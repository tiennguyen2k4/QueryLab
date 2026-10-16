import assert from 'node:assert/strict';
import test from 'node:test';
import { PGliteEngine } from '../lib/engine/core';

test('real PostgreSQL seed, guard, complete ordered equivalence, scan plan and transactional index result integrity', async () => {
  const engine = new PGliteEngine();
  try {
    await engine.initialize(50000);
    const counts = await engine.run('SELECT (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM order_items) AS order_items');
    assert.deepEqual(counts.rows, [[1000, 100, 50000, 100000]]);
    const totalCheck = await engine.run('SELECT COUNT(*) AS incorrect FROM orders o JOIN (SELECT order_id,SUM(quantity*unit_price) AS expected FROM order_items GROUP BY order_id) i ON i.order_id=o.id WHERE o.total<>i.expected');
    assert.deepEqual(totalCheck.rows, [[0]]);
    const richCells = await engine.run(`SELECT '${'x'.repeat(2500)}' AS long_text, '{"example":[1,2,3]}'::jsonb AS details, DATE '2024-01-01' AS day`);
    assert.equal(String(richCells.rows[0][0]).length, 2001);
    assert.equal(typeof richCells.rows[0][1], 'string');
    assert.equal(richCells.rows[0][2], '2024-01-01');
    assert.equal(richCells.previewTruncated, true);
    await assert.rejects(engine.run(`SELECT ${Array.from({ length: 41 }, (_, i) => `${i} AS c${i}`).join(',')}`), /up to 40 columns/);
    const preview = await engine.run('SELECT id FROM orders ORDER BY id');
    assert.equal(preview.rows.length, 200); assert.equal(preview.previewTruncated, true); assert.equal(preview.returnedRowCount, 50000);

    const referenceSql = 'SELECT id FROM orders ORDER BY id';
    const referenceRule = { kind: 'result-equivalent' as const, referenceSql, ordered: true, explanation: 'All IDs in order.' };
    assert.equal((await engine.validate({ candidateSql: referenceSql, rules: [referenceRule] })).matches, true);
    // Difference after the capped preview must still fail.
    assert.equal((await engine.validate({ candidateSql: 'SELECT id FROM orders WHERE id<>49000 ORDER BY id', rules: [referenceRule] })).matches, false);
    assert.equal((await engine.validate({ candidateSql: 'SELECT id FROM orders ORDER BY id DESC', rules: [referenceRule] })).matches, false);
    assert.equal((await engine.validate({ candidateSql: 'SELECT id FROM orders', rules: [referenceRule] })).matches, false);
    assert.equal((await engine.validate({ candidateSql: 'SELECT id FROM orders UNION ALL SELECT id FROM orders WHERE id=49000', canonicalSql: 'SELECT id FROM orders' })).matches, false);
    assert.equal((await engine.validate({ candidateSql: 'SELECT NULL::integer AS id UNION ALL SELECT 1', canonicalSql: 'SELECT 1 AS id UNION ALL SELECT NULL::integer' })).matches, true);

    const lookup = 'SELECT * FROM orders WHERE customer_id=42';
    const baseline = await engine.run(lookup);
    assert.equal(baseline.metrics?.heapRowsVisitedApprox, 50000);
    const created = await engine.run('CREATE INDEX idx_orders_customer ON orders(customer_id)', { baselineQuery: lookup });
    assert.deepEqual(created.equivalence, { checked: true, matches: true });
    const candidate = await engine.run(lookup);
    assert.ok((candidate.metrics?.heapRowsVisitedApprox ?? Infinity) < 500);
    const validation = await engine.validate({ candidateSql: lookup, baselinePlan: baseline.plan!, rules: [
      { kind: 'result-equivalent', referenceSql: lookup, ordered: false, explanation: 'same results' },
      { kind: 'has-index', table: 'orders', leadingColumns: ['customer_id'], explanation: 'customer leading key' },
      { kind: 'plan-uses-index', table: 'orders', explanation: 'actual index use' },
      { kind: 'less-work-than-baseline', table: 'orders', minReduction: 0.8, explanation: 'less work' },
    ] });
    assert.equal(validation.matches, true, JSON.stringify(validation));
    const explained = await engine.run('EXPLAIN (ANALYZE,FORMAT JSON) SELECT id FROM orders WHERE customer_id=42');
    assert.equal(explained.explained, true); assert.ok(explained.plan?.Plan['Actual Rows']);
    await assert.rejects(engine.run("SELECT 1, nextval('orders_id_seq') AS n"));
    await assert.rejects(engine.run('DROP INDEX orders_pkey'));
    await engine.run('DROP INDEX idx_orders_customer', { baselineQuery: lookup });
    assert.equal((await engine.run(lookup)).metrics?.heapRowsVisitedApprox, 50000);
  } finally { await engine.close(); }
});

test('playground fixture prepares without error and resets indexes', async () => {
  const engine = new PGliteEngine();
  try {
    await engine.initialize(10000);
    await assert.doesNotReject(engine.prepareLab('playground'));
    await engine.run('CREATE INDEX idx_test_playground ON orders(status)');
    assert.equal((await engine.indexes()).some(idx => idx.name === 'idx_test_playground'), true);
    await engine.prepareLab('playground');
    assert.equal((await engine.indexes()).some(idx => idx.name === 'idx_test_playground'), false);
  } finally { await engine.close(); }
});
