'use client';
import type { DatabaseAdapter, DatasetSize, QueryResult, ValidationRequest, ValidationResult } from './types';
import type { ConnectorJobView, ConnectorOperation } from '../connector/protocol';
import type { AppliedExperiment, DatabaseCatalog, Experiment, ExperimentPreview, Measurement } from '../workspace';

type NativeStatus = { connected: boolean; lastSeenAt: number; paired: boolean; recoveryRequired: boolean };
const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

/** Credentials remain inside the learner's local connector; browser holds an opaque control session. */
export class NativePostgresAdapter implements DatabaseAdapter {
  private token: string | null = null;
  private pairing: Promise<void> | null = null;
  private initialized: Promise<{ size: DatasetSize; engine: string }> | null = null;
  private size: DatasetSize = 100000;
  private activeJob: string | null = null;
  private submitting = false;
  private disposed = false;
  constructor(private pairingCode: string, private baseUrl = '/api/connectors') {}

  private async request<T>(path: string, method = 'GET', input?: unknown): Promise<T> {
    const result = await fetch(`${this.baseUrl}${path}`, {
      method, cache: 'no-store', signal: AbortSignal.timeout(10_000), keepalive: method === 'DELETE',
      headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}), ...(input === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });
    const response = await result.json();
    if (!result.ok) throw new Error(typeof response.error === 'string' ? response.error : 'Connector request failed.');
    return response as T;
  }
  private async pair() {
    if (this.disposed) throw new Error('The native adapter was disposed.');
    if (this.token) return;
    this.pairing ??= this.request<{ browserToken: string }>('/pair', 'POST', { code: this.pairingCode }).then(response => { this.token = response.browserToken; if (this.disposed) { void this.request('/session', 'DELETE').catch(() => undefined); throw new Error('The native adapter was disposed.'); } }).catch(error => { this.pairing = null; throw error; });
    await this.pairing;
  }
  async connect(): Promise<NativeStatus> { await this.pair(); return this.status(); }
  async status(): Promise<NativeStatus> { await this.pair(); return this.request<NativeStatus>('/status'); }
  inspectWorkspace() { return this.job<DatabaseCatalog>({ type: 'workspace-inspect' }); }
  measureWorkspace(schema: string, sql: string) { return this.job<Measurement>({ type: 'workspace-measure', schema, sql }); }
  previewExperiment(experiment: Experiment) { return this.job<ExperimentPreview>({ type: 'workspace-preview', experiment }); }
  applyExperiment(approvalId: string) { return this.job<AppliedExperiment>({ type: 'workspace-apply', approvalId, confirmed: true }); }
  reconcileWorkspace() { return this.job<DatabaseCatalog>({ type: 'workspace-reconcile', confirmed: true }); }

  private async job<T>(operation: ConnectorOperation): Promise<T> {
    await this.pair();
    const idleDeadline = Date.now() + 12_000;
    while ((this.activeJob || this.submitting) && !this.disposed && Date.now() < idleDeadline) await delay(100);
    if (this.disposed) throw new Error('The native adapter was disposed.');
    if (this.activeJob || this.submitting) throw new Error('Wait for the current native job to finish or cancel it.');
    this.submitting = true;
    let submitted: ConnectorJobView;
    try { submitted = await this.request<ConnectorJobView>('/jobs', 'POST', operation); this.activeJob = submitted.id; }
    finally { this.submitting = false; }
    const deadline = Date.now() + (operation.type === 'initialize' || operation.type === 'reset' ? 185_000 : 35_000);
    try {
      while (!this.disposed && Date.now() < deadline) {
        const current = await this.request<ConnectorJobView>(`/jobs/${submitted.id}`);
        if (current.state === 'succeeded') return current.result as T;
        if (['failed', 'expired', 'cancelled'].includes(current.state)) throw new Error(current.error ?? `Native job ${current.state}.`);
        await delay(300);
      }
      await this.request(`/jobs/${submitted.id}/cancel`, 'POST');
      throw new Error('Native job interrupted or timed out. Wait for cancellation, then inspect the database state before continuing. Never retry DDL blindly.');
    } catch (error) {
      // A transport failure is not proof that SQL stopped. Request cancellation; never retry the job.
      if (!this.disposed) await this.request(`/jobs/${submitted.id}/cancel`, 'POST').catch(() => undefined);
      throw error;
    } finally { if (this.activeJob === submitted.id) this.activeJob = null; }
  }
  initialize(size: DatasetSize = this.size) {
    if (this.initialized && size === this.size) return this.initialized;
    this.size = size;
    const initializing = this.job<{ size: DatasetSize; engine: string }>({ type: 'initialize', size }).catch(error => { if (this.initialized === initializing) this.initialized = null; throw error; });
    this.initialized = initializing;
    return initializing;
  }
  async run(sql: string, options: { baselineQuery?: string } = {}) {
    await this.initialize(this.size);
    return this.job<QueryResult>({ type: 'run', sql, baselineQuery: options.baselineQuery });
  }
  async validate(request: ValidationRequest) {
    await this.initialize(this.size);
    return this.job<ValidationResult>({ type: 'validate', request });
  }
  async prepareLab(labId: string) {
    await this.initialize(this.size);
    await this.job<void>({ type: 'prepare', labId });
  }
  async cancel() {
    const id = this.activeJob;
    if (id) {
      await this.request(`/jobs/${id}/cancel`, 'POST');
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        const current = await this.request<ConnectorJobView>(`/jobs/${id}`);
        if (!['queued', 'running'].includes(current.state)) break;
        await delay(200);
      }
    }
    this.initialized = null;
  }
  async reset(size: DatasetSize = this.size) {
    this.size = size; this.initialized = null;
    const resetting = this.job<{ size: DatasetSize; engine: string }>({ type: 'reset', size }).catch(error => { if (this.initialized === resetting) this.initialized = null; throw error; });
    this.initialized = resetting;
    return resetting;
  }
  dispose() {
    if (this.disposed) return;
    if (this.token) void this.request('/session', 'DELETE').catch(() => undefined);
    this.disposed = true; this.initialized = null;
  }
}
