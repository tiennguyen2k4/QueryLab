import { PGliteEngine } from './core';
import type { WorkerRequest, WorkerResponse } from './types';

const engine = new PGliteEngine();
// One queue protects the single connection and prevents request/transaction interleaving.
let queue = Promise.resolve();
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  queue = queue.then(async () => {
    let response: WorkerResponse;
    try {
      const result = request.type === 'initialize' ? await engine.initialize(request.size)
        : request.type === 'prepare' ? await engine.prepareLab(request.labId)
        : request.type === 'run' ? await engine.run(request.sql, { baselineQuery: request.baselineQuery })
          : await engine.validate(request.request);
      response = { id: request.id, ok: true, result };
    } catch (error) {
      const details = error as { message?: string; code?: string; position?: string };
      response = { id: request.id, ok: false, error: { message: details.message ?? 'Query failed.', code: details.code, position: details.position } };
    }
    self.postMessage(response);
  });
});
