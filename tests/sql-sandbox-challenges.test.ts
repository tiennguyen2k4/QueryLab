import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { seedSql } from '../lib/engine/seed';
import { splitStatements } from '../lib/engine/sql-guard';
import {
  sqlSandboxChallenges,
  getSqlChallenge,
  getChallengeByLesson,
  getChallengesByLevel,
} from '../content/sql-sandbox-challenges';

test('all sql sandbox challenges are well-formed, bilingual, and cover all levels', () => {
  assert.equal(sqlSandboxChallenges.length, 16);
  assert.equal(new Set(sqlSandboxChallenges.map(c => c.id)).size, 16);
  assert.equal(new Set(sqlSandboxChallenges.map(c => c.number)).size, 16);

  const basic = getChallengesByLevel('basic');
  const intermediate = getChallengesByLevel('intermediate');
  const advanced = getChallengesByLevel('advanced');

  assert.ok(basic.length >= 8, 'basic challenges count');
  assert.ok(intermediate.length >= 4, 'intermediate challenges count');
  assert.ok(advanced.length >= 4, 'advanced challenges count');

  for (const c of sqlSandboxChallenges) {
    assert.ok(c.title[0] && c.title[1], `${c.id} title`);
    assert.ok(c.topic[0] && c.topic[1], `${c.id} topic`);
    assert.ok(c.scenario[0] && c.scenario[1], `${c.id} scenario`);
    assert.ok(c.task[0] && c.task[1], `${c.id} task`);
    assert.ok(c.hints.length >= 2, `${c.id} hints`);
    assert.ok(c.explanation[0] && c.explanation[1], `${c.id} explanation`);
    assert.ok(c.starterSql.trim().length > 0, `${c.id} starterSql`);
    assert.ok(c.referenceSql.trim().length > 0, `${c.id} referenceSql`);
    assert.ok(c.tables.length > 0, `${c.id} tables`);
  }

  assert.ok(getSqlChallenge('sql-sb-01-select'));
  assert.ok(getSqlChallenge('select'));
  assert.ok(getChallengeByLesson('where'));
  assert.ok(getChallengeByLesson('group-by'));
  assert.ok(getChallengeByLesson('window'));
});

test('all 16 reference queries and solutions execute successfully on real seeded PostgreSQL', { timeout: 120000 }, async () => {
  const db = new PGlite();
  try {
    await db.exec(seedSql(10000));

    for (const challenge of sqlSandboxChallenges) {
      // Execute solution statements (splitting DDL and DML if multiple)
      const stmts = splitStatements(challenge.solutionSql);
      for (const stmt of stmts) {
        if (/^\s*(select|with)/i.test(stmt)) {
          const res = await db.query(stmt);
          assert.ok(res.rows.length > 0, `${challenge.id} solution read query returned rows`);
        } else {
          await db.exec(stmt);
        }
      }

      // Execute reference
      const ref = await db.query(challenge.referenceSql);
      assert.ok(ref.rows.length > 0, `${challenge.id} reference returned rows`);
      assert.ok(ref.fields.length > 0, `${challenge.id} reference returned fields`);
    }
  } finally {
    await db.close();
  }
});
