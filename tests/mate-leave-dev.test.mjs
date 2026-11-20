// MATE-LEAVE V1 fixtures (12/12 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + leave contrast verdicts + scripted steering proof + leave-gate proof
// + bit-identity (JSON-normalized) + absolute billing (12/15, incl. leave states)
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
import {mateLeaveV1Bank,mateLeaveV1Sources,scoreMateLeaveV1Rows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,ML1_NOISE,ML1_ROW_SCHEMA,ML1_ARM_TOPO,ML1_ARM_LEAVE,ML1_ARM_LGATE} from '../scripts/mate-leave-dev.mjs';

// Mirrors the runner's row literal EXACTLY (frozen ML1_ROW_SCHEMA; no verticalTransmission/mateBias field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:ML1_ARM_TOPO[arm],topology:ML1_ARM_TOPO[arm],sense:1,leave:ML1_ARM_LEAVE[arm],lgate:ML1_ARM_LGATE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:ML1_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:{spread:3,hub:1}[ML1_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubLeave',439001,200,8,3)).sort(),[...ML1_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub',439010,200,8,1)).sort(),[...ML1_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread',439019,260,8,0)).sort(),[...ML1_ROW_SCHEMA].sort());
});

test('scorer GO-V1 on the leave interaction (hubLeave >= 2 AND hubLeave > hub; spread descriptive)',()=>{
  const seeds=[439001,439010,439019,439028,439037,439046];
  const rows=[...seeds.map((s,i)=>mkRow('hubLeave',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  const v=scoreMateLeaveV1Rows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-LEAVE-GO-V1');
  assert.equal(v.hubLeaveGen2,4);
  assert.equal(v.hubGen2,0);
});

test('scorer keys verdict on the leave pair, not the anchor',()=>{
  const seeds=[439001,439010,439019,439028,439037,439046];
  const flat=[...seeds.map(s=>mkRow('hubLeave',s,200,8,1)),...seeds.map(s=>mkRow('hub',s,200,8,1)),
    ...seeds.map(s=>mkRow('spread',s,200,8,9))];
  assert.equal(scoreMateLeaveV1Rows(flat).verdict,'MATE-LEAVE-NOGO-V1');
  const inv=[...seeds.map(s=>mkRow('hubLeave',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,200,8,3)),
    ...seeds.map(s=>mkRow('spread',s,200,8,0))];
  assert.equal(scoreMateLeaveV1Rows(inv).verdict,'MATE-LEAVE-NOGO-V1');
  const low=[...seeds.map((s,i)=>mkRow('hubLeave',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  assert.equal(scoreMateLeaveV1Rows(low).verdict,'MATE-LEAVE-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when hubLeave gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[439001,439010,439019,439028,439037,439046];
  const flat=[...seeds.map(s=>mkRow('hubLeave',s,0,0,0)),...seeds.map(s=>mkRow('hub',s,200,8,2)),
    ...seeds.map(s=>mkRow('spread',s,200,8,3))];
  assert.equal(scoreMateLeaveV1Rows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong leave bias, lgate, geography',()=>{
  const seeds=[439001,439010,439019,439028,439037,439046];
  const base=[...seeds.map((s,i)=>mkRow('hubLeave',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,1))];
  assert.equal(scoreMateLeaveV1Rows(base).verdict,'MATE-LEAVE-GO-V1');
  const badLeave=base.map((r,i)=>i===0?{...r,leave:0}:r);
  assert.equal(scoreMateLeaveV1Rows(badLeave).verdict,'INVALID');
  const badGate=base.map((r,i)=>i===0?{...r,lgate:null}:r);
  assert.equal(scoreMateLeaveV1Rows(badGate).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===6?{...r,centersCount:3}:r);
  assert.equal(scoreMateLeaveV1Rows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===0?{...r,mode:'spread'}:r);
  assert.equal(scoreMateLeaveV1Rows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===6?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateLeaveV1Rows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateLeaveV1Rows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateLeaveV1Rows(short).verdict,'INVALID');
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

test('scripted steering proof: fed k_L=2 follows food; k_L=0 ignores leave state (sign verified)',()=>{
  // Food directly RIGHT: raw[2]=1 (right), raw[1]=0. Fed + winning.
  const rawFed=[0,0,1,0.5,0.9,0,0,0,0,0, 0,0,0,0.5,0,0,1];
  const t2=motorPrimitive(rawFed,1,false,0,-Infinity,2,50/120);
  assert.ok(t2[0]>0.3,'fed k_L=2 must follow the food gradient (no leave: winning)');
  // Losing + poor but k_L=0: still follows food (leave knob off ignores state).
  const rawPoor=[0,0,1,0.5,0.1,0,0,0,0,0, 0,0,0,-0.5,0,0,1];
  const t0=motorPrimitive(rawPoor,1,false,0,-Infinity,0,50/120);
  assert.ok(t0[0]>0.3,'k_L=0 must follow food even when losing and poor (null default)');
  // Mirror: food LEFT.
  const rawLeft=[0,1,0,0.5,0.9,0,0,0,0,0, 0,0,0,0.5,0,0,1];
  const t2L=motorPrimitive(rawLeft,1,false,0,-Infinity,2,50/120);
  assert.ok(t2L[0]<-0.3,'fed k_L=2 must turn toward left-side food');
  // Absolute billing: approach 12, avoidance 15 (ML1 +2 leave muls, unconditional).
  // tickMotor bills exactly these counts on a minimal state (runner call-shape mirror).
  const s1={work:{scalarOperations:0}};tickMotor(s1,[0,0,0,0,0.5,0,0,0,1,0,0,0,0,0,0,0,0],0);
  assert.equal(s1.work.scalarOperations,12);
  const s2={work:{scalarOperations:0}};tickMotor(s2,[0,0,0,0,0.5,0,0,1,0,0,0,0,0,0,0,0,0],1);
  assert.equal(s2.work.scalarOperations,15);
});

test('scripted leave-gate proof: losing+poor cancels, either condition alone follows (AND verified)',()=>{
  // Food RIGHT, losing + poor (lastFood -0.5 < 0, energy 0.1 < 50/120): gate opens -> food turn EXACTLY cancelled.
  const rawLP=[0,0,1,0.5,0.1,0,0,0,0,0, 0,0,0,-0.5,0,0,1];
  const tLP=motorPrimitive(rawLP,1,false,0,-Infinity,2,50/120);
  assert.equal(tLP[0],0,'losing+poor k_L=2 must cancel the food turn exactly (k_L=2 parity: (2-2)xdiff=0)');
  // Losing + RICH (energy 0.9): gate shut (needs BOTH) -> follows food.
  const rawLR=[0,0,1,0.5,0.9,0,0,0,0,0, 0,0,0,-0.5,0,0,1];
  const tLR=motorPrimitive(rawLR,1,false,0,-Infinity,2,50/120);
  assert.ok(tLR[0]>0.3,'losing+rich k_L=2 must follow food (energy prong fails -> no leave)');
  // Winning + POOR (lastFood +0.5): gate shut -> follows food.
  const rawWP=[0,0,1,0.5,0.1,0,0,0,0,0, 0,0,0,0.5,0,0,1];
  const tWP=motorPrimitive(rawWP,1,false,0,-Infinity,2,50/120);
  assert.ok(tWP[0]>0.3,'winning+poor k_L=2 must follow food (intake prong fails -> no leave)');
  // Default (no leave args) equals explicit zeros: null-default preserves behavior exactly.
  const tDef=motorPrimitive(rawLP,1,false);
  assert.deepEqual(JSON.parse(JSON.stringify(tDef)),JSON.parse(JSON.stringify(motorPrimitive(rawLP,1,false,0,-Infinity,0,-Infinity))),'omitted leave args must behave as k_L=0/thr=-Inf');
  // Billing identical whether gate opens or not (symmetric billing).
  const g1={work:{scalarOperations:0}};tickMotor(g1,rawLP,0,0,-Infinity,2,50/120);
  const g2={work:{scalarOperations:0}};tickMotor(g2,rawLR,0,0,-Infinity,2,50/120);
  assert.equal(g1.work.scalarOperations,12);
  assert.equal(g2.work.scalarOperations,12);
});

test('JSON-normalized bit-identity: no-flag run == explicit k_L=0 run (k_L=2 differs only via behavior)',()=>{
  const history={seed:439001,cueSeed:439002,resourceSeeds:[439003,439004,439005,439006],probeSeeds:{A:439007,B:439008,transfer:439009}};
  const mkActs=(extra)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'spread',mateSenseMultiplier:1,...extra});run.advance(48);return {acts,run};};
  const base=mkActs({});
  const zero=mkActs({mateLeaveBias:0});
  const norm=o=>JSON.parse(JSON.stringify(o));
  assert.deepEqual(norm(zero.acts),norm(base.acts));
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(zero),ops(base));
  // k_L=2 runs without crashing and bills identically-structured ops (same code path)
  const two=mkActs({mateLeaveBias:2,mateLeaveGate:50});
  assert.ok(Number.isFinite(two.run.endpoint().budgetAdjustedEnergyPerFounder));
  assert.ok(ops(two)>0);
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateLeaveV1Sources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-leave-dev.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 439001-439054 spent (rebuild refuses)',()=>{
  // Bank fresh-01 is BUILT (evidence/mate-leave-dev/fresh-01/); the spent-bank
  // guard must now refuse any rebuild touching 439001-439054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (12/12 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-leave-v1-bank-'));
  assert.throws(()=>mateLeaveV1Bank(join(dir,'protocol.json')),/already used/);
});
