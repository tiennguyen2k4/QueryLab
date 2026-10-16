import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { NativePostgresRuntime } from '../lib/connector/postgres';
import { relation, type AppliedExperiment, type DatabaseCatalog, type ExperimentPreview, type Measurement } from '../lib/workspace';

const url = process.env.DATALAB_TEST_DATABASE_URL;

test('existing mode rejects remote databases and URL connection overrides', () => {
  for (const value of ['postgresql://user@db.example.com/application', 'postgresql://user@localhost/app?host=remote', 'postgresql://user@localhost/app#fragment']) {
    assert.throws(() => new NativePostgresRuntime(value, false, 'existing'), /loopback/);
  }
  assert.doesNotThrow(() => new NativePostgresRuntime('postgresql://user@127.0.0.1/application', false, 'existing'));
});

test('existing PostgreSQL: discovery, baseline, confirmed index, partition copy, rollback and cleanup', { skip: !url }, async () => {
  assert.match(new URL(url!).pathname, /^\/datalab_lab(?:_[a-z0-9_]+)?$/, 'integration tests only create fixtures inside a dedicated test database');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const schema = `datalab_workspace_test_${process.pid}_${Date.now()}`;
  const source = relation(schema, 'events');
  const runtime = new NativePostgresRuntime(url!, false, 'existing');
  const preview = (experiment: unknown) => runtime.execute({ type: 'workspace-preview', experiment }) as Promise<ExperimentPreview>;
  const apply = (value: ExperimentPreview) => runtime.execute({ type: 'workspace-apply', approvalId: value.approvalId, confirmed: true }) as Promise<AppliedExperiment>;
  try {
    await client.query(`CREATE SCHEMA "${schema}"; CREATE TABLE ${relation(schema,'empty_table')} (); CREATE TABLE ${source} (id integer PRIMARY KEY, customer_id integer, occurred_at date, status text);
      INSERT INTO ${source} SELECT n, n%1000, DATE '2024-01-01'+(n%365), CASE WHEN n%2=0 THEN 'paid' ELSE 'pending' END FROM generate_series(1,50000) n;
      INSERT INTO ${source} VALUES (50001,1,NULL,'pending'),(50002,1,DATE '2023-01-01','paid'); ANALYZE ${source};`);
    const beforeOid = (await client.query<{ oid: number }>('SELECT $1::regclass::oid::int AS oid', [source])).rows[0].oid;
    const catalog = await runtime.execute({ type: 'workspace-inspect' }) as DatabaseCatalog;
    const table = catalog.tables.find(item => item.schema === schema && item.name === 'events')!;
    assert.deepEqual(catalog.tables.find(item => item.schema === schema && item.name === 'empty_table')?.columns, []);
    assert.ok(table); assert.equal(table.columns.find(column => column.name === 'occurred_at')?.date, true);
    await assert.rejects(runtime.execute({ type: 'reset', size: 100000 }), /disabled/);
    await assert.rejects(runtime.execute({ type: 'initialize', size: 100000 }), /disabled/);
    await assert.rejects(runtime.execute({ type: 'run', sql: 'CREATE INDEX bad ON orders(id)' }), /disabled/);
    const sql = `SELECT id FROM ${source} WHERE customer_id=42`;
    const before = await runtime.execute({ type: 'workspace-measure', schema, sql }) as Measurement;
    assert.deepEqual(before.result.rows, [], 'existing database rows are never fetched into previews');
    assert.ok(before.result.metrics!.scanTypes.includes('Seq Scan'));
    assert.equal(before.result.metrics!.heapRowsVisitedApprox, 50002);
    const indexPreview = await preview({ kind: 'index', schema, table: 'events', name: 'datalab_customer_idx', columns: ['customer_id'] });
    assert.equal((await client.query('SELECT to_regclass($1) AS index', [relation(schema,'datalab_customer_idx')])).rows[0].index, null, 'preview is read-only');
    const createdIndex = await apply(indexPreview);
    await assert.rejects(apply(indexPreview), /already used/);
    const after = await runtime.execute({ type: 'workspace-measure', schema, sql }) as Measurement;
    assert.ok(after.result.metrics!.indexNames.includes('datalab_customer_idx'));
    assert.ok(after.result.metrics!.heapRowsVisitedApprox < before.result.metrics!.heapRowsVisitedApprox / 10);
    assert.equal(after.result.returnedRowCount, before.result.returnedRowCount);
    await assert.rejects(preview({ kind: 'remove', schema, name: 'events', object: 'table' }), /Only unchanged/);
    await assert.rejects(preview({ kind: 'remove', schema, name: 'events_pkey', object: 'index' }), /Only unchanged/);
    const copyPreview = await preview({ kind: 'partition', schema, table: 'events', name: 'datalab_monthly', column: 'occurred_at', startMonth: '2024-01', months: 12 });
    const createdCopy = await apply(copyPreview);
    const copy = relation(schema,'datalab_monthly');
    const counts = await client.query(`SELECT (SELECT count(*) FROM ${source}) AS original, (SELECT count(*) FROM ${copy}) AS copy,
      (SELECT count(*) FROM ${relation(schema,'datalab_monthly_other')}) AS other`);
    assert.deepEqual(Object.values(counts.rows[0]).map(Number), [50002,50002,2]);
    const differences = await client.query(`SELECT NOT EXISTS ((SELECT * FROM ${source} EXCEPT ALL SELECT * FROM ${copy}) UNION ALL (SELECT * FROM ${copy} EXCEPT ALL SELECT * FROM ${source})) AS matches`);
    assert.equal(differences.rows[0].matches, true, 'copy preserves every fixture value including NULLs');
    const partitioned = await runtime.execute({ type: 'workspace-measure', schema, sql: `SELECT id FROM ${copy} WHERE occurred_at >= DATE '2024-03-01' AND occurred_at < DATE '2024-04-01'` }) as Measurement;
    assert.match(JSON.stringify(partitioned.result.plan), /datalab_monthly_p3/);
    assert.doesNotMatch(JSON.stringify(partitioned.result.plan), /datalab_monthly_p2"/);
    const failing = await preview({ kind: 'partition', schema, table: 'events', name: 'datalab_conflict', column: 'occurred_at', startMonth: '2024-01', months: 2 });
    await client.query(`CREATE TABLE ${relation(schema,'datalab_conflict_p2')} (id int)`);
    await assert.rejects(apply(failing), /already exists/);
    assert.equal((await client.query('SELECT to_regclass($1) AS target', [relation(schema,'datalab_conflict')])).rows[0].target, null, 'later DDL failure rolls back the whole copy');
    assert.equal((await client.query('SELECT $1::regclass::oid::int AS oid', [source])).rows[0].oid, beforeOid, 'source table is never replaced');
    await apply(await preview(createdIndex.cleanup));
    await apply(await preview(createdCopy.cleanup));
    assert.equal((await client.query('SELECT to_regclass($1) AS target', [copy])).rows[0].target, null);
    assert.equal(Number((await client.query(`SELECT count(*) FROM ${source}`)).rows[0].count), 50002, 'cleanup never deletes source rows');
  } finally {
    await runtime.close();
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
    await client.end();
  }
});
