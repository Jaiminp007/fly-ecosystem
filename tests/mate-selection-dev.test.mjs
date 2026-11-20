// MATE-SELECTION V1 fixtures (FROZEN plan docs/MATE_SELECTION_PLAN_V1.md).
// 5 tests, zero worlds: bank shape/exclusion (mint to tmp, cleaned),
// scorer GO/NOGO/INCOMPLETE branches on synthetic rows, arm→learning
// options contrast at tick 0 (throwaway synthetic seed 7 — never banked,
// no bank contact), generation-summarizer parity + zero-tick wiring.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {summarizeGenerations} from '../scripts/mate-inherit-v1b.mjs';
import {mateSelectionBank,scoreMateSelectionRows,MS_FIXTURE_SEEDS,MS_ARMS} from '../scripts/mate-selection-dev.mjs';
import {mateSelectionBank as mateSelectionBankV1b,scoreMateSelectionRows as scoreMateSelectionRowsV1b,MS_FIXTURE_SEEDS as MS_FIXTURE_SEEDS_V1B} from '../scripts/mate-selection-v1b.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const synthRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,mode:'none',matingEnergyBar:50,nutrientOverride:5,transmission:'none',
  endpoint:{budgetAdjustedEnergyPerFounder:-60.1,survivors:3},births,generations:{gen1,gen2,maxGeneration:gen2>0?2:gen1>0?1:0,byGeneration:{}}});

describe('mate-selection-dev fixtures',()=>{
  it('V1 bank refuses re-mint post-spend (spent-bank guard)',()=>{
    const dir=join(tmpdir(),'msel-bank-test');
    rmSync(dir,{recursive:true,force:true});
    assert.throws(()=>mateSelectionBank(join(dir,'protocol.json')),/already used in prior evidence/);
    rmSync(dir,{recursive:true,force:true});
  });
  it('scorer GO iff candidate > unlearned and >= frozen',()=>{
    const v=scoreMateSelectionRows([synthRow('candidate',473001,5,4,1),synthRow('frozen',473001,3,3,0),synthRow('unlearned',473001,2,2,0)]);
    assert.equal(v.g1,true);assert.equal(v.g2,true);
    assert.equal(v.go,true);assert.equal(v.verdict,'MATE-SELECTION-GO-V1');
    assert.equal(v.candidateBirths,5);assert.equal(v.frozenBirths,3);assert.equal(v.unlearnedBirths,2);
  });
  it('scorer NOGO on no-signal and INCOMPLETE-NOBIRTHS on all-zero',()=>{
    const n=scoreMateSelectionRows([synthRow('candidate',473001,2,2,0),synthRow('frozen',473001,4,3,1),synthRow('unlearned',473001,1,1,0)]);
    assert.equal(n.go,false);assert.equal(n.verdict,'MATE-SELECTION-NOGO-V1');
    const z=scoreMateSelectionRows([synthRow('candidate',473001,0,0,0),synthRow('frozen',473001,0,0,0),synthRow('unlearned',473001,0,0,0)]);
    assert.equal(z.go,false);assert.equal(z.verdict,'INCOMPLETE-NOBIRTHS');
  });
  it('options contrast: arm determines founder learning at tick 0 (synthetic seed 7, no bank contact)',()=>{
    assert.ok(!MS_FIXTURE_SEEDS.includes(7));
    const h=synthHistory(7);
    const runs=Object.fromEntries(MS_ARMS.map(a=>[a,new TasteExperiment({history:h,arm:a})]));
    const acq=(r)=>r.learners[r.founderIds[0]].acquisition;
    assert.equal(acq(runs.unlearned),false,'unlearned founders frozen at construction');
    assert.notEqual(acq(runs.candidate),false,'candidate founders learning');
    assert.notEqual(acq(runs.frozen),false,'frozen founders learn in phase A');
  });
  it('generation summarizer parity + zero-tick wiring (transmission none, bar 50, nutrient 5)',()=>{
    const g=summarizeGenerations([{generation:1,parents:[3],born:10,died:20},{generation:2,parents:[9],born:30,died:null},{generation:0,parents:[],born:0,died:null}]);
    assert.equal(g.gen1,1);assert.equal(g.gen2,1);
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate',reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'none',nutrientOverride:5});
    assert.equal(run.world.config.reproduction,true);
    assert.equal(run.world.config.matingEnergyBar,50);
    assert.equal(run.arm,'candidate');
  });
});

describe('mate-selection-v1b replication fixtures',()=>{
  it('V1b bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'mselv1b-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=mateSelectionBankV1b(join(dir,'protocol.json'));
    assert.equal(p.experiment,'mate-selection-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...MS_FIXTURE_SEEDS_V1B].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.ok(!MS_FIXTURE_SEEDS.some(s=>MS_FIXTURE_SEEDS_V1B.includes(s)),'V1b seeds overlap V1 bank');
    rmSync(dir,{recursive:true,force:true});
  });
  it('V1b scorer GO/NOGO on 2-history synthetic rows',()=>{
    const go=scoreMateSelectionRowsV1b([
      synthRow('candidate',473010,4,4,0),synthRow('frozen',473010,2,2,0),synthRow('unlearned',473010,1,1,0),
      synthRow('candidate',473019,3,3,0),synthRow('frozen',473019,3,3,0),synthRow('unlearned',473019,2,2,0)]);
    assert.equal(go.g1,true);assert.equal(go.g2,true);
    assert.equal(go.go,true);assert.equal(go.verdict,'MATE-SELECTION-GO-V1');
    assert.equal(go.candidateBirths,7);
    const no=scoreMateSelectionRowsV1b([
      synthRow('candidate',473010,1,1,0),synthRow('frozen',473010,4,4,0),synthRow('unlearned',473010,2,2,0),
      synthRow('candidate',473019,2,2,0),synthRow('frozen',473019,1,1,0),synthRow('unlearned',473019,3,3,0)]);
    assert.equal(no.go,false);assert.equal(no.verdict,'MATE-SELECTION-NOGO-V1');
  });
});
