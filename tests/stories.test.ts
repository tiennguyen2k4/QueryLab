import assert from 'node:assert/strict';
import test from 'node:test';
import { labs } from '../content/labs';
import { getLabStory, labStories } from '../content/lab-stories';
import { PGliteEngine } from '../lib/engine/core';
import { guardSql, splitStatements } from '../lib/engine/sql-guard';

test('published lessons have bilingual stories with predictions and transferable experiments', () => {
  for (const lab of labs) {
    for (const locale of ['en', 'vi'] as const) {
      const story = getLabStory(lab.id, locale);
      assert.ok(story, `${lab.id}: missing ${locale} story`);
      assert.ok(story.opening.length > 60, `${lab.id}: concrete opening`);
      assert.ok(story.motivation.length > 25, `${lab.id}: task motivation`);
      assert.ok(story.transferQuestion.endsWith('?'), `${lab.id}: transfer question`);
      assert.ok(story.constraints.length >= 3, `${lab.id}: preserve actual task constraints`);
      assert.ok(story.inputTables.length >= 1);
      assert.ok(story.output.rows.length >= 1);
      assert.ok(story.prediction.choices.length >= 2);
      assert.ok(story.prediction.correctChoice >= 0 && story.prediction.correctChoice < story.prediction.choices.length);
      for (const table of [...story.inputTables, story.output]) {
        assert.ok(table.columns.length > 0);
        assert.ok(table.rows.every(row => row.length === table.columns.length), `${lab.id}: rectangular example table`);
      }
    }
    assert.notEqual(getLabStory(lab.id, 'en')?.opening, getLabStory(lab.id, 'vi')?.opening);
  }
  assert.equal(getLabStory('missing-lesson', 'vi'), undefined);
});

test('every sample and experiment is exactly one read-only statement accepted by the lab guard', () => {
  for (const [id, translations] of Object.entries(labStories)) {
    for (const story of Object.values(translations)) {
      for (const sql of [story.sampleSql, story.experiment.sql]) {
        assert.equal(splitStatements(sql).length, 1, `${id}: one staged statement`);
        assert.equal(guardSql(sql).kind, 'read', `${id}: read-only staged SQL`);
      }
    }
  }
});

test('illustrative outputs are correct and counterexperiments execute on the real lab dataset', { timeout: 90000 }, async () => {
  const engine = new PGliteEngine();
  try {
    await engine.initialize(10000);
    for (const [id, translations] of Object.entries(labStories)) {
      // Localized prose shares one executable example; do not test a translation twice.
      const story = translations.en;
      assert.equal(translations.vi.sampleSql, story.sampleSql, `${id}: equivalent bilingual example`);
      assert.deepEqual(translations.vi.output, story.output);
      const result = await engine.run(story.sampleSql);
      assert.deepEqual(result.fields.map(column => column.name), story.output.columns, `${id}: expected output columns`);
      assert.deepEqual(result.rows.map(row => row.map(value => String(value))), story.output.rows, `${id}: correct sample values and order`);
      if (id === 'partition-014') await engine.prepareLab(id);
      const experiment = await engine.run(story.experiment.sql);
      assert.equal(experiment.kind, 'read', `${id}: counterexperiment executes as read-only SQL`);
      assert.ok(experiment.plan, `${id}: counterexperiment has an observed plan`);
    }
  } finally {
    await engine.close();
  }
});
