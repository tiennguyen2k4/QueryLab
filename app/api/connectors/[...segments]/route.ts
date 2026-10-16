import { ConnectorStoreError, connectorStore } from '@/lib/connector/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ segments: string[] }> };
function authorization(request: Request) { return request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''; }
function enabled() {
  if (process.env.NODE_ENV === 'production' && process.env.DATALAB_CONNECTOR_ENABLED !== '1') throw new ConnectorStoreError('Native connector is a local-development prototype. Explicit relay opt-in is required.', 503);
}
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new ConnectorStoreError('Cross-origin connector requests are not allowed.', 403);
}
async function body(request: Request, maximum = 64_000): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ConnectorStoreError('JSON request required.', 415);
  if (Number(request.headers.get('content-length')) > maximum) throw new ConnectorStoreError('Request exceeds connector payload limit.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ConnectorStoreError('Request body required.');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const next = await reader.read(); if (next.done) break;
    length += next.value.length;
    if (length > maximum) { await reader.cancel(); throw new ConnectorStoreError('Request exceeds connector payload limit.', 413); }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ConnectorStoreError('Invalid JSON.'); }
  const checkDepth = (value: unknown, depth = 0) => {
    if (depth > 35) throw new ConnectorStoreError('Connector JSON is nested too deeply.');
    if (value && typeof value === 'object') for (const child of Object.values(value)) checkDepth(child, depth + 1);
  };
  checkDepth(parsed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ConnectorStoreError('JSON object required.');
  return parsed as Record<string, unknown>;
}
function response(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
async function route(request: Request, context: Context) {
  try {
    enabled(); sameOrigin(request);
    const path = (await context.params).segments;
    const bearer = authorization(request);
    const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 100) ?? 'local';
    if (request.method === 'POST' && path.join('/') === 'register') {
      connectorStore.rateLimit(`register:${address}`, 8);
      const input = await body(request);
      if (Object.keys(input).length) throw new ConnectorStoreError('Registration does not accept database connection settings.');
      return response(connectorStore.register(), 201);
    }
    if (request.method === 'POST' && path.join('/') === 'pair') {
      connectorStore.rateLimit(`pair:${address}`);
      const input = await body(request);
      if (Object.keys(input).some(key => key !== 'code') || typeof input.code !== 'string') throw new ConnectorStoreError('Only a pairing code is accepted.');
      return response(connectorStore.pair(input.code.trim().toUpperCase()));
    }
    if (request.method === 'GET' && path.join('/') === 'status') return response(connectorStore.status(bearer));
    if (request.method === 'DELETE' && path.join('/') === 'session') return response(connectorStore.release(bearer));
    if (request.method === 'POST' && path.join('/') === 'agent/poll') return response(connectorStore.poll(bearer));
    if (request.method === 'POST' && path.join('/') === 'agent/report') {
      const input = await body(request, 3_000_000);
      if (typeof input.id !== 'string' || input.error !== undefined && typeof input.error !== 'string') throw new ConnectorStoreError('Invalid job report.');
      if (input.result === undefined && input.error === undefined) throw new ConnectorStoreError('Job report must include a result or error.');
      return response(connectorStore.report(bearer, input.id, { result: input.result, error: input.error as string | undefined }));
    }
    if (request.method === 'POST' && path.join('/') === 'jobs') return response(connectorStore.enqueue(bearer, await body(request)), 201);
    if (path[0] === 'jobs' && path.length === 2 && request.method === 'GET') return response(connectorStore.getJob(bearer, path[1]));
    if (path[0] === 'jobs' && path.length === 3 && path[2] === 'cancel' && request.method === 'POST') return response(connectorStore.cancel(bearer, path[1]));
    return response({ error: 'Connector endpoint not found.' }, 404);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Connector request failed.' }, error instanceof ConnectorStoreError ? error.status : 400);
  }
}
export const GET = route;
export const POST = route;
export const DELETE = route;
