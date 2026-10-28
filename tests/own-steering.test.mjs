import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnSteering,chooseOwnSteering,terminateOwnSteering,freezeOwnSteering} from '../learning/own-steering.mjs';

const features=[1,0,0,0,0,0,0,0];
test('updates only the selected action from its own next energy',()=>{
  const state=createOwnSteering(1,123),choice=chooseOwnSteering(state,{agentId:1,tick:1,energy:10,features,midpointAvailable:false});
  assert.equal(choice.action,0);
  chooseOwnSteering(state,{agentId:1,tick:2,energy:11,features,midpointAvailable:false});
  assert.equal(state.updates,1);assert.ok(state.weights[0][0]>0);assert.equal(state.weights[1][0],0);
  assert.throws(()=>chooseOwnSteering(state,{agentId:2,tick:3,energy:11,features,midpointAvailable:true}));
});
test('terminal updates once; frozen policy does not learn',()=>{
  const dead=createOwnSteering(1,8);chooseOwnSteering(dead,{agentId:1,tick:1,energy:1,features,midpointAvailable:true});
  terminateOwnSteering(dead,{agentId:1,tick:1,energy:0});assert.equal(dead.updates,1);assert.throws(()=>terminateOwnSteering(dead,{agentId:1,tick:1,energy:0}));
  const frozen=createOwnSteering(2,8);chooseOwnSteering(frozen,{agentId:2,tick:1,energy:1,features,midpointAvailable:true});
  freezeOwnSteering(frozen);const before=structuredClone(frozen.weights);
  chooseOwnSteering(frozen,{agentId:2,tick:2,energy:2,features,midpointAvailable:true});assert.deepEqual(frozen.weights,before);assert.equal(frozen.pending,null);
});
test('unavailable midpoint never executes and decision sequence is continuous',()=>{
  const state=createOwnSteering(1,1);state.weights[1][0]=8;
  assert.equal(chooseOwnSteering(state,{agentId:1,tick:1,energy:1,features,midpointAvailable:false}).action,0);
  assert.throws(()=>chooseOwnSteering(state,{agentId:1,tick:3,energy:1,features,midpointAvailable:true}));
});
test('a matched control learns only from its actual forced action',()=>{
  const state=createOwnSteering(1,123456789);state.weights[1][0]=1;
  const choice=chooseOwnSteering(state,{agentId:1,tick:1,energy:1,features,midpointAvailable:true},{forcedAction:0});
  assert.equal(choice.proposed,1);assert.equal(choice.action,0);
  chooseOwnSteering(state,{agentId:1,tick:2,energy:2,features,midpointAvailable:true},{forcedAction:0});
  assert.ok(state.weights[0][0]>0);assert.equal(state.weights[1][0],1);
  assert.throws(()=>chooseOwnSteering(createOwnSteering(2,3),{agentId:2,tick:1,energy:1,features,midpointAvailable:false},{forcedAction:1}));
});
test('one-step and terminal update work matches the declared operation schedule',()=>{
  const state=createOwnSteering(1,123456789);
  chooseOwnSteering(state,{agentId:1,tick:1,energy:10,features,midpointAvailable:false});
  assert.equal(state.work.scalarOperations,41);
  chooseOwnSteering(state,{agentId:1,tick:2,energy:11,features,midpointAvailable:false});
  assert.equal(state.work.scalarOperations,41+154);
  assert.equal(state.weights[0][0],.05/120);
  terminateOwnSteering(state,{agentId:1,tick:2,energy:0});
  assert.equal(state.work.scalarOperations,41+154+81);
});
