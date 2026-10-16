import assert from 'node:assert/strict';
import test from 'node:test';
import { ConnectorStore } from '../lib/connector/store';
import { connectorOperation } from '../lib/connector/protocol';

test('pairing is short-lived, single-use and separates agent from browser capabilities', () => {
  let now = 1_000_000; const store = new ConnectorStore(() => now);
  const one = store.register(); const two = store.register();
  const browser = store.pair(one.pairingCode);
  assert.throws(() => store.pair(one.pairingCode), /already used/);
  assert.throws(() => store.poll(browser.browserToken), /expired/);
  assert.throws(() => store.enqueue(one.agentToken, { type: 'initialize', size: 100000 }), /expired/);
  const job = store.enqueue(browser.browserToken, { type: 'initialize', size: 100000 });
  assert.equal(store.poll(two.agentToken).job, null);
  const claim = store.poll(one.agentToken).job!;
  assert.equal(claim.id, job.id);
  assert.equal(store.poll(one.agentToken).job, null, 'running jobs are never delivered twice');
  assert.throws(() => store.report(two.agentToken, job.id, { result: {} }), /not running/);
  store.report(one.agentToken, job.id, { result: { size: 100000 } });
  assert.deepEqual(store.getJob(browser.browserToken, job.id).result, { size: 100000 });
  now += 5 * 60_000 + 1;
  assert.throws(() => store.pair(two.pairingCode), /expired/);
});

test('running cancellation requires acknowledgement and explicit recovery; queued cancellation does not execute', () => {
  const store = new ConnectorStore(); const agent = store.register(); const browser = store.pair(agent.pairingCode);
  const cancelled = store.enqueue(browser.browserToken, { type: 'initialize', size: 50000 });
  store.cancel(browser.browserToken, cancelled.id);
  assert.equal(store.poll(agent.agentToken).job, null);
  assert.equal(store.getJob(browser.browserToken, cancelled.id).state, 'cancelled');
  const job = store.enqueue(browser.browserToken, { type: 'reset', size: 50000 });
  store.poll(agent.agentToken); store.cancel(browser.browserToken, job.id);
  assert.deepEqual(store.poll(agent.agentToken).cancelIds, [job.id]);
  assert.throws(() => store.enqueue(browser.browserToken, { type: 'run', sql: 'SELECT 1' }), /acknowledgement/);
  store.report(agent.agentToken, job.id, { result: { size: 50000 } });
  assert.equal(store.getJob(browser.browserToken, job.id).state, 'cancelled', 'late success cannot hide cancellation');
  assert.throws(() => store.enqueue(browser.browserToken, { type: 'run', sql: 'SELECT 1' }), /reset/);
  const reset = store.enqueue(browser.browserToken, { type: 'reset', size: 50000 });
  store.poll(agent.agentToken); store.report(agent.agentToken, reset.id, { result: { size: 50000 } });
  assert.equal(store.status(browser.browserToken).recoveryRequired, false);
});

test('job deadlines, offline connectors and bounded queues preserve ownership', () => {
  let now = 1_000; const store = new ConnectorStore(() => now); const agent = store.register(); const browser = store.pair(agent.pairingCode);
  const job = store.enqueue(browser.browserToken, { type: 'run', sql: 'SELECT 1' });
  assert.throws(() => store.enqueue(browser.browserToken, { type: 'run', sql: 'SELECT 2' }), /previous job/);
  store.poll(agent.agentToken); now += 31_000;
  assert.equal(store.getJob(browser.browserToken, job.id).state, 'expired');
  assert.equal(store.status(browser.browserToken).connected, false);
  assert.deepEqual(store.poll(agent.agentToken).cancelIds, [job.id]);
  store.report(agent.agentToken, job.id, { error: 'cancelled' });
  store.release(browser.browserToken);
  assert.throws(() => store.status(browser.browserToken), /expired/);
  const refreshed = store.poll(agent.agentToken);
  assert.ok(refreshed.pairingCode); assert.notEqual(refreshed.pairingCode, agent.pairingCode);
});

test('operations reject unsupported profiles and arbitrary setup scripts', () => {
  assert.throws(() => connectorOperation({ type: 'initialize', size: 1_000_000_000 }), /Unsupported/);
  assert.throws(() => connectorOperation({ type: 'prepare', labId: 'partition-014;DROP' }), /Invalid/);
  assert.throws(() => connectorOperation({ type: 'run', sql: 'x'.repeat(16001) }), /limited/);
  assert.throws(() => connectorOperation({ type: 'exec', sql: 'DROP DATABASE postgres' }), /Unsupported/);
  assert.equal(connectorOperation({ type: 'initialize', size: 1000000 }).type, 'initialize');
});


test('acknowledged read-only cancellation allows a new lesson without reimporting the dataset', () => {
  const store = new ConnectorStore(); const agent = store.register(); const browser = store.pair(agent.pairingCode);
  const job = store.enqueue(browser.browserToken, { type: 'run', sql: 'SELECT COUNT(*) FROM orders' });
  store.poll(agent.agentToken); store.cancel(browser.browserToken, job.id);
  assert.throws(() => store.enqueue(browser.browserToken, { type: 'run', sql: 'SELECT 1' }), /acknowledgement/);
  store.report(agent.agentToken, job.id, { error: 'read transaction rolled back' });
  assert.equal(store.status(browser.browserToken).recoveryRequired, false);
  const next = store.enqueue(browser.browserToken, { type: 'prepare', labId: 'index-006' });
  assert.equal(store.poll(agent.agentToken).job?.id, next.id);
});
