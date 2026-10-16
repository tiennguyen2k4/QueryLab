import { randomBytes } from 'node:crypto';
import type { LabDatabase, LabTransaction } from '../engine/core';
import type { ExplainDocument, QueryResult } from '../engine/types';
import { metricsFromPlan } from '../engine/metrics';
import { experimentSql, identifier, parseExperiment, relation, workspaceRead, type AppliedExperiment, type DatabaseCatalog, type DatabaseColumn, type Experiment, type ExperimentPreview, type Measurement } from '../workspace';

type Approval = ExperimentPreview & { sourceOid: number };
type OwnedObject = { oid: number; object: 'index' | 'table' };
const LIMITS = "SET LOCAL statement_timeout = '20000ms'; SET LOCAL lock_timeout = '1500ms'; SET LOCAL timezone = 'UTC'; SET LOCAL search_path = pg_catalog;";

/** Existing databases never pass through the fixture engine or its reset/seed paths. */
export class ExistingDatabaseWorkspace {
  private approvals = new Map<string, Approval>();
  private owned = new Map<string, OwnedObject>();
  constructor(private db: LabDatabase) {}

  private async table(tx: LabTransaction, schema: string, name: string) {
    const found = await tx.query<{ oid: number; kind: string }>(
      `SELECT c.oid::int AS oid, c.relkind AS kind FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname=$1 AND c.relname=$2 AND c.relkind IN ('r','p') AND NOT c.relispartition
       AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema' AND pg_catalog.has_table_privilege(c.oid, 'SELECT')`, [schema, name]);
    if (!found.rows[0]) throw new Error('Source table is unavailable. Refresh the schema and check SELECT permissions.');
    return found.rows[0];
  }
  async inspect(): Promise<DatabaseCatalog> {
    return this.db.transaction(async tx => {
      await tx.exec(`SET TRANSACTION READ ONLY; ${LIMITS}`);
      const database = await tx.query<{ database: string }>('SELECT current_database() AS database');
      const result = await tx.query<{
        schema: string; name: string; estimatedRows: number; bytes: number; partitioned: boolean; columns: DatabaseColumn[];
      }>(`SELECT n.nspname AS schema, c.relname AS name, greatest(0,c.reltuples)::float8 AS "estimatedRows",
        pg_catalog.pg_table_size(c.oid)::float8 AS bytes, c.relkind='p' AS partitioned,
        COALESCE((SELECT json_agg(json_build_object('name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
          'date',a.atttypid IN (1082,1114,1184)) ORDER BY a.attnum)
         FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped), '[]'::json) AS columns
        FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE c.relkind IN ('r','p') AND NOT c.relispartition AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
        AND pg_catalog.has_schema_privilege(n.oid,'USAGE') AND pg_catalog.has_table_privilege(c.oid,'SELECT')
        ORDER BY n.nspname,c.relname LIMIT 201`);
      if (result.rows.length > 200) throw new Error('This workspace supports up to 200 visible tables. Use a role scoped to the schemas you want to investigate.');
      return { database: database.rows[0].database, tables: result.rows };
    });
  }
  async measure(schema: string, input: string): Promise<Measurement> {
    identifier(schema);
    const query = workspaceRead(input);
    const result = await this.db.transaction(async tx => {
      await tx.exec(`SET TRANSACTION READ ONLY; ${LIMITS} SET LOCAL statement_timeout='4500ms'; SET LOCAL search_path=pg_catalog,${identifier(schema)};`);
      const explained = await tx.query<{ 'QUERY PLAN': ExplainDocument[] }>(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON, TIMING ON, SUMMARY ON) ${query.sql}`);
      const plan = explained.rows[0]?.['QUERY PLAN']?.[0];
      if (!plan?.Plan) throw new Error('PostgreSQL did not return an execution plan.');
      const indexes = await tx.query<QueryResult['indexes'][number]>(`SELECT indexname AS name, tablename AS "table", indexdef AS definition,
        pg_catalog.pg_relation_size(pg_catalog.to_regclass(pg_catalog.quote_ident(schemaname)||'.'||pg_catalog.quote_ident(indexname)))::float8 AS bytes
        FROM pg_catalog.pg_indexes WHERE schemaname=$1 ORDER BY tablename,indexname LIMIT 200`, [schema]);
      const metrics = metricsFromPlan(plan);
      return { kind: 'read' as const, sql: query.sql, fields: [], rows: [], previewTruncated: false,
        returnedRowCount: metrics.actualRows, plan, metrics, indexes: indexes.rows };
    });
    return { result, schema, measuredAt: Date.now() };
  }
  private async validate(tx: LabTransaction, experiment: Experiment): Promise<number> {
    if (experiment.kind === 'remove') {
      const owned = this.owned.get(relation(experiment.schema, experiment.name));
      const found = await tx.query<{ oid: number }>('SELECT pg_catalog.to_regclass($1)::oid::int AS oid', [relation(experiment.schema, experiment.name)]);
      if (!owned || owned.object !== experiment.object || owned.oid !== found.rows[0]?.oid) throw new Error('Only unchanged objects created by this connector session may be removed.');
      return owned.oid;
    }
    const source = await this.table(tx, experiment.schema, experiment.table);
    const columns = await tx.query<{ name: string; date: boolean }>(
      'SELECT attname AS name, atttypid IN (1082,1114,1184) AS date FROM pg_catalog.pg_attribute WHERE attrelid=$1 AND attnum>0 AND NOT attisdropped', [source.oid]);
    const requested = experiment.kind === 'index' ? experiment.columns : [experiment.column];
    if (requested.some(name => !columns.rows.some(column => column.name === name && (experiment.kind !== 'partition' || column.date)))) throw new Error('Selected columns are unavailable or the partition key is not a date/timestamp.');
    if (experiment.kind === 'partition' && source.kind !== 'r') throw new Error('Choose a non-partitioned source table for the partition-copy experiment.');
    return source.oid;
  }
  async preview(input: Experiment): Promise<ExperimentPreview> {
    const experiment = parseExperiment(input);
    const sourceOid = await this.db.transaction(async tx => {
      await tx.exec(`SET TRANSACTION READ ONLY; ${LIMITS}`);
      return this.validate(tx, experiment);
    });
    for (const [key, value] of this.approvals) if (value.expiresAt < Date.now()) this.approvals.delete(key);
    if (this.approvals.size >= 20) throw new Error('Too many pending previews. Apply a preview or wait five minutes.');
    const preview = { approvalId: randomBytes(24).toString('hex'), sql: experimentSql(experiment), expiresAt: Date.now() + 300_000, experiment };
    this.approvals.set(preview.approvalId, { ...preview, sourceOid });
    return preview;
  }
  async apply(approvalId: string): Promise<AppliedExperiment> {
    const approval = this.approvals.get(approvalId);
    this.approvals.delete(approvalId);
    if (!approval || approval.expiresAt < Date.now()) throw new Error('SQL preview expired or already used. Review a new preview before confirming.');
    const { experiment, sql, sourceOid } = approval;
    const oid = await this.db.transaction(async tx => {
      await tx.exec(LIMITS);
      if (experiment.kind === 'remove') {
        const owned = this.owned.get(relation(experiment.schema, experiment.name));
        if (!owned) throw new Error('Only objects created by this connector session may be removed.');
        if (experiment.object === 'table') await tx.exec(`LOCK TABLE ${relation(experiment.schema, experiment.name)} IN ACCESS EXCLUSIVE MODE;`);
        else {
          const parent = await tx.query<{ schema: string; name: string }>(
            `SELECT n.nspname AS schema,c.relname AS name FROM pg_catalog.pg_index i
             JOIN pg_catalog.pg_class c ON c.oid=i.indrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
             WHERE i.indexrelid=$1`, [owned.oid]);
          if (!parent.rows[0]) throw new Error('Experiment index no longer exists. Refresh the database state.');
          await tx.exec(`LOCK TABLE ${relation(parent.rows[0].schema,parent.rows[0].name)} IN SHARE MODE;`);
        }
      }
      const currentOid = await this.validate(tx, experiment);
      if (currentOid !== sourceOid) throw new Error('The source changed after preview. Refresh and review again.');
      if (experiment.kind !== 'remove') {
        const source = relation(experiment.schema, experiment.table);
        await tx.exec(`LOCK TABLE ${source} IN SHARE MODE;`);
        if ((await this.validate(tx, experiment)) !== sourceOid) throw new Error('Source table changed. Review a new preview.');
        if (experiment.kind === 'partition') {
          const overflow = await tx.query(`SELECT 1 FROM ${source} OFFSET 1000000 LIMIT 1`);
          if (overflow.rows.length) throw new Error('Partition copies are limited to 1,000,000 rows. Use a smaller development copy.');
        }
      }
      // No arbitrary DDL crosses this boundary: SQL is generated locally from a one-use preview.
      await tx.exec(sql);
      if (experiment.kind === 'remove') return null;
      const created = await tx.query<{ oid: number }>('SELECT pg_catalog.to_regclass($1)::oid::int AS oid', [relation(experiment.schema, experiment.name)]);
      return created.rows[0].oid;
    });
    const key = relation(experiment.schema, experiment.name);
    if (experiment.kind === 'remove') this.owned.delete(key);
    else if (oid !== null) this.owned.set(key, { oid, object: experiment.kind === 'index' ? 'index' : 'table' });
    return { experiment, sql, cleanup: experiment.kind === 'remove' ? null : {
      kind: 'remove', schema: experiment.schema, name: experiment.name, object: experiment.kind === 'index' ? 'index' : 'table',
    } };
  }
}
