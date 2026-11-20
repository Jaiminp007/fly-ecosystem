// MATE-INFORMED V1 fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + donor-lineage verdicts + donor/transplant units + temp-dir bank + bit-identity.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateInformedDevBank,mateInformedDevSources,scoreMateInformedDevRows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,donorLineCounts,mateInformedDonor,MIF_NOISE,MIF_ROW_SCHEMA} from '../scripts/mate-informed-dev.mjs';
import {snapshotWeights,copyWeights,assertFreshTarget,digestWeights} from '../scripts/turn-gated-dev-v1b.mjs';

// Mirrors the runner's row literal EXACTLY (frozen MIF_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,dGen1,dGen2,fmt=null)=>({history:{seed},arm,mode:arm,topology:'hub',sense:1,
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MIF_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:1,
  donorId:1,donorDigest:'abc',appliedDigest:'abc',donorLine:{gen1:dGen1,gen2plus:dGen2},donorFile:'frozen',donorAgentId:'1'});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('informed',434001,200,8,3,4,2)).sort(),[...MIF_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('sham',434010,200,8,1,2,0)).sort(),[...MIF_ROW_SCHEMA].sort());
});

test('scorer GO-V1 on donor advantage (informed donor-line gen-2+ >= 2 AND > sham)',()=>{
  const seeds=[434001,434010,434019,434028,434037,434046];
  const rows=[...seeds.map((s,i)=>mkRow('informed',s,200,8,i<2?2:0,4,i<2?2:0)),
    ...seeds.map((s,i)=>mkRow('sham',s,200,8,0,2,i<1?1:0))];
  const v=scoreMateInformedDevRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-INFORMED-GO-V1');
  assert.equal(v.informedDonorGen2,4);
  assert.equal(v.shamDonorGen2,1);
});

test('scorer keys verdict on the donor line, not total gen-2',()=>{
  const seeds=[434001,434010,434019,434028,434037,434046];
  // totals high but donor line flat -> NOGO (knowledge did not compound)
  const flat=[...seeds.map(s=>mkRow('informed',s,200,8,5,4,0)),
    ...seeds.map(s=>mkRow('sham',s,200,8,5,4,0))];
  assert.equal(scoreMateInformedDevRows(flat).verdict,'MATE-INFORMED-NOGO-V1');
  // inverted (sham donor wins) -> NOGO
  const inv=[...seeds.map(s=>mkRow('informed',s,200,8,2,4,1)),
    ...seeds.map(s=>mkRow('sham',s,200,8,2,4,3))];
  assert.equal(scoreMateInformedDevRows(inv).verdict,'MATE-INFORMED-NOGO-V1');
  // below-count informed donor (< 2) -> NOGO even with direction
  const low=[...seeds.map((s,i)=>mkRow('informed',s,200,8,1,i<1?4:0,i<1?1:0)),
    ...seeds.map(s=>mkRow('sham',s,200,8,0,0,0))];
  assert.equal(scoreMateInformedDevRows(low).verdict,'MATE-INFORMED-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when informed donor gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[434001,434010,434019,434028,434037,434046];
  const flat=[...seeds.map(s=>mkRow('informed',s,200,8,2,0,0)),
    ...seeds.map(s=>mkRow('sham',s,200,8,2,3,1))];
  assert.equal(scoreMateInformedDevRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. digest mismatch and bad donor lineage',()=>{
  const seeds=[434001,434010,434019,434028,434037,434046];
  const base=[...seeds.map((s,i)=>mkRow('informed',s,200,8,i<2?2:0,4,i<2?2:0)),
    ...seeds.map((s,i)=>mkRow('sham',s,200,8,0,2,i<1?1:0))];
  assert.equal(scoreMateInformedDevRows(base).verdict,'MATE-INFORMED-GO-V1');
  const badDigest=base.map((r,i)=>i===0?{...r,appliedDigest:'xyz'}:r);
  assert.equal(scoreMateInformedDevRows(badDigest).verdict,'INVALID');
  const badLine=base.map((r,i)=>i===0?{...r,donorLine:{gen1:0,gen2plus:-1}}:r);
  assert.equal(scoreMateInformedDevRows(badLine).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===6?{...r,mode:'hub1'}:r);
  assert.equal(scoreMateInformedDevRows(badMode).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===0?{...r,topology:'spread'}:r);
  assert.equal(scoreMateInformedDevRows(badTopo).verdict,'INVALID');
  const short=base.slice(0,11);
  assert.equal(scoreMateInformedDevRows(short).verdict,'INVALID');
});

test('donorLineCounts follows parents[0]-chain (weight ancestry), counts gen-1 vs gen-2+',()=>{
  const lineage=[
    {id:1,generation:0,parents:[]},{id:2,generation:0,parents:[]},
    {id:3,generation:1,parents:[1,2]},{id:4,generation:1,parents:[2,1]},
    {id:5,generation:2,parents:[3,9]},{id:6,generation:2,parents:[9,3]},
    {id:7,generation:1,parents:[2,2]},{id:8,generation:3,parents:[5,7]}];
  // donor 1: gen-1 via parents[0] (3 only; 4's parents[0] is 2), gen-2+ via chain (5 via 3; 8 via 5; 6's chain 6->9 dead-end)
  const d=donorLineCounts(lineage,1);
  assert.deepEqual(d,{gen1:1,gen2plus:2});
  assert.deepEqual(donorLineCounts([],'x'),{gen1:0,gen2plus:0});
  assert.deepEqual(donorLineCounts([{id:1,generation:0,parents:[]}],1),{gen1:0,gen2plus:0});
});

test('donor loads from the frozen artifact (read-only) with stable min-id selection',()=>{
  const d1=mateInformedDonor();
  const d2=mateInformedDonor();
  assert.equal(d1.file,'evidence/turn-gated-dev/attempt-09/rows/414019-train.json');
  assert.ok(Number.isInteger(Number(d1.agentId)));
  assert.deepEqual(d1.weights,d2.weights);
  assert.equal(d1.digest,d2.digest);
  assert.ok(d1.digest.length>=16);
});

test('transplant compatibility: donor weights copy into a fresh founder-1 and run (shape gate)',()=>{
  const history={seed:434001,cueSeed:434002,resourceSeeds:[434003,434004,434005,434006],probeSeeds:{A:434007,B:434008,transfer:434009}};
  const mk=()=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1});
  const donor=mateInformedDonor();
  const run=mk();
  assertFreshTarget(run.learners[1],1);
  copyWeights(donor.weights,{1:run.learners[1]});
  assert.deepEqual(digestWeights({1:snapshotWeights(run.learners)[1]}),donor.digest);
  run.advance(48);
  assert.ok(Number.isFinite(run.endpoint().budgetAdjustedEnergyPerFounder));
  // sham self-copy is bit-identical to no transplant
  const actsOf=(transplant)=>{
    const acts=[];const r2=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1});
    if(transplant){assertFreshTarget(r2.learners[1],1);const s={[1]:snapshotWeights(r2.learners)[1]};copyWeights(s,{1:r2.learners[1]});}
    r2.advance(48);return acts;
  };
  assert.deepEqual(actsOf(true),actsOf(false));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateInformedDevSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-informed-dev.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 434001-434054 spent (rebuild refuses)',()=>{
  // Bank fresh-01 is BUILT (evidence/mate-informed-dev/fresh-01/); the spent-bank
  // guard must now refuse any rebuild touching 434001-434054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (10/10 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-informed-bank-'));
  assert.throws(()=>mateInformedDevBank(join(dir,'protocol.json')),/already used/);
});
