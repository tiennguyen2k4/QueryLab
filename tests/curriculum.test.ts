import assert from 'node:assert/strict';
import { test } from 'node:test';
import { labs } from '../content/labs';
import { PGliteEngine } from '../lib/engine/core';
import { splitStatements } from '../lib/engine/sql-guard';

test('all published labs accept their complete solutions against real PostgreSQL', {timeout:120000}, async()=>{
  assert.equal(labs.length,14);
  for (const lab of labs) {
    const engine=new PGliteEngine();
    try {
      await engine.initialize(50000);
      await engine.prepareLab(lab.id);
      for(const setup of lab.setupSql)await engine.run(setup);
      const baseline=await engine.run(lab.baselineQuery||lab.initialQuery);
      let candidate='';
      for(const statement of splitStatements(lab.solutionSql)){
        const r=await engine.run(statement);if(r.kind==='read')candidate=r.sql;
      }
      assert.ok(candidate, `${lab.id}: solution must include a read query`);
      const verdict=await engine.validate({candidateSql:candidate,rules:lab.validationRules,baselinePlan:baseline.plan||undefined});
      assert.equal(verdict.matches,true,`${lab.id}: ${verdict.reasons.join('; ')}`);
      assert.ok(verdict.checks.every(c=>c.passed),`${lab.id}: all rules pass`);
    } finally {await engine.close();}
  }
});
