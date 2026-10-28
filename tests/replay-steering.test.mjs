import test from 'node:test';
import assert from 'node:assert/strict';
import {createReplaySteering,chooseReplaySteering,terminateReplaySteering,freezeReplaySteering,resetReplaySteering} from '../learning/replay-steering.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const features=[1,0,0,0,0,0,0,0];
const own=(agentId,tick,energy,midpointAvailable=false)=>({agentId,tick,energy,features,midpointAvailable});
test('replays the actual forced action and own factual transition',()=>{
  const state=createReplaySteering(1,123456789);state.weights[1][0]=1;
  const first=chooseReplaySteering(state,own(1,1,10,true),{forcedAction:0});
  assert.equal(first.proposed,1);assert.equal(first.action,0);
  chooseReplaySteering(state,own(1,2,11),{forcedAction:0});
  assert.deepEqual(state.memory[0],{agentId:1,tick:1,action:0,features,nextFeatures:features,available:false,reward:1/120,terminal:false});
  const live=.05/120;
  assert.ok(Math.abs(state.weights[0][0]-(live+.01*(1/120+Math.exp(-1/256)*live-live)))<1e-15);
  assert.equal(state.weights[1][0],1);assert.equal(state.updates,1);assert.equal(state.replayUpdates,1);
  assert.throws(()=>chooseReplaySteering(state,own(2,3,11)));
});
test('terminal credit and freeze do not fabricate transitions',()=>{
  const state=createReplaySteering(1,7);chooseReplaySteering(state,own(1,1,1));
  terminateReplaySteering(state,{agentId:1,tick:1,energy:0});
  assert.equal(state.memory[0].reward,-1/120);assert.equal(state.memory[0].terminal,true);assert.equal(state.memory[0].nextFeatures,null);
  assert.throws(()=>terminateReplaySteering(state,{agentId:1,tick:1,energy:0}));
  const frozen=createReplaySteering(2,8);chooseReplaySteering(frozen,own(2,1,1));freezeReplaySteering(frozen);
  chooseReplaySteering(frozen,own(2,2,2));assert.equal(frozen.memory.length,0);assert.equal(frozen.pending,null);
});
test('reservoir remains bounded, serializes exactly and is chargeable state',()=>{
  const state=createReplaySteering(1,42),initial=encodedStateBytes(state);
  for(let tick=1;tick<=50;tick++)chooseReplaySteering(state,own(1,tick,10+tick/10));
  assert.equal(state.memory.length,32);assert.equal(state.seen,49);assert.equal(state.replayUpdates,49);
  assert.ok(encodedStateBytes(state)>initial);assert.ok(state.work.scalarOperations>0);
  const restored=JSON.parse(JSON.stringify(state));
  assert.deepEqual(chooseReplaySteering(state,own(1,51,15.1)),chooseReplaySteering(restored,own(1,51,15.1)));
  assert.deepEqual(state,restored);
  resetReplaySteering(state);assert.equal(state.memory.length,0);assert.equal(state.seen,0);assert.ok(state.weights.every(row=>row.every(value=>value===0)));
});
test('declared operation increments include live and replay updates',()=>{
  const state=createReplaySteering(1,11);
  chooseReplaySteering(state,own(1,1,10));assert.equal(state.work.scalarOperations,49);
  chooseReplaySteering(state,own(1,2,11));assert.equal(state.work.scalarOperations,49+296);
  terminateReplaySteering(state,{agentId:1,tick:2,energy:0});assert.equal(state.work.scalarOperations,49+296+207);
});
