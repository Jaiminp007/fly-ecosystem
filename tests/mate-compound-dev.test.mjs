// MATE-COMPOUND V1 fixtures (FROZEN plan docs/MATE_COMPOUND_PLAN_V1.md).
// 5 tests, zero worlds: bank tmp-mint shape/exclusion, scorer GO/NOGO/
// INCOMPLETE branches on synthetic rows, arm→learning options contrast +
// maternal-mode wiring at tick 0 (throwaway synthetic seed 7),
// generation-summarizer parity.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {summarizeGenerations} from '../scripts/mate-inherit-v1b.mjs';
import {mateSelectionBank,scoreMateSelectionRows,MS_FIXTURE_SEEDS,MS_ARMS} from '../scripts/mate-compound-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const synthRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,mode:'maternal',matingEnergyBar:50,nutrientOverride:5,transmission:'maternal',
  endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:3},births,generations:{gen1,gen2,maxGeneration:gen2>0?2:gen1>0?1:0,byGeneration:{}}});

describe('mate-compound-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'mcp-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=mateSelectionBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'mate-compound-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...MS_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    rmSync(dir,{recursive:true,force:true});
  });
  it('scorer GO iff candidate-line births exceed unlearned-line',()=>{
    const v=scoreMateSelectionRows([
      synthRow('candidate',473100,8,7,1),synthRow('unlearned',473100,5,5,0),
      synthRow('candidate',473109,9,8,1),synthRow('unlearned',473109,6,6,0)]);
    assert.equal(v.g1,true);assert.equal(v.g2,true);
    assert.equal(v.go,true);assert.equal(v.verdict,'MATE-COMPOUND-GO-V1');
    assert.equal(v.candidateBirths,17);assert.equal(v.unlearnedBirths,11);
    assert.equal(v.candidateGen2,2);assert.equal(v.unlearnedGen2,0);
  });
  it('scorer NOGO on no-signal and INCOMPLETE-NOBIRTHS on all-zero',()=>{
    const n=scoreMateSelectionRows([
      synthRow('candidate',473100,4,4,0),synthRow('unlearned',473100,6,5,1),
      synthRow('candidate',473109,5,5,0),synthRow('unlearned',473109,5,5,0)]);
    assert.equal(n.go,false);assert.equal(n.verdict,'MATE-COMPOUND-NOGO-V1');
    const z=scoreMateSelectionRows([
      synthRow('candidate',473100,0,0,0),synthRow('unlearned',473100,0,0,0),
      synthRow('candidate',473109,0,0,0),synthRow('unlearned',473109,0,0,0)]);
    assert.equal(z.go,false);assert.equal(z.verdict,'INCOMPLETE-NOBIRTHS');
  });
  it('options contrast + maternal wiring at tick 0 (synthetic seed 7, no bank contact)',()=>{
    assert.ok(!MS_FIXTURE_SEEDS.includes(7));
    for(const arm of MS_ARMS){
      const run=new TasteExperiment({history:synthHistory(7),arm,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5});
      assert.equal(run.arm,arm);
      assert.equal(run.world.config.reproduction,true);
      assert.equal(run.world.config.verticalTransmission,'maternal');
      const st=run.learners[run.founderIds[0]];
      if(arm==='unlearned')assert.equal(st.acquisition,false);
      else assert.notEqual(st.acquisition,false);
    }
  });
  it('generation summarizer parity (v1b import)',()=>{
    const g=summarizeGenerations([{generation:1,parents:[3],born:10,died:20},{generation:2,parents:[9],born:30,died:null},{generation:0,parents:[],born:0,died:null}]);
    assert.equal(g.gen1,1);assert.equal(g.gen2,1);
  });
});
