import { guardSql } from './engine/sql-guard';
import type { QueryResult } from './engine/types';

export type DatabaseColumn = { name: string; type: string; date: boolean };
export type DatabaseTable = {
  schema: string; name: string; estimatedRows: number; bytes: number;
  partitioned: boolean; columns: DatabaseColumn[];
};
export type DatabaseCatalog = { database: string; tables: DatabaseTable[] };
export type Experiment =
  | { kind: 'index'; schema: string; table: string; name: string; columns: string[] }
  | { kind: 'partition'; schema: string; table: string; name: string; column: string; startMonth: string; months: number }
  | { kind: 'remove'; schema: string; name: string; object: 'index' | 'table' };
export type ExperimentPreview = {
  approvalId: string; sql: string; expiresAt: number; experiment: Experiment;
};
export type AppliedExperiment = {
  experiment: Experiment; sql: string;
  cleanup: Extract<Experiment, { kind: 'remove' }> | null;
};
export type Measurement = { result: QueryResult; measuredAt: number; schema: string };
export interface WorkspaceAdapter {
  status(): Promise<{ connected: boolean; recoveryRequired: boolean }>;
  inspectWorkspace(): Promise<DatabaseCatalog>;
  reconcileWorkspace(): Promise<DatabaseCatalog>;
  measureWorkspace(schema: string, sql: string): Promise<Measurement>;
  previewExperiment(experiment: Experiment): Promise<ExperimentPreview>;
  applyExperiment(approvalId: string): Promise<AppliedExperiment>;
  dispose(): void;
}
export type WorkspaceSession = {
  tableKey: string; sql: string; kind: 'index' | 'partition' | 'rewrite';
  columns: string[]; name: string; dateColumn: string; startMonth: string; months: number;
  baseline: Measurement | null; after: Measurement | null; afterExperiment: Experiment | null;
  applied: AppliedExperiment[]; comparisonTarget: AppliedExperiment | null;
  busy: string; error: string; notice: string; recovery: boolean;
};
export function createWorkspaceSession(): WorkspaceSession {
  return { tableKey: '', sql: '', kind: 'index', columns: [], name: 'datalab_trial_index',
    dateColumn: '', startMonth: '2024-01', months: 12, baseline: null, after: null,
    afterExperiment: null, applied: [], comparisonTarget: null, busy: '', error: '', notice: '', recovery: false };
}

export function identifier(value: string): string {
  if (!value || value.includes('\0') || new TextEncoder().encode(value).length > 63) throw new Error('PostgreSQL identifiers must contain 1–63 bytes and no NUL.');
  return `"${value.replaceAll('"', '""')}"`;
}
export function relation(schema: string, table: string) { return `${identifier(schema)}.${identifier(table)}`; }

export function parseExperiment(input: unknown): Experiment {
  if (!input || typeof input !== 'object') throw new Error('Invalid experiment.');
  const value = input as Record<string, unknown>;
  for (const key of ['schema', 'name']) {
    if (typeof value[key] !== 'string') throw new Error(`Missing experiment ${key}.`);
    identifier(value[key]);
  }
  const schema = value.schema as string; const name = value.name as string;
  if (value.kind === 'remove' && (value.object === 'table' || value.object === 'index')) return { kind: 'remove', schema, name, object: value.object };
  if (typeof value.table !== 'string') throw new Error('Select a source table.');
  identifier(value.table);
  if (!/^datalab_[a-z0-9_]{1,34}$/.test(name) || name === value.table) throw new Error('Use a new name starting with datalab_, followed by up to 34 lowercase letters, digits or underscores.');
  if (value.kind === 'index') {
    if (!Array.isArray(value.columns) || value.columns.length < 1 || value.columns.length > 4 || value.columns.some(column => typeof column !== 'string') || new Set(value.columns).size !== value.columns.length) throw new Error('Choose 1–4 distinct index columns, in key order.');
    const columns: string[] = value.columns; columns.forEach(identifier);
    return { kind: 'index', schema, table: value.table, name, columns };
  }
  if (value.kind === 'partition') {
    if (typeof value.column !== 'string' || typeof value.startMonth !== 'string' || !/^(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2])$/.test(value.startMonth) || !Number.isInteger(value.months) || Number(value.months) < 1 || Number(value.months) > 24) throw new Error('Choose a date column, a month (1900–2199), and 1–24 monthly partitions.');
    identifier(value.column);
    return { kind: 'partition', schema, table: value.table, name, column: value.column, startMonth: value.startMonth, months: Number(value.months) };
  }
  throw new Error('Unsupported experiment type.');
}
export function monthBoundary(start: string, offset: number): string {
  const [year, month] = start.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 10);
}
export function experimentSql(input: Experiment): string {
  const experiment = parseExperiment(input);
  if (experiment.kind === 'remove') return `DROP ${experiment.object === 'index' ? 'INDEX' : 'TABLE'} ${relation(experiment.schema, experiment.name)};`;
  const source = relation(experiment.schema, experiment.table);
  const target = relation(experiment.schema, experiment.name);
  if (experiment.kind === 'index') return `CREATE INDEX ${identifier(experiment.name)} ON ${source} USING btree (${experiment.columns.map(identifier).join(', ')});`;
  const partitions = Array.from({ length: experiment.months }, (_, index) =>
    `CREATE TABLE ${relation(experiment.schema, `${experiment.name}_p${index + 1}`)} PARTITION OF ${target} FOR VALUES FROM ('${monthBoundary(experiment.startMonth, index)}') TO ('${monthBoundary(experiment.startMonth, index + 1)}');`);
  return [
    `CREATE TABLE ${target} (LIKE ${source}) PARTITION BY RANGE (${identifier(experiment.column)});`,
    ...partitions,
    `CREATE TABLE ${relation(experiment.schema, `${experiment.name}_other`)} PARTITION OF ${target} DEFAULT;`,
    `INSERT INTO ${target} SELECT * FROM ${source};`,
    `ANALYZE ${target};`,
  ].join('\n');
}
export function partitionQuery(experiment: Extract<Experiment, { kind: 'partition' }>, copy = false) {
  return `SELECT * FROM ${relation(experiment.schema, copy ? experiment.name : experiment.table)}\nWHERE ${identifier(experiment.column)} >= DATE '${monthBoundary(experiment.startMonth, 0)}'\n  AND ${identifier(experiment.column)} < DATE '${monthBoundary(experiment.startMonth, 1)}';`;
}
export function workspaceRead(sql: string) {
  const guarded = guardSql(sql);
  if (guarded.kind !== 'read') throw new Error('Use SELECT/WITH here. Schema changes require a SQL preview and explicit confirmation.');
  return guarded;
}
