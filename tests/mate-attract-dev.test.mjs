// MATE-ATTRACT V1 fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + 2x2 contrast verdicts + scripted sensing proof + temp-dir bank + bit-identity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateAttractDevBank,mateAttractDevSources,scoreMateAttractDevRows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,ATR_NOISE,ATR_ROW_SCHEMA,ATR_ARM_TOPO,ATR_ARM_SENSE} from '../scripts/mate-attract-dev.mjs';

// Mirrors the runner's row literal EXACTLY (frozen ATR_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:ATR_ARM_TOPO[arm],topology:ATR_ARM_TOPO[arm],sense:ATR_ARM_SENSE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:ATR_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,
  centersCount:{spread:3,hub:1}[ATR_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('spread1',430001,200,8,0)).sort(),[...ATR_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread2',430010,200,8,1)).sort(),[...ATR_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub2',430019,260,8,2,150)).sort(),[...ATR_ROW_SCHEMA].sort());
});

test('scorer GO-V1 on the encounter contrast (spread2 >= 2 AND > spread1; hubs descriptive)',()=>{
  const seeds=[430001,430010,430019,430028,430037,430046];
  const rows=[...seeds.map((s,i)=>mkRow('spread1',s,200,8,i<1?1:0)),
    ...seeds.map((s,i)=>mkRow('spread2',s,210,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub1',s,200,8,0)),
    ...seeds.map(s=>mkRow('hub2',s,200,8,5))];
  const v=scoreMateAttractDevRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-ATTRACT-GO-V1');
  assert.equal(v.spread2Gen2,4);
  assert.equal(v.spread1Gen2,1);
});

test('scorer keys verdict on the contrast, not the hubs',()=>{
  const seeds=[430001,430010,430019,430028,430037,430046];
  // hubs high but contrast flat -> NOGO
  const flat=[...seeds.map(s=>mkRow('spread1',s,200,8,1)),...seeds.map(s=>mkRow('spread2',s,210,8,1)),
    ...seeds.map(s=>mkRow('hub1',s,200,8,3)),...seeds.map(s=>mkRow('hub2',s,200,8,3))];
  assert.equal(scoreMateAttractDevRows(flat).verdict,'MATE-ATTRACT-NOGO-V1');
  // contrast holds but hubs childless -> still GO
  const nohub=[...seeds.map(s=>mkRow('spread1',s,200,8,0)),...seeds.map((s,i)=>mkRow('spread2',s,210,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub1',s,0,0,0)),...seeds.map(s=>mkRow('hub2',s,0,0,0))];
  assert.equal(scoreMateAttractDevRows(nohub).verdict,'MATE-ATTRACT-GO-V1');
  // below-count contrast -> NOGO
  const low=[...seeds.map(s=>mkRow('spread1',s,200,8,1)),...seeds.map(s=>mkRow('spread2',s,210,8,1)),
    ...seeds.map(s=>mkRow('hub1',s,200,8,0)),...seeds.map(s=>mkRow('hub2',s,200,8,0))];
  assert.equal(scoreMateAttractDevRows(low).verdict,'MATE-ATTRACT-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when spread2 gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[430001,430010,430019,430028,430037,430046];
  const flat=[...seeds.map(s=>mkRow('spread1',s,200,8,1)),...seeds.map(s=>mkRow('spread2',s,0,0,0)),
    ...seeds.map(s=>mkRow('hub1',s,200,8,2)),...seeds.map(s=>mkRow('hub2',s,200,8,3))];
  assert.equal(scoreMateAttractDevRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong sense and geography',()=>{
  const seeds=[430001,430010,430019,430028,430037,430046];
  const base=[...seeds.map((s,i)=>mkRow('spread1',s,200,8,i<1?1:0)),
    ...seeds.map((s,i)=>mkRow('spread2',s,210,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub1',s,200,8,0)),
    ...seeds.map(s=>mkRow('hub2',s,200,8,0))];
  assert.equal(scoreMateAttractDevRows(base).verdict,'MATE-ATTRACT-GO-V1');
  const badSense=base.map((r,i)=>i===6?{...r,sense:1}:r);
  assert.equal(scoreMateAttractDevRows(badSense).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===0?{...r,centersCount:1}:r);
  assert.equal(scoreMateAttractDevRows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===12?{...r,mode:'spread'}:r);
  assert.equal(scoreMateAttractDevRows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===18?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateAttractDevRows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateAttractDevRows(badGen).verdict,'INVALID');
  const short=base.slice(0,23);
  assert.equal(scoreMateAttractDevRows(short).verdict,'INVALID');
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

test('scripted sensing proof: 1x blind beyond sense range, 2x detects (bit-identity 1x == no-flag)',()=>{
  const history={seed:430001,cueSeed:430002,resourceSeeds:[430003,430004,430005,430006],probeSeeds:{A:430007,B:430008,transfer:430009}};
  const setup=(extra)=>{
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'spread',...extra});
    const w=run.world;
    const male=w.flies.find(f=>f.sex===0), female=w.flies.find(f=>f.sex===1);
    assert.ok(male&&female);
    const r=male.genome.traits.sense;
    male.x=500;male.y=320;male.heading=0;male.age=100;
    female.x=500+1.5*r;female.y=320;female.age=100;
    for(const f of w.flies){if(f!==male&&f!==female){f.x=10;f.y=10;f.age=100;}}
    w.step();
    return {run,male};
  };
  const acts1=(()=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'spread'});run.advance(48);return acts;})();
  const one=setup({});
  assert.equal(one.male.lastInputs[6],0,'1x must not detect a mate at 1.5x sense range');
  const two=setup({mateSenseMultiplier:2});
  assert.ok(two.male.lastInputs[6]>0.9,'2x must detect a mate at 1.5x sense range (bearing dead ahead)');
  // bit-identity: explicit 1x == no-flag on actions + ops
  const actsX=(()=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'spread',mateSenseMultiplier:1});run.advance(48);return {acts,run};})();
  assert.deepEqual(actsX.acts,acts1);
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  const base=(()=>{const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'spread'});run.advance(48);return {run};})();
  assert.equal(ops(actsX),ops(base));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateAttractDevSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-attract-dev.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 430001-430054 spent (rebuild refuses)',()=>{
  // Bank fresh-01 is BUILT (evidence/mate-attract-dev/fresh-01/); the spent-bank
  // guard must now refuse any rebuild touching 430001-430054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (10/10 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-attract-bank-'));
  assert.throws(()=>mateAttractDevBank(join(dir,'protocol.json')),/already used/);
});
