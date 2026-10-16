'use client';
import type { DatabaseAdapter, DatasetSize, QueryResult, ValidationRequest, ValidationResult, WorkerOperation, WorkerResponse } from './types';

type Pending = { resolve(value: unknown): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> };

/** PGlite is owned only by a dedicated Worker. Main-thread deadline terminates stuck WASM execution.
 * A terminated engine loses all transient indexes; explicit reset deterministically rebuilds its dataset. */
export class BrowserPostgresAdapter implements DatabaseAdapter {
  private worker: Worker | null = null;
  private sequence = 0;
  private pending = new Map<number, Pending>();
  private initialized: Promise<{ size: DatasetSize; engine: string }> | null = null;
  private size: DatasetSize = 50000;
  private disposed = false;
  private recoveryRequired = false;

  constructor(private deadlines: { queryMs?: number; initializeMs?: number } = {}) {}

  private startWorker() {
    if (this.worker) return;
    if (this.disposed) throw new Error('The database adapter was disposed.');
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'datalab-postgres' });
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const request = this.pending.get(response.id);
      if (!request) return;
      clearTimeout(request.timer); this.pending.delete(response.id);
      if (response.ok) request.resolve(response.result);
      else request.reject(Object.assign(new Error(response.error.message), { code: response.error.code, position: response.error.position }));
    };
    this.worker.onerror = () => { this.recoveryRequired = true; this.terminate(new Error('The database worker failed. Reset the database to rebuild the dataset.')); };
    this.worker.onmessageerror = () => { this.recoveryRequired = true; this.terminate(new Error('The database worker returned an unreadable response. Reset the database to rebuild it.')); };
  }

  private send<T>(operation: WorkerOperation, deadline = this.deadlines.queryMs ?? 8000): Promise<T> {
    this.startWorker(); const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.recoveryRequired = true; this.terminate(Object.assign(new Error('Query timed out. Reset the database to rebuild it; transient indexes were discarded.'), { resetRequired: true })); }, deadline);
      this.pending.set(id, { resolve: value => resolve(value as T), reject, timer });
      this.worker!.postMessage({ ...operation, id });
    });
  }

  private terminate(error: Error) {
    this.worker?.terminate(); this.worker = null; this.initialized = null;
    for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(error); }
    this.pending.clear();
  }

  initialize(size: DatasetSize = 50000) {
    if (size === 1000000) return Promise.reject(new Error('The one-million-order profile requires native PostgreSQL. Choose up to 100,000 orders in the browser.'));
    if (this.recoveryRequired) return Promise.reject(new Error('Reset the database before running another query.'));
    if (this.initialized && this.size === size) return this.initialized;
    if (this.initialized && this.size !== size) this.terminate(new Error('Dataset changed.'));
    this.size = size;
    const initializing = this.send<{ size: DatasetSize; engine: string }>({ type: 'initialize', size }, this.deadlines.initializeMs ?? 45000).catch(error => {
      if (this.initialized === initializing) this.initialized = null;
      throw error;
    });
    this.initialized = initializing;
    return this.initialized;
  }

  async run(sql: string, options: { baselineQuery?: string } = {}) {
    await this.initialize(this.size);
    return this.send<QueryResult>({ type: 'run', sql, baselineQuery: options.baselineQuery });
  }

  async validate(request: ValidationRequest) {
    await this.initialize(this.size);
    return this.send<ValidationResult>({ type: 'validate', request });
  }

  async prepareLab(labId: string) {
    await this.initialize(this.size);
    return this.send<void>({ type: 'prepare', labId });
  }

  async cancel() {
    this.recoveryRequired = true;
    this.terminate(new Error('Query cancelled. Reset the database before continuing.'));
  }

  reset(size: DatasetSize = this.size) {
    this.terminate(new Error('Database reset.'));
    this.recoveryRequired = false;
    return this.initialize(size);
  }

  dispose() { this.disposed = true; this.terminate(new Error('Database closed.')); }
}
