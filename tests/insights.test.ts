import assert from 'node:assert/strict';
import test from 'node:test';
import { investigateQuery, rootBuffers } from '../lib/engine/insights';
import { partitionMonths } from '../lib/engine/lesson-setup';
import type { PlanNode, QueryResult } from '../lib/engine/types';

function query(plan: PlanNode, overrides: Partial<QueryResult> = {}): QueryResult {
  return {
    kind: 'read', sql: 'SELECT * FROM orders WHERE customer_id = 42;',
    fields: [], rows: [], previewTruncated: false, returnedRowCount: 50,
    metrics: null, plan: { Plan: plan }, indexes: [], ...overrides,
  };
}

const selectiveScan: PlanNode = {
  'Node Type': 'Seq Scan', 'Relation Name': 'orders', 'Plan Rows': 50,
  'Actual Rows': 50, 'Actual Loops': 1, 'Rows Removed by Filter': 49950,
};

test('index experiment requires a selective measured scan and stages SQL without execution', () => {
  const insight = investigateQuery(query(selectiveScan));
  assert.equal(insight.indexCandidate?.createSql, 'CREATE INDEX datalab_orders_customer_idx ON orders (customer_id);');
  assert.equal(insight.indexCandidate?.stagedSql, 'CREATE INDEX datalab_orders_customer_idx ON orders (customer_id);\n\nSELECT * FROM orders WHERE customer_id = 42;');
  assert.equal(insight.indexCandidate?.filteredRowsApprox, 49950);
  for (const modified of [
    { sql: 'SELECT * FROM orders WHERE customer_id=42 LIMIT 5' },
    { sql: 'SELECT * FROM orders WHERE customer_id=42 OR status=\'paid\'' },
    { sql: 'SELECT * FROM orders o JOIN customers c ON o.customer_id=c.id WHERE customer_id=42' },
    { indexes: [{ name: 'existing', table: 'orders', definition: 'CREATE INDEX existing ON orders USING btree (customer_id, order_date)', bytes: 100 }] },
  ]) assert.equal(investigateQuery(query(selectiveScan, modified)).indexCandidate, null);
  assert.equal(investigateQuery(query({ ...selectiveScan, 'Actual Rows': 45000, 'Rows Removed by Filter': 5000 })).indexCandidate, null);
  assert.equal(investigateQuery(query({ ...selectiveScan, 'Actual Rows': 5, 'Rows Removed by Filter': 95 })).indexCandidate, null);
});

test('zero-loop nodes do not imply used indexes, row-estimate problems or sort spills', () => {
  const result = query({ 'Node Type': 'Append', 'Actual Rows': 1, 'Actual Loops': 1, Plans: [
    { ...selectiveScan, 'Actual Loops': 0, 'Plan Rows': 100000 },
    { 'Node Type': 'Index Scan', 'Relation Name': 'orders', 'Index Name': 'never_used', 'Actual Rows': 1, 'Actual Loops': 0 },
    { 'Node Type': 'Sort', 'Sort Space Type': 'Disk', 'Actual Loops': 0 },
  ] });
  const insight = investigateQuery(result);
  assert.deepEqual(insight.usedIndexes, []);
  assert.deepEqual(insight.estimateMismatches, []);
  assert.deepEqual(insight.sortSpills, []);
  assert.equal(insight.indexCandidate, null);
});

test('LIMIT early-stop evidence is not misclassified as stale statistics', () => {
  const scan = { ...selectiveScan, 'Plan Rows': 50000, 'Actual Rows': 5 };
  assert.equal(investigateQuery(query(scan)).estimateMismatches.length, 1);
  const insight = investigateQuery(query({ 'Node Type': 'Limit', 'Plan Rows': 5, 'Actual Rows': 5, 'Actual Loops': 1, Plans: [scan] }));
  assert.equal(insight.hasEarlyStop, true);
  assert.deepEqual(insight.estimateMismatches, []);
  assert.equal(insight.indexCandidate, null);
});

test('estimates compare per-loop values; cumulative loops do not invent a deviation', () => {
  const insight = investigateQuery(query({ ...selectiveScan, 'Plan Rows': 50, 'Actual Rows': 50, 'Actual Loops': 100 }));
  assert.deepEqual(insight.estimateMismatches, []);
  assert.equal(insight.nodes[0].rowsAcrossLoopsApprox, 5000);
});

test('root buffers are not double-counted from children or coerced from missing values', () => {
  const buffers = rootBuffers({ 'Node Type': 'Sort', 'Shared Hit Blocks': 10, 'Shared Read Blocks': 4, 'Temp Written Blocks': 3, Plans: [
    { ...selectiveScan, 'Shared Hit Blocks': 10, 'Shared Read Blocks': 4, 'Temp Written Blocks': 3 },
  ] });
  assert.equal(buffers.sharedHits, 10);
  assert.equal(buffers.sharedReads, 4);
  assert.equal(buffers.tempWritten, 3);
  assert.equal(buffers.tempReads, null);
});

test('partition execution uses actual named fixture scans and retains baseline evidence', () => {
  const baseline = query({ 'Node Type': 'Append', 'Actual Loops': 1, Plans: partitionMonths.map(month => ({
    'Node Type': 'Seq Scan', 'Relation Name': month.table, 'Actual Rows': 100, 'Actual Loops': 1,
  })) });
  const current = query({ 'Node Type': 'Append', 'Actual Loops': 1, Plans: [
    { 'Node Type': 'Seq Scan', 'Relation Name': 'orders_p202407', 'Actual Rows': 100, 'Actual Loops': 1 },
    { 'Node Type': 'Seq Scan', 'Relation Name': 'orders_p202408', 'Actual Rows': 0, 'Actual Loops': 0 },
  ] });
  const partitions = investigateQuery(current, baseline, 'partition-014').partitions!;
  assert.equal(partitions.months.length, 24);
  assert.equal(partitions.executedCount, 1);
  assert.equal(partitions.baselineExecutedCount, 24);
  assert.equal(partitions.months.find(month => month.month === '2024-07')?.state, 'executed');
  assert.equal(partitions.months.find(month => month.month === '2024-08')?.reason, 'zero-loops');
  assert.equal(partitions.months.find(month => month.month === '2025-01')?.reason, 'absent');
  assert.equal(investigateQuery(query(selectiveScan), null, 'partition-014').partitions?.executedCount, null);
  assert.equal(investigateQuery(current).partitions, null);
});

test('sort-spill observation requires a measured executed disk/external sort', () => {
  assert.equal(investigateQuery(query({ 'Node Type': 'Sort', 'Actual Loops': 1, 'Sort Method': 'external merge', 'Sort Space Type': 'Disk', 'Sort Space Used': 2048 })).sortSpills[0].sortSpaceKb, 2048);
  assert.deepEqual(investigateQuery(query({ 'Node Type': 'Sort', 'Sort Method': 'quicksort', 'Sort Space Type': 'Memory', 'Actual Loops': 1 })).sortSpills, []);
});
