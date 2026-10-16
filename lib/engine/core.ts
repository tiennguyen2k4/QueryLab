import { PGlite } from '@electric-sql/pglite';
import { lessonSetupSql } from './lesson-setup';
import { labs } from '../../content/labs';
import { guardSql, hasTopLevelOrder, QueryGuardError } from './sql-guard';
import { seedSql } from './seed';
import { metricsFromPlan, tableTupleWork, walkPlan } from './metrics';
import type { DatasetSize, ExplainDocument, QueryResult, ValidationRequest, ValidationResult } from './types';

const PREVIEW_ROWS = 200;
const MAX_CELL_CHARACTERS = 2000;
const MAX_PREVIEW_COLUMNS = 40;
const MAX_PREVIEW_CHARACTERS = 1_000_000;
const MAX_INDEXES = 12;
const TIMEOUT_SQL = "SET LOCAL statement_timeout = '4500ms'";

export interface LabTransaction {
  exec(sql: string): Promise<unknown>;
  query<T = Record<string, unknown>>(sql: string, parameters?: unknown[], options?: { rowMode: 'array' }): Promise<{ rows: T[]; fields: { name: string; dataTypeID: number }[] }>;
}
export interface LabDatabase extends LabTransaction {
  transaction<T>(fn: (transaction: LabTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Shared guard, result comparison and measured-plan validation for WASM and native PostgreSQL. */
export class LabEngine {
  private database: LabDatabase | null = null;
  private size: DatasetSize = 50000;
  private userIndexes = new Set<string>();

  constructor(
    private factory: () => Promise<LabDatabase>,
    private engineName: string,
    private schema = 'public',
    private seedOnInitialize = true,
  ) {
    if (!/^[a-z_][a-z_0-9]*$/.test(schema)) throw new Error('Invalid lab schema.');
  }

  async initialize(size: DatasetSize = 50000) {
    if (this.database) return { size: this.size, engine: this.engineName };
    this.size = size;
    const db = await this.factory();
    try {
      await db.exec(`SET timezone = 'UTC'; SET standard_conforming_strings = on; SET search_path = ${this.schema}, pg_catalog;`);
      if (this.seedOnInitialize) await db.transaction(async tx => { await tx.exec(seedSql(size)); });
      this.database = db;
      return { size, engine: this.engineName };
    } catch (error) { await db.close(); throw error; }
  }

  private get db(): LabDatabase {
    if (!this.database) throw new Error('Initialize the database first.');
    return this.database;
  }

  private async readonly<T>(fn: (tx: LabTransaction) => Promise<T>): Promise<T> {
    return this.db.transaction(async tx => {
      await tx.query('SET TRANSACTION READ ONLY');
      await tx.query(TIMEOUT_SQL);
      return fn(tx);
    });
  }

  private async explain(tx: LabTransaction, sql: string): Promise<ExplainDocument> {
    const result = await tx.query<{ 'QUERY PLAN': ExplainDocument[] }>(
      `EXPLAIN (ANALYZE, FORMAT JSON, BUFFERS, TIMING ON, SUMMARY ON) ${sql}`,
    );
    const document = result.rows[0]?.['QUERY PLAN']?.[0];
    if (!document?.Plan) throw new Error('The database did not return a query plan.');
    return document;
  }

  async indexes() {
    const result = await this.db.query<{ name: string; table: string; definition: string; bytes: number }>(`
      SELECT indexname AS name, tablename AS "table", indexdef AS definition,
        pg_relation_size((schemaname || '.' || indexname)::regclass)::integer AS bytes
      FROM pg_indexes WHERE schemaname = '${this.schema}' AND tablename <> '_datalab_metadata' ORDER BY tablename, indexname
    `);
    return result.rows;
  }

  async run(input: string, options: { baselineQuery?: string } = {}): Promise<QueryResult> {
    const query = guardSql(input);
    if (query.kind === 'read') {
      const result = await this.readonly(async tx => {
        const plan = await this.explain(tx, query.sql);
        if (query.explained) {
          return {
            kind: 'read' as const, sql: query.sql, explained: true,
            fields: [{ name: 'QUERY PLAN', dataTypeID: 114 }], rows: [[JSON.stringify(plan, null, 2)]],
            previewTruncated: false, returnedRowCount: 1, metrics: metricsFromPlan(plan), plan,
          };
        }
        const schema = await tx.query(`SELECT * FROM (${query.sql}) AS _datalab_schema LIMIT 0`);
        if (schema.fields.length > MAX_PREVIEW_COLUMNS) throw new QueryGuardError(`Return up to ${MAX_PREVIEW_COLUMNS} columns in the result preview.`);
        const preview = await tx.query(`SELECT * FROM (${query.sql}) AS _datalab_preview LIMIT ${PREVIEW_ROWS + 1}`, [], { rowMode: 'array' });
        let cellTruncated = false;
        let remainingCharacters = MAX_PREVIEW_CHARACTERS;
        const rows = (preview.rows as unknown as unknown[][]).slice(0, PREVIEW_ROWS).map(row => row.map((rawValue, columnIndex) => {
          const value = typeof rawValue === 'bigint' ? rawValue.toString()
            : rawValue instanceof Date ? (preview.fields[columnIndex]?.dataTypeID === 1082 ? rawValue.toISOString().slice(0, 10) : rawValue.toISOString())
              : rawValue !== null && typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue;
          if (typeof value === 'string') {
            const allowance = Math.max(0, Math.min(MAX_CELL_CHARACTERS, remainingCharacters));
            remainingCharacters -= Math.min(value.length, allowance);
            if (value.length > allowance) { cellTruncated = true; return value.slice(0, allowance) + '…'; }
          }
          return value;
        }));
        return {
          kind: 'read' as const, sql: query.sql, fields: preview.fields, rows,
          previewTruncated: preview.rows.length > PREVIEW_ROWS || cellTruncated,
          returnedRowCount: metricsFromPlan(plan).actualRows,
          metrics: metricsFromPlan(plan), plan,
        };
      });
      return { ...result, indexes: await this.indexes() };
    }
    if (query.operation === 'create' && !this.userIndexes.has(query.name) && this.userIndexes.size >= MAX_INDEXES) throw new QueryGuardError('Keep up to 12 playground indexes. Drop an index before creating another.');
    if (query.operation === 'create' && !this.userIndexes.has(query.name) && (await this.indexes()).some(index => index.name === query.name)) throw new QueryGuardError('That index already belongs to the initial database; choose a new name.');
    if (query.operation === 'drop' && !this.userIndexes.has(query.name)) throw new QueryGuardError('Only indexes created in this playground can be dropped.');
    const baseline = options.baselineQuery ? guardSql(options.baselineQuery) : undefined;
    if (baseline && baseline.kind !== 'read') throw new QueryGuardError('The index baseline must be a read query.');
    const executionSql = query.operation === 'create' ? query.sql.replace(' ON public.', ` ON ${this.schema}.`) : query.sql;
    const equivalence = await this.db.transaction(async tx => {
      await tx.query(TIMEOUT_SQL);
      if (baseline?.kind === 'read') await tx.query(`CREATE TEMP TABLE _datalab_baseline ON COMMIT DROP AS SELECT * FROM (${baseline.sql}) AS _baseline_source`);
      await tx.query(executionSql);
      if (!baseline || baseline.kind !== 'read') return { checked: false, matches: true };
      const result = await tx.query<{ matches: boolean }>(`
        WITH _actual AS MATERIALIZED (${baseline.sql})
        SELECT NOT EXISTS (
          (SELECT * FROM _datalab_baseline EXCEPT ALL SELECT * FROM _actual)
          UNION ALL
          (SELECT * FROM _actual EXCEPT ALL SELECT * FROM _datalab_baseline)
        ) AS matches
      `);
      if (!result.rows[0].matches) throw new QueryGuardError('Index change altered the full query result, so the transaction was rolled back. Add a deterministic ORDER BY when using LIMIT.');
      return { checked: true, matches: true };
    });
    if (query.operation === 'create') this.userIndexes.add(query.name);
    else this.userIndexes.delete(query.name);
    return {
      kind: 'index', sql: executionSql, fields: [], rows: [], previewTruncated: false, returnedRowCount: 0,
      metrics: null, plan: null, indexes: await this.indexes(), equivalence,
      message: `${query.operation === 'create' ? 'Created' : 'Dropped'} ${query.name}.${equivalence.checked ? ' Full query results are unchanged.' : ''}`,
    };
  }

  async validate(request: ValidationRequest): Promise<ValidationResult> {
    const candidate = guardSql(request.candidateSql);
    if (candidate.kind !== 'read') throw new QueryGuardError('Challenge validation requires a SELECT query.');
    return this.readonly(async tx => {
      let schemaMatches = true;
      let resultMatches = true;
      const reasons: string[] = [];
      const plan = await this.explain(tx, candidate.sql);
      const nodes = walkPlan(plan.Plan);
      const names = nodes.map(n => n['Node Type']);
      let planMatches = true;
      const checks: ValidationResult['checks'] = [];
      const rules = request.rules ?? (request.canonicalSql ? [{ kind: 'result-equivalent' as const, referenceSql: request.canonicalSql, ordered: false, explanation: 'Return the complete expected result.' }] : []);
      const catalogs = await tx.query<{ table: string; name: string; columns: string[]; operator_classes: string[] }>(`
        SELECT t.relname AS "table", ci.relname AS name,
          array_agg(a.attname::text ORDER BY key.ordinality) AS columns,
          array_agg(opc.opcname::text ORDER BY key.ordinality) AS operator_classes
        FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_class ci ON ci.oid = i.indexrelid
        JOIN pg_namespace ns ON ns.oid = t.relnamespace
        CROSS JOIN LATERAL unnest(i.indkey::smallint[]) WITH ORDINALITY AS key(attnum, ordinality)
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
        JOIN pg_opclass opc ON opc.oid = i.indclass[(key.ordinality - 1)::integer]
        WHERE ns.nspname = '${this.schema}' AND i.indisvalid AND key.ordinality <= i.indnkeyatts
        GROUP BY t.relname, ci.relname
      `);
      for (const rule of rules) {
        let passed = false;
        if (rule.kind === 'result-equivalent') {
          const canonical = guardSql(rule.referenceSql);
          if (canonical.kind !== 'read') throw new QueryGuardError('The canonical result must be a read query.');
          const candidateFields = (await tx.query(`SELECT * FROM (${candidate.sql}) AS _candidate_schema LIMIT 0`)).fields;
          const canonicalFields = (await tx.query(`SELECT * FROM (${canonical.sql}) AS _canonical_schema LIMIT 0`)).fields;
          const thisSchemaMatches = candidateFields.length === canonicalFields.length && (request.requireColumnNames === false || candidateFields.every((field, index) => field.name === canonicalFields[index].name));
          schemaMatches = schemaMatches && thisSchemaMatches;
          if (!thisSchemaMatches) reasons.push('Return the expected columns in the expected order.');
          else if (rule.ordered && !hasTopLevelOrder(candidate.sql)) reasons.push('Use an explicit ORDER BY for the expected row order.');
          else {
            try {
              // Ordinality captures materialized executor output order before set comparison.
              // EXCEPT ALL preserves duplicate multiplicity and nulls. Neither result is capped.
              const candidateSelect = rule.ordered ? 'SELECT row_number() OVER () AS _datalab_ordinal, c.* FROM _candidate c' : 'SELECT * FROM _candidate';
              const canonicalSelect = rule.ordered ? 'SELECT row_number() OVER () AS _datalab_ordinal, c.* FROM _canonical c' : 'SELECT * FROM _canonical';
              const comparison = await tx.query<{ matches: boolean }>(`
                WITH _candidate AS MATERIALIZED (${candidate.sql}), _canonical AS MATERIALIZED (${canonical.sql})
                SELECT NOT EXISTS (
                  (${candidateSelect} EXCEPT ALL ${canonicalSelect})
                  UNION ALL
                  (${canonicalSelect} EXCEPT ALL ${candidateSelect})
                ) AS matches
              `);
              passed = comparison.rows[0].matches;
            } catch (error) {
              throw new QueryGuardError(`Result comparison failed: ${error instanceof Error ? error.message : 'incompatible result types'}`);
            }
          }
          resultMatches = resultMatches && passed;
          if (thisSchemaMatches && !passed && !reasons.includes('Use an explicit ORDER BY for the expected row order.')) reasons.push('The complete result differs from the expected values, duplicate rows, or required row order.');
        } else if (rule.kind === 'has-index') {
          passed = catalogs.rows.some(index => index.table === rule.table && rule.leadingColumns.every((column, i) => index.columns[i] === column) && (!rule.operatorClass || index.operator_classes.slice(0, rule.leadingColumns.length).includes(rule.operatorClass)));
        } else if (rule.kind === 'plan-uses-index') {
          passed = nodes.some(n => n['Relation Name'] === rule.table && (['Index Scan', 'Index Only Scan'].includes(n['Node Type']) || n['Node Type'] === 'Bitmap Heap Scan' && walkPlan(n).some(c => c['Node Type'] === 'Bitmap Index Scan')));
        } else if (rule.kind === 'plan-has-node') {
          passed = nodes.some(n => n['Node Type'] === rule.nodeType && (!rule.table || n['Relation Name'] === rule.table));
        } else if (rule.kind === 'plan-avoids-node') {
          passed = !nodes.some(n => n['Node Type'] === rule.nodeType);
        } else if (rule.kind === 'plan-captured') {
          passed = typeof plan['Execution Time'] === 'number' && nodes.some(n => typeof n['Actual Rows'] === 'number' && typeof n['Actual Loops'] === 'number');
        } else if (rule.kind === 'less-work-than-baseline') {
          const before = request.baselinePlan ? tableTupleWork(request.baselinePlan.Plan, rule.table) : null;
          const after = tableTupleWork(plan.Plan, rule.table);
          passed = before !== null && before > 0 && after !== null && after <= before * (1 - rule.minReduction);
          if (!passed && before === null) reasons.push('Run the starter query before your changes to capture the baseline plan.');
        }
        checks.push({ kind: rule.kind, passed, explanation: rule.explanation });
        if (rule.kind !== 'result-equivalent') planMatches = planMatches && passed;
        if (!passed && rule.kind !== 'result-equivalent') reasons.push(rule.explanation);
      }
      for (const type of request.requirePlanNodes ?? []) {
        if (!names.includes(type)) { planMatches = false; reasons.push(`The captured plan must contain ${type}.`); }
      }
      for (const type of request.forbidPlanNodes ?? []) {
        if (names.includes(type)) { planMatches = false; reasons.push(`The captured plan must avoid ${type}.`); }
      }
      for (const name of request.requireIndexNames ?? []) {
        if (!nodes.some(n => n['Index Name'] === name)) { planMatches = false; reasons.push(`The captured plan must use ${name}.`); }
      }
      return { matches: schemaMatches && resultMatches && planMatches, schemaMatches, resultMatches, planMatches, reasons, metrics: metricsFromPlan(plan), checks };
    });
  }

  /** Restore the clean lesson baseline without importing the commerce dataset again. */
  async prepareLab(labId: string): Promise<void> {
    if (labId !== 'playground' && !labs.some(lab => lab.id === labId)) throw new QueryGuardError('Unknown lesson fixture.');
    const sql = labId === 'playground' ? null : lessonSetupSql(labId);
    await this.db.transaction(async tx => {
      for (const name of this.userIndexes) await tx.query(`DROP INDEX IF EXISTS ${this.schema}."${name.replaceAll('"', '""')}"`);
      if (sql) await tx.exec(sql);
    });
    this.userIndexes.clear();
  }

  /** Connector resumes only indexes inside its disposable lab schema; never used for arbitrary databases. */
  restoreLabIndexes(names: string[]): void {
    for (const name of names) {
      if (!/^[a-z_][a-z_0-9]*$/.test(name)) throw new Error('Invalid persisted lab index.');
      this.userIndexes.add(name);
    }
  }

  async close() { if (this.database) { await this.database.close(); this.database = null; this.userIndexes.clear(); } }
}

/** Browser engine retains an independent memory database and its existing lifecycle. */
export class PGliteEngine extends LabEngine {
  constructor() {
    super(async () => await PGlite.create({ dataDir: 'memory://' }) as unknown as LabDatabase, 'PostgreSQL · PGlite WASM');
  }
}
