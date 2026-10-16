import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceSession, experimentSql, identifier, monthBoundary, parseExperiment, partitionQuery, workspaceRead, type Experiment } from '../lib/workspace';
import { connectorOperation } from '../lib/connector/protocol';
import { ConnectorStore } from '../lib/connector/store';

test('workspace generates quoted index SQL without accepting arbitrary DDL', () => {
  const index: Experiment = { kind: 'index', schema: 'Sales Data', table: 'Order"History', name: 'datalab_customer_date', columns: ['Customer ID', 'date'] };
  assert.equal(experimentSql(index), 'CREATE INDEX "datalab_customer_date" ON "Sales Data"."Order""History" USING btree ("Customer ID", "date");');
  assert.throws(() => parseExperiment({ ...index, columns: ['id', 'id'] }), /distinct/);
  assert.throws(() => parseExperiment({ ...index, columns: [] }), /1–4/);
  assert.throws(() => parseExperiment({ ...index, columns: ['a','b','c','d','e'] }), /1–4/);
  assert.throws(() => parseExperiment({ ...index, name: 'datalab_x;DROP TABLE orders' }), /new name/);
  assert.throws(() => parseExperiment({ ...index, name: index.table }), /new name/);
  assert.equal(identifier('x"; DROP SCHEMA public;--'), '"x""; DROP SCHEMA public;--"');
  assert.throws(() => identifier('a'.repeat(64)), /1–63/);
  assert.throws(() => identifier('é'.repeat(32)), /1–63/);
});

test('partition SQL copies to a separate table and covers NULL/out-of-range dates', () => {
  const partition: Experiment = { kind: 'partition', schema: 'public', table: 'events', name: 'datalab_events_copy', column: 'at', startMonth: '2024-12', months: 2 };
  const sql = experimentSql(partition);
  assert.match(sql, /CREATE TABLE "public"."datalab_events_copy" \(LIKE "public"."events"\) PARTITION BY RANGE \("at"\)/);
  assert.match(sql, /FROM \('2024-12-01'\) TO \('2025-01-01'\)/);
  assert.match(sql, /FROM \('2025-01-01'\) TO \('2025-02-01'\)/);
  assert.match(sql, /PARTITION OF "public"."datalab_events_copy" DEFAULT/);
  assert.match(sql, /INSERT INTO "public"."datalab_events_copy" SELECT \* FROM "public"."events";/);
  assert.doesNotMatch(sql, /DROP|ALTER|DELETE|UPDATE/);
  assert.match(partitionQuery(partition), /FROM "public"."events"/);
  assert.match(partitionQuery(partition, true), /FROM "public"."datalab_events_copy"/);
  assert.equal(monthBoundary('2024-12', 2), '2025-02-01');
  for (const invalid of [{ months: 0 }, { months: 25 }, { months: 1.5 }, { startMonth: '2024-13' }, { startMonth: "2024-01');DROP" }]) {
    assert.throws(() => parseExperiment({ ...partition, ...invalid }), /month/);
  }
});

test('existing workspace protocol requires confirmed one-use previews and read-only measurements', () => {
  assert.equal(workspaceRead('EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events').kind, 'read');
  for (const sql of ['DELETE FROM events', 'CREATE INDEX idx ON orders(id)', 'SELECT 1; SELECT 2', 'SELECT pg_sleep(1)', 'WITH gone AS (DELETE FROM events RETURNING *) SELECT * FROM gone']) {
    assert.throws(() => connectorOperation({ type: 'workspace-measure', schema: 'public', sql }));
  }
  assert.throws(() => connectorOperation({ type: 'workspace-apply', approvalId: 'a'.repeat(48), confirmed: false }), /confirm/);
  assert.throws(() => connectorOperation({ type: 'workspace-apply', approvalId: 'raw SQL', confirmed: true }), /confirm/);
  assert.throws(() => connectorOperation({ type: 'workspace-reconcile' }), /acknowledge/);
  assert.equal(connectorOperation({ type: 'workspace-apply', approvalId: 'a'.repeat(48), confirmed: true }).type, 'workspace-apply');
});

test('workspace read cancellation needs no destructive reset; uncertain DDL needs explicit reconciliation', () => {
  const store = new ConnectorStore(); const agent = store.register(); const browser = store.pair(agent.pairingCode);
  const read = store.enqueue(browser.browserToken, { type: 'workspace-measure', schema: 'public', sql: 'SELECT 1' });
  store.poll(agent.agentToken); store.cancel(browser.browserToken, read.id);
  store.report(agent.agentToken, read.id, { error: 'read rolled back' });
  assert.equal(store.status(browser.browserToken).recoveryRequired, false);
  const change = store.enqueue(browser.browserToken, { type: 'workspace-apply', approvalId: 'a'.repeat(48), confirmed: true });
  store.poll(agent.agentToken); store.cancel(browser.browserToken, change.id);
  store.report(agent.agentToken, change.id, { result: { mayHaveCommitted: true } });
  assert.equal(store.status(browser.browserToken).recoveryRequired, true);
  assert.throws(() => store.enqueue(browser.browserToken, { type: 'workspace-measure', schema: 'public', sql: 'SELECT 1' }), /acknowledge/);
  const inspect = store.enqueue(browser.browserToken, { type: 'workspace-inspect' });
  store.poll(agent.agentToken); store.report(agent.agentToken, inspect.id, { result: { tables: [] } });
  assert.equal(store.status(browser.browserToken).recoveryRequired, true, 'inspection alone is not acknowledgement');
  const recovery = store.enqueue(browser.browserToken, { type: 'workspace-reconcile', confirmed: true });
  store.poll(agent.agentToken); store.report(agent.agentToken, recovery.id, { result: { tables: [] } });
  assert.equal(store.status(browser.browserToken).recoveryRequired, false);
});

test('workspace session defaults never share mutable data between connections', () => {
  const first = createWorkspaceSession(); const second = createWorkspaceSession();
  first.columns.push('customer_id'); first.sql = 'SELECT 42'; first.busy = 'Measuring';
  assert.deepEqual(second.columns, []); assert.equal(second.sql, ''); assert.equal(second.busy, '');
  assert.equal(second.baseline, null); assert.equal(second.comparisonTarget, null);
});
