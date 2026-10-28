import test from 'node:test';
import assert from 'node:assert/strict';
import {feedingContextFeatures,createFeedingPredictor,predictFeedingEnergy,trainFeedingEnergy} from '../learning/feeding-context.mjs';

test('current and delayed propensity use only their declared own observable input',()=>{
  const own={raw:Array(17).fill(.2),contactPresent:true},first=feedingContextFeatures(own,.9,.1,'context'),second=feedingContextFeatures(own,.1,.9,'context');
  assert.deepEqual(first.slice(0,13),second.slice(0,13));assert.notDeepEqual(first.slice(13),second.slice(13));
  assert.deepEqual(first,feedingContextFeatures(own,.1,.9,'delayed'));
  assert.equal(feedingContextFeatures(own,.9,.1,'raw').length,13);
});
test('own executed action is isolated and held-out fitting is rejected',()=>{
  const state=createFeedingPredictor(1,'context'),phi=Array(26).fill(0);phi[0]=1;
  const record={agentId:1,action:2,phi,target:1};assert.equal(trainFeedingEnergy(state,record),0);assert.equal(state.weights[2][0],.05);
  assert.ok(state.weights[0].every(value=>value===0));assert.throws(()=>trainFeedingEnergy(state,{...record,agentId:2}));
  state.frozen=true;const before=structuredClone(state.weights);assert.equal(predictFeedingEnergy(state,record),.05);assert.deepEqual(before,state.weights);
  assert.throws(()=>trainFeedingEnergy(state,record));assert.deepEqual(before,state.weights);
});
