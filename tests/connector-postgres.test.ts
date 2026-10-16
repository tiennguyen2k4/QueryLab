import assert from 'node:assert/strict';
import test from 'node:test';
import { NativePostgresRuntime } from '../lib/connector/postgres';
import type { QueryResult, ValidationResult } from '../lib/engine/types';
const url = process.env.DATALAB_TEST_DATABASE_URL;

test('connector refuses accidental production and superuser-shaped setup', () => {
  assert.throws(() => new NativePostgresRuntime('postgresql://user:password@localhost/production', true), /dedicated database/);
  assert.throws(() => new NativePostgresRuntime('postgresql://user:password@localhost/datalab_lab', false), /DEDICATED_DATABASE/);
});

test('native PostgreSQL seed, real plan, full equivalence, index reset, persistence and cancellation', { skip: !url }, async () => {
  const runtime = new NativePostgresRuntime(url!, true);
  try {
    await runtime.execute({ type: 'reset', size: 50000 });
    const counts = await runtime.execute({ type: 'run', sql: 'SELECT (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM order_items) AS items' }) as QueryResult;
    assert.deepEqual(counts.rows[0].map(Number), [1000, 50000, 100000]);
    const date = await runtime.execute({ type: 'run', sql: "SELECT DATE '2024-01-01' AS day" }) as QueryResult;
    assert.equal(date.rows[0][0], '2024-01-01', 'DATE preview retains calendar date independently of connector timezone');
    const lookup = 'SELECT id FROM orders WHERE customer_id=42 ORDER BY id';
    const baseline = await runtime.execute({ type: 'run', sql: lookup }) as QueryResult;
    assert.ok(baseline.plan?.Plan); assert.equal(baseline.metrics?.heapRowsVisitedApprox, 50000);
    const created = await runtime.execute({ type: 'run', sql: 'CREATE INDEX idx_orders_customer ON orders(customer_id)', baselineQuery: lookup }) as QueryResult;
    assert.deepEqual(created.equivalence, { checked: true, matches: true });
    const validation = await runtime.execute({ type: 'validate', request: { candidateSql: lookup, baselinePlan: baseline.plan, rules: [
      { kind: 'result-equivalent', referenceSql: lookup, ordered: true, explanation: 'same rows and order' },
      { kind: 'has-index', table: 'orders', leadingColumns: ['customer_id'], explanation: 'customer key' },
      { kind: 'plan-uses-index', table: 'orders', explanation: 'index used' },
      { kind: 'less-work-than-baseline', table: 'orders', minReduction: 0.8, explanation: 'less tuple work' },
    ] } }) as ValidationResult;
    assert.equal(validation.matches, true, JSON.stringify(validation));
    const incomplete = await runtime.execute({ type: 'validate', request: { candidateSql: 'SELECT id FROM orders WHERE id<>49000 ORDER BY id', canonicalSql: 'SELECT id FROM orders ORDER BY id' } }) as ValidationResult;
    assert.equal(incomplete.matches, false, 'validation compares rows beyond the 200-row preview');
    await assert.rejects(runtime.execute({ type: 'run', sql: 'DELETE FROM orders' }));
    await assert.rejects(runtime.execute({ type: 'run', sql: 'DROP INDEX orders_pkey' }));
    await runtime.execute({ type: 'prepare', labId: 'index-006' });
    const clean = await runtime.execute({ type: 'run', sql: lookup }) as QueryResult;
    assert.equal(clean.metrics?.heapRowsVisitedApprox, 50000);
    assert.ok(!clean.indexes.some(index => index.name === 'idx_orders_customer'));
    await runtime.execute({ type: 'prepare', labId: 'partition-014' });
    const partitions = await runtime.execute({ type: 'run', sql: "SELECT id FROM orders_partitioned WHERE order_date >= DATE '2024-03-01' AND order_date < DATE '2024-04-01'" }) as QueryResult;
    assert.ok(JSON.stringify(partitions.plan).includes('orders_p202403'));
    assert.ok(!JSON.stringify(partitions.plan).includes('orders_p202402'));
    await runtime.close();
    await runtime.execute({ type: 'initialize', size: 50000 });
    const retained = await runtime.execute({ type: 'run', sql: 'SELECT COUNT(*) AS orders FROM orders' }) as QueryResult;
    assert.equal(Number(retained.rows[0][0]), 50000);
    const expensive = runtime.execute({ type: 'run', sql: 'SELECT COUNT(*) FROM orders a CROSS JOIN orders b' });
    const rejected = assert.rejects(expensive, /canceling statement/);
    await new Promise(resolve => setTimeout(resolve, 150));
    await runtime.cancel();
    await rejected;
    assert.equal((await runtime.execute({ type: 'run', sql: 'SELECT 1 AS recovered' }) as QueryResult).rows[0][0], 1);
  } finally { await runtime.execute({ type: 'reset', size: 100000 }).catch(() => undefined); await runtime.close(); }
});


test('native large profile imports one million real orders and two million line items', { skip: !url || process.env.DATALAB_TEST_LARGE_PROFILE !== '1' }, async () => {
  const runtime = new NativePostgresRuntime(url!, true);
  try {
    await runtime.execute({ type: 'reset', size: 1000000 });
    const counts = await runtime.execute({ type: 'run', sql: 'SELECT (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM order_items) AS items' }) as QueryResult;
    assert.deepEqual(counts.rows[0].map(Number), [1000000, 2000000]);
    assert.ok(counts.plan?.Plan);
    const baseline = await runtime.execute({ type: 'run', sql: 'SELECT id FROM orders WHERE customer_id=42 ORDER BY id' }) as QueryResult;
    await runtime.execute({ type: 'run', sql: 'CREATE INDEX idx_native_large_customer ON orders(customer_id)' });
    const after = await runtime.execute({ type: 'run', sql: 'SELECT id FROM orders WHERE customer_id=42 ORDER BY id' }) as QueryResult;
    assert.equal(after.returnedRowCount, 1000);
    assert.ok((after.metrics?.heapRowsVisitedApprox ?? Infinity) < (baseline.metrics?.heapRowsVisitedApprox ?? 0));
  } finally {
    // Keep the development fixture ready for the UI's default native profile after the optional large test.
    await runtime.execute({ type: 'reset', size: 100000 }).catch(() => undefined);
    await runtime.close();
  }
});
