import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categories, labs, type Lab } from '../content/labs';
import { categoriesVi, labTranslationsVi } from '../content/labs.vi';
import { localizeLab, localizedCategories, localizedLabs } from '../lib/lab-localization';

function executableDefinition(lab: Lab) {
  const {
    title, subtitle, goals, concept, initialState, task, expectedBehavior,
    hints, solutionExplanation, realWorldScenario, validationRules, incidentQueries,
    ...definition
  } = lab;
  void [title, subtitle, goals, concept, initialState, task, expectedBehavior,
    hints, solutionExplanation, realWorldScenario];
  return {
    ...definition,
    validationRules: validationRules.map(({ explanation, ...rule }) => {
      void explanation;
      return rule;
    }),
    incidentQueries: incidentQueries?.map(({ observation, ...query }) => {
      void observation;
      return query;
    }),
  };
}

test('Vietnamese covers every published lab without changing SQL or grading rules', () => {
  assert.deepEqual(Object.keys(labTranslationsVi).sort(), labs.map((lab) => lab.id).sort());
  for (const lab of labs) {
    const vi = localizeLab(lab, 'vi');
    const text = labTranslationsVi[lab.id];
    assert.deepEqual(executableDefinition(vi), executableDefinition(lab), `${lab.id}: executable content stays stable`);
    assert.equal(text.validationExplanations.length, lab.validationRules.length, `${lab.id}: all checks are translated`);
    assert.equal(text.goals.length, lab.goals.length, `${lab.id}: all goals are translated`);
    assert.equal(text.hints.length, lab.hints.length, `${lab.id}: all hints are translated`);
    assert.equal(text.incidentObservations?.length, lab.incidentQueries?.length, `${lab.id}: all query observations are translated`);
    assert.notEqual(vi.task, lab.task, `${lab.id}: task is translated`);
    assert.notEqual(vi.concept, lab.concept, `${lab.id}: concept is translated`);
    assert.ok(vi.validationRules.every((rule, index) => rule.explanation !== lab.validationRules[index].explanation));
    assert.equal(localizeLab(lab, 'en'), lab, `${lab.id}: English content remains the canonical definition`);
  }
  assert.equal(localizedLabs('vi').length, labs.length);
  assert.equal(localizedLabs('en'), labs);
});

test('localized categories retain their routing and visual identity', () => {
  assert.deepEqual(Object.keys(categoriesVi).sort(), categories.map((category) => category.id).sort());
  assert.equal(localizedCategories('en'), categories);
  for (const [index, category] of localizedCategories('vi').entries()) {
    assert.equal(category.id, categories[index].id);
    assert.equal(category.color, categories[index].color);
    assert.notEqual(category.title, categories[index].title);
    assert.notEqual(category.description, categories[index].description);
  }
});
