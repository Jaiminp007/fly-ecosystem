import test from 'node:test';
import assert from 'node:assert/strict';
import {steeringGeometryContext,steeringGeometryFeatures,createSteeringGeometryPredictor,predictSteeringGeometry,trainSteeringGeometry} from '../learning/steering-geometry-information.mjs';

test('geometry comes from current observable recommendation and delayed context is separate',()=>{
  const context=steeringGeometryContext({score:.2,point:[200,-50]}),previous=[.1,.2,.3],features=[1,0,0,0,0,0,0,0];
  assert.deepEqual(context,[Math.tanh(.2),1,-.5]);
  assert.deepEqual(steeringGeometryFeatures(features,context,previous,'geometry'),[...features,...context]);
  assert.deepEqual(steeringGeometryFeatures(features,context,previous,'delayed'),[...features,...previous]);
  assert.deepEqual(steeringGeometryFeatures(features,context,previous,'base'),features);
});
test('only the actual own action updates and frozen inference never learns',()=>{
  const state=createSteeringGeometryPredictor(4,'geometry'),phi=[1,0,0,0,0,0,0,0,.2,.3,-.4],record={agentId:4,action:1,phi,target:.5};
  assert.equal(trainSteeringGeometry(state,record),0);assert.ok(state.weights[0].every(value=>value===0));assert.ok(state.weights[1][0]>0);
  assert.throws(()=>trainSteeringGeometry(state,{...record,agentId:5}));state.frozen=true;const before=structuredClone(state.weights);
  predictSteeringGeometry(state,record);assert.deepEqual(state.weights,before);assert.throws(()=>trainSteeringGeometry(state,record));
});
