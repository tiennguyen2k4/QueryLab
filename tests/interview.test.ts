import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  interviewRoles,
  interviewLevels,
  enterpriseQuestions,
  type InterviewRole,
  type InterviewLevel,
} from '../content/interview-data';

test('interview roles and levels are well-defined and bilingual', () => {
  assert.equal(interviewRoles.length, 4);
  const roleIds = interviewRoles.map((r) => r.id);
  assert.deepEqual(roleIds, ['backend', 'data-analyst', 'data-engineer', 'dba']);

  for (const role of interviewRoles) {
    assert.ok(role.name.en && role.name.vi, `Role ${role.id} must have bilingual name`);
    assert.ok(role.tagline.en && role.tagline.vi, `Role ${role.id} must have bilingual tagline`);
    assert.ok(role.description.en && role.description.vi, `Role ${role.id} must have bilingual description`);
    assert.ok(role.shortTag, `Role ${role.id} must have shortTag`);
    assert.ok(role.color, `Role ${role.id} must have theme color`);
    assert.ok(role.skills.length >= 3, `Role ${role.id} must have at least 3 skills`);
  }

  assert.equal(interviewLevels.length, 3);
  const levelIds = interviewLevels.map((l) => l.id);
  assert.deepEqual(levelIds, ['junior', 'middle', 'senior']);

  for (const level of interviewLevels) {
    assert.ok(level.name.en && level.name.vi, `Level ${level.id} must have bilingual name`);
    assert.ok(level.badge, `Level ${level.id} must have badge`);
    assert.ok(level.exp, `Level ${level.id} must have exp requirement string`);
  }
});

test('enterprise questions bank is comprehensive, fully bilingual, and covers all roles and levels', () => {
  assert.ok(enterpriseQuestions.length >= 24, `Must have at least 24 questions, got ${enterpriseQuestions.length}`);

  const roles = new Set<InterviewRole>(enterpriseQuestions.map((q) => q.role));
  assert.equal(roles.size, 4, 'All 4 roles must have enterprise questions');

  for (const roleId of ['backend', 'data-analyst', 'data-engineer', 'dba'] as const) {
    const roleQuestions = enterpriseQuestions.filter((q) => q.role === roleId);
    assert.ok(roleQuestions.length >= 6, `Role ${roleId} should have at least 6 questions, got ${roleQuestions.length}`);
  }

  const levels = new Set<InterviewLevel>(enterpriseQuestions.map((q) => q.level));
  assert.equal(levels.size, 3, 'Must cover junior, middle, and senior levels');

  const categories = new Set(enterpriseQuestions.map((q) => q.category));
  assert.ok(categories.has('foundational'), 'Must have foundational questions');
  assert.ok(categories.has('architecture'), 'Must have architecture questions');
  assert.ok(categories.has('incident'), 'Must have incident questions');

  // Verify full structural integrity of every question
  for (const q of enterpriseQuestions) {
    assert.ok(q.id, 'Question must have id');
    assert.ok(['backend', 'data-analyst', 'data-engineer', 'dba'].includes(q.role), `Valid role for ${q.id}`);
    assert.ok(['junior', 'middle', 'senior'].includes(q.level), `Valid level for ${q.id}`);
    assert.ok(q.companyContext, `Company context must be present for ${q.id}`);

    // Bilingual titles & questions
    assert.ok(q.title.en && q.title.vi, `Bilingual title required for ${q.id}`);
    assert.ok(q.question.en && q.question.vi, `Bilingual question required for ${q.id}`);

    // Guided narrative problem
    assert.ok(q.scenarioNarrative.en && q.scenarioNarrative.vi, `Bilingual narrative required for ${q.id}`);
    assert.ok(q.scenarioNarrative.vi.length > 30, `Narrative should have descriptive context for ${q.id}`);

    // 10-point answer framework checklist
    assert.ok(q.idealAnswerFramework.en.length >= 3, `Must have at least 3 framework items in en for ${q.id}`);
    assert.ok(q.idealAnswerFramework.vi.length >= 3, `Must have at least 3 framework items in vi for ${q.id}`);

    // Detailed solution & architectural trade-offs
    assert.ok(q.solutionDetail.en && q.solutionDetail.vi, `Bilingual solutionDetail required for ${q.id}`);
    assert.ok(q.tradeoffs.en && q.tradeoffs.vi, `Bilingual tradeoffs required for ${q.id}`);

    // Evaluation rubric: Green Flags & Red Flags
    assert.ok(q.rubric.greenFlags.en.length >= 2, `Green flags required for ${q.id}`);
    assert.ok(q.rubric.greenFlags.vi.length >= 2, `Green flags in vi required for ${q.id}`);
    assert.ok(q.rubric.redFlags.en.length >= 2, `Red flags required for ${q.id}`);
    assert.ok(q.rubric.redFlags.vi.length >= 2, `Red flags in vi required for ${q.id}`);

    // Tags
    assert.ok(q.tags.length >= 2, `At least 2 tags required for ${q.id}`);
  }
});

test('locale defaults to Vietnamese and parses accurately', async () => {
  const { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, parseLocale } = await import('../lib/locale');
  assert.equal(DEFAULT_LOCALE, 'vi');
  assert.equal(LOCALE_STORAGE_KEY, 'querylab.locale.v2');
  assert.equal(parseLocale(null), 'vi');
  assert.equal(parseLocale(''), 'vi');
  assert.equal(parseLocale('invalid'), 'vi');
  assert.equal(parseLocale('vi'), 'vi');
  assert.equal(parseLocale('en'), 'en');
});
