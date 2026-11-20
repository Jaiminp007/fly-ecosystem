// MATE-PROXIMITY V1b fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + split verdicts + scripted range proof + temp-dir bank + bit-identity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateProximityV1bBank,mateProximityV1bSources,scoreMateProximityV1bRows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,PB_NOISE,PB_ROW_SCHEMA,PB_ARM_TOPO,PB_ARM_RANGE} from '../scripts/mate-proximity-v1b.mjs';

// Mirrors the runner's row literal EXACTLY (frozen PB_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:PB_ARM_TOPO[arm],topology:PB_ARM_TOPO[arm],sense:1,range:PB_ARM_RANGE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:PB_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,
  centersCount:{spread:3,hub:1}[PB_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubR2',433001,200,8,3)).sort(),[...PB_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spreadR2',433010,200,8,1)).sort(),[...PB_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hubR1',433019,260,8,2,150)).sort(),[...PB_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spreadR1',433028,200,8,0)).sort(),[...PB_ROW_SCHEMA].sort());
});

test('scorer GO-V1B on the split (hubR2 >= 2 AND hubR2 > spreadR2; anchors descriptive)',()=>{
  const seeds=[433001,433010,433019,433028,433037,433046];
  const rows=[...seeds.map((s,i)=>mkRow('hubR2',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('spreadR2',s,200,8,0)),
    ...seeds.map(s=>mkRow('hubR1',s,200,8,9)),
    ...seeds.map(s=>mkRow('spreadR1',s,200,8,9))];
  const v=scoreMateProximityV1bRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-PROXIMITY-GO-V1B');
  assert.equal(v.hubR2Gen2,4);
  assert.equal(v.spreadR2Gen2,0);
});

test('scorer keys verdict on the breadth-held pair, not the anchors',()=>{
  const seeds=[433001,433010,433019,433028,433037,433046];
  // anchors high but split flat -> NOGO
  const flat=[...seeds.map(s=>mkRow('hubR2',s,200,8,2)),...seeds.map(s=>mkRow('spreadR2',s,200,8,2)),
    ...seeds.map(s=>mkRow('hubR1',s,200,8,9)),...seeds.map(s=>mkRow('spreadR1',s,200,8,9))];
  assert.equal(scoreMateProximityV1bRows(flat).verdict,'MATE-PROXIMITY-NOGO-V1B');
  // split inverted (spread wins at equal breadth) -> NOGO
  const inv=[...seeds.map(s=>mkRow('hubR2',s,200,8,1)),...seeds.map(s=>mkRow('spreadR2',s,200,8,3)),
    ...seeds.map(s=>mkRow('hubR1',s,200,8,0)),...seeds.map(s=>mkRow('spreadR1',s,200,8,0))];
  assert.equal(scoreMateProximityV1bRows(inv).verdict,'MATE-PROXIMITY-NOGO-V1B');
  // hubR2 below count (< 2, nothing to explain) -> NOGO even with direction
  const low=[...seeds.map((s,i)=>mkRow('hubR2',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('spreadR2',s,200,8,0)),
    ...seeds.map(s=>mkRow('hubR1',s,200,8,0)),...seeds.map(s=>mkRow('spreadR1',s,200,8,0))];
  assert.equal(scoreMateProximityV1bRows(low).verdict,'MATE-PROXIMITY-NOGO-V1B');
});

test('scorer INCOMPLETE-NOBIRTHS when hubR2 gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[433001,433010,433019,433028,433037,433046];
  const flat=[...seeds.map(s=>mkRow('hubR2',s,0,0,0)),...seeds.map(s=>mkRow('spreadR2',s,200,8,2)),
    ...seeds.map(s=>mkRow('hubR1',s,200,8,2)),...seeds.map(s=>mkRow('spreadR1',s,200,8,1))];
  assert.equal(scoreMateProximityV1bRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong range/topology/centers',()=>{
  const seeds=[433001,433010,433019,433028,433037,433046];
  const base=[...seeds.map((s,i)=>mkRow('hubR2',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('spreadR2',s,200,8,0)),
    ...seeds.map(s=>mkRow('hubR1',s,200,8,1)),
    ...seeds.map(s=>mkRow('spreadR1',s,200,8,1))];
  assert.equal(scoreMateProximityV1bRows(base).verdict,'MATE-PROXIMITY-GO-V1B');
  const badRange=base.map((r,i)=>i===0?{...r,range:1}:r);
  assert.equal(scoreMateProximityV1bRows(badRange).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===6?{...r,mode:'hub'}:r);
  assert.equal(scoreMateProximityV1bRows(badTopo).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===6?{...r,centersCount:1}:r);
  assert.equal(scoreMateProximityV1bRows(badGeo).verdict,'INVALID');
  const badSense=base.map((r,i)=>i===12?{...r,sense:2}:r);
  assert.equal(scoreMateProximityV1bRows(badSense).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateProximityV1bRows(badGen).verdict,'INVALID');
  const short=base.slice(0,23);
  assert.equal(scoreMateProximityV1bRows(short).verdict,'INVALID');
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

test('scripted range proof at 52u + 1x bit-identity (knob engages, null-default holds)',()=>{
  const history={seed:433001,cueSeed:433002,resourceSeeds:[433003,433004,433005,433006],probeSeeds:{A:433007,B:433008,transfer:433009}};
  const birthAt=(mult,topo,dist)=>{
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:topo,...(mult==null?{}:{matingRangeMultiplier:mult})});
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
  assert.equal(birthAt(2,'hub',40),1,'2x (52u) must mate at 40u on hub');
  assert.equal(birthAt(1,'hub',40),0,'1x (26u) must NOT mate at 40u on hub');
  assert.equal(birthAt(2,'spread',40),1,'2x (52u) must mate at 40u on spread (topology-independent knob)');
  // bit-identity: explicit 1x == no-flag on actions + ops
  const mkActs=(extra)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',...extra});run.advance(48);return {acts,run};};
  const base=mkActs({});
  const one=mkActs({matingRangeMultiplier:1});
  assert.deepEqual(one.acts,base.acts);
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(one),ops(base));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateProximityV1bSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-proximity-v1b.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 433001-433054 spent (rebuild refuses)',()=>{
  // Bank fresh-02 is BUILT (evidence/mate-proximity-dev/fresh-02/); the spent-bank
  // guard must now refuse any rebuild touching 433001-433054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (10/10 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-proximity-v1b-bank-'));
  assert.throws(()=>mateProximityV1bBank(join(dir,'protocol.json')),/already used/);
});
