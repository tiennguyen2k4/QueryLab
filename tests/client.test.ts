import assert from 'node:assert/strict';
import test from 'node:test';
import { BrowserPostgresAdapter } from '../lib/engine/client';

test('hard query deadline terminates worker, rejects all pending requests and requires explicit recovery', async () => {
  const originalWorker = globalThis.Worker;
  const workers: StubWorker[] = [];
  class StubWorker {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessageerror: (() => void) | null = null;
    terminated = false;
    constructor() { workers.push(this); }
    postMessage(request: { id: number; type: string; size?: number }) {
      if (request.type === 'initialize') queueMicrotask(() => this.onmessage?.({ data: { id: request.id, ok: true, result: { size: request.size, engine: 'test' } } }));
      // Intentionally never answer read queries: simulates synchronous stuck WASM.
    }
    terminate() { this.terminated = true; }
  }
  globalThis.Worker = StubWorker as unknown as typeof Worker;
  const adapter = new BrowserPostgresAdapter({ queryMs: 15, initializeMs: 1000 });
  try {
    await adapter.initialize();
    const requests = [adapter.run('SELECT 1'), adapter.run('SELECT 2')];
    const results = await Promise.allSettled(requests);
    assert.equal(results.filter(r => r.status === 'rejected').length, 2);
    assert.equal(workers[0].terminated, true);
    await assert.rejects(adapter.run('SELECT 3'), /Reset the database/);
    assert.equal(workers.length, 1);
    await adapter.reset();
    assert.equal(workers.length, 2);
    assert.equal(workers[1].terminated, false);
    adapter.dispose();
    assert.equal(workers[1].terminated, true);
  } finally { adapter.dispose(); globalThis.Worker = originalWorker; }
});
