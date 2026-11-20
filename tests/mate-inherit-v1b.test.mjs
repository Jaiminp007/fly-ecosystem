// MATE-INHERIT V1b fixtures (G3 gate per plan + V1A correction). Zero bank
// worlds: synthetic rows, temp-dir bank, unit-level generation summary +
// transmission-noise plumbing (no full runs except null-default V1-parity).
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment,syncNewbornLearners} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateInheritV1bBank,scoreMateInheritV1bRows,summarizeGenerations,meanGen1Lifespan,MI2_NOISE} from '../scripts/mate-inherit-v1b.mjs';

const mkRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,
  mode:'maternal',matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MI2_NOISE[arm],
  endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2}});

test('scorer GO on mutant gen-2 >= 2 AND mutant > exact',()=>{
  const seeds=[416001,416010,416019,416028,416037,416046];
  const rows=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map((s,i)=>mkRow('mutant',s,3,3,i<2?1:0))];
  const v=scoreMateInheritV1bRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-INHERIT-GO-V1B');
  assert.equal(v.mutantGen2,2);
  assert.equal(v.exactGen2,0);
});

test('scorer NOGO when mutant fails the bar (below-count, tied, or beaten)',()=>{
  const seeds=[416001,416010,416019,416028,416037,416046];
  // singleton (V1f-level): mutant gen-2 == 1 < 2 -> NOGO (needs replication within line)
  const one=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map((s,i)=>mkRow('mutant',s,3,3,i<1?1:0))];
  assert.equal(scoreMateInheritV1bRows(one).verdict,'MATE-INHERIT-NOGO-V1B');
  // tied and beaten
  const tied=[...seeds.map(s=>mkRow('exact',s,2,2,1)),...seeds.map(s=>mkRow('mutant',s,2,2,1))];
  assert.equal(scoreMateInheritV1bRows(tied).verdict,'MATE-INHERIT-NOGO-V1B');
  const beaten=[...seeds.map(s=>mkRow('exact',s,4,4,2)),...seeds.map(s=>mkRow('mutant',s,3,3,1))];
  const bv=scoreMateInheritV1bRows(beaten);
  assert.equal(bv.verdict,'MATE-INHERIT-NOGO-V1B');
});

test('scorer INCOMPLETE-NOMUTANTS when mutant gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[416001,416010,416019,416028,416037,416046];
  const flat=[...seeds.map(s=>mkRow('exact',s,0,0,0)),...seeds.map(s=>mkRow('mutant',s,0,0,0))];
  assert.equal(scoreMateInheritV1bRows(flat).verdict,'INCOMPLETE-NOMUTANTS');
  // mutant-zero with control-positive is still void (nothing to compound)
  const voided=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map(s=>mkRow('mutant',s,0,0,0))];
  assert.equal(scoreMateInheritV1bRows(voided).verdict,'INCOMPLETE-NOMUTANTS');
});

test('scorer INVALID on audit fail: wrong nutrient/noise/mode, short, bad generations',()=>{
  const seeds=[416001,416010,416019,416028,416037,416046];
  const base=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map((s,i)=>mkRow('mutant',s,3,3,i<2?1:0))];
  assert.equal(scoreMateInheritV1bRows(base).verdict,'MATE-INHERIT-GO-V1B');
  const badNut=base.map((r,i)=>i===0?{...r,nutrientOverride:0.4}:r);
  assert.equal(scoreMateInheritV1bRows(badNut).verdict,'INVALID');
  const badNoise=base.map((r,i)=>i===6?{...r,transmissionNoise:0.5}:r);
  assert.equal(scoreMateInheritV1bRows(badNoise).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===0?{...r,mode:'none'}:r);
  assert.equal(scoreMateInheritV1bRows(badMode).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateInheritV1bRows(badGen).verdict,'INVALID');
  const short=base.slice(0,11);
  assert.equal(scoreMateInheritV1bRows(short).verdict,'INVALID');
});

test('summarizeGenerations + meanGen1Lifespan (incl. censored survivors)',()=>{
  const lineage=[
    {id:1,generation:0,parents:[]},{id:2,generation:0,parents:[]},
    {id:3,generation:1,parents:[1,2],born:100,died:200},{id:4,generation:1,parents:[1,2],born:110,died:null},
    {id:5,generation:2,parents:[3,4],born:210,died:300}];
  const s=summarizeGenerations(lineage);
  assert.equal(s.maxGeneration,2);
  assert.deepEqual(s.byGeneration,{1:2,2:1});
  assert.equal(s.gen1,2);
  assert.equal(s.gen2,1);
  assert.deepEqual(summarizeGenerations([]),{maxGeneration:0,byGeneration:{},gen1:0,gen2:0});
  const L=meanGen1Lifespan(lineage,1792);
  assert.equal(L.n,2);
  assert.equal(L.censored,1);
  assert.ok(Math.abs(L.mean-((100+1682)/2))<1e-9);
  assert.deepEqual(meanGen1Lifespan([],1792),{mean:null,n:0,censored:0});
});

test('transmissionNoise plumbing: null default = V1-identical exact copy; 0.05 perturbs deterministically and bills ops',()=>{
  const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
  const mkAgent=(w)=>({weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
    awaitingObservation:false,acquisition:true,dead:false,recent:[],older:[],
    motorPending:null,hold:{cruise:false,remaining:0},config:{tasteRate:1},selfMod:null,
    work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},credit:{tick:0},feedRngState:7,surpriseEma:0,surpriseTimer:0});
  const mkRun=(extra,srcW)=>{const m=mkAgent(srcW);
    return {world:{tick:100,flies:[{id:5,brainSeed:9,parents:[3,4]}]},
      learners:{3:m},arm:'candidate',verticalTransmission:'maternal',history:{seed:416001},...extra};};
  // null (and missing-field legacy): exact maternal copy, zero billed
  for(const extra of [{transmissionNoise:null},{}]){
    const r=mkRun(extra,[[1,2,3],[4],[5]]);
    const w0=r.learners[3].weights.taste.slice();
    assert.equal(syncNewbornLearners(r),1);
    assert.deepEqual(r.learners[5].weights.taste,[1,2,3]);
    assert.deepEqual(r.learners[5].weights.actor,[4]);
    assert.deepEqual(r.learners[3].weights.taste,w0);
  }
  // 0.05: perturbed, deterministic across identical runs, billed per element
  // (differential vs null run: 3 taste + 1 actor + 1 critic = 5 ops)
  const r0=mkRun({transmissionNoise:null},[[1,2,3],[4],[5]]);
  assert.equal(syncNewbornLearners(r0),1);
  const r1=mkRun({transmissionNoise:0.05},[[1,2,3],[4],[5]]);
  const r2=mkRun({transmissionNoise:0.05},[[1,2,3],[4],[5]]);
  assert.equal(syncNewbornLearners(r1),1);
  assert.equal(syncNewbornLearners(r2),1);
  assert.deepEqual(r1.learners[5].weights,r2.learners[5].weights);
  assert.ok(JSON.stringify(r1.learners[5].weights.taste)!==JSON.stringify([1,2,3]));
  assert.equal(r1.learners[5].work.scalarOperations-r0.learners[5].work.scalarOperations,5);
});

test('options contrast: exact vs mutant differ ONLY in transmissionNoise (V1-parity otherwise)',()=>{
  const diffKeys=(a,b)=>Object.keys({...a,...b}).filter(k=>a[k]!==b[k]).sort();
  const base={verticalTransmission:'maternal',nutrientOverride:5,matingActionRequired:false,matingEnergyBar:50,reproduction:true,transmissionNoise:null};
  const mut={...base,transmissionNoise:0.05};
  assert.deepEqual(diffKeys(base,mut),['transmissionNoise']);
  // the experiment accepts and stores the knob (null default preserved)
  const history={seed:416001,cueSeed:416002,resourceSeeds:[416003,416004,416005,416006]};
  const mkE=(extra)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,...extra});
  assert.equal(mkE({}).transmissionNoise,null);
  assert.equal(mkE({transmissionNoise:0.05}).transmissionNoise,0.05);
});

test('live bank 416001-416054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1b bank built cleanly pre-build (8/8 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=mateInheritV1bBank('evidence/mate-inherit-dev/fresh-02/protocol.json');
  assert.equal(p.experiment,'mate-inherit-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),416001);
  assert.equal(Math.max(...flat),416054);
  for(const s of [381001,395019,396001,405001,416001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'mate-inherit-v1b-bank-guard-'));
  assert.throws(()=>mateInheritV1bBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
