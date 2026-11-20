// MATE-ATTRACT V1b fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + suppression verdicts + 0.5x sensing proof + temp-dir bank + bit-identity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateAttractV1bBank,mateAttractV1bSources,scoreMateAttractV1bRows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,ATB_NOISE,ATB_ROW_SCHEMA,ATB_ARM_TOPO,ATB_ARM_SENSE} from '../scripts/mate-attract-v1b.mjs';

// Mirrors the runner's row literal EXACTLY (frozen ATB_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:ATB_ARM_TOPO[arm],topology:ATB_ARM_TOPO[arm],sense:ATB_ARM_SENSE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:ATB_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,
  centersCount:{spread:3,hub:1}[ATB_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hub1',431001,200,8,3)).sort(),[...ATB_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub05',431010,200,8,1)).sort(),[...ATB_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread1',431019,200,8,0)).sort(),[...ATB_ROW_SCHEMA].sort());
});

test('scorer GO-V1B on suppression (hub1 >= 2 AND hub05 < hub1; spread descriptive)',()=>{
  const seeds=[431001,431010,431019,431028,431037,431046];
  const rows=[...seeds.map((s,i)=>mkRow('hub1',s,200,8,i<2?2:0)),
    ...seeds.map((s,i)=>mkRow('hub05',s,200,8,i<1?1:0)),
    ...seeds.map(s=>mkRow('spread1',s,200,8,9))];
  const v=scoreMateAttractV1bRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-ATTRACT-GO-V1B');
  assert.equal(v.hub1Gen2,4);
  assert.equal(v.hub05Gen2,1);
});

test('scorer keys verdict on suppression, not the anchor',()=>{
  const seeds=[431001,431010,431019,431028,431037,431046];
  // no suppression (equal) -> NOGO even with high anchor
  const flat=[...seeds.map(s=>mkRow('hub1',s,200,8,1)),...seeds.map(s=>mkRow('hub05',s,200,8,1)),
    ...seeds.map(s=>mkRow('spread1',s,200,8,9))];
  assert.equal(scoreMateAttractV1bRows(flat).verdict,'MATE-ATTRACT-NOGO-V1B');
  // inverted (0.5x HIGHER) -> NOGO
  const inv=[...seeds.map(s=>mkRow('hub1',s,200,8,1)),...seeds.map(s=>mkRow('hub05',s,200,8,2)),
    ...seeds.map(s=>mkRow('spread1',s,200,8,0))];
  assert.equal(scoreMateAttractV1bRows(inv).verdict,'MATE-ATTRACT-NOGO-V1B');
  // below-count hub1 (< 2, nothing to suppress) -> NOGO
  const low=[...seeds.map((s,i)=>mkRow('hub1',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('hub05',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread1',s,200,8,0))];
  assert.equal(scoreMateAttractV1bRows(low).verdict,'MATE-ATTRACT-NOGO-V1B');
});

test('scorer INCOMPLETE-NOBIRTHS when hub1 gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[431001,431010,431019,431028,431037,431046];
  const flat=[...seeds.map(s=>mkRow('hub1',s,0,0,0)),...seeds.map(s=>mkRow('hub05',s,0,0,0)),
    ...seeds.map(s=>mkRow('spread1',s,200,8,2))];
  assert.equal(scoreMateAttractV1bRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong sense and geography',()=>{
  const seeds=[431001,431010,431019,431028,431037,431046];
  const base=[...seeds.map((s,i)=>mkRow('hub1',s,200,8,i<2?2:0)),
    ...seeds.map((s,i)=>mkRow('hub05',s,200,8,i<1?1:0)),
    ...seeds.map(s=>mkRow('spread1',s,200,8,1))];
  assert.equal(scoreMateAttractV1bRows(base).verdict,'MATE-ATTRACT-GO-V1B');
  const badSense=base.map((r,i)=>i===6?{...r,sense:1}:r);
  assert.equal(scoreMateAttractV1bRows(badSense).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===0?{...r,centersCount:3}:r);
  assert.equal(scoreMateAttractV1bRows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===12?{...r,mode:'hub'}:r);
  assert.equal(scoreMateAttractV1bRows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===0?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateAttractV1bRows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateAttractV1bRows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateAttractV1bRows(short).verdict,'INVALID');
});

test('firstMatingTick: min gen-1 born; null when none; skips parentless/gen-0/non-integer',()=>{
  const lineage=[
    {id:1,generation:0,parents:[],born:0},{id:2,generation:0,parents:[],born:0},
    {id:3,generation:1,parents:[],born:50},
    {id:4,generation:1,parents:[1,2],born:200},{id:5,generation:1,parents:[1,2],born:100},
    {id:6,generation:2,parents:[4,5],born:90}];
  assert.equal(firstMatingTick(lineage),100);
  assert.equal(firstMatingTick([{id:1,generation:0,parents:[],born:0}]),null);
  assert.equal(firstMatingTick([]),null);
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
  const L=meanGen1Lifespan(lineage,1792);
  assert.equal(L.n,2);
  assert.equal(L.censored,1);
});

test('scripted 0.5x sensing proof: detects at 0.4x range, blind at 0.75x (1x == no-flag)',()=>{
  const history={seed:431001,cueSeed:431002,resourceSeeds:[431003,431004,431005,431006],probeSeeds:{A:431007,B:431008,transfer:431009}};
  const setup=(extra,frac)=>{
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',...extra});
    const w=run.world;
    const male=w.flies.find(f=>f.sex===0), female=w.flies.find(f=>f.sex===1);
    assert.ok(male&&female);
    const r=male.genome.traits.sense;
    male.x=500;male.y=320;male.heading=0;male.age=100;
    female.x=500+frac*r;female.y=320;female.age=100;
    for(const f of w.flies){if(f!==male&&f!==female){f.x=10;f.y=10;f.age=100;}}
    w.step();
    return {run,male};
  };
  // 0.5x sees within 0.5x range
  const near=setup({mateSenseMultiplier:0.5},0.4);
  assert.ok(near.male.lastInputs[6]>0.9,'0.5x must detect a mate at 0.4x sense range');
  // 0.5x blind beyond 0.5x range
  const far=setup({mateSenseMultiplier:0.5},0.75);
  assert.equal(far.male.lastInputs[6],0,'0.5x must NOT detect a mate at 0.75x sense range');
  // bit-identity: explicit 1x == no-flag on actions + ops
  const acts1=(()=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub'});run.advance(48);return acts;})();
  const actsX=(()=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1});run.advance(48);return {acts,run};})();
  assert.deepEqual(actsX.acts,acts1);
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  const base=(()=>{const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub'});run.advance(48);return {run};})();
  assert.equal(ops(actsX),ops(base));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateAttractV1bSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-attract-v1b.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 431001-431054 spent (rebuild refuses)',()=>{
  // Bank fresh-02 is BUILT (evidence/mate-attract-dev/fresh-02/); the spent-bank
  // guard must now refuse any rebuild touching 431001-431054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (10/10 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-attract-v1b-bank-'));
  assert.throws(()=>mateAttractV1bBank(join(dir,'protocol.json')),/already used/);
});
