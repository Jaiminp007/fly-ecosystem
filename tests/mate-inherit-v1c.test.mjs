// MATE-INHERIT V1c fixtures (G3 gate per plan; FINAL chartered mating line).
// Zero bank worlds: synthetic rows, temp-dir bank, unit-level generation +
// founder + lifespan checks, scorer branches, options-contrast, V1b-parity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment,syncNewbornLearners} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateInheritV1cBank,scoreMateInheritV1cRows,summarizeGenerations,meanGen1Lifespan,
  summarizeLineageFounders,collectFounderIds,MI3_NOISE} from '../scripts/mate-inherit-v1c.mjs';

const mkRow=(arm,seed,births,gen1,gen2,founders)=>({history:{seed},arm,
  mode:'maternal',matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MI3_NOISE[arm],
  endpoint:{budgetAdjustedEnergyPerFounder:-25.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:{mean:1300,n:gen1,censored:0},
  lineageFounders:founders??{gen2:Array(gen2).fill(1000+seed%100),gen3:[]}});

test('scorer GO on mutant gen-2 >= 2 AND mutant > exact (replication bar, unchanged from V1b)',()=>{
  const seeds=[417001,417010,417019,417028,417037,417046];
  const rows=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map((s,i)=>mkRow('mutant',s,3,3,i<2?1:0))];
  const v=scoreMateInheritV1cRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-INHERIT-GO-V1C');
  assert.equal(v.mutantGen2,2);
  assert.equal(v.exactGen2,0);
});

test('scorer NOGO when mutant fails the bar; closes line as unconfirmed',()=>{
  const seeds=[417001,417010,417019,417028,417037,417046];
  const one=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map((s,i)=>mkRow('mutant',s,3,3,i<1?1:0))];
  const n1=scoreMateInheritV1cRows(one);
  assert.equal(n1.verdict,'MATE-INHERIT-NOGO-V1C');
  const tied=[...seeds.map(s=>mkRow('exact',s,2,2,1)),...seeds.map(s=>mkRow('mutant',s,2,2,1))];
  assert.equal(scoreMateInheritV1cRows(tied).go,false);
  const beaten=[...seeds.map(s=>mkRow('exact',s,4,4,2)),...seeds.map(s=>mkRow('mutant',s,3,3,1))];
  assert.equal(scoreMateInheritV1cRows(beaten).verdict,'MATE-INHERIT-NOGO-V1C');
});
test('scorer INCOMPLETE-NOMUTANTS when mutant gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[417001,417010,417019,417028,417037,417046];
  const flat=[...seeds.map(s=>mkRow('exact',s,0,0,0)),...seeds.map(s=>mkRow('mutant',s,0,0,0))];
  assert.equal(scoreMateInheritV1cRows(flat).verdict,'INCOMPLETE-NOMUTANTS');
  const voided=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map(s=>mkRow('mutant',s,0,0,0))];
  assert.equal(scoreMateInheritV1cRows(voided).verdict,'INCOMPLETE-NOMUTANTS');
});

test('scorer INVALID on audit fail: wrong nutrient/noise/mode, missing founders field, bad generations',()=>{
  const seeds=[417001,417010,417019,417028,417037,417046];
  const base=[...seeds.map(s=>mkRow('exact',s,2,2,0)),...seeds.map((s,i)=>mkRow('mutant',s,3,3,i<2?1:0))];
  assert.equal(scoreMateInheritV1cRows(base).verdict,'MATE-INHERIT-GO-V1C');
  const badNut=base.map((r,i)=>i===0?{...r,nutrientOverride:0.4}:r);
  assert.equal(scoreMateInheritV1cRows(badNut).verdict,'INVALID');
  const badNoise=base.map((r,i)=>i===6?{...r,transmissionNoise:0.5}:r);
  assert.equal(scoreMateInheritV1cRows(badNoise).verdict,'INVALID');
  const badFounders=base.map((r,i)=>i===0?{...r,lineageFounders:{gen2:'x',gen3:[]}}:r);
  assert.equal(scoreMateInheritV1cRows(badFounders).verdict,'INVALID');
  const noFounders=base.map(({lineageFounders,...r})=>r);
  assert.equal(scoreMateInheritV1cRows(noFounders).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1},lineageFounders:{gen2:[],gen3:[]}}:r);
  assert.equal(scoreMateInheritV1cRows(badGen).verdict,'INVALID');
  const short=base.slice(0,11);
  assert.equal(scoreMateInheritV1cRows(short).verdict,'INVALID');
});

test('summarizeGenerations + meanGen1Lifespan (censored survivors counted, malformed skipped)',()=>{
  const lineage=[
    {id:1,generation:0,parents:[]},{id:2,generation:0,parents:[]},
    {id:3,generation:1,parents:[1,2],born:100,died:300},{id:4,generation:1,parents:[1,2],born:110,died:null},
    {id:5,generation:2,parents:[3,4],born:210,died:300},{id:9}];
  const s=summarizeGenerations(lineage);
  assert.equal(s.maxGeneration,2);
  assert.deepEqual(s.byGeneration,{1:2,2:1});
  assert.equal(s.gen1,2);
  assert.equal(s.gen2,1);
  assert.deepEqual(summarizeGenerations([]),{maxGeneration:0,byGeneration:{},gen1:0,gen2:0});
  const L=meanGen1Lifespan(lineage,1792);
  assert.equal(L.n,2);
  assert.equal(L.censored,1);
  assert.ok(Math.abs(L.mean-((200+1682)/2))<1e-9);
  assert.deepEqual(meanGen1Lifespan([],1792),{mean:null,n:0,censored:0});
});

test('summarizeLineageFounders: maternal founder per gen-2+ birth; orphans dropped; cycles break',()=>{
  // A: founders 1,2 -> gen1 3,4 -> gen2 5 (3+4), gen2 6 (3+missing-father: still founder 1 via mother 3), gen2 8 (mother missing: dropped); B: founder 10 alone.
  const lineage=[
    {id:1,generation:0,parents:[]},{id:2,generation:0,parents:[]},
    {id:3,generation:1,parents:[1,2]},{id:4,generation:1,parents:[1,2]},
    {id:5,generation:2,parents:[3,4]},{id:6,generation:2,parents:[3,99]},{id:8,generation:2,parents:[98,2]},
    {id:7,generation:3,parents:[5,9]},
    {id:10,generation:0,parents:[]}];
  const f=summarizeLineageFounders(lineage);
  assert.deepEqual(f.gen2,[1,1]);
  assert.deepEqual(f.gen3,[1]);
  // orphan gen-2 (parent entry missing entirely) is dropped, not attributed
  const orph=[{id:20,generation:2,parents:[98,99]}];
  assert.deepEqual(summarizeLineageFounders(orph),{gen2:[],gen3:[]});
  // cycle breaks instead of hanging (A<->B mutual parents)
  const cyc=[{id:30,generation:2,parents:[31,32]},{id:31,generation:1,parents:[30,32]},{id:32,generation:0,parents:[]}];
  assert.deepEqual(summarizeLineageFounders(cyc),{gen2:[],gen3:[]});
  assert.deepEqual(summarizeLineageFounders([]),{gen2:[],gen3:[]});
  // collectFounderIds aggregates per arm+gen across rows (duplicates kept)
  const rows=[{arm:'mutant',lineageFounders:{gen2:[3],gen3:[]}},{arm:'mutant',lineageFounders:{gen2:[3,7],gen3:[3]}},{arm:'exact',lineageFounders:{gen2:[9],gen3:[]}}];
  assert.deepEqual(collectFounderIds(rows,'mutant','gen2'),[3,3,7]);
  assert.deepEqual(collectFounderIds(rows,'mutant','gen3'),[3]);
  assert.deepEqual(collectFounderIds(rows,'exact','gen2'),[9]);
  assert.deepEqual(collectFounderIds(rows,'exact','gen3'),[]);
  assert.deepEqual(collectFounderIds([],'mutant','gen2'),[]);
});

test('transmissionNoise plumbing: null default = exact copy; 0.05 deterministic + billed',()=>{
  const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
  const mkAgent=(w)=>({weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
    awaitingObservation:false,acquisition:true,dead:false,recent:[],older:[],
    motorPending:null,hold:{cruise:false,remaining:0},config:{tasteRate:1},selfMod:null,
    work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},credit:{tick:0},feedRngState:7,surpriseEma:0,surpriseTimer:0});
  const mkRun=(extra,srcW)=>{const m=mkAgent(srcW);
    return {world:{tick:100,flies:[{id:5,brainSeed:9,parents:[3,4]}]},
      learners:{3:m},arm:'candidate',verticalTransmission:'maternal',history:{seed:417001},...extra};};
  for(const extra of [{transmissionNoise:null},{}]){
    const r=mkRun(extra,[[1,2,3],[4],[5]]);
    assert.equal(syncNewbornLearners(r),1);
    assert.deepEqual(r.learners[5].weights.taste,[1,2,3]);
  }
  const rNull=mkRun({transmissionNoise:null},[[1,2,3],[4],[5]]);
  assert.equal(syncNewbornLearners(rNull),1);
  const r1=mkRun({transmissionNoise:0.05},[[1,2,3],[4],[5]]);
  const r2=mkRun({transmissionNoise:0.05},[[1,2,3],[4],[5]]);
  assert.equal(syncNewbornLearners(r1),1);
  assert.equal(syncNewbornLearners(r2),1);
  assert.deepEqual(r1.learners[5].weights,r2.learners[5].weights);
  assert.ok(JSON.stringify(r1.learners[5].weights.taste)!==JSON.stringify([1,2,3]));
  // billed ops = mutated element count (3 taste + 1 actor + 1 critic), differential vs null run
  assert.equal(r1.learners[5].work.scalarOperations-rNull.learners[5].work.scalarOperations,5);
});

test('options contrast: exact vs mutant differ ONLY in transmissionNoise (V1b-identical values)',()=>{
  const diffKeys=(a,b)=>Object.keys({...a,...b}).filter(k=>a[k]!==b[k]).sort();
  const base={mode:'maternal',matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:null,reproduction:true,verticalTransmission:'maternal'};
  const mut={...base,transmissionNoise:0.05};
  assert.deepEqual(diffKeys(base,mut),['transmissionNoise']);
  assert.equal(MI3_NOISE.exact,null);
  assert.equal(MI3_NOISE.mutant,0.05);
  const history={seed:417001,cueSeed:417002,resourceSeeds:[417003,417004,417005,417006]};
  const mk=(extra)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,...extra});
  assert.equal(mk({}).transmissionNoise,null);
  assert.equal(mk({transmissionNoise:0.05}).transmissionNoise,0.05);
});

test('live bank 417001-417054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1c bank built cleanly pre-build (9/9 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=mateInheritV1cBank('evidence/mate-inherit-dev/fresh-03/protocol.json');
  assert.equal(p.experiment,'mate-inherit-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),417001);
  assert.equal(Math.max(...flat),417054);
  for(const s of [381001,395019,396001,405001,416001,417001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'mate-inherit-v1c-bank-guard-'));
  assert.throws(()=>mateInheritV1cBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
