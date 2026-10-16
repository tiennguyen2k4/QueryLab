export type DatasetSize = 10000 | 50000 | 100000 | 1000000;

export type PlanNode = {
  'Node Type': string;
  'Relation Name'?: string;
  'Index Name'?: string;
  'Total Cost'?: number;
  'Plan Rows'?: number;
  'Actual Rows'?: number;
  'Actual Loops'?: number;
  'Actual Total Time'?: number;
  'Rows Removed by Filter'?: number;
  'Rows Removed by Index Recheck'?: number;
  'Heap Fetches'?: number;
  Plans?: PlanNode[];
  [key: string]: unknown;
};

export type ExplainDocument = {
  Plan: PlanNode;
  'Planning Time'?: number;
  'Execution Time'?: number;
};

export type PlanMetrics = {
  executionMs: number;
  planningMs: number;
  estimatedCost: number;
  estimatedRows: number;
  actualRows: number;
  heapRowsVisitedApprox: number;
  indexEntriesReturnedApprox: number;
  scanTypes: string[];
  indexNames: string[];
};

export type QueryResult = {
  kind: 'read' | 'index';
  sql: string;
  fields: { name: string; dataTypeID: number }[];
  rows: unknown[][];
  previewTruncated: boolean;
  returnedRowCount: number;
  metrics: PlanMetrics | null;
  plan: ExplainDocument | null;
  indexes: { name: string; table: string; definition: string; bytes: number }[];
  message?: string;
  equivalence?: { checked: boolean; matches: boolean; reason?: string };
  explained?: boolean;
};

export type ValidationRequest = {
  candidateSql: string;
  canonicalSql?: string;
  requireColumnNames?: boolean;
  requirePlanNodes?: string[];
  forbidPlanNodes?: string[];
  requireIndexNames?: string[];
  rules?: LessonValidationRule[];
  baselinePlan?: ExplainDocument;
};

export type LessonValidationRule =
  | { kind: 'result-equivalent'; referenceSql: string; ordered: boolean; explanation: string }
  | { kind: 'has-index'; table: string; leadingColumns: string[]; operatorClass?: 'text_pattern_ops'; explanation: string }
  | { kind: 'plan-uses-index'; table: string; explanation: string }
  | { kind: 'plan-has-node'; nodeType: string; table?: string; explanation: string }
  | { kind: 'plan-avoids-node'; nodeType: string; explanation: string }
  | { kind: 'less-work-than-baseline'; table: string; minReduction: number; explanation: string }
  | { kind: 'plan-captured'; explanation: string };

export type ValidationResult = {
  matches: boolean;
  schemaMatches: boolean;
  resultMatches: boolean;
  planMatches: boolean;
  reasons: string[];
  metrics: PlanMetrics | null;
  checks: { kind: string; passed: boolean; explanation: string }[];
};

export interface DatabaseAdapter {
  initialize(size?: DatasetSize): Promise<{ size: DatasetSize; engine: string }>;
  run(sql: string, options?: { baselineQuery?: string }): Promise<QueryResult>;
  validate(request: ValidationRequest): Promise<ValidationResult>;
  reset(size?: DatasetSize): Promise<{ size: DatasetSize; engine: string }>;
  dispose(): void;
  prepareLab?(labId: string): Promise<void>;
  cancel?(): Promise<void>;
}

export type WorkerOperation =
  | { type: 'initialize'; size: DatasetSize }
  | { type: 'prepare'; labId: string }
  | { type: 'run'; sql: string; baselineQuery?: string }
  | { type: 'validate'; request: ValidationRequest };

export type WorkerRequest = WorkerOperation & { id: number };
export type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: { message: string; code?: string; position?: string } };
