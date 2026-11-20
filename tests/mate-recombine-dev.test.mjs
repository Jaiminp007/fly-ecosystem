// MATE-RECOMBINE V1 fixtures (11/11 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + recombine contrast verdicts + scripted crossover proof (unit-level sync)
// + clone-parents identity + absolute billing (n ops) + bit-identity (JSON)
// + temp-dir bank. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment,syncNewbornLearners} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateRecombineV1Bank,mateRecombineV1Sources,scoreMateRecombineV1Rows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,MR1_NOISE,MR1_ROW_SCHEMA,MR1_ARM_TOPO,MR1_ARM_TX} from '../scripts/mate-recombine-dev.mjs';

// Mirrors the runner's row literal EXACTLY (frozen MR1_ROW_SCHEMA; transmission varies by arm).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:MR1_ARM_TOPO[arm],topology:MR1_ARM_TOPO[arm],sense:1,transmission:MR1_ARM_TX[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MR1_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:{spread:3,hub:1}[MR1_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubRecombine',441001,200,8,3)).sort(),[...MR1_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub',441010,200,8,1)).sort(),[...MR1_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread',441019,260,8,0)).sort(),[...MR1_ROW_SCHEMA].sort());
});

test('scorer GO-V1 on the recombine interaction (hubRecombine >= 2 AND hubRecombine > hub; spread descriptive)',()=>{
  const seeds=[441001,441010,441019,441028,441037,441046];
  const rows=[...seeds.map((s,i)=>mkRow('hubRecombine',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  const v=scoreMateRecombineV1Rows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-RECOMBINE-GO-V1');
  assert.equal(v.hubRecombineGen2,4);
  assert.equal(v.hubGen2,0);
});

test('scorer keys verdict on the recombine pair, not the anchor',()=>{
  const seeds=[441001,441010,441019,441028,441037,441046];
  const flat=[...seeds.map(s=>mkRow('hubRecombine',s,200,8,1)),...seeds.map(s=>mkRow('hub',s,200,8,1)),
    ...seeds.map(s=>mkRow('spread',s,200,8,9))];
  assert.equal(scoreMateRecombineV1Rows(flat).verdict,'MATE-RECOMBINE-NOGO-V1');
  const inv=[...seeds.map(s=>mkRow('hubRecombine',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,200,8,3)),
    ...seeds.map(s=>mkRow('spread',s,200,8,0))];
  assert.equal(scoreMateRecombineV1Rows(inv).verdict,'MATE-RECOMBINE-NOGO-V1');
  const low=[...seeds.map((s,i)=>mkRow('hubRecombine',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  assert.equal(scoreMateRecombineV1Rows(low).verdict,'MATE-RECOMBINE-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when hubRecombine gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[441001,441010,441019,441028,441037,441046];
  const flat=[...seeds.map(s=>mkRow('hubRecombine',s,0,0,0)),...seeds.map(s=>mkRow('hub',s,200,8,2)),
    ...seeds.map(s=>mkRow('spread',s,200,8,3))];
  assert.equal(scoreMateRecombineV1Rows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong transmission, geography',()=>{
  const seeds=[441001,441010,441019,441028,441037,441046];
  const base=[...seeds.map((s,i)=>mkRow('hubRecombine',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,1))];
  assert.equal(scoreMateRecombineV1Rows(base).verdict,'MATE-RECOMBINE-GO-V1');
  const badTx=base.map((r,i)=>i===0?{...r,transmission:'maternal'}:r);
  assert.equal(scoreMateRecombineV1Rows(badTx).verdict,'INVALID');
  const badTx2=base.map((r,i)=>i===6?{...r,transmission:'biparental'}:r);
  assert.equal(scoreMateRecombineV1Rows(badTx2).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===6?{...r,centersCount:3}:r);
  assert.equal(scoreMateRecombineV1Rows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===0?{...r,mode:'spread'}:r);
  assert.equal(scoreMateRecombineV1Rows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===6?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateRecombineV1Rows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateRecombineV1Rows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateRecombineV1Rows(short).verdict,'INVALID');
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
  assert.deepEqual(Object.keys(s.byGeneration).sort(),['1','2']);
  assert.equal(s.gen1,2);
  assert.equal(s.gen2,1);
  const L=meanGen1Lifespan(lineage,1792);
  assert.equal(L.n,2);
  assert.equal(L.censored,1);
});

// Unit-level crossover proof: disjoint-marker parents, per-newborn seeded RNG.
const mkSyncRun=(kids,tx)=>{
  const W=(v,n)=>Array.from({length:n},()=>v);
  const learners={};
  learners[7]={weights:{taste:W(1,11),actor:W(1,16),critic:W(1,16)}};
  learners[8]={weights:{taste:W(2,11),actor:W(2,16),critic:W(2,16)}};
  return {history:{seed:441001},verticalTransmission:tx,transmissionNoise:null,
    founderOffspring:{},arm:'candidate',learnerOptions:{},
    world:{tick:100,flies:kids.map((id,i)=>({id,parents:[7,8],brainSeed:9000+i}))},
    learners};
};

test('scripted crossover proof: disjoint markers mix per-element, deterministic, billed n',()=>{
  const kids=[101,102,103,104,105,106,107,108];
  const run=mkSyncRun(kids,'biparental');
  const created=syncNewbornLearners(run);
  assert.equal(created,kids.length);
  const vecs=kids.map(id=>[...run.learners[id].weights.taste,...run.learners[id].weights.actor,...run.learners[id].weights.critic]);
  for(const v of vecs)for(const x of v)assert.ok(x===1||x===2,'every element comes from one parent');
  assert.ok(new Set(vecs.map(v=>v.join(','))).size>1,'distinct newborns differ (mixing is real)');
  const n1=vecs[0].filter(x=>x===1).length;
  assert.ok(n1>0&&n1<43,'both parents represented (43 elements: 11+16+16)');
  // Determinism: identical rebuild mixes identically.
  const run2=mkSyncRun(kids,'biparental');
  syncNewbornLearners(run2);
  assert.deepEqual(vecs,kids.map(id=>[...run2.learners[id].weights.taste,...run2.learners[id].weights.actor,...run2.learners[id].weights.critic]));
  // Billing: exactly one op per crossed element (96 = 32+16+16), per newborn.
  // Billing: crossover adds exactly 43 (11+16+16) over the maternal baseline (creation + 2 counts identical).
  const runM=mkSyncRun(kids,'maternal');
  syncNewbornLearners(runM);
  for(const id of kids)assert.equal(run.learners[id].work.scalarOperations-runM.learners[id].work.scalarOperations,43);
  void n1;
});

test('fallback + clone identity: p1 missing == maternal; clone parents == maternal copy',()=>{
  // Fallback: parents[1] has no learner -> maternal copy of parents[0], bit-identical path.
  const W=(v,n)=>Array.from({length:n},()=>v);
  const runFb={history:{seed:441001},verticalTransmission:'biparental',transmissionNoise:null,
    founderOffspring:{},arm:'candidate',learnerOptions:{},
    world:{tick:100,flies:[{id:201,parents:[7,999],brainSeed:9001}]},
    learners:{7:{weights:{taste:W(3,11),actor:W(3,16),critic:W(3,16)}}}};
  syncNewbornLearners(runFb);
  assert.deepEqual(runFb.learners[201].weights.taste,W(3,11));
  // Clone parents: biparental == maternal weights exactly (crossover of identicals is copy).
  const mkClone=(tx)=>({history:{seed:441001},verticalTransmission:tx,transmissionNoise:null,
    founderOffspring:{},arm:'candidate',learnerOptions:{},
    world:{tick:100,flies:[{id:301,parents:[7,8],brainSeed:9002}]},
    learners:{7:{weights:{taste:W(5,11),actor:W(5,16),critic:W(5,16)}},
      8:{weights:{taste:W(5,11),actor:W(5,16),critic:W(5,16)}}}});
  const rb=mkClone('biparental');syncNewbornLearners(rb);
  const rm=mkClone('maternal');syncNewbornLearners(rm);
  assert.deepEqual(rb.learners[301].weights,rm.learners[301].weights);
  assert.equal(rb.learners[301].work.scalarOperations-rm.learners[301].work.scalarOperations,43);
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateRecombineV1Sources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-recombine-dev.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 441001-441054 spent (rebuild refuses)',()=>{
  // Bank fresh-01 is BUILT (evidence/mate-recombine-dev/fresh-01/); the spent-bank
  // guard must now refuse any rebuild touching 441001-441054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (11/11 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-recombine-v1-bank-'));
  assert.throws(()=>mateRecombineV1Bank(join(dir,'protocol.json')),/already used/);
});
