// TASTE-BACKWARD V1 fixtures (FROZEN plan docs/TASTE_BACKWARD_PLAN_V1.md).
// 5 tests, zero worlds: bank tmp-mint shape/exclusion, scorer GO/NOGO/
// INCOMPLETE branches on synthetic cumulative phaseRows, depletion-DiD
// arithmetic, arm validity + zero-tick wiring (throwaway synthetic seed 7).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {tasteBackwardBank,segmentRates,scoreTasteBackwardRows,TB_FIXTURE_SEEDS,TB_ARMS} from '../scripts/taste-backward-dev.mjs';
import {tasteBackwardBank as tasteBackwardBankV1b,scoreTasteBackwardRows as scoreTasteBackwardRowsV1b,TB_FIXTURE_SEEDS as TB_FIXTURE_SEEDS_V1B} from '../scripts/taste-backward-v1b.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
// Cumulative food across A/B/C/return-A (ticks 512/512/512/256).
const synthRow=(arm,seed,cum,energy=-50.0,surv=3)=>({history:{seed},arm,
  phaseRows:['A','B','C','return-A'].map((id,i)=>({phase:id,totals:{foodEaten:cum[i]},endpoint:{}})),
  endpoint:{budgetAdjustedEnergyPerFounder:energy,survivors:surv}});

describe('taste-backward-dev fixtures',()=>{
  it('V1 bank refuses re-mint post-spend (spent-bank guard)',()=>{
    const dir=join(tmpdir(),'tb-bank-test');
    rmSync(dir,{recursive:true,force:true});
    assert.throws(()=>tasteBackwardBank(join(dir,'protocol.json')),/already used in prior evidence/);
    rmSync(dir,{recursive:true,force:true});
  });
  it('segmentRates differences cumulative rows into per-tick rates',()=>{
    const seg=segmentRates(synthRow('candidate',473028,[256,512,640,704]).phaseRows);
    assert.equal(seg.A.rate,256/512);assert.equal(seg.B.rate,256/512);
    assert.equal(seg.C.rate,128/512);assert.equal(seg.retA.rate,64/256);
    assert.equal(segmentRates([{phase:'A',totals:{foodEaten:1}}]),null);
  });
  it('scorer GO iff candidate drop < unlearned drop, retA above naive, within frozen+tol',()=>{
    const rows=[
      synthRow('candidate',473028,[300,560,680,800]),synthRow('frozen',473028,[300,560,700,820]),synthRow('unlearned',473028,[200,280,320,340]),
      synthRow('candidate',473037,[320,600,720,850]),synthRow('frozen',473037,[320,600,740,860]),synthRow('unlearned',473037,[210,290,330,350])];
    const v=scoreTasteBackwardRows(rows);
    assert.equal(v.g1,true);assert.equal(v.g2,true);
    assert.equal(v.go,true);assert.equal(v.verdict,'TASTE-BACKWARD-GO-V1');
    assert.ok(v.pooled.candidate.drop<v.pooled.unlearned.drop);
  });
  it('scorer NOGO on no-signal and INCOMPLETE-NOFEED on all-zero',()=>{
    const n=scoreTasteBackwardRows([
      synthRow('candidate',473028,[300,560,680,700]),synthRow('frozen',473028,[300,580,720,800]),synthRow('unlearned',473028,[280,540,660,740]),
      synthRow('candidate',473037,[310,570,690,710]),synthRow('frozen',473037,[310,590,730,810]),synthRow('unlearned',473037,[290,550,670,750])]);
    assert.equal(n.go,false);assert.equal(n.verdict,'TASTE-BACKWARD-NOGO-V1');
    const z=scoreTasteBackwardRows([
      synthRow('candidate',473028,[0,0,0,0]),synthRow('frozen',473028,[0,0,0,0]),synthRow('unlearned',473028,[0,0,0,0]),
      synthRow('candidate',473037,[0,0,0,0]),synthRow('frozen',473037,[0,0,0,0]),synthRow('unlearned',473037,[0,0,0,0])]);
    assert.equal(z.go,false);assert.equal(z.verdict,'INCOMPLETE-NOFEED');
  });
  it('arm validity + zero-tick wiring (synthetic seed 7, no bank contact)',()=>{
    assert.ok(!TB_FIXTURE_SEEDS.includes(7));
    for(const arm of TB_ARMS){
      const run=new TasteExperiment({history:synthHistory(7),arm});
      assert.equal(run.arm,arm);
      assert.ok(run.learners[run.founderIds[0]]);
    }
    const u=new TasteExperiment({history:synthHistory(7),arm:'unlearned'});
    const c=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    assert.equal(u.learners[u.founderIds[0]].acquisition,false);
    assert.notEqual(c.learners[c.founderIds[0]].acquisition,false);
  });
});

describe('taste-backward-v1b replication fixtures',()=>{
  const synthRowV1b=(arm,seed,cum,energy=-50.0,surv=3)=>({history:{seed},arm,
    phaseRows:['A','B','C','return-A'].map((id,i)=>({phase:id,totals:{foodEaten:cum[i]},endpoint:{}})),
    endpoint:{budgetAdjustedEnergyPerFounder:energy,survivors:surv}});
  it('V1b bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'tbv1b-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=tasteBackwardBankV1b(join(dir,'protocol.json'));
    assert.equal(p.experiment,'taste-backward-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...TB_FIXTURE_SEEDS_V1B].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.ok(!TB_FIXTURE_SEEDS.some(s=>TB_FIXTURE_SEEDS_V1B.includes(s)),'V1b seeds overlap V1 bank');
    rmSync(dir,{recursive:true,force:true});
  });
  it('V1b scorer GO/NOGO on 2-history synthetic rows',()=>{
    const go=scoreTasteBackwardRowsV1b([
      synthRowV1b('candidate',473046,[300,560,680,800]),synthRowV1b('frozen',473046,[300,560,700,820]),synthRowV1b('unlearned',473046,[200,280,320,340]),
      synthRowV1b('candidate',473055,[320,600,720,850]),synthRowV1b('frozen',473055,[320,600,740,860]),synthRowV1b('unlearned',473055,[210,290,330,350])]);
    assert.equal(go.g1,true);assert.equal(go.g2,true);
    assert.equal(go.go,true);assert.equal(go.verdict,'TASTE-BACKWARD-GO-V1');
    const no=scoreTasteBackwardRowsV1b([
      synthRowV1b('candidate',473046,[300,560,680,700]),synthRowV1b('frozen',473046,[300,580,720,800]),synthRowV1b('unlearned',473046,[280,540,660,740]),
      synthRowV1b('candidate',473055,[310,570,690,710]),synthRowV1b('frozen',473055,[310,590,730,810]),synthRowV1b('unlearned',473055,[290,550,670,750])]);
    assert.equal(no.go,false);assert.equal(no.verdict,'TASTE-BACKWARD-NOGO-V1');
  });
});
