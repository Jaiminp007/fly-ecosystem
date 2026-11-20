// MATE-ENCOUNTER V1c fixtures (11/11 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + 3-arm dose scorer + duo geography + temp-dir bank + null-default bit-identity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateEncounterV1cBank,mateEncounterV1cSources,scoreMateEncounterV1cRows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,M3_NOISE,M3_ROW_SCHEMA} from '../scripts/mate-encounter-v1c.mjs';

// Mirrors the runner's row literal EXACTLY (frozen M3_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:arm,topology:arm,
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:M3_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,
  centersCount:{spread:3,duo:2,hub:1}[arm]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('spread',429001,200,8,0)).sort(),[...M3_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('duo',429010,200,8,1)).sort(),[...M3_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub',429019,260,8,2,150)).sort(),[...M3_ROW_SCHEMA].sort());
});

test('scorer GO-V1C on weak-monotone dose (spread <= duo <= hub, hub >= 2, hub > spread)',()=>{
  const seeds=[429001,429010,429019,429028,429037,429046];
  const rows=[...seeds.map(s=>mkRow('spread',s,200,8,0)),
    ...seeds.map((s,i)=>mkRow('duo',s,220,8,i<1?1:0)),
    ...seeds.map((s,i)=>mkRow('hub',s,260,8,i<2?2:0))];
  const v=scoreMateEncounterV1cRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-ENCOUNTER-GO-V1C');
  assert.equal(v.spreadGen2,0);
  assert.equal(v.duoGen2,1);
  assert.equal(v.hubGen2,4);
});

test('scorer GO-V1C allows duo ties (weak monotonicity)',()=>{
  const seeds=[429001,429010,429019,429028,429037,429046];
  const rows=[...seeds.map(s=>mkRow('spread',s,200,8,0)),
    ...seeds.map(s=>mkRow('duo',s,220,8,0)),
    ...seeds.map((s,i)=>mkRow('hub',s,260,8,i<2?2:0))];
  assert.equal(scoreMateEncounterV1cRows(rows).verdict,'MATE-ENCOUNTER-GO-V1C');
});

test('scorer NOGO-V1C on flat, inverted, hump, and below-count doses',()=>{
  const seeds=[429001,429010,429019,429028,429037,429046];
  const flat=[...seeds.map(s=>mkRow('spread',s,200,8,1)),...seeds.map(s=>mkRow('duo',s,220,8,1)),...seeds.map(s=>mkRow('hub',s,260,8,1))];
  assert.equal(scoreMateEncounterV1cRows(flat).verdict,'MATE-ENCOUNTER-NOGO-V1C');
  const inv=[...seeds.map(s=>mkRow('spread',s,200,8,2)),...seeds.map(s=>mkRow('duo',s,220,8,1)),...seeds.map(s=>mkRow('hub',s,260,8,0))];
  assert.equal(scoreMateEncounterV1cRows(inv).verdict,'MATE-ENCOUNTER-NOGO-V1C');
  const hump=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map(s=>mkRow('duo',s,220,8,3)),...seeds.map(s=>mkRow('hub',s,260,8,1))];
  assert.equal(scoreMateEncounterV1cRows(hump).verdict,'MATE-ENCOUNTER-NOGO-V1C');
  const low=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map(s=>mkRow('duo',s,220,8,0)),...seeds.map((s,i)=>mkRow('hub',s,260,8,i<1?1:0))];
  assert.equal(scoreMateEncounterV1cRows(low).verdict,'MATE-ENCOUNTER-NOGO-V1C');
});

test('scorer INCOMPLETE-NOBIRTHS when hub gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[429001,429010,429019,429028,429037,429046];
  const flat=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map(s=>mkRow('duo',s,220,8,0)),...seeds.map(s=>mkRow('hub',s,0,0,0))];
  assert.equal(scoreMateEncounterV1cRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. geography (wrong centers count)',()=>{
  const seeds=[429001,429010,429019,429028,429037,429046];
  const base=[...seeds.map(s=>mkRow('spread',s,200,8,0)),
    ...seeds.map((s,i)=>mkRow('duo',s,220,8,i<1?1:0)),
    ...seeds.map((s,i)=>mkRow('hub',s,260,8,i<2?2:0))];
  assert.equal(scoreMateEncounterV1cRows(base).verdict,'MATE-ENCOUNTER-GO-V1C');
  const badGeo=base.map((r,i)=>i===6?{...r,centersCount:3}:r);
  assert.equal(scoreMateEncounterV1cRows(badGeo).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===0?{...r,mode:'none'}:r);
  assert.equal(scoreMateEncounterV1cRows(badMode).verdict,'INVALID');
  const badNut=base.map((r,i)=>i===12?{...r,nutrientOverride:0.4}:r);
  assert.equal(scoreMateEncounterV1cRows(badNut).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateEncounterV1cRows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateEncounterV1cRows(short).verdict,'INVALID');
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

test('null-default bit-identity + duo geography (no-flag == spread; duo 2 centers)',()=>{
  const history={seed:429001,cueSeed:429002,resourceSeeds:[429003,429004,429005,429006],probeSeeds:{A:429007,B:429008,transfer:429009}};
  const mk=(extra)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,...extra});run.advance(48);return {run,acts};};
  const base=mk({});
  const spread=mk({resourceTopology:'spread'});
  assert.deepEqual(spread.acts,base.acts);
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(spread),ops(base));
  assert.equal(spread.run.world.resourceCenters.length,3);
  const duo=mk({resourceTopology:'duo'});
  assert.equal(duo.run.world.resourceCenters.length,2);
  assert.deepEqual(duo.run.world.resourceCenters,[{x:250,y:450},{x:750,y:450}]);
  const hub=mk({resourceTopology:'hub'});
  assert.equal(hub.run.world.resourceCenters.length,1);
  assert.deepEqual(hub.run.world.resourceCenters[0],{x:500,y:320});
  assert.ok(Number.isFinite(hub.run.endpoint().budgetAdjustedEnergyPerFounder));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateEncounterV1cSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-encounter-v1c.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 429001-429054 spent (rebuild refuses)',()=>{
  // Bank fresh-03 is BUILT (evidence/mate-encounter-dev/fresh-03/); the spent-bank
  // guard must now refuse any rebuild touching 429001-429054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (11/11 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-encounter-v1c-bank-'));
  assert.throws(()=>mateEncounterV1cBank(join(dir,'protocol.json')),/already used/);
});
