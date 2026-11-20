// MATE-DECOMP V1 fixtures (FROZEN plan docs/MATE_DECOMP_PLAN_V1.md).
// 5 tests, zero worlds: bank tmp-mint shape/exclusion, scorer GO/NOGO/
// INCOMPLETE branches on synthetic rows, arm→learning options contrast at
// tick 0 (throwaway synthetic seed 7: candidate taste+motor learn, noTaste
// motor-only, unlearned frozen) + transmission-off wiring, generation
// summarizer parity.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {summarizeGenerations} from '../scripts/mate-inherit-v1b.mjs';
import {mateSelectionBank,scoreMateSelectionRows,tasteShare,motorShare,MS_FIXTURE_SEEDS,MS_ARMS} from '../scripts/mate-decomp-dev.mjs';
import {mateSelectionBank as mateSelectionBankV1b,scoreMateSelectionRows as scoreMateSelectionRowsV1b,MS_FIXTURE_SEEDS as MS_FIXTURE_SEEDS_V1B} from '../scripts/mate-decomp-v1b.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const synthRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,mode:'none',matingEnergyBar:50,nutrientOverride:5,transmission:'none',
  endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:3},births,generations:{gen1,gen2,maxGeneration:gen2>0?2:gen1>0?1:0,byGeneration:{}}});

describe('mate-decomp-dev fixtures',()=>{
  it('V1 bank refuses re-mint post-spend (spent-bank guard)',()=>{
    const dir=join(tmpdir(),'mdec-bank-test');
    rmSync(dir,{recursive:true,force:true});
    assert.throws(()=>mateSelectionBank(join(dir,'protocol.json')),/already used in prior evidence/);
    rmSync(dir,{recursive:true,force:true});
  });
  it('scorer GO iff candidate-line tops unlearned; shares split the edge',()=>{
    const v=scoreMateSelectionRows([
      synthRow('candidate',473190,8,7,1),synthRow('noTaste',473190,5,5,0),synthRow('unlearned',473190,2,2,0),
      synthRow('candidate',473199,7,6,1),synthRow('noTaste',473199,6,6,0),synthRow('unlearned',473199,3,3,0)]);
    assert.equal(v.g1,true);assert.equal(v.g2,true);
    assert.equal(v.go,true);assert.equal(v.verdict,'MATE-DECOMP-GO-V1');
    assert.equal(v.candidateBirths,15);assert.equal(v.noTasteBirths,11);assert.equal(v.unlearnedBirths,5);
    assert.equal(v.tasteShare,0.4);assert.equal(v.motorShare,0.6);
    assert.equal(tasteShare(15,11,5),0.4);assert.equal(motorShare(15,11,5),0.6);
    assert.equal(tasteShare(5,5,5),null);
  });
  it('scorer NOGO on no-edge and INCOMPLETE-NOBIRTHS on all-zero',()=>{
    const n=scoreMateSelectionRows([
      synthRow('candidate',473190,3,3,0),synthRow('noTaste',473190,4,4,0),synthRow('unlearned',473190,5,5,0),
      synthRow('candidate',473199,4,4,0),synthRow('noTaste',473199,4,4,0),synthRow('unlearned',473199,4,4,0)]);
    assert.equal(n.go,false);assert.equal(n.verdict,'MATE-DECOMP-NOGO-V1');
    const z=scoreMateSelectionRows([
      synthRow('candidate',473190,0,0,0),synthRow('noTaste',473190,0,0,0),synthRow('unlearned',473190,0,0,0),
      synthRow('candidate',473199,0,0,0),synthRow('noTaste',473199,0,0,0),synthRow('unlearned',473199,0,0,0)]);
    assert.equal(z.go,false);assert.equal(z.verdict,'INCOMPLETE-NOBIRTHS');
  });
  it('options contrast: taste/motor/unlearned mapping at tick 0 (synthetic seed 7)',()=>{
    assert.ok(!MS_FIXTURE_SEEDS.includes(7));
    const runs=Object.fromEntries(MS_ARMS.map(a=>[a,new TasteExperiment({history:synthHistory(7),arm:a,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'none',nutrientOverride:5})]));
    assert.equal(runs.candidate.learners[runs.candidate.founderIds[0]].config.tasteLearning,true);
    assert.equal(runs.noTaste.learners[runs.noTaste.founderIds[0]].config.tasteLearning,false);
    assert.notEqual(runs.noTaste.learners[runs.noTaste.founderIds[0]].acquisition,false);
    assert.equal(runs.unlearned.learners[runs.unlearned.founderIds[0]].acquisition,false);
    for(const a of MS_ARMS)assert.equal(runs[a].world.config.verticalTransmission,'none');
  });
  it('generation summarizer parity (v1b import)',()=>{
    const g=summarizeGenerations([{generation:1,parents:[3],born:10,died:20},{generation:2,parents:[9],born:30,died:null},{generation:0,parents:[],born:0,died:null}]);
    assert.equal(g.gen1,1);assert.equal(g.gen2,1);
  });
});

describe('mate-decomp-v1b replication fixtures',()=>{
  const synthRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,mode:'none',matingEnergyBar:50,nutrientOverride:5,transmission:'none',
    endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:3},births,generations:{gen1,gen2,maxGeneration:gen2>0?2:gen1>0?1:0,byGeneration:{}}});
  it('V1b bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'mdecv1b-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=mateSelectionBankV1b(join(dir,'protocol.json'));
    assert.equal(p.experiment,'mate-decomp-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...MS_FIXTURE_SEEDS_V1B].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.ok(!MS_FIXTURE_SEEDS.some(s=>MS_FIXTURE_SEEDS_V1B.includes(s)),'V1b seeds overlap V1 bank');
    rmSync(dir,{recursive:true,force:true});
  });
  it('V1b scorer GO/NOGO on 2-history synthetic rows',()=>{
    const go=scoreMateSelectionRowsV1b([
      synthRow('candidate',473208,6,6,0),synthRow('noTaste',473208,4,4,0),synthRow('unlearned',473208,3,3,0),
      synthRow('candidate',473217,5,5,0),synthRow('noTaste',473217,4,4,0),synthRow('unlearned',473217,2,2,0)]);
    assert.equal(go.g1,true);assert.equal(go.g2,true);
    assert.equal(go.go,true);assert.equal(go.verdict,'MATE-DECOMP-GO-V1');
    const no=scoreMateSelectionRowsV1b([
      synthRow('candidate',473208,2,2,0),synthRow('noTaste',473208,3,3,0),synthRow('unlearned',473208,4,4,0),
      synthRow('candidate',473217,3,3,0),synthRow('noTaste',473217,3,3,0),synthRow('unlearned',473217,3,3,0)]);
    assert.equal(no.go,false);assert.equal(no.verdict,'MATE-DECOMP-NOGO-V1');
  });
});
