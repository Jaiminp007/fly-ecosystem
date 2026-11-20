// MATE-PROXIMITY V1c fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + range dose verdicts + scripted range proof + temp-dir bank + bit-identity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateProximityV1cBank,mateProximityV1cSources,scoreMateProximityV1cRows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,PC_NOISE,PC_ROW_SCHEMA,PC_ARM_RANGE} from '../scripts/mate-proximity-v1c.mjs';

// Mirrors the runner's row literal EXACTLY (frozen PC_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:'hub',topology:'hub',sense:1,range:PC_ARM_RANGE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:PC_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:1});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubN',435001,200,8,0)).sort(),[...PC_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub1',435010,200,8,1)).sort(),[...PC_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hubW',435019,260,8,2,150)).sort(),[...PC_ROW_SCHEMA].sort());
});

test('scorer GO-V1C on weak-monotone dose (narrow <= normal <= wide, wide >= 2, wide > narrow)',()=>{
  const seeds=[435001,435010,435019,435028,435037,435046];
  const rows=[...seeds.map(s=>mkRow('hubN',s,200,8,0)),
    ...seeds.map((s,i)=>mkRow('hub1',s,220,8,i<1?1:0)),
    ...seeds.map((s,i)=>mkRow('hubW',s,260,8,i<2?2:0))];
  const v=scoreMateProximityV1cRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-PROXIMITY-GO-V1C');
  assert.equal(v.hubNGen2,0);
  assert.equal(v.hub1Gen2,1);
  assert.equal(v.hubWGen2,4);
});

test('scorer GO-V1 allows ties (weak monotonicity)',()=>{
  const seeds=[435001,435010,435019,435028,435037,435046];
  const rows=[...seeds.map(s=>mkRow('hubN',s,200,8,0)),
    ...seeds.map(s=>mkRow('hub1',s,220,8,0)),
    ...seeds.map((s,i)=>mkRow('hubW',s,260,8,i<2?2:0))];
  assert.equal(scoreMateProximityV1cRows(rows).verdict,'MATE-PROXIMITY-GO-V1C');
});

test('scorer NOGO-V1C on flat, inverted, hump, and below-count doses',()=>{
  const seeds=[435001,435010,435019,435028,435037,435046];
  const flat=[...seeds.map(s=>mkRow('hubN',s,200,8,1)),...seeds.map(s=>mkRow('hub1',s,220,8,1)),...seeds.map(s=>mkRow('hubW',s,260,8,1))];
  assert.equal(scoreMateProximityV1cRows(flat).verdict,'MATE-PROXIMITY-NOGO-V1C');
  const inv=[...seeds.map(s=>mkRow('hubN',s,200,8,2)),...seeds.map(s=>mkRow('hub1',s,220,8,1)),...seeds.map(s=>mkRow('hubW',s,260,8,0))];
  assert.equal(scoreMateProximityV1cRows(inv).verdict,'MATE-PROXIMITY-NOGO-V1C');
  const hump=[...seeds.map(s=>mkRow('hubN',s,200,8,0)),...seeds.map(s=>mkRow('hub1',s,220,8,3)),...seeds.map(s=>mkRow('hubW',s,260,8,1))];
  assert.equal(scoreMateProximityV1cRows(hump).verdict,'MATE-PROXIMITY-NOGO-V1C');
  const low=[...seeds.map(s=>mkRow('hubN',s,200,8,0)),...seeds.map(s=>mkRow('hub1',s,220,8,0)),...seeds.map((s,i)=>mkRow('hubW',s,260,8,i<1?1:0))];
  assert.equal(scoreMateProximityV1cRows(low).verdict,'MATE-PROXIMITY-NOGO-V1C');
});

test('scorer INCOMPLETE-NOBIRTHS when wide gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[435001,435010,435019,435028,435037,435046];
  const flat=[...seeds.map(s=>mkRow('hubN',s,200,8,1)),...seeds.map(s=>mkRow('hub1',s,220,8,1)),...seeds.map(s=>mkRow('hubW',s,0,0,0))];
  assert.equal(scoreMateProximityV1cRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong range and geography',()=>{
  const seeds=[435001,435010,435019,435028,435037,435046];
  const base=[...seeds.map(s=>mkRow('hubN',s,200,8,0)),
    ...seeds.map((s,i)=>mkRow('hub1',s,220,8,i<1?1:0)),
    ...seeds.map((s,i)=>mkRow('hubW',s,260,8,i<2?2:0))];
  assert.equal(scoreMateProximityV1cRows(base).verdict,'MATE-PROXIMITY-GO-V1C');
  const badRange=base.map((r,i)=>i===0?{...r,range:1}:r);
  assert.equal(scoreMateProximityV1cRows(badRange).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===12?{...r,centersCount:3}:r);
  assert.equal(scoreMateProximityV1cRows(badGeo).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===6?{...r,mode:'spread'}:r);
  assert.equal(scoreMateProximityV1cRows(badMode).verdict,'INVALID');
  const badSense=base.map((r,i)=>i===6?{...r,sense:2}:r);
  assert.equal(scoreMateProximityV1cRows(badSense).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateProximityV1cRows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateProximityV1cRows(short).verdict,'INVALID');
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

test('scripted range proof: 20u mates under 1x not 0.5x; 40u under 2x not 1x (1x == no-flag)',()=>{
  const history={seed:435001,cueSeed:435002,resourceSeeds:[435003,435004,435005,435006],probeSeeds:{A:435007,B:435008,transfer:435009}};
  const birthAt=(mult,dist)=>{
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',...(mult==null?{}:{matingRangeMultiplier:mult})});
    const w=run.world;
    const male=w.flies.find(f=>f.sex===0), female=w.flies.find(f=>f.sex===1);
    assert.ok(male&&female);
    male.x=500;male.y=320;male.heading=0;male.age=100;male.energy=100;male.cooldown=0;
    female.x=500+dist;female.y=320;female.age=100;female.energy=100;female.cooldown=0;
    for(const f of w.flies){if(f!==male&&f!==female){f.x=10;f.y=10;f.age=0;}}
    const b0=w.totals.births;
    w.step();
    return w.totals.births-b0;
  };
  assert.equal(birthAt(1,20),1,'1x (26u) must mate at 20u');
  assert.equal(birthAt(0.5,20),0,'0.5x (13u) must NOT mate at 20u');
  assert.equal(birthAt(2,40),1,'2x (52u) must mate at 40u');
  assert.equal(birthAt(1,40),0,'1x (26u) must NOT mate at 40u');
  // bit-identity: explicit 1x == no-flag on actions + ops
  const mkActs=(extra)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',...extra});run.advance(48);return {acts,run};};
  const base=mkActs({});
  const one=mkActs({matingRangeMultiplier:1});
  assert.deepEqual(one.acts,base.acts);
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(one),ops(base));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateProximityV1cSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-proximity-v1c.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 435001-435054 spent (rebuild refuses)',()=>{
  // Bank fresh-03 is BUILT (evidence/mate-proximity-dev/fresh-03/); the spent-bank
  // guard must now refuse any rebuild touching 435001-435054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (11/11 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-proximity-bank-'));
  assert.throws(()=>mateProximityV1cBank(join(dir,'protocol.json')),/already used/);
});
