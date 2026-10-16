import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../app/api/local-db/route';
import { parseConnectionForm } from '../lib/local-db/sessions';

const url = process.env.DATALAB_TEST_DATABASE_URL;
const call = (body: unknown, headers: Record<string, string> = {}) => POST(new Request('http://localhost:3000/api/local-db', {
  method: 'POST', body: JSON.stringify(body),
  headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', ...headers },
}));

test('only loopback PostgreSQL hosts are accepted', () => {
  for (const host of ['db.example.com', '10.0.0.5', '192.168.1.2', '127.0.0.2', 'localhost.evil.com', '']) {
    assert.throws(() => parseConnectionForm({ host, port: 5432, database: 'app', user: 'me', password: 'x' }), host);
  }
  assert.equal(parseConnectionForm({ host: '[::1]', port: '5432', database: 'app', user: 'me', password: '' }).host, '::1');
  assert.throws(() => parseConnectionForm({ host: 'localhost', port: 70000, database: 'app', user: 'me', password: '' }), /Port/);
});

test('API rejects remote hosts, other websites, cross-site and non-JSON requests', async () => {
  const cases: [Record<string, string>, number, string][] = [
    [{ host: 'evil.example:3000', origin: 'http://evil.example:3000' }, 403, 'local-only'],
    [{ host: '192.168.1.20:3000', origin: 'http://192.168.1.20:3000' }, 403, 'local-only'],
    [{ origin: 'http://evil.example' }, 403, 'origin'],
    [{ origin: '' }, 403, 'origin'],
    [{ 'sec-fetch-site': 'cross-site' }, 403, 'origin'],
    [{ 'content-type': 'text/plain' }, 415, 'invalid'],
  ];
  for (const [headers, status, code] of cases) {
    const response = await call({ action: 'connect', host: 'localhost', port: 5432, database: 'x', user: 'x', password: 'x' }, headers);
    assert.equal(response.status, status, JSON.stringify(headers));
    assert.equal((await response.json()).code, code);
  }
  const anonymous = await call({ action: 'status' });
  assert.equal(anonymous.status, 401);
  const remoteDb = await call({ action: 'connect', host: 'db.example.com', port: 5432, database: 'x', user: 'x', password: 'x' });
  assert.equal((await remoteDb.json()).code, 'host');
});

test('real PostgreSQL: wrong password, connect, measure, password never returned, disconnect', { skip: !url }, async () => {
  const target = new URL(url!);
  const form = { host: target.hostname, port: Number(target.port || 5432), database: target.pathname.slice(1), user: decodeURIComponent(target.username), password: decodeURIComponent(target.password) };
  const wrong = await call({ action: 'connect', ...form, password: 'definitely-wrong' });
  assert.equal(wrong.status, 400); assert.equal((await wrong.json()).code, 'auth');
  const connected = await call({ action: 'connect', ...form });
  const body = await connected.json();
  assert.equal(connected.status, 200, JSON.stringify(body));
  assert.ok(!JSON.stringify(body).includes(form.password), 'response never echoes the password');
  assert.equal(body.status.database, form.database);
  const auth = { authorization: `Bearer ${body.token}` };
  const measured = await call({ action: 'measure', schema: 'public', sql: 'SELECT 1 AS one' }, auth);
  assert.equal(measured.status, 200);
  assert.ok((await measured.json()).result.plan);
  const write = await call({ action: 'measure', schema: 'public', sql: 'DELETE FROM pg_class' }, auth);
  assert.equal(write.status, 400, 'writes are rejected');
  const stolen = await call({ action: 'status' }, { ...auth, origin: 'http://evil.example' });
  assert.equal(stolen.status, 403, 'a token is useless from another origin');
  await call({ action: 'disconnect' }, auth);
  assert.equal((await call({ action: 'status' }, auth)).status, 401);
});
