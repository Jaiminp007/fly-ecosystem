// MATE-ENCOUNTER V1 fixtures (9/9 green required before bank build; zero bank worlds).
// Synthetic rows + temp-dir bank + null-default bit-identity (incl. replay on).
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateEncounterDevBank,mateEncounterDevSources,scoreMateEncounterDevRows,summarizeGenerations,meanGen1Lifespan,ME_NOISE} from '../scripts/mate-encounter-dev.mjs';

const mkRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,mode:arm,topology:arm,
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:ME_NOISE[arm],verticalTransmission:'maternal',
  endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2}});

test('scorer GO on hub gen-2 >= 2 AND hub > spread (with manipulation met)',()=>{
  const seeds=[427001,427010,427019,427028,427037,427046];
  const rows=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map((s,i)=>mkRow('hub',s,260,8,i<2?2:0))];
  const v=scoreMateEncounterDevRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-ENCOUNTER-GO-V1');
  assert.equal(v.hubGen2,4);
  assert.equal(v.spreadGen2,0);
});

test('scorer NOGO when hub fails the bar (below-count, tied, beaten)',()=>{
  const seeds=[427001,427010,427019,427028,427037,427046];
  const one=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map((s,i)=>mkRow('hub',s,260,8,i<1?1:0))];
  assert.equal(scoreMateEncounterDevRows(one).verdict,'MATE-ENCOUNTER-NOGO-V1');
  const tied=[...seeds.map(s=>mkRow('spread',s,200,8,1)),...seeds.map(s=>mkRow('hub',s,260,8,1))];
  assert.equal(scoreMateEncounterDevRows(tied).verdict,'MATE-ENCOUNTER-NOGO-V1');
  const beaten=[...seeds.map(s=>mkRow('spread',s,200,8,2)),...seeds.map(s=>mkRow('hub',s,260,8,1))];
  assert.equal(scoreMateEncounterDevRows(beaten).verdict,'MATE-ENCOUNTER-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when hub gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[427001,427010,427019,427028,427037,427046];
  const flat=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,0,0,0))];
  assert.equal(scoreMateEncounterDevRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail: wrong nutrient/mode/topology/bar, short, bad generations',()=>{
  const seeds=[427001,427010,427019,427028,427037,427046];
  const base=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map((s,i)=>mkRow('hub',s,260,8,i<2?2:0))];
  assert.equal(scoreMateEncounterDevRows(base).verdict,'MATE-ENCOUNTER-GO-V1');
  const badNut=base.map((r,i)=>i===0?{...r,nutrientOverride:0.4}:r);
  assert.equal(scoreMateEncounterDevRows(badNut).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===0?{...r,mode:'none'}:r);
  assert.equal(scoreMateEncounterDevRows(badMode).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===6?{...r,topology:'spread'}:r);
  assert.equal(scoreMateEncounterDevRows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===6?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateEncounterDevRows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateEncounterDevRows(badGen).verdict,'INVALID');
  const short=base.slice(0,11);
  assert.equal(scoreMateEncounterDevRows(short).verdict,'INVALID');
});

test('scorer INVALID when manipulation fails (hub births do not exceed spread)',()=>{
  const seeds=[427001,427010,427019,427028,427037,427046];
  // equal births: no concentration effect -> INVALID (knob did not engage)
  const flat=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,200,8,0))];
  assert.equal(scoreMateEncounterDevRows(flat).verdict,'INVALID');
  // hub fewer births
  const neg=[...seeds.map(s=>mkRow('spread',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,100,4,0))];
  assert.equal(scoreMateEncounterDevRows(neg).verdict,'INVALID');
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

test('null-default bit-identity: no-flag run == explicit spread run (incl. replay)',()=>{
  const history={seed:427001,cueSeed:427002,resourceSeeds:[427003,427004,427005,427006],probeSeeds:{A:427007,B:427008,transfer:427009}};
  const mk=(extra)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,...extra});run.advance(48);return {run,acts};};
  const base=mk({});
  const spread=mk({resourceTopology:'spread'});
  assert.deepEqual(spread.acts,base.acts);
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(spread),ops(base));
  assert.equal(spread.run.world.resourceCenters.length,3);
  const hub=mk({resourceTopology:'hub'});
  assert.equal(hub.run.world.resourceCenters.length,1);
  assert.deepEqual(hub.run.world.resourceCenters[0],{x:500,y:320});
  assert.ok(Number.isFinite(hub.run.endpoint().budgetAdjustedEnergyPerFounder));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateEncounterDevSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-encounter-dev.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 427001-427054 spent (rebuild refuses)',()=>{
  // Bank fresh-01 is BUILT (evidence/mate-encounter-dev/fresh-01/); the spent-bank
  // guard must now refuse any rebuild touching 427001-427054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (9/9 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-encounter-bank-'));
  assert.throws(()=>mateEncounterDevBank(join(dir,'protocol.json')),/already used/);
});
