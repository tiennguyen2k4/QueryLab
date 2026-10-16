import { NativePostgresRuntime } from '../lib/connector/postgres';
import type { ConnectorClaim } from '../lib/connector/protocol';

type Poll = { job: ConnectorClaim | null; cancelIds: string[]; pairingCode: string | null; pairExpiresAt: number; paired: boolean };
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const endpoint = new URL(process.env.DATALAB_URL ?? 'http://localhost:3000');
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname))) throw new Error('Use HTTPS for a remote relay; plain HTTP is allowed only on loopback.');
if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('DATALAB_URL must not include credentials, query or fragment.');
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Set DATABASE_URL locally. It is never sent to the website.');
const mode = process.env.DATALAB_MODE ?? 'lab';
if (mode !== 'lab' && mode !== 'existing') throw new Error('DATALAB_MODE must be lab or existing.');
if (mode === 'existing' && !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)) throw new Error('Existing database metadata and plans must use a locally hosted DataLab relay.');
const runtime = new NativePostgresRuntime(connectionString, process.env.DATALAB_DEDICATED_DATABASE === '1', mode);
let token: string | undefined;
let stopped = false;
let running: Promise<void> | null = null;
let activeId: string | null = null;
let printedCode: string | null = null;
let pendingReport: { id: string; result?: unknown; error?: string } | null = null;
const getPendingReport = () => pendingReport;
function publicError(error: unknown) {
  if (!(error instanceof Error)) return 'PostgreSQL job failed.';
  if (!('severity' in error)) return error.message.slice(0, 1000);
  const details = error as Error & { code?: string; position?: string };
  const messages: Record<string, string> = {
    '42P01': 'Table not found. Refresh the schema and check the selected database.',
    '42703': 'Column not found. Check its name and table alias.',
    '42601': 'SQL syntax error. Check SELECT, commas, quotes and parentheses.',
    '42501': 'The local database role does not have the required permission.',
    '55P03': 'Could not acquire the required lock. No automatic retry; try again when the database is idle.',
    '42P07': 'An object with that name already exists. Choose a different experiment name.',
    '57014': 'Query cancelled or statement timeout exceeded. Try a smaller bounded query.',
  };
  return `${messages[details.code ?? ''] ?? 'PostgreSQL rejected the database query. Inspect details in the local connector.'}${details.code ? ` (SQLSTATE ${details.code})` : ''}${details.position && /^\d+$/.test(details.position) ? ` at position ${details.position}` : ''}`;
}
async function request<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(new URL(`/api/connectors${path}`, endpoint), {
    method: 'POST', signal: AbortSignal.timeout(10_000),
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value.error === 'string' ? value.error : `Relay HTTP ${response.status}`);
  return value as T;
}
const shutdown = () => { stopped = true; void runtime.cancel().catch(() => undefined); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
async function main() {
  console.log(mode === 'existing' ? 'DataLab: existing local PostgreSQL. No seeding/reset. Metadata and EXPLAIN plans go only to your local web app; plans may contain filter values. Review every schema change before confirming.' : 'DataLab connector: dedicated PostgreSQL lab only. SQL, bounded preview and plans pass through the website relay.');
  const session = await request<{ agentToken: string; pairingCode: string }>('/register', {});
  token = session.agentToken;
  console.log(`Pairing code: ${session.pairingCode} (expires after 5 minutes; enter it in the PostgreSQL connection panel).`);
  printedCode = session.pairingCode;
  let consecutiveErrors = 0;
  while (!stopped) {
    try {
      if (pendingReport) {
        await request('/agent/report', pendingReport); pendingReport = null;
      }
      const poll = await request<Poll>('/agent/poll');
      consecutiveErrors = 0;
      if (poll.pairingCode && poll.pairingCode !== printedCode) { printedCode = poll.pairingCode; console.log(`New pairing code: ${poll.pairingCode} (valid for 5 minutes).`); }
      for (const id of poll.cancelIds) {
        if (id === activeId) await runtime.cancel();
        else if (!getPendingReport() || getPendingReport()!.id !== id) await request('/agent/report', { id, error: 'Cancelled before local execution.' });
      }
      if (poll.job && !running) {
        const job = poll.job; activeId = job.id;
        running = runtime.execute(job.operation).then(result => { pendingReport = { id: job.id, result }; }, error => { console.error(`Local job failed: ${error instanceof Error ? error.message.replaceAll(connectionString!, '[local database]') : 'PostgreSQL error'}`); pendingReport = { id: job.id, error: publicError(error) }; }).finally(() => { activeId = null; running = null; });
      }
    } catch (error) {
      consecutiveErrors++;
      // Never print DATABASE_URL, query text, row values or complete PostgreSQL errors.
      console.error(error instanceof Error ? error.message : 'Relay unavailable.');
      if (consecutiveErrors >= 10) { console.error('Relay unavailable repeatedly. Stopping without retrying any SQL job; restart and pair again.'); stopped = true; await runtime.cancel().catch(() => undefined); }
    }
    if (!stopped) await delay(1000);
  }
  await running;
  if (pendingReport) await request('/agent/report', pendingReport).catch(() => undefined);
  await runtime.close();
}
main().catch(async error => { console.error(error instanceof Error ? error.message : 'Connector failed.'); await runtime.close().catch(() => undefined); process.exitCode = 1; });
