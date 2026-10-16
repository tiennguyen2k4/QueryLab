import { partitionMonths } from './lesson-setup';
import type { PlanNode, QueryResult } from './types';

export type NodeEvidence = {
  id: string;
  depth: number;
  type: string;
  relation?: string;
  indexName?: string;
  estimatedRows: number | null;
  rowsPerLoop: number | null;
  loops: number | null;
  rowsAcrossLoopsApprox: number | null;
  filteredAcrossLoopsApprox: number | null;
  executed: boolean | null;
  earlyStopPossible: boolean;
  estimateMismatch: boolean;
  sortSpill: boolean;
  sortSpaceKb: number | null;
};

export type RootBuffers = {
  sharedHits: number | null;
  sharedReads: number | null;
  sharedDirtied: number | null;
  sharedWritten: number | null;
  tempReads: number | null;
  tempWritten: number | null;
};

export type IndexCandidate = {
  createSql: string;
  stagedSql: string;
  filteredRowsApprox: number;
  returnedRowsApprox: number;
};

export type PartitionEvidence = {
  months: {
    table: string;
    month: string;
    state: 'executed' | 'not-executed' | 'unknown';
    reason: 'positive-loops' | 'zero-loops' | 'absent' | 'missing-counters' | 'not-observed';
    baselineExecuted: boolean;
  }[];
  executedCount: number | null;
  baselineExecutedCount: number | null;
};

function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function flattenEvidence(root: PlanNode): NodeEvidence[] {
  const nodes: NodeEvidence[] = [];
  function visit(node: PlanNode, path: string, depth: number, demandLimited: boolean) {
    const earlyStopPossible = demandLimited || node['Node Type'] === 'Limit' || ['Semi', 'Anti'].includes(String(node['Join Type']));
    const loops = count(node['Actual Loops']);
    const rowsPerLoop = count(node['Actual Rows']);
    const estimatedRows = count(node['Plan Rows']);
    const filtered = count(node['Rows Removed by Filter']);
    const executed = loops === null ? null : loops > 0;
    // Plan Rows and Actual Rows are per-loop values. A parent LIMIT or semi join
    // can stop asking for rows; a partial child is not a statistics diagnosis.
    const estimateMismatch = executed === true && !earlyStopPossible && rowsPerLoop !== null && estimatedRows !== null
      && rowsPerLoop > 0 && estimatedRows > 0
      && Math.max(rowsPerLoop / estimatedRows, estimatedRows / rowsPerLoop) >= 10
      && Math.abs(rowsPerLoop - estimatedRows) >= 100;
    const sortSpill = executed === true && ['Sort', 'Incremental Sort'].includes(node['Node Type'])
      && (node['Sort Space Type'] === 'Disk' || /external/.test(String(node['Sort Method'] ?? '')));
    nodes.push({
      id: path, depth, type: node['Node Type'], relation: node['Relation Name'], indexName: node['Index Name'],
      estimatedRows, rowsPerLoop, loops, executed, earlyStopPossible, estimateMismatch, sortSpill,
      rowsAcrossLoopsApprox: rowsPerLoop !== null && loops !== null ? rowsPerLoop * loops : null,
      filteredAcrossLoopsApprox: filtered !== null && loops !== null ? filtered * loops : null,
      sortSpaceKb: sortSpill ? count(node['Sort Space Used']) : null,
    });
    (node.Plans ?? []).forEach((child, index) => visit(child, `${path}.${index}`, depth + 1, earlyStopPossible));
  }
  visit(root, '0', 0, false);
  return nodes;
}

/** These root counters already include children: never add node buffer counters. */
export function rootBuffers(root: PlanNode): RootBuffers {
  return {
    sharedHits: count(root['Shared Hit Blocks']), sharedReads: count(root['Shared Read Blocks']),
    sharedDirtied: count(root['Shared Dirtied Blocks']), sharedWritten: count(root['Shared Written Blocks']),
    tempReads: count(root['Temp Read Blocks']), tempWritten: count(root['Temp Written Blocks']),
  };
}

function indexCandidate(result: QueryResult, nodes: NodeEvidence[]): IndexCandidate | null {
  // Deliberately narrow: no joins, expressions, ranges, LIMIT, CTEs or extra
  // predicates. This is an experiment for a known lesson, not a SQL optimizer.
  const simpleLookup = /^\s*SELECT\s+(?:\*|(?:id|customer_id|order_date|status|total)(?:\s*,\s*(?:id|customer_id|order_date|status|total))*)\s+FROM\s+orders\s+WHERE\s+customer_id\s*=\s*\d+\s*;?\s*$/i.test(result.sql);
  if (!simpleLookup || result.kind !== 'read') return null;
  // An existing key/expression/include reference may already address the
  // column. Avoid duplicating it without richer catalog/workload evidence.
  if (result.indexes.some(index => index.table === 'orders' && /\bcustomer_id\b/i.test(index.definition))) return null;
  const scan = nodes.find(node => node.type === 'Seq Scan' && node.relation === 'orders' && node.executed === true
    && !node.earlyStopPossible && node.rowsAcrossLoopsApprox !== null && node.filteredAcrossLoopsApprox !== null
    && node.rowsAcrossLoopsApprox + node.filteredAcrossLoopsApprox >= 1000
    && node.filteredAcrossLoopsApprox / Math.max(1, node.rowsAcrossLoopsApprox + node.filteredAcrossLoopsApprox) >= 0.8);
  if (!scan || scan.filteredAcrossLoopsApprox === null || scan.rowsAcrossLoopsApprox === null) return null;
  let name = 'datalab_orders_customer_idx';
  for (let suffix = 2; result.indexes.some(index => index.name === name); suffix++) name = `datalab_orders_customer_idx_${suffix}`;
  const createSql = `CREATE INDEX ${name} ON orders (customer_id);`;
  return { createSql, stagedSql: `${createSql}\n\n${result.sql}`, filteredRowsApprox: scan.filteredAcrossLoopsApprox, returnedRowsApprox: scan.rowsAcrossLoopsApprox };
}

function partitionEvidence(nodes: NodeEvidence[], baselineNodes: NodeEvidence[]): PartitionEvidence {
  const names = new Set(partitionMonths.map(month => month.table));
  const observed = nodes.filter(node => node.relation && names.has(node.relation));
  const baselineObserved = baselineNodes.filter(node => node.relation && names.has(node.relation));
  const hasActualEvidence = observed.some(node => node.loops !== null);
  const hasBaselineEvidence = baselineObserved.some(node => node.loops !== null);
  const months: PartitionEvidence['months'] = partitionMonths.map(month => {
    const accesses = observed.filter(node => node.relation === month.table);
    const executed = accesses.some(node => node.executed === true);
    const missing = accesses.some(node => node.executed === null);
    return {
      table: month.table, month: month.start.slice(0, 7),
      state: executed ? 'executed' : missing || !hasActualEvidence ? 'unknown' : 'not-executed',
      reason: executed ? 'positive-loops' : missing ? 'missing-counters' : !hasActualEvidence ? 'not-observed' : accesses.length ? 'zero-loops' : 'absent',
      baselineExecuted: baselineObserved.some(node => node.relation === month.table && node.executed === true),
    };
  });
  return {
    months,
    executedCount: hasActualEvidence ? months.filter(month => month.state === 'executed').length : null,
    baselineExecutedCount: hasBaselineEvidence ? months.filter(month => month.baselineExecuted).length : null,
  };
}

export function investigateQuery(result: QueryResult, baseline: QueryResult | null = null, labId?: string) {
  const nodes = result.plan ? flattenEvidence(result.plan.Plan) : [];
  const baselineNodes = baseline?.plan ? flattenEvidence(baseline.plan.Plan) : [];
  const usedIndexes = [...new Set(nodes.filter(node => node.executed === true).flatMap(node => node.indexName ? [node.indexName] : []))];
  const relationNames = new Set(nodes.flatMap(node => node.relation ? [node.relation] : []));
  const indexes = result.indexes.filter(index => relationNames.has(index.table)).map(index => ({ ...index, used: usedIndexes.includes(index.name) }));
  return {
    nodes, usedIndexes, indexes,
    executedScans: [...new Set(nodes.filter(node => node.executed === true && node.type.includes('Scan')).map(node => node.type))],
    buffers: result.plan ? rootBuffers(result.plan.Plan) : null,
    hasEarlyStop: nodes.some(node => node.earlyStopPossible),
    estimateMismatches: nodes.filter(node => node.estimateMismatch),
    sortSpills: nodes.filter(node => node.sortSpill),
    indexCandidate: indexCandidate(result, nodes),
    partitions: labId === 'partition-014' ? partitionEvidence(nodes, baselineNodes) : null,
  };
}
