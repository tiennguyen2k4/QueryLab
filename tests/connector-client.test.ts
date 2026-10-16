import assert from 'node:assert/strict';
import test from 'node:test';
import { NativePostgresAdapter } from '../lib/engine/native-client';
import { ConnectorStore } from '../lib/connector/store';

/** Transport simulation checks client session/retry behavior; real SQL is exercised separately. */
test('native client pairs once, keeps its controller across lessons and never retries DDL on a lost response', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const store = new ConnectorStore(); const agent = store.register();
  let browserToken = ''; let mutationSubmissions = 0; let lostJob: string | null = null;
  const operations: string[] = [];
  globalThis.fetch = async (input, init) => {
    const path = new URL(String(input), 'http://localhost').pathname.replace('/api/connectors', '');
    const bearer = new Headers(init?.headers).get('authorization')?.replace('Bearer ', '') ?? '';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    assert.ok(!JSON.stringify(body ?? {}).includes('DATABASE_URL'));
    if (path === '/pair') { const paired = store.pair(body.code); browserToken = paired.browserToken; return Response.json(paired); }
    if (path === '/status') return Response.json(store.status(bearer));
    if (path === '/session') return Response.json(store.release(bearer));
    if (path === '/jobs') {
      const submitted = store.enqueue(bearer, body); operations.push(body.type);
      const claim = store.poll(agent.agentToken).job!;
      if (body.type === 'run' && body.sql.startsWith('CREATE')) { mutationSubmissions++; lostJob = claim.id; }
      else store.report(agent.agentToken, claim.id, { result: body.type === 'initialize' || body.type === 'reset' ? { size: body.size, engine: 'native test transport' } : { prepared: true } });
      return Response.json(submitted);
    }
    const match = path.match(/^\/jobs\/([^/]+)(\/cancel)?$/)!;
    if (match[2]) return Response.json(store.cancel(bearer, match[1]));
    if (match[1] === lostJob) { lostJob = null; throw new TypeError('Connection lost after database execution may have started.'); }
    return Response.json(store.getJob(bearer, match[1]));
  };
  const adapter = new NativePostgresAdapter(agent.pairingCode);
  assert.equal((await adapter.connect()).connected, true);
  await adapter.initialize(100000);
  await adapter.prepareLab('index-006');
  await adapter.prepareLab('partition-014');
  assert.deepEqual(operations, ['initialize', 'prepare', 'prepare']);
  await assert.rejects(adapter.run('CREATE INDEX idx_test ON orders(customer_id)'), /Connection lost/);
  assert.equal(mutationSubmissions, 1);
  const cancelled = store.poll(agent.agentToken).cancelIds[0];
  assert.ok(cancelled);
  store.report(agent.agentToken, cancelled, { result: { message: 'DDL may have finished' } });
  assert.equal(store.getJob(browserToken, cancelled).state, 'cancelled');
  assert.equal((await adapter.status()).recoveryRequired, true);
  await adapter.reset(100000);
  assert.equal((await adapter.status()).recoveryRequired, false);
  adapter.dispose();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.throws(() => store.status(browserToken), /expired/);
});

test('existing database client inspects and measures without initializing or resetting fixtures', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const store = new ConnectorStore(); const agent = store.register();
  const operations: string[] = [];
  globalThis.fetch = async (input, init) => {
    const path = new URL(String(input), 'http://localhost').pathname.replace('/api/connectors', '');
    const bearer = new Headers(init?.headers).get('authorization')?.replace('Bearer ', '') ?? '';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (path === '/pair') return Response.json(store.pair(body.code));
    if (path === '/status') return Response.json(store.status(bearer));
    if (path === '/session') return Response.json(store.release(bearer));
    if (path === '/jobs') {
      operations.push(body.type);
      const submitted = store.enqueue(bearer, body); const claim = store.poll(agent.agentToken).job!;
      store.report(agent.agentToken, claim.id, { result: body.type === 'workspace-inspect' ? { database: 'existing', tables: [] } : { measuredAt: 123 } });
      return Response.json(submitted);
    }
    return Response.json(store.getJob(bearer, path.split('/').at(-1)!));
  };
  const adapter = new NativePostgresAdapter(agent.pairingCode);
  await adapter.connect();
  assert.equal((await adapter.inspectWorkspace()).database, 'existing');
  await adapter.measureWorkspace('public', 'SELECT 1');
  assert.deepEqual(operations, ['workspace-inspect', 'workspace-measure']);
  adapter.dispose();
});
