import { randomBytes, timingSafeEqual } from 'node:crypto';
import { guardSql } from '../engine/sql-guard';
import { connectorOperation, type ConnectorClaim, type ConnectorJobView, type ConnectorOperation } from './protocol';

const PAIR_TTL = 5 * 60_000;
const SESSION_TTL = 8 * 60 * 60_000;
const CONNECTED_TTL = 15_000;
const RETENTION = 10 * 60_000;
const MAX_CONNECTORS = 32;
const MAX_JOBS = 50;
type Job = ConnectorJobView & { operation: ConnectorOperation; deadline: number; cancellationRequested: boolean };
type Session = { id: string; agentToken: string; browserToken: string | null; pairingCode: string; pairExpiresAt: number; expiresAt: number; lastSeenAt: number; recoveryRequired: boolean; jobs: Map<string, Job> };
const token = () => randomBytes(32).toString('base64url');
const code = () => randomBytes(6).toString('hex').toUpperCase();
function mutates(operation: ConnectorOperation) {
  if (operation.type.startsWith('workspace-')) return operation.type === 'workspace-apply';
  if (operation.type === 'validate') return false;
  if (operation.type === 'run') { try { return guardSql(operation.sql).kind === 'index'; } catch { return true; } }
  return true;
}
const equal = (left: string, right: string) => left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));
export class ConnectorStoreError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/** Single Node-process development relay. No durable state, horizontal scaling or user account binding. */
export class ConnectorStore {
  private sessions = new Map<string, Session>();
  private attempts = new Map<string, { count: number; until: number }>();
  constructor(private now: () => number = Date.now) {}

  rateLimit(key: string, limit = 20) {
    const now = this.now();
    for (const [address, entry] of this.attempts) if (entry.until < now) this.attempts.delete(address);
    let entry = this.attempts.get(key);
    if (!entry) { if (this.attempts.size > 1000) throw new ConnectorStoreError('Relay request capacity reached.', 429); entry = { count: 0, until: now + 60_000 }; this.attempts.set(key, entry); }
    if (++entry.count > limit) throw new ConnectorStoreError('Too many requests. Wait one minute.', 429);
  }

  private clean() {
    const now = this.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) { this.sessions.delete(id); continue; }
      for (const [jobId, job] of session.jobs) {
        if ((job.state === 'queued' || job.state === 'running') && job.deadline < now) {
          if (job.state === 'running' && mutates(job.operation)) session.recoveryRequired = true;
          job.state = 'expired'; job.cancellationRequested = true; job.error = 'Job deadline exceeded. No automatic retry; reconnect or reset after the connector acknowledges cancellation.';
        }
        if (job.createdAt + RETENTION < now && !job.cancellationRequested) session.jobs.delete(jobId);
      }
    }
  }

  register() {
    this.clean();
    if (this.sessions.size >= MAX_CONNECTORS) throw new ConnectorStoreError('Development relay supports up to 32 connector sessions.', 429);
    const now = this.now();
    const session: Session = { id: token(), agentToken: token(), browserToken: null, pairingCode: code(), pairExpiresAt: now + PAIR_TTL, expiresAt: now + SESSION_TTL, lastSeenAt: now, recoveryRequired: false, jobs: new Map() };
    this.sessions.set(session.id, session);
    return { agentToken: session.agentToken, pairingCode: session.pairingCode, pairExpiresAt: session.pairExpiresAt };
  }

  pair(pairingCode: string) {
    this.clean();
    if (!/^[0-9A-F]{12}$/.test(pairingCode)) throw new ConnectorStoreError('Invalid pairing code.', 401);
    const session = [...this.sessions.values()].find(item => equal(item.pairingCode, pairingCode));
    if (!session || session.pairExpiresAt < this.now() || session.browserToken || session.lastSeenAt + CONNECTED_TTL < this.now()) throw new ConnectorStoreError('Pairing code expired, already used, or connector offline.', 401);
    session.browserToken = token();
    return { browserToken: session.browserToken, expiresAt: session.expiresAt };
  }

  private authenticate(bearer: string, agent: boolean) {
    this.clean();
    if (!bearer || bearer.length > 128) throw new ConnectorStoreError('Connector session authorization required.', 401);
    const session = [...this.sessions.values()].find(item => equal(agent ? item.agentToken : item.browserToken ?? '', bearer));
    if (!session) throw new ConnectorStoreError('Connector session expired. Pair again.', 401);
    return session;
  }
  status(bearer: string) {
    const session = this.authenticate(bearer, false);
    return { connected: session.lastSeenAt + CONNECTED_TTL >= this.now(), lastSeenAt: session.lastSeenAt, paired: true, recoveryRequired: session.recoveryRequired };
  }

  enqueue(bearer: string, input: unknown): ConnectorJobView {
    const session = this.authenticate(bearer, false);
    if (session.lastSeenAt + CONNECTED_TTL < this.now()) throw new ConnectorStoreError('Connector is offline.', 409);
    const operation = connectorOperation(input);
    if ([...session.jobs.values()].some(job => job.state === 'queued' || job.state === 'running' || job.cancellationRequested)) throw new ConnectorStoreError('Wait for the previous job or its cancellation acknowledgement.', 409);
    if (session.recoveryRequired && operation.type !== 'reset' && operation.type !== 'workspace-inspect' && operation.type !== 'workspace-reconcile') throw new ConnectorStoreError('A previous job was interrupted. Inspect and acknowledge the current database state, or reset a dedicated lab dataset, before continuing.', 409);
    if (session.jobs.size >= MAX_JOBS) {
      const oldest = session.jobs.keys().next().value;
      if (oldest) session.jobs.delete(oldest);
    }
    const createdAt = this.now();
    const job: Job = { id: token(), operation, state: 'queued', createdAt, deadline: createdAt + (operation.type === 'initialize' || operation.type === 'reset' ? 180_000 : 30_000), cancellationRequested: false };
    session.jobs.set(job.id, job);
    return this.view(job);
  }
  private view(job: Job): ConnectorJobView { return { id: job.id, state: job.state, createdAt: job.createdAt, ...(job.result === undefined ? {} : { result: job.result }), ...(job.error ? { error: job.error } : {}) }; }
  getJob(bearer: string, id: string) {
    const session = this.authenticate(bearer, false);
    const job = session.jobs.get(id);
    if (!job) throw new ConnectorStoreError('Job not found in this session.', 404);
    return this.view(job);
  }
  cancel(bearer: string, id: string) {
    const session = this.authenticate(bearer, false);
    const job = session.jobs.get(id);
    if (!job) throw new ConnectorStoreError('Job not found in this session.', 404);
    if (job.state === 'queued') { job.state = 'cancelled'; job.error = 'Cancelled before execution.'; }
    else if (job.state === 'running') { job.cancellationRequested = true; if (mutates(job.operation)) session.recoveryRequired = true; }
    return this.view(job);
  }
  poll(bearer: string): { job: ConnectorClaim | null; cancelIds: string[]; pairingCode: string | null; pairExpiresAt: number; paired: boolean } {
    const session = this.authenticate(bearer, true);
    session.lastSeenAt = this.now();
    if (!session.browserToken && session.pairExpiresAt < this.now()) { session.pairingCode = code(); session.pairExpiresAt = this.now() + PAIR_TTL; }
    const cancelled = [...session.jobs.values()].filter(job => job.cancellationRequested);
    let job = [...session.jobs.values()].find(job => job.state === 'running');
    if (!job && !cancelled.length && session.browserToken) {
      job = [...session.jobs.values()].find(job => job.state === 'queued');
      if (job) job.state = 'running';
    } else job = undefined; // Claims are delivered once; running DDL is never implicitly replayed.
    return { job: job ? { id: job.id, operation: job.operation } : null, cancelIds: cancelled.map(job => job.id), pairingCode: session.browserToken ? null : session.pairingCode, pairExpiresAt: session.pairExpiresAt, paired: Boolean(session.browserToken) };
  }
  report(bearer: string, id: string, payload: { result?: unknown; error?: string }) {
    const session = this.authenticate(bearer, true);
    session.lastSeenAt = this.now();
    const job = session.jobs.get(id);
    if (!job) throw new ConnectorStoreError('Job is not running in this session.', 409);
    if (['succeeded', 'failed', 'cancelled', 'expired'].includes(job.state) && !job.cancellationRequested) return this.view(job); // Idempotent acknowledgement; SQL itself is never replayed.
    if (!['running', 'expired'].includes(job.state)) throw new ConnectorStoreError('Job is not running in this session.', 409);
    if (job.cancellationRequested || job.state === 'expired') { job.state = job.state === 'expired' ? 'expired' : 'cancelled'; job.error ??= session.recoveryRequired ? 'Query cancelled. Reset before continuing.' : 'Query cancelled.'; }
    else if (payload.error) { job.state = 'failed'; job.error = payload.error.slice(0, 1000); }
    else { job.state = 'succeeded'; job.result = payload.result; if (job.operation.type === 'reset' || job.operation.type === 'workspace-reconcile') session.recoveryRequired = false; }
    job.cancellationRequested = false;
    return this.view(job);
  }
  release(bearer: string) {
    const session = this.authenticate(bearer, false);
    for (const job of session.jobs.values()) {
      if (job.state === 'queued') job.state = 'cancelled';
      else if (job.state === 'running') { job.cancellationRequested = true; if (mutates(job.operation)) session.recoveryRequired = true; }
    }
    session.browserToken = null; session.pairingCode = code(); session.pairExpiresAt = this.now() + PAIR_TTL;
    return { released: true };
  }
}

declare global { var datalabConnectorStore: ConnectorStore | undefined; }
export const connectorStore = globalThis.datalabConnectorStore ??= new ConnectorStore();
