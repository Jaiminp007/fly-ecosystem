import test from 'node:test';
import assert from 'node:assert/strict';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';
import {chargeForStep,billSarsaWork,encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {createValueBody,valueFeatures,valuePrediction,chooseValueAction,observeValueBody,freezeValueBody,resetValueBody,restoreValueBody} from '../learning/tick-value.mjs';
const pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)};
const sensory=(cue=[0,0,0,0])=>{const raw=Array(17).fill(0);raw[16]=1;return {raw,observation:cueObservation(raw,cue)};};
const own=(tick,energy=50,cue=[0,0,0,0])=>({agentId:1,tick,energy,...sensory(cue)});
const observe=(state,tick,energy=50,terminal=false,emit=()=>{})=>observeValueBody(state,{agentId:1,tick,energy,terminal},emit);
const json=value=>JSON.parse(JSON.stringify(value));
test('features use only current and previous own base/action, normalize and meter their actual arithmetic',()=>{
  const state=createValueBody(1,1),s=sensory([1,-1,1,-1]),before=state.work.scalarOperations;
  const first=valueFeatures(state,s.raw,s.observation);
  assert.equal(first.phi.length,71);assert.equal(state.work.scalarOperations-before,236);
  assert.ok(Math.abs(first.phi.reduce((n,v)=>n+v*v,0)-1)<1e-12);
  assert.ok(first.phi.slice(33).every(v=>v===0));
  state.previous={inputs:first.base,action:2,tick:1};const operations=state.work.scalarOperations;
  const second=valueFeatures(state,s.raw,s.observation);assert.equal(state.work.scalarOperations-operations,273);
  assert.ok(second.phi[68]>0 && second.phi[70]>0);assert.equal(second.phi[66],0);
  const bad={...s,raw:[...s.raw]};bad.raw[4]=2;assert.throws(()=>valueFeatures(state,bad.raw,s.observation));
  assert.throws(()=>createValueBody(1,1,{rate:.1}));assert.throws(()=>createValueBody(1,1,{lambda:.5}));
});
test('nominal probabilities give uniform exact ties and epsilon-greedy ranks without a fixed-index prior',()=>{
  const state=createValueBody(1,7),phi=Array(71).fill(0);phi[0]=1;
  const before=state.work.scalarOperations;assert.deepEqual(valuePrediction(state,phi),{values:[0,0,0,0],probabilities:[.25,.25,.25,.25]});
  assert.equal(state.work.scalarOperations-before,587);
  state.weights[2][0]=.1;const operations=state.work.scalarOperations;
  assert.deepEqual(valuePrediction(state,phi).probabilities,[.025,.025,.925,.025]);assert.equal(state.work.scalarOperations-operations,581);
  state.weights[0][0]=.1;assert.deepEqual(valuePrediction(state,phi).probabilities,[.025+.9/2,.025,.025+.9/2,.025]);
});
test('one factual transition has the declared pre-update target, online trace and fresh replay arithmetic',()=>{
  const state=createValueBody(1,17),action=chooseValueAction(state,own(1));observe(state,1,49);
  const rows=[];chooseValueAction(state,own(2,49),row=>rows.push(row));
  const reward=-1/120,live=.05*reward,nextValue=.025*live/Math.sqrt(2.5),replayTarget=reward+.99*nextValue,
    replayDelta=replayTarget-live,expected=live+.01*replayDelta;
  assert.equal(rows.length,1);assert.equal(rows[0].prediction,0);assert.equal(rows[0].nextValue,0);assert.equal(rows[0].delta,reward);
  assert.ok(Math.abs(rows[0].replay.nextValue-nextValue)<1e-15);assert.ok(Math.abs(state.weights[action][16]-expected)<1e-15);
  assert.equal(state.eligibility[action][16],1);assert.equal(state.recent[0].experience,1);assert.equal(state.recent[0].duration,1);
  assert.equal(state.work.replayUpdates,1);assert.equal(state.work.liveUpdates,1);
  for(let a=0;a<4;a++)for(let j=0;j<71;j++)if(a!==action||j!==16)assert.equal(state.weights[a][j],0);
});
test('frozen choices use one private RNG draw each, maintain own history and never acquire/replay',()=>{
  const state=createValueBody(1,111),streams=[state.retentionRngState,state.replayRngState];freezeValueBody(state);let rng=111;
  for(let tick=1;tick<=30;tick++){rng=advanceRng(rng);assert.equal(chooseValueAction(state,own(tick)),Math.floor(rng/4294967296*4));observe(state,tick);}
  assert.equal(state.rngState,rng);assert.deepEqual([state.retentionRngState,state.replayRngState],streams);
  assert.equal(state.transitions,0);assert.equal(state.recent.length,0);assert.equal(state.previous.tick,30);assert.equal(state.pending,null);
});
test('live and replay arithmetic enforces the disclosed finite parameter bound when a positive update would exceed it',()=>{
  const state=createValueBody(1,141);for(const row of state.weights)row.fill(4);
  const action=chooseValueAction(state,own(1,50));observe(state,1,51);const rows=[];chooseValueAction(state,own(2,51),r=>rows.push(r));
  assert.ok(rows[0].delta>0&&rows[0].replay.delta>0);assert.equal(state.weights[action][16],4);
  assert.ok(state.weights.flat().every(v=>Number.isFinite(v)&&Math.abs(v)<=4));
});
function step(state,tick,terminal=false,attack=false){
  const cue=tick%2?[1,-1,1,-1]:[-1,1,-1,1],rows=[];
  chooseValueAction(state,own(tick,50-tick/100,cue),row=>{rows.push(row);if(attack){row.record.phi.fill(1e30);row.replay.delta=1e30;}});
  const bill=chargeForStep(state,pricing);bill.afterEnergyCharge({paid:bill.energyCost/2});
  observe(state,tick,terminal?-state.charge.outstandingEnergy:50-tick/100,terminal,row=>rows.push(row));
  if(terminal)billSarsaWork(state,pricing);return rows;
}
test('bounded reservoir owns only completed records; all streams, traces, bills and continuation round-trip exactly',()=>{
  const state=createValueBody(1,73);for(let tick=1;tick<=70;tick++)step(state,tick);
  assert.equal(state.recent.length,16);assert.equal(state.older.length,48);assert.equal(state.olderSeen,53);
  assert.notEqual(state.retentionRngState,(73^0x9e3779b9)>>>0);assert.ok(encodedStateBytes(state)>60000);
  const twin=restoreValueBody(json(state));
  for(let tick=71;tick<=85;tick++){assert.deepEqual(step(state,tick,tick===85),step(twin,tick,tick===85));assert.deepEqual(state,twin);}
  assert.equal(state.dead,true);assert.equal(state.transitions,state.decisions);assert.ok(state.charge.outstandingEnergy>0);
  assert.equal(state.pending,null);assert.ok(state.eligibility.flat().every(v=>v===0));assert.deepEqual(restoreValueBody(json(state)),state);
  const ids=[...state.recent,...state.older].map(r=>r.experience);assert.equal(new Set(ids).size,64);
});
test('reset/freeze preserve debts and lifetime streams; reset clears acquired memory and can continue without rewinding serials',()=>{
  const state=createValueBody(1,91);for(let tick=1;tick<=20;tick++)step(state,tick);
  const before=json(state);resetValueBody(state);
  for(const key of ['rngState','retentionRngState','replayRngState','decisions','transitions','work','charge'])assert.deepEqual(state[key],before[key]);
  assert.equal(state.previous,null);assert.equal(state.acquiredTransitions,0);assert.equal(state.olderSeen,0);assert.equal(state.recent.length,0);
  step(state,21);step(state,22);assert.equal(state.recent[0].experience,20);assert.deepEqual(restoreValueBody(json(state)),state);
  freezeValueBody(state);assert.equal(state.acquisition,false);assert.equal(state.pending,null);assert.ok(state.eligibility.flat().every(v=>v===0));
  const learned=json(state.weights);step(state,23);assert.deepEqual(state.weights,learned);
});
test('terminal-first, mid-choice restoration, observer mutation and lifecycle misuse preserve the body contract',()=>{
  const state=createValueBody(1,127);chooseValueAction(state,own(1));const twin=restoreValueBody(json(state));
  observe(state,1,-.001,true);observe(twin,1,-.001,true);assert.deepEqual(state,twin);
  assert.equal(state.recent[0].terminal,true);assert.ok(state.recent[0].nextPhi.every(v=>v===0));
  assert.throws(()=>chooseValueAction(state,own(2)));assert.throws(()=>observe(state,1));
  const normal=createValueBody(1,133),attacked=createValueBody(1,133);
  for(let tick=1;tick<=4;tick++){step(normal,tick);step(attacked,tick,false,true);}assert.deepEqual(attacked,normal);
  const wrong=createValueBody(1,1);assert.throws(()=>chooseValueAction(wrong,{...own(1),agentId:2}));assert.throws(()=>chooseValueAction(wrong,own(2)));
});
test('restoration rejects foreign/missing records, duplicate serials, malformed vectors and inconsistent costs',()=>{
  const state=createValueBody(1,211);for(let tick=1;tick<=72;tick++)step(state,tick);
  for(const mutate of [s=>{s.recent[0].agentId=2;},s=>{s.recent.pop();},s=>{s.older[0].experience=s.recent[0].experience;},
    s=>{s.weights[0][0]=5;},s=>{s.recent[0].reward=1;},s=>{s.pending.phi[0]=2;},s=>{s.charge.outstandingEnergy=1;},
    s=>{s.work.replayUpdates--;},s=>{s.retentionRngState=0;},s=>{s.secretTask='A';}]){
    const copy=json(state);mutate(copy);assert.throws(()=>restoreValueBody(copy));
  }
});
