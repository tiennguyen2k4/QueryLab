import pg from 'pg';
import { LabEngine, type LabDatabase, type LabTransaction } from '../engine/core';
import type { DatasetSize } from '../engine/types';
import { connectorOperation, NATIVE_ENGINE_NAME, type ConnectorOperation } from './protocol';
import { ExistingDatabaseWorkspace } from './workspace';

const SCHEMA = 'datalab_lab';
const DATASET_VERSION = 'commerce-v1';
export const nativeTypes = { getTypeParser: (oid: number, format?: 'text' | 'binary') => oid === 1082 && format !== 'binary' ? (value: string) => value : pg.types.getTypeParser(oid, format) }; // DATE is a calendar value; never shift it through the connector's local timezone.

export class PgLabDatabase implements LabDatabase {
  constructor(readonly client: pg.Client) {}
  async exec(sql: string) { return this.client.query(sql); }
  async query<T = Record<string, unknown>>(sql: string, parameters: unknown[] = [], options?: { rowMode: 'array' }) {
    const result = await this.client.query({ text: sql, values: parameters, ...(options ? { rowMode: options.rowMode } : {}) });
    return { rows: result.rows as T[], fields: result.fields.map(field => ({ name: field.name, dataTypeID: field.dataTypeID })) };
  }
  async transaction<T>(fn: (transaction: LabTransaction) => Promise<T>): Promise<T> {
    await this.client.query('BEGIN');
    try { const result = await fn(this); await this.client.query('COMMIT'); return result; }
    catch (error) { await this.client.query('ROLLBACK').catch(() => undefined); throw error; }
  }
  async close() { await this.client.end(); }
}

/** Only the connector sees DATABASE_URL. It refuses production-shaped targets and superuser roles. */
export class NativePostgresRuntime {
  private engine: LabEngine | null = null;
  private database: PgLabDatabase | null = null;
  private size: DatasetSize = 100000;
  private busy = false;
  private workspace: ExistingDatabaseWorkspace | null = null;
  constructor(private connectionString: string, private dedicatedDatabase: boolean, private mode: 'lab' | 'existing' = 'lab') {
    if (mode === 'lab' && !dedicatedDatabase) throw new Error('Set DATALAB_DEDICATED_DATABASE=1 only for a disposable, dedicated lab database.');
    let url: URL;
    try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL must be a PostgreSQL connection URL.'); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');
    if (mode === 'existing') {
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.search || url.hash) throw new Error('Existing-database mode requires a loopback PostgreSQL URL without query overrides or fragments.');
    } else if (!/^datalab_lab(?:_[a-z0-9_]+)?$/.test(decodeURIComponent(url.pathname.slice(1)))) throw new Error('Connector requires a dedicated database named datalab_lab or datalab_lab_<suffix>.');
  }
  private async connect() {
    const client = new pg.Client({ connectionString: this.connectionString, application_name: 'datalab-local-connector', types: nativeTypes, connectionTimeoutMillis: 5000, query_timeout: 120_000 });
    await client.connect();
    try {
      const permission = await client.query<{ unsafe: boolean; database: string }>('SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls AS unsafe, current_database() AS database FROM pg_roles WHERE rolname = current_user');
      if (this.mode === 'lab' && !/^datalab_lab(?:_[a-z0-9_]+)?$/.test(permission.rows[0]?.database ?? '')) throw new Error('The connected PostgreSQL database is not a dedicated datalab_lab database.');
      if (permission.rows[0]?.unsafe !== false) throw new Error('Use a dedicated lab role without SUPERUSER, CREATEDB, CREATEROLE, REPLICATION or BYPASSRLS.');
      // Session-wide limits cover fixture/import and catalogue operations; guarded queries set stricter LOCAL limits.
      await client.query("SET statement_timeout = '90000ms'; SET lock_timeout = '2000ms'; SET idle_in_transaction_session_timeout = '15000ms'; SET work_mem = '16MB'; SET timezone = 'UTC';");
      return new PgLabDatabase(client);
    } catch (error) { await client.end(); throw error; }
  }

  private async initialize(size: DatasetSize, reset = false) {
    if (this.engine && !reset) {
      if (size !== this.size) throw new Error(`Dataset is already ${this.size} orders. Use Reset to select a different size.`);
      return { size, engine: NATIVE_ENGINE_NAME };
    }
    await this.close();
    const db = await this.connect(); this.database = db;
    try {
      const existing = await db.query<{ relation: string | null }>("SELECT to_regclass('datalab_lab._datalab_metadata')::text AS relation");
      let seeded = false;
      if (reset) await db.exec(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE;`);
      else if (existing.rows[0]?.relation) {
        const metadata = await db.query<{ size: number; version: string }>(`SELECT size, version FROM ${SCHEMA}._datalab_metadata WHERE singleton = true`);
        if (metadata.rows[0]?.version !== DATASET_VERSION || metadata.rows[0].size !== size) throw new Error('A different dataset already exists. Explicitly Reset the dedicated lab schema to rebuild it.');
        seeded = true;
      } else {
        const objects = await db.query<{ count: string }>("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='datalab_lab' AND c.relkind IN ('r','p','v','m')");
        if (Number(objects.rows[0].count)) throw new Error('Unrecognized tables exist in datalab_lab. Explicitly Reset only if they are disposable lab data.');
      }
      await db.exec(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA};`);
      const engine = new LabEngine(async () => db, NATIVE_ENGINE_NAME, SCHEMA, !seeded);
      await engine.initialize(size);
      if (!seeded) await db.exec(`CREATE TABLE ${SCHEMA}._datalab_metadata (singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton), size integer NOT NULL, version text NOT NULL); INSERT INTO ${SCHEMA}._datalab_metadata VALUES (true, ${size}, '${DATASET_VERSION}');`);
      if (seeded) {
        const indexes = await db.query<{ name: string }>(`SELECT c.relname AS name FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='${SCHEMA}' AND NOT i.indisprimary AND NOT i.indisunique`);
        engine.restoreLabIndexes(indexes.rows.map(index => index.name));
      }
      this.engine = engine; this.size = size;
      return { size, engine: NATIVE_ENGINE_NAME };
    } catch (error) { await db.close().catch(() => undefined); this.database = null; throw error; }
  }
  async execute(input: unknown): Promise<unknown> {
    const operation: ConnectorOperation = connectorOperation(input);
    if (this.busy) throw new Error('Only one native lab job can run at a time.');
    this.busy = true;
    try {
      if (operation.type.startsWith('workspace-')) {
        if (this.mode !== 'existing') throw new Error('Restart the connector with DATALAB_MODE=existing to inspect an existing local database.');
        if (!this.workspace) {
          this.database = await this.connect();
          this.workspace = new ExistingDatabaseWorkspace(this.database);
        }
        if (operation.type === 'workspace-inspect' || operation.type === 'workspace-reconcile') return await this.workspace.inspect();
        if (operation.type === 'workspace-measure') return await this.workspace.measure(operation.schema, operation.sql);
        if (operation.type === 'workspace-preview') return await this.workspace.preview(operation.experiment);
        if (operation.type === 'workspace-apply') return await this.workspace.apply(operation.approvalId);
      }
      if (this.mode === 'existing') throw new Error('Fixture initialization, reset and lab SQL are disabled for existing databases. Use the optimization workspace.');
      if (operation.type === 'initialize' || operation.type === 'reset') return await this.initialize(operation.size, operation.type === 'reset');
      if (!this.engine) throw new Error('Initialize the native lab dataset first.');
      if (operation.type === 'prepare') { await this.engine.prepareLab(operation.labId); return { prepared: true }; }
      if (operation.type === 'run') return await this.engine.run(operation.sql, { baselineQuery: operation.baselineQuery });
      if (operation.type === 'validate') return await this.engine.validate(operation.request);
      throw new Error('Unsupported database operation.');
    } finally { this.busy = false; }
  }
  async cancel() {
    if (!this.database) return;
    // Separate connection lets PostgreSQL interrupt the running transaction; no blind operation retries.
    const control = new pg.Client({ connectionString: this.connectionString, application_name: 'datalab-local-cancel', connectionTimeoutMillis: 5000 });
    await control.connect();
    try {
      const processId = (this.database.client as pg.Client & { processID?: number }).processID;
      if (processId) await control.query('SELECT pg_cancel_backend($1)', [processId]);
    } finally { await control.end(); }
  }
  async close() {
    if (this.engine) await this.engine.close();
    else if (this.database) await this.database.close().catch(() => undefined);
    this.engine = null; this.database = null; this.workspace = null;
  }
}
