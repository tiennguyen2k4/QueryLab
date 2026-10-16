import type { ExplainDocument, PlanMetrics, PlanNode } from './types';

export function walkPlan(node: PlanNode): PlanNode[] {
  return [node, ...(node.Plans ?? []).flatMap(walkPlan)];
}

/** Executor counters count visits, not distinct rows. Per-loop averages can be rounded by PostgreSQL.
 * Bitmap index/heap layers must not be added together; index-only scans use Heap Fetches directly. */
export function metricsFromPlan(explain: ExplainDocument): PlanMetrics {
  const nodes = walkPlan(explain.Plan);
  let heapRowsVisitedApprox = 0;
  let indexEntriesReturnedApprox = 0;
  for (const node of nodes) {
    const loops = Number(node['Actual Loops'] ?? 0);
    const visited = (Number(node['Actual Rows'] ?? 0) + Number(node['Rows Removed by Filter'] ?? 0) + Number(node['Rows Removed by Index Recheck'] ?? 0)) * loops;
    if (['Seq Scan', 'Index Scan', 'Bitmap Heap Scan', 'Tid Scan', 'Tid Range Scan'].includes(node['Node Type'])) heapRowsVisitedApprox += visited;
    if (node['Node Type'] === 'Index Only Scan') heapRowsVisitedApprox += Number(node['Heap Fetches'] ?? 0);
    if (['Index Only Scan', 'Index Scan', 'Bitmap Index Scan'].includes(node['Node Type'])) indexEntriesReturnedApprox += visited;
  }
  return {
    executionMs: Number(explain['Execution Time'] ?? 0),
    planningMs: Number(explain['Planning Time'] ?? 0),
    estimatedCost: Number(explain.Plan['Total Cost'] ?? 0),
    estimatedRows: Number(explain.Plan['Plan Rows'] ?? 0),
    actualRows: Number(explain.Plan['Actual Rows'] ?? 0) * Number(explain.Plan['Actual Loops'] ?? 0),
    heapRowsVisitedApprox,
    indexEntriesReturnedApprox,
    scanTypes: [...new Set(nodes.filter(n => n['Node Type'].includes('Scan')).map(n => n['Node Type']))],
    indexNames: [...new Set(nodes.flatMap(n => n['Index Name'] ? [n['Index Name']] : []))],
  };
}

export function tableTupleWork(node: PlanNode, table: string): number | null {
  const accesses = walkPlan(node).filter(n => n['Relation Name'] === table && ['Seq Scan', 'Index Scan', 'Bitmap Heap Scan', 'Index Only Scan', 'Tid Scan', 'Tid Range Scan'].includes(n['Node Type']));
  if (!accesses.length || accesses.some(n => n['Actual Rows'] === undefined || n['Actual Loops'] === undefined)) return null;
  // Index Only Scan still visits index tuples; heap fetches alone cannot measure keyset/OFFSET work.
  return accesses.reduce((sum, n) => sum + (Number(n['Actual Rows']) + Number(n['Rows Removed by Filter'] ?? 0) + Number(n['Rows Removed by Index Recheck'] ?? 0)) * Number(n['Actual Loops']), 0);
}
