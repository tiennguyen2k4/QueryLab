import { DirectDatabaseError, directSessions, parseConnectionForm, type DirectAction } from '@/lib/local-db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);
let attempts: { count: number; until: number } = { count: 0, until: 0 };

/** Only same-origin requests to a QueryLab server addressed via loopback may submit credentials (blocks remote access, CSRF and DNS rebinding). */
function localOnly(request: Request) {
  if (process.env.DATALAB_DIRECT_DB === '0') throw new DirectDatabaseError('Direct database connections are disabled.', 'disabled', 403);
  const host = request.headers.get('host') ?? '';
  if (!LOCAL_HOSTNAMES.has(host.replace(/:\d+$/, ''))) throw new DirectDatabaseError('Open QueryLab via http://localhost to connect a local database.', 'local-only', 403);
  const origin = request.headers.get('origin');
  let originUrl: URL | null = null;
  try { originUrl = origin ? new URL(origin) : null; } catch { originUrl = null; }
  if (!originUrl || originUrl.host !== host || !LOCAL_HOSTNAMES.has(originUrl.hostname)) throw new DirectDatabaseError('Cross-origin request rejected.', 'origin', 403);
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') throw new DirectDatabaseError('Cross-site request rejected.', 'origin', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new DirectDatabaseError('JSON request required.', 'invalid', 415);
}

function reply(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function POST(request: Request) {
  try {
    localOnly(request);
    const raw = await request.text();
    if (raw.length > 64_000) throw new DirectDatabaseError('Request too large.', 'invalid', 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { throw new DirectDatabaseError('Invalid JSON.', 'invalid'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DirectDatabaseError('JSON object required.', 'invalid');
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
    if (body.action === 'connect') {
      const now = Date.now();
      if (attempts.until < now) attempts = { count: 0, until: now + 60_000 };
      if (++attempts.count > 10) throw new DirectDatabaseError('Too many attempts. Wait a minute.', 'limit', 429);
      return reply(await directSessions.connect(parseConnectionForm(body)));
    }
    if (body.action === 'disconnect') { await directSessions.close(token); return reply({ closed: true }); }
    return reply(await directSessions.execute(token, body as DirectAction));
  } catch (error) {
    const failure = error instanceof DirectDatabaseError ? error : new DirectDatabaseError('Request failed.', 'unknown');
    return reply({ error: failure.message, code: failure.code }, failure.status);
  }
}
