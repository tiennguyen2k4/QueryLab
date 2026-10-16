import type { DatasetSize, ValidationRequest } from '../engine/types';
import { identifier, parseExperiment, workspaceRead, type Experiment } from '../workspace';

export type ConnectorOperation =
  | { type: 'workspace-inspect' }
  | { type: 'workspace-measure'; schema: string; sql: string }
  | { type: 'workspace-preview'; experiment: Experiment }
  | { type: 'workspace-apply'; approvalId: string; confirmed: true }
  | { type: 'workspace-reconcile'; confirmed: true }
  | { type: 'initialize'; size: DatasetSize }
  | { type: 'reset'; size: DatasetSize }
  | { type: 'prepare'; labId: string }
  | { type: 'run'; sql: string; baselineQuery?: string }
  | { type: 'validate'; request: ValidationRequest };
export type ConnectorJobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
export type ConnectorJobView = {
  id: string; state: ConnectorJobState; createdAt: number;
  result?: unknown; error?: string;
};
export type ConnectorClaim = { id: string; operation: ConnectorOperation };
export const CONNECTOR_PROFILE_SIZES = [10000, 50000, 100000, 1000000] as const;
export const NATIVE_ENGINE_NAME = 'PostgreSQL · local connector';

/** Validate again at the local trust boundary; the relay never sends arbitrary setup scripts. */
export function connectorOperation(value: unknown): ConnectorOperation {
  if (!value || typeof value !== 'object') throw new Error('Invalid connector operation.');
  const operation = value as Record<string, unknown>;
  if (operation.type === 'workspace-inspect') return { type: 'workspace-inspect' };
  if (operation.type === 'workspace-measure') {
    if (typeof operation.schema !== 'string' || typeof operation.sql !== 'string') throw new Error('Schema and SELECT query required.');
    identifier(operation.schema); workspaceRead(operation.sql);
    return { type: 'workspace-measure', schema: operation.schema, sql: operation.sql };
  }
  if (operation.type === 'workspace-preview') return { type: 'workspace-preview', experiment: parseExperiment(operation.experiment) };
  if (operation.type === 'workspace-apply') {
    if (operation.confirmed !== true || typeof operation.approvalId !== 'string' || !/^[a-f0-9]{48}$/.test(operation.approvalId)) throw new Error('Review SQL and explicitly confirm a valid preview.');
    return { type: 'workspace-apply', approvalId: operation.approvalId, confirmed: true };
  }
  if (operation.type === 'workspace-reconcile') {
    if (operation.confirmed !== true) throw new Error('Explicitly acknowledge that the previous operation may have completed.');
    return { type: 'workspace-reconcile', confirmed: true };
  }
  if (operation.type === 'initialize' || operation.type === 'reset') {
    if (!CONNECTOR_PROFILE_SIZES.includes(operation.size as typeof CONNECTOR_PROFILE_SIZES[number])) throw new Error('Unsupported native dataset size.');
    return { type: operation.type, size: operation.size as DatasetSize };
  }
  if (operation.type === 'prepare') {
    if (typeof operation.labId !== 'string' || !/^[a-z][a-z0-9-]{1,80}$/.test(operation.labId)) throw new Error('Invalid lesson identifier.');
    return { type: 'prepare', labId: operation.labId };
  }
  if (operation.type === 'run') {
    if (typeof operation.sql !== 'string' || operation.sql.length > 16000 || operation.baselineQuery !== undefined && (typeof operation.baselineQuery !== 'string' || operation.baselineQuery.length > 16000)) throw new Error('SQL is limited to 16,000 characters.');
    return { type: 'run', sql: operation.sql, ...(operation.baselineQuery === undefined ? {} : { baselineQuery: operation.baselineQuery as string }) };
  }
  if (operation.type === 'validate') {
    const request = operation.request as ValidationRequest | undefined;
    if (!request || typeof request !== 'object' || typeof request.candidateSql !== 'string' || request.candidateSql.length > 16000 || request.rules !== undefined && (!Array.isArray(request.rules) || request.rules.length > 20)) throw new Error('Invalid validation request.');
    return { type: 'validate', request };
  }
  throw new Error('Unsupported connector operation.');
}
