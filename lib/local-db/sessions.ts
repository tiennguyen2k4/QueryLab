import { createHash, randomBytes } from 'node:crypto';
import pg from 'pg';
import { nativeTypes, PgLabDatabase } from '../connector/postgres';
import { ExistingDatabaseWorkspace } from '../connector/workspace';
import { parseExperiment, type DatabaseCatalog } from '../workspace';

export const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1'] as const;
const IDLE_TTL = 30 * 60_000;
const MAX_SESSIONS = 4;

export type ConnectionForm = { host: string; port: number; database: string; user: string; password: string };
export type DirectStatus = { connected: boolean; recoveryRequired: boolean; database: string; user: string; host: string; port: number; elevated: boolean };
export type DirectAction =
  | { action: 'status' } | { action: 'inspect' } | { action: 'reconcile' }
  | { action: 'measure'; schema: string; sql: string }
  | { action: 'preview'; experiment: unknown }
  | { action: 'apply'; approvalId: string };

export class DirectDatabaseError extends Error {
  constructor(message: string, public code: string, public status = 400) { super(message); }
}

const text = (value: unknown, field: string, maximum: number, allowEmpty = false) => {
  if (typeof value !== 'string' || value.includes('\0') || value.length > maximum || (!allowEmpty && !value.trim())) throw new DirectDatabaseError(`Invalid ${field}.`, 'invalid');
  return value;
};

/** Credentials are accepted only for a loopback PostgreSQL; the server never connects elsewhere on a user's behalf. */
export function parseConnectionForm(input: unknown): ConnectionForm {
  if (!input || typeof input !== 'object') throw new DirectDatabaseError('Connection details required.', 'invalid');
  const value = input as Record<string, unknown>;
  const host = text(value.host, 'host', 64).trim().replace(/^\[(.*)\]$/, '$1').toLowerCase();
  if (!(LOOPBACK_HOSTS as readonly string[]).includes(host)) throw new DirectDatabaseError('Only localhost, 127.0.0.1 or ::1 are allowed.', 'host');
  const port = Number(value.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new DirectDatabaseError('Port must be 1–65535.', 'invalid');
  return { host, port, database: text(value.database, 'database', 63).trim(), user: text(value.user, 'user', 63).trim(), password: text(value.password, 'password', 1024, true) };
}

function friendly(error: unknown): DirectDatabaseError {
  if (error instanceof DirectDatabaseError) return error;
  const details = error as Error & { code?: string };
  const map: Record<string, [string, string]> = {
    '28P01': ['Wrong user or password.', 'auth'], '28000': ['PostgreSQL refused this login (check pg_hba.conf).', 'auth'],
    '3D000': ['Database does not exist.', 'database-missing'], ECONNREFUSED: ['Nothing is listening on that host and port. Is PostgreSQL running?', 'refused'],
    ETIMEDOUT: ['Connection timed out.', 'refused'], '42501': ['This role lacks the required permission.', 'permission'],
    '57014': ['Statement timeout exceeded.', 'timeout'], '55P03': ['Could not acquire a lock; the table is busy. Nothing was changed.', 'lock'],
    '42P07': ['An object with that name already exists.', 'exists'],
  };
  const known = map[details.code ?? ''];
  if (known) return new DirectDatabaseError(known[0], known[1]);
  if (/timeout/i.test(details.message ?? '')) return new DirectDatabaseError('Connection timed out.', 'refused');
  return new DirectDatabaseError((details.message ?? 'Database request failed.').slice(0, 400), 'database');
}

type Session = { db: PgLabDatabase; workspace: ExistingDatabaseWorkspace; status: Omit<DirectStatus, 'recoveryRequired' | 'connected'>; busy: boolean; lastUsed: number };
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** In-memory only: the password lives in the pg client for the session's lifetime and is never persisted or returned. */
export class DirectDatabaseSessions {
  private sessions = new Map<string, Session>();
  constructor(private now: () => number = Date.now) {}

  private async sweep() {
    for (const [key, session] of this.sessions) {
      if (!session.busy && session.lastUsed + IDLE_TTL < this.now()) { this.sessions.delete(key); await session.db.close().catch(() => undefined); }
    }
  }
  async connect(form: ConnectionForm): Promise<{ token: string; status: DirectStatus; catalog: DatabaseCatalog }> {
    await this.sweep();
    if (this.sessions.size >= MAX_SESSIONS) throw new DirectDatabaseError('Too many open connections. Disconnect another tab first.', 'limit', 429);
    const client = new pg.Client({ ...form, application_name: 'datalab-local', types: nativeTypes, connectionTimeoutMillis: 5000, query_timeout: 120_000, ssl: false });
    try {
      await client.connect();
      const role = await client.query<{ elevated: boolean; database: string; user: string }>(
        'SELECT rolsuper OR rolcreaterole OR rolreplication OR rolbypassrls AS elevated, current_database() AS database, current_user AS "user" FROM pg_roles WHERE rolname = current_user');
      await client.query("SET statement_timeout = '90000ms'; SET lock_timeout = '2000ms'; SET idle_in_transaction_session_timeout = '15000ms'; SET timezone = 'UTC';");
      const db = new PgLabDatabase(client);
      const workspace = new ExistingDatabaseWorkspace(db);
      const catalog = await workspace.inspect();
      const token = randomBytes(32).toString('base64url');
      const status = { database: role.rows[0].database, user: role.rows[0].user, host: form.host, port: form.port, elevated: role.rows[0].elevated };
      this.sessions.set(hash(token), { db, workspace, status, busy: false, lastUsed: this.now() });
      return { token, status: { ...status, connected: true, recoveryRequired: false }, catalog };
    } catch (error) { await client.end().catch(() => undefined); throw friendly(error); }
  }
  private session(token: string) {
    const session = token && token.length <= 128 ? this.sessions.get(hash(token)) : undefined;
    if (!session) throw new DirectDatabaseError('Connection closed. Connect again.', 'closed', 401);
    session.lastUsed = this.now();
    return session;
  }
  async execute(token: string, request: DirectAction): Promise<unknown> {
    await this.sweep();
    const session = this.session(token);
    if (request.action === 'status') return { ...session.status, connected: true, recoveryRequired: session.busy };
    if (session.busy) throw new DirectDatabaseError('Another database action is still running.', 'busy', 409);
    session.busy = true;
    try {
      if (request.action === 'inspect' || request.action === 'reconcile') return await session.workspace.inspect();
      if (request.action === 'measure') return await session.workspace.measure(text(request.schema, 'schema', 63), text(request.sql, 'SQL', 16000));
      if (request.action === 'preview') return await session.workspace.preview(parseExperiment(request.experiment));
      if (request.action !== 'apply' || !/^[a-f0-9]{48}$/.test(String(request.approvalId))) throw new DirectDatabaseError('Review and confirm a valid SQL preview.', 'invalid');
      return await session.workspace.apply(request.approvalId);
    } catch (error) { throw friendly(error); }
    finally { session.busy = false; }
  }
  async close(token: string) {
    const key = hash(token); const session = this.sessions.get(key);
    if (!session) return;
    this.sessions.delete(key);
    await session.db.close().catch(() => undefined);
  }
}

declare global { var datalabDirectSessions: DirectDatabaseSessions | undefined; }
export const directSessions = globalThis.datalabDirectSessions ??= new DirectDatabaseSessions();
