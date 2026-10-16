'use client';
import type { AppliedExperiment, DatabaseCatalog, Experiment, ExperimentPreview, Measurement, WorkspaceAdapter } from '../workspace';
import type { DirectStatus } from './sessions';

export type ConnectionInput = { host: string; port: number; database: string; user: string; password: string };

export class DirectDatabaseRequestError extends Error {
  constructor(message: string, public code: string) { super(message); }
}

async function call<T>(body: unknown, token?: string, timeout = 30_000): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/local-db', {
      method: 'POST', cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(timeout), keepalive: (body as { action?: string }).action === 'disconnect',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new DirectDatabaseRequestError(error instanceof Error && error.name === 'TimeoutError' ? 'Request timed out.' : 'QueryLab server unreachable.', 'network');
  }
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new DirectDatabaseRequestError(typeof value.error === 'string' ? value.error : 'Request failed.', typeof value.code === 'string' ? value.code : 'unknown');
  return value as T;
}

/** The browser keeps only an opaque session token in memory; the password is sent once to the local server. */
export class DirectDatabaseClient implements WorkspaceAdapter {
  private constructor(private token: string, public info: DirectStatus) {}
  static async connect(input: ConnectionInput) {
    const result = await call<{ token: string; status: DirectStatus; catalog: DatabaseCatalog }>({ action: 'connect', ...input });
    return { client: new DirectDatabaseClient(result.token, result.status), catalog: result.catalog };
  }
  status() { return call<DirectStatus>({ action: 'status' }, this.token); }
  inspectWorkspace() { return call<DatabaseCatalog>({ action: 'inspect' }, this.token); }
  reconcileWorkspace() { return call<DatabaseCatalog>({ action: 'reconcile' }, this.token); }
  measureWorkspace(schema: string, sql: string) { return call<Measurement>({ action: 'measure', schema, sql }, this.token); }
  previewExperiment(experiment: Experiment) { return call<ExperimentPreview>({ action: 'preview', experiment }, this.token); }
  applyExperiment(approvalId: string) { return call<AppliedExperiment>({ action: 'apply', approvalId }, this.token, 120_000); }
  dispose() { void call({ action: 'disconnect' }, this.token).catch(() => undefined); }
}
