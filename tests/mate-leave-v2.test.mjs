// MATE-LEAVE V2 fixtures (12/12 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + leave dose verdicts + scripted sign ladder (0.76/0/-0.96) + leave-gate proof
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
import {mateLeaveV2Bank,mateLeaveV2Sources,scoreMateLeaveV2Rows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,ML2_NOISE,ML2_ROW_SCHEMA,ML2_ARM_TOPO,ML2_ARM_LEAVE,ML2_ARM_LGATE} from '../scripts/mate-leave-v2.mjs';

// Mirrors the runner's row literal EXACTLY (frozen ML2_ROW_SCHEMA; no verticalTransmission/mateBias field).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:ML2_ARM_TOPO[arm],topology:ML2_ARM_TOPO[arm],sense:1,leave:ML2_ARM_LEAVE[arm],lgate:ML2_ARM_LGATE[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:ML2_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:{spread:3,hub:1}[ML2_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubLeave2',440001,200,8,3)).sort(),[...ML2_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub',440010,200,8,1)).sort(),[...ML2_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread',440019,260,8,0)).sort(),[...ML2_ROW_SCHEMA].sort());
});

test('scorer GO-V2 on the leave dose (hubLeave2 >= 2 replicates AND weak-monotone hub<=L1<=L2<=L4, L4 > hub)',()=>{
  const seeds=[440001,440010,440019,440028,440037,440046];
  const rows=[...seeds.map((s,i)=>mkRow('hubLeave1',s,200,8,i<2?1:0)),
    ...seeds.map((s,i)=>mkRow('hubLeave2',s,200,8,i<2?2:0)),
    ...seeds.map((s,i)=>mkRow('hubLeave4',s,200,8,i<4?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  const v=scoreMateLeaveV2Rows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-LEAVE-GO-V2');
  assert.equal(v.hubLeave2Gen2,4);
  assert.equal(v.hubGen2,0);
});

test('scorer keys verdict on replication + monotonicity, not the anchor',()=>{
  const seeds=[440001,440010,440019,440028,440037,440046];
  const mk=(l1,l2,l4,h)=>[...seeds.map((s,i)=>mkRow('hubLeave1',s,200,8,i<l1?1:0)),
    ...seeds.map((s,i)=>mkRow('hubLeave2',s,200,8,i<l2?1:0)),
    ...seeds.map((s,i)=>mkRow('hubLeave4',s,200,8,i<l4?1:0)),
    ...seeds.map((s,i)=>mkRow('hub',s,200,8,i<h?1:0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,9))];
  assert.equal(scoreMateLeaveV2Rows(mk(2,4,6,0)).verdict,'MATE-LEAVE-GO-V2');
  const flat=mk(2,2,2,2);
  assert.equal(scoreMateLeaveV2Rows(flat).verdict,'MATE-LEAVE-NOGO-V2');
  const noRep=mk(4,1,6,0);
  assert.equal(scoreMateLeaveV2Rows(noRep).verdict,'MATE-LEAVE-NOGO-V2');
  const nonMono=mk(4,2,6,0);
  assert.equal(scoreMateLeaveV2Rows(nonMono).verdict,'MATE-LEAVE-NOGO-V2');
  const inv=mk(0,0,0,3);
  assert.equal(scoreMateLeaveV2Rows(inv).verdict,'MATE-LEAVE-NOGO-V2');
  const low=mk(1,1,1,0);
  assert.equal(scoreMateLeaveV2Rows(low).verdict,'MATE-LEAVE-NOGO-V2');
});

test('scorer INCOMPLETE-NOBIRTHS when hubLeave2 gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[440001,440010,440019,440028,440037,440046];
  const flat=[...seeds.map(s=>mkRow('hubLeave1',s,200,8,1)),
    ...seeds.map(s=>mkRow('hubLeave2',s,0,0,0)),
    ...seeds.map(s=>mkRow('hubLeave4',s,200,8,1)),
    ...seeds.map(s=>mkRow('hub',s,200,8,2)),
    ...seeds.map(s=>mkRow('spread',s,200,8,3))];
  assert.equal(scoreMateLeaveV2Rows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong leave bias, lgate, geography',()=>{
  const seeds=[440001,440010,440019,440028,440037,440046];
  const base=[...seeds.map((s,i)=>mkRow('hubLeave1',s,200,8,i<2?1:0)),
    ...seeds.map((s,i)=>mkRow('hubLeave2',s,200,8,i<2?2:0)),
    ...seeds.map((s,i)=>mkRow('hubLeave4',s,200,8,i<4?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,1))];
  assert.equal(scoreMateLeaveV2Rows(base).verdict,'MATE-LEAVE-GO-V2');
  const badLeave=base.map((r,i)=>i===0?{...r,leave:0}:r);
  assert.equal(scoreMateLeaveV2Rows(badLeave).verdict,'INVALID');
  const badGate=base.map((r,i)=>i===6?{...r,lgate:null}:r);
  assert.equal(scoreMateLeaveV2Rows(badGate).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===12?{...r,centersCount:3}:r);
  assert.equal(scoreMateLeaveV2Rows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===0?{...r,mode:'spread'}:r);
  assert.equal(scoreMateLeaveV2Rows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===18?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateLeaveV2Rows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateLeaveV2Rows(badGen).verdict,'INVALID');
  const short=base.slice(0,29);
  assert.equal(scoreMateLeaveV2Rows(short).verdict,'INVALID');
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

test('scripted sign ladder: k=1 weakens, k=2 cancels, k=4 reverses (monotone mechanism)',()=>{
  // Food directly RIGHT: raw[2]=1 (right), raw[1]=0. Losing + poor (gate open for all).
  const rawPoor=[0,0,1,0.5,0.1,0,0,0,0,0, 0,0,0,-0.5,0,0,1];
  const t1=motorPrimitive(rawPoor,1,false,0,-Infinity,1,50/120);
  assert.ok(t1[0]>0.3,'k_L=1 must still follow food (weakened: tanh(1)=0.76)');
  const t2=motorPrimitive(rawPoor,1,false,0,-Infinity,2,50/120);
  assert.equal(t2[0],0,'k_L=2 must cancel the food turn exactly ((2-2)xdiff=0)');
  const t4=motorPrimitive(rawPoor,1,false,0,-Infinity,4,50/120);
  assert.ok(t4[0]<-0.3,'k_L=4 must reverse away from food (tanh(-2)=-0.96)');
  // k_L=0 ignores leave state (null default).
  const t0=motorPrimitive(rawPoor,1,false,0,-Infinity,0,50/120);
  assert.ok(t0[0]>0.3,'k_L=0 must follow food even when losing and poor');
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
  const history={seed:440001,cueSeed:440002,resourceSeeds:[440003,440004,440005,440006],probeSeeds:{A:440007,B:440008,transfer:440009}};
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
  const s=mateLeaveV2Sources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-leave-v2.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 440001-440054 spent (rebuild refuses)',()=>{
  // Bank fresh-02 is BUILT (evidence/mate-leave-dev/fresh-02/); the spent-bank
  // guard must now refuse any rebuild touching 440001-440054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (12/12 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-leave-v2-bank-'));
  assert.throws(()=>mateLeaveV2Bank(join(dir,'protocol.json')),/already used/);
});
