import assert from 'node:assert/strict';
import test from 'node:test';
import { guardSql, hasTopLevelOrder, splitStatements } from '../lib/engine/sql-guard';
import { metricsFromPlan, tableTupleWork } from '../lib/engine/metrics';

test('blocks mutation CTEs, filesystem/session functions, schema qualification and all statement injection', () => {
  for (const sql of [
    'DELETE FROM orders',
    'WITH changed AS (DELETE FROM orders RETURNING *) SELECT * FROM changed',
    'SELECT * INTO copy_of_orders FROM orders',
    "SELECT pg_read_file('/etc/passwd')",
    "SELECT pg_sleep(5)",
    "SELECT set_config('search_path','pg_catalog',false)",
    "SELECT 1, nextval('orders_id_seq') AS n",
    "SELECT * FROM orders, nextval('orders_id_seq') AS n",
    'SELECT public.count(*) FROM orders',
    'SELECT "pg_sleep"(5)',
    "SELECT U&\"pg_\\0073leep\"(5)",
    'SELECT * FROM orders; DROP TABLE orders;',
    'CREATE INDEX idx_danger ON orders ((pg_sleep(1)))',
    'CREATE INDEX idx_unknown ON orders (nonexistent)',
    'CREATE INDEX idx_customer ON orders(customer_id) WHERE pg_sleep(1) IS NULL',
    'DROP INDEX orders_pkey',
    'EXPLAIN ANALYZE DELETE FROM orders',
    "SELECT E'\\\'; SELECT pg_sleep(5)'",
  ]) assert.throws(() => guardSql(sql), Error, sql);
});

test('handles strings, nested comments, CTEs, semicolons and real EXPLAIN wrappers safely', () => {
  for (const sql of [
    "SELECT 'delete; pg_sleep(5)' AS safe_value",
    '/* a /* nested */ comment */ SELECT * FROM orders WHERE customer_id=42; -- trailing',
    "SELECT $$; DROP TABLE orders;$$ AS example",
    'WITH source (id) AS (SELECT id FROM orders) SELECT id FROM source ORDER BY id',
    'SELECT COUNT(*) FILTER (WHERE status = \'completed\') FROM orders',
    'SELECT ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY id) FROM orders',
    '   EXPLAIN (ANALYZE, FORMAT JSON) SELECT id FROM orders -- end',
  ]) assert.equal(guardSql(sql).kind, 'read', sql);
  assert.equal(guardSql('EXPLAIN (ANALYZE, FORMAT JSON) SELECT id FROM orders').sql, 'SELECT id FROM orders\n');
  assert.equal(guardSql('SELECT 1 -- close wrapper').sql.at(-1), '\n');
  assert.throws(() => guardSql('SELECT 1 /* unfinished'));
  assert.throws(() => guardSql("SELECT 'unfinished"));
  assert.throws(() => guardSql('SELECT $$unfinished'));
});

test('reconstructs safe index statements and batches using lexical separators', () => {
  const create = guardSql('CREATE INDEX IF NOT EXISTS idx_recent ON public.orders (customer_id, order_date DESC, id DESC) INCLUDE(total,status)');
  assert.equal(create.kind, 'index');
  assert.match(create.sql, /^CREATE INDEX IF NOT EXISTS/);
  assert.equal(guardSql('CREATE INDEX idx_prefix ON customers(email text_pattern_ops)').kind, 'index');
  assert.equal(guardSql('DROP INDEX IF EXISTS idx_recent').kind, 'index');
  assert.deepEqual(splitStatements("CREATE INDEX idx_customer ON orders(customer_id); SELECT ';' AS example; -- done"), ['CREATE INDEX idx_customer ON orders(customer_id)', "SELECT ';' AS example"]);
  assert.throws(() => splitStatements('CREATE INDEX idx_customer ON orders(customer_id); DROP TABLE orders'));
  assert.equal(hasTopLevelOrder('SELECT * FROM (SELECT * FROM orders ORDER BY id) x'), false);
  assert.equal(hasTopLevelOrder('SELECT * FROM orders ORDER BY id'), true);
});

test('scan work counts loops and filter/recheck rows without double-counting parents and bitmap index', () => {
  const plan = { Plan: { 'Node Type': 'Nested Loop', 'Actual Rows': 2, 'Actual Loops': 1, Plans: [
    { 'Node Type': 'Bitmap Heap Scan', 'Relation Name': 'orders', 'Actual Rows': 2, 'Actual Loops': 3, 'Rows Removed by Filter': 4, 'Rows Removed by Index Recheck': 1, Plans: [
      { 'Node Type': 'Bitmap Index Scan', 'Actual Rows': 7, 'Actual Loops': 3, 'Index Name': 'idx_orders_customer' },
    ] },
    { 'Node Type': 'Index Only Scan', 'Relation Name': 'customers', 'Actual Rows': 2, 'Actual Loops': 3, 'Heap Fetches': 2 },
  ] }, 'Execution Time': 1.5, 'Planning Time': 0.2 };
  const metrics = metricsFromPlan(plan);
  assert.equal(metrics.heapRowsVisitedApprox, 23);
  assert.equal(tableTupleWork(plan.Plan, 'orders'), 21);
  assert.equal(tableTupleWork(plan.Plan, 'customers'), 6);
  assert.equal(tableTupleWork(plan.Plan, 'missing'), null);
  assert.equal(metrics.executionMs, 1.5);
});
