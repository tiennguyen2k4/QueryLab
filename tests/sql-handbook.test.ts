import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { sampleSetupSql, sampleTables, sqlLessons, type Cell } from '../content/sql-handbook';

const normalize = (value: unknown): Cell => value === null ? null
  : value instanceof Date ? value.toISOString().slice(0, 10)
    : typeof value === 'bigint' || typeof value === 'number' ? Number(value) : String(value);

test('handbook lessons are complete, bilingual and cover basics through advanced', () => {
  assert.equal(new Set(sqlLessons.map(lesson => lesson.id)).size, sqlLessons.length);
  for (const level of ['basic', 'intermediate', 'advanced']) assert.ok(sqlLessons.filter(lesson => lesson.level === level).length >= 4, level);
  for (const id of ['intro', 'select', 'where', 'join', 'group-by', 'cte', 'window', 'index', 'explain', 'partition', 'permissions']) assert.ok(sqlLessons.some(lesson => lesson.id === id), id);
  for (const lesson of sqlLessons) {
    const texts = [lesson.title, lesson.tagline, lesson.what, lesson.example.question, ...lesson.when, ...lesson.mistakes, ...lesson.parts.map(part => part.meaning)];
    assert.ok(texts.every(([en, vi]) => en.trim() && vi.trim()), lesson.id);
    assert.ok(lesson.parts.length >= 3 && lesson.mistakes.length >= 2, lesson.id);
    assert.ok(lesson.example.result || lesson.example.error || lesson.example.illustration || lesson.example.note, `${lesson.id} shows an outcome`);
  }
});

test('every displayed example result is what PostgreSQL actually returns on the sample data', async () => {
  const db = new PGlite();
  try {
    await db.exec(sampleSetupSql);
    for (const table of Object.values(sampleTables)) {
      const rows = await db.query(`SELECT * FROM ${table.name} ORDER BY id`, [], { rowMode: 'array' });
      assert.deepEqual((rows.rows as unknown[][]).map(row => row.map(normalize)), table.rows, `${table.name} matches the displayed sample`);
    }
    for (const lesson of sqlLessons) {
      const example = lesson.example;
      if (example.runnable === false) continue;
      await db.exec(sampleSetupSql);
      if (example.error) { await assert.rejects(db.exec(example.sql), lesson.id); continue; }
      if (example.check) await db.exec(example.sql);
      const query = await db.query(example.check ?? example.sql, [], { rowMode: 'array' });
      if (!example.result) continue;
      assert.deepEqual(query.fields.map(field => field.name), example.result.columns, `${lesson.id} columns`);
      const actual = (query.rows as unknown[][]).map(row => row.map(normalize));
      const ordered = /ORDER BY/i.test(example.check ?? example.sql);
      const sort = (rows: Cell[][]) => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      assert.deepEqual(ordered ? actual : sort(actual), ordered ? example.result.rows : sort(example.result.rows), `${lesson.id} rows`);
    }
  } finally { await db.close(); }
});
