// GEN1-COHORT V1 fixtures (FROZEN docs/GEN1_COHORT_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, cohortSurvival
// helper (windows/censoring-proof), scorer GO/NOGO/NOBIRTHS branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gcBank,scoreGen1CohortRows,cohortSurvival,GC_FIXTURE_SEEDS,GC_MARGIN,GC_EARLY_MAX,GC_LATE_MIN,GC_LATE_MAX,GC_WINDOW} from '../scripts/gen1-cohort-dev.mjs';

const row=(seed,earlyN,early,lateN,late)=>({history:{seed},arm:'cohort',stage:'main',
  cohorts:{earlyN,early,lateN,late},births:earlyN+lateN,
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('gen1-cohort-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1cohort-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gcBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-cohort-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B]);
    assert.ok(flat.length>0);
    assert.equal(GC_FIXTURE_SEEDS[0],474271);
    assert.equal(GC_EARLY_MAX,400);assert.equal(GC_LATE_MIN,1200);assert.equal(GC_LATE_MAX,1592);assert.equal(GC_WINDOW,200);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cohortSurvival splits windows and is censoring-proof (late cap 1592+200=1792)',()=>{
    const lin=[
      {id:1,generation:1,born:100,died:150},{id:2,generation:1,born:100,died:null},
      {id:3,generation:1,born:1300,died:1400},{id:4,generation:1,born:1300,died:null},
      {id:5,generation:1,born:1700,died:null},{id:6,generation:0,born:0,died:null}];
    const v=cohortSurvival(lin,1792);
    assert.equal(v.earlyN,2);assert.equal(v.early,0.5);
    assert.equal(v.lateN,2);assert.equal(v.late,0.5);
  });
  it('cohortSurvival ignores out-of-window births (gap 401-1199)',()=>{
    const lin=[{id:1,generation:1,born:800,died:900}];
    const v=cohortSurvival(lin,1792);
    assert.equal(v.earlyN,0);assert.equal(v.lateN,0);
    assert.equal(v.early,null);assert.equal(v.late,null);
  });
  it('scorer GO branch (early survives better)',()=>{
    const rows=[row(474271,3,1.0,3,0.5),row(474280,3,1.0,3,0.5)];
    const v=scoreGen1CohortRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-COHORT-GO-V1');
  });
  it('scorer NOGO branch (no difference)',()=>{
    const rows=[row(474271,3,1.0,3,1.0),row(474280,3,0.5,3,0.5)];
    const v=scoreGen1CohortRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-COHORT-NOGO-V1');
  });
  it('scorer NOBIRTHS void (window empty in both histories -> pooled empty)',()=>{
    const rows=[row(474271,0,null,3,1.0),row(474280,0,null,3,1.0)];
    const v=scoreGen1CohortRows(rows);
    assert.equal(v.go,false);
    assert.equal(v.verdict,'INCOMPLETE-NOBIRTHS');
    assert.ok(GC_MARGIN===1.1);
  });
});
