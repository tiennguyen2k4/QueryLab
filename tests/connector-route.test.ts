import assert from 'node:assert/strict';
import test from 'node:test';
import { GET, POST } from '../app/api/connectors/[...segments]/route';
function request(path: string, value?: unknown, token?: string, origin?: string) {
  return new Request(`http://localhost/api/connectors/${path}`, { method: value === undefined ? 'GET' : 'POST', headers: { ...(value === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}) }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
}
function context(path: string) { return { params: Promise.resolve({ segments: path.split('/') }) }; }

test('connector HTTP boundary rejects DB credentials, cross-origin requests, nested and oversized payloads', async () => {
  const credentials = await POST(request('register', { DATABASE_URL: 'postgresql://never-store-this' }), context('register'));
  assert.equal(credentials.status, 400);
  const crossOrigin = await POST(request('pair', { code: '123456789ABC' }, undefined, 'https://other.example'), context('pair'));
  assert.equal(crossOrigin.status, 403);
  const huge = await POST(request('jobs', { sql: 'x'.repeat(64_001) }), context('jobs'));
  assert.equal(huge.status, 413);
  let nested: unknown = {};
  for (let index = 0; index < 40; index++) nested = { nested };
  assert.equal((await POST(request('jobs', nested), context('jobs'))).status, 400);
});

test('authenticated route lifecycle isolates jobs and prevents a browser from claiming SQL', async () => {
  const registration = await POST(request('register', {}), context('register'));
  assert.equal(registration.status, 201);
  assert.equal(registration.headers.get('cache-control'), 'no-store');
  const agent = await registration.json();
  const pairing = await POST(request('pair', { code: agent.pairingCode }), context('pair'));
  assert.equal(pairing.status, 200);
  const browser = await pairing.json();
  assert.equal((await POST(request('agent/poll', {}, browser.browserToken), context('agent/poll'))).status, 401);
  assert.equal((await GET(request('status', undefined, browser.browserToken), context('status'))).status, 200);
  const submitted = await POST(request('jobs', { type: 'run', sql: 'SELECT 1' }, browser.browserToken), context('jobs'));
  assert.equal(submitted.status, 201); const job = await submitted.json();
  const poll = await POST(request('agent/poll', {}, agent.agentToken), context('agent/poll'));
  assert.equal((await poll.json()).job.id, job.id);
  assert.equal((await GET(request(`jobs/${job.id}`), context(`jobs/${job.id}`))).status, 401);
  const report = await POST(request('agent/report', { id: job.id, result: { rows: [[1]] } }, agent.agentToken), context('agent/report'));
  assert.equal(report.status, 200);
  const completed = await GET(request(`jobs/${job.id}`, undefined, browser.browserToken), context(`jobs/${job.id}`));
  assert.equal((await completed.json()).state, 'succeeded');
});
