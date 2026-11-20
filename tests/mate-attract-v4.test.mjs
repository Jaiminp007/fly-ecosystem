// MATE-ATTRACT V4 fixtures (12/12 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + interaction contrast verdicts + scripted steering proof + gated-taxis proof
// + bit-identity (JSON-normalized) + absolute billing (12/15, incl. gate states)
// + temp-dir bank. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {motorPrimitive} from '../learning/cue-foraging.mjs';
import {tickMotor} from '../learning/tick-actor-critic.mjs';
import {mateAttractV4Bank,mateAttractV4Sources,scoreMateAttractV4Rows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,AT4_NOISE,AT4_ROW_SCHEMA,AT4_ARM_TOPO,AT4_ARM_BIAS,AT4_ARM_GATE} from '../scripts/mate-attract-v4.mjs';

// Mirrors the runner's row literal EXACTLY (frozen AT4_ROW_SCHEMA; no verticalTransmission field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:AT4_ARM_TOPO[arm],topology:AT4_ARM_TOPO[arm],sense:1,bias:AT4_ARM_BIAS[arm],gate:AT4_ARM_GATE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:AT4_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:{spread:3,hub:1}[AT4_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubAttract',438001,200,8,3)).sort(),[...AT4_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub',438010,200,8,1)).sort(),[...AT4_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread',438019,260,8,0)).sort(),[...AT4_ROW_SCHEMA].sort());
});

test('scorer GO-V4 on the gated hub interaction (hubAttract >= 2 AND hubAttract > hub; spread descriptive)',()=>{
  const seeds=[438001,438010,438019,438028,438037,438046];
  const rows=[...seeds.map((s,i)=>mkRow('hubAttract',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  const v=scoreMateAttractV4Rows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-ATTRACT-GO-V4');
  assert.equal(v.hubAttractGen2,4);
  assert.equal(v.hubGen2,0);
});

test('scorer keys verdict on the gated pair, not the anchor',()=>{
  const seeds=[438001,438010,438019,438028,438037,438046];
  const flat=[...seeds.map(s=>mkRow('hubAttract',s,200,8,1)),...seeds.map(s=>mkRow('hub',s,200,8,1)),
    ...seeds.map(s=>mkRow('spread',s,200,8,9))];
  assert.equal(scoreMateAttractV4Rows(flat).verdict,'MATE-ATTRACT-NOGO-V4');
  const inv=[...seeds.map(s=>mkRow('hubAttract',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,200,8,3)),
    ...seeds.map(s=>mkRow('spread',s,200,8,0))];
  assert.equal(scoreMateAttractV4Rows(inv).verdict,'MATE-ATTRACT-NOGO-V4');
  const low=[...seeds.map((s,i)=>mkRow('hubAttract',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  assert.equal(scoreMateAttractV4Rows(low).verdict,'MATE-ATTRACT-NOGO-V4');
});

test('scorer INCOMPLETE-NOBIRTHS when hubAttract gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[438001,438010,438019,438028,438037,438046];
  const flat=[...seeds.map(s=>mkRow('hubAttract',s,0,0,0)),...seeds.map(s=>mkRow('hub',s,200,8,2)),
    ...seeds.map(s=>mkRow('spread',s,200,8,3))];
  assert.equal(scoreMateAttractV4Rows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong gate, bias, geography',()=>{
  const seeds=[438001,438010,438019,438028,438037,438046];
  const base=[...seeds.map((s,i)=>mkRow('hubAttract',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,1))];
  assert.equal(scoreMateAttractV4Rows(base).verdict,'MATE-ATTRACT-GO-V4');
  const badGate=base.map((r,i)=>i===0?{...r,gate:null}:r);
  assert.equal(scoreMateAttractV4Rows(badGate).verdict,'INVALID');
  const badBias=base.map((r,i)=>i===0?{...r,bias:0}:r);
  assert.equal(scoreMateAttractV4Rows(badBias).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===6?{...r,centersCount:3}:r);
  assert.equal(scoreMateAttractV4Rows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===0?{...r,mode:'spread'}:r);
  assert.equal(scoreMateAttractV4Rows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===6?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateAttractV4Rows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateAttractV4Rows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateAttractV4Rows(short).verdict,'INVALID');
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

test('scripted steering proof: k=2 turns toward a lateral mate, k=0 ignores (sign verified)',()=>{
  // Mate directly to the RIGHT: raw[8]=1 (right), raw[7]=0. Food/walls zeroed.
  const rawRight=[0,0,0,0,0.5,0,0,0,1,0, 0,0,0,0,0,0,0];
  const t2=motorPrimitive(rawRight,1,false,2);
  const t0=motorPrimitive(rawRight,1,false,0);
  assert.ok(t2[0]>0.3,'k=2 must turn substantially toward a right-side mate');
  assert.equal(t0[0],0,'k=0 must not turn without food/walls');
  // Mate to the LEFT: mirror.
  const rawLeft=[0,0,0,0,0.5,0,0,1,0,0, 0,0,0,0,0,0,0];
  const t2L=motorPrimitive(rawLeft,1,false,2);
  assert.ok(t2L[0]<-0.3,'k=2 must turn substantially toward a left-side mate');
  // Avoidance branch: negated mate pull (turn away).
  const t2a=motorPrimitive(rawRight,-1,false,2);
  assert.ok(t2a[0]<0,'avoidance must turn away from the mate side');
  // Absolute billing: approach 12, avoidance 15 (V2 +3 mate ops, V4 +1 gate mul, ML1 +2 leave muls, unconditional).
  // tickMotor bills exactly these counts on a minimal state (runner call-shape mirror).
  const s1={work:{scalarOperations:0}};tickMotor(s1,[0,0,0,0,0.5,0,0,0,1,0,0,0,0,0,0,0,0],0);
  assert.equal(s1.work.scalarOperations,12);
  const s2={work:{scalarOperations:0}};tickMotor(s2,[0,0,0,0,0.5,0,0,1,0,0,0,0,0,0,0,0,0],1);
  assert.equal(s2.work.scalarOperations,15);
});

test('scripted gate proof: low energy cruises, high energy orients (gate opens at bar)',()=>{
  // Mate right, energy LOW (raw[4]=0.1 < 50/120): gate closed -> no turn despite k=2.
  const rawLow=[0,0,0,0,0.1,0,0,0,1,0, 0,0,0,0,0,0,0];
  const tLow=motorPrimitive(rawLow,1,false,2,50/120);
  assert.equal(tLow[0],0,'gated-off k=2 must not turn (energy below bar)');
  // Same geometry, energy HIGH (raw[4]=0.9): gate open -> turns like ungated k=2.
  const rawHigh=[0,0,0,0,0.9,0,0,0,1,0, 0,0,0,0,0,0,0];
  const tHigh=motorPrimitive(rawHigh,1,false,2,50/120);
  assert.ok(tHigh[0]>0.3,'gated-on k=2 must turn toward the mate');
  // Default (no gate arg) equals explicit gated-on: null-default opens the gate.
  const tDef=motorPrimitive(rawHigh,1,false,2);
  assert.deepEqual(JSON.parse(JSON.stringify(tDef)),JSON.parse(JSON.stringify(tHigh)),'omitted gate must behave as always-open');
  // Billing identical whether gate opens or not (symmetric billing).
  const g1={work:{scalarOperations:0}};tickMotor(g1,rawLow,0,2,50/120);
  const g2={work:{scalarOperations:0}};tickMotor(g2,rawHigh,0,2,50/120);
  assert.equal(g1.work.scalarOperations,12);
  assert.equal(g2.work.scalarOperations,12);
});

test('JSON-normalized bit-identity: no-flag run == explicit k=0 run (k=2 differs only via behavior)',()=>{
  const history={seed:438001,cueSeed:438002,resourceSeeds:[438003,438004,438005,438006],probeSeeds:{A:438007,B:438008,transfer:438009}};
  const mkActs=(extra)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'spread',mateSenseMultiplier:1,...extra});run.advance(48);return {acts,run};};
  const base=mkActs({});
  const zero=mkActs({mateAttractBias:0});
  const norm=o=>JSON.parse(JSON.stringify(o));
  assert.deepEqual(norm(zero.acts),norm(base.acts));
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(zero),ops(base));
  // k=2 runs without crashing and bills identically-structured ops (same code path)
  const two=mkActs({mateAttractBias:2});
  assert.ok(Number.isFinite(two.run.endpoint().budgetAdjustedEnergyPerFounder));
  assert.ok(ops(two)>0);
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateAttractV4Sources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-attract-v4.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 438001-438054 spent (rebuild refuses)',()=>{
  // Bank fresh-05 is BUILT (evidence/mate-attract-dev/fresh-05/); the spent-bank
  // guard must now refuse any rebuild touching 438001-438054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (13/13 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-attract-v4-bank-'));
  assert.throws(()=>mateAttractV4Bank(join(dir,'protocol.json')),/already used/);
});

test('checkpoint/restore preserves gated taxis (JSON-unsafe -Infinity recomputed)',()=>{
  const history={seed:438001,cueSeed:438002,resourceSeeds:[438003,438004,438005,438006],probeSeeds:{A:438007,B:438008,transfer:438009}};
  const mk=(extra)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1,mateAttractBias:2,mateAttractEnergyGate:50,...extra});
  const a=mk({});a.advance(48);
  const b=TasteExperiment.restore(a.checkpoint());
  assert.equal(b.mateAttractGateThr,50/120,'restored gate threshold must equal bar/120, not JSON null');
  a.advance(32);b.advance(32);
  assert.deepEqual(b.checkpoint(),a.checkpoint());
});
