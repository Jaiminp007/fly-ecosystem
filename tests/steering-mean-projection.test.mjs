import test from 'node:test';
import assert from 'node:assert/strict';
import {createSteeringMeanProjection,projectOwnSteeringIncrement} from '../learning/steering-mean-projection.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const vector=(first,second=0)=>[first,second,0,0,0,0,0,0];
const own=(tick,action,features)=>({agentId:7,tick,action,features});

test('projection protects the preceding factual mean and isolates actions',()=>{
  const state=createSteeringMeanProjection(7),increment=vector(2,3);
  assert.deepEqual(projectOwnSteeringIncrement(state,own(1,0,vector(1,1)),increment),increment);
  const projected=projectOwnSteeringIncrement(state,own(2,0,vector(3,1)),increment);
  assert.ok(Math.abs(projected[0]+projected[1])<1e-12);
  assert.deepEqual(state.means[0],vector(2,1));assert.deepEqual(state.means[1],vector(0));
  assert.deepEqual(projectOwnSteeringIncrement(state,own(3,1,vector(0,1)),increment),increment);
  assert.deepEqual(state.counts,[2,1]);assert.equal(state.work.scalarOperations,18+3*128);
});

test('zero means, own identity and bounded serialized state are handled',()=>{
  const state=createSteeringMeanProjection(7),increment=vector(3,4);
  projectOwnSteeringIncrement(state,own(1,0,vector(0)),increment);
  assert.deepEqual(projectOwnSteeringIncrement(state,own(2,0,vector(0)),increment),increment);
  const size=encodedStateBytes(state);for(let tick=3;tick<100;tick++)projectOwnSteeringIncrement(state,own(tick,0,vector(0)),increment);
  assert.equal(encodedStateBytes(state),size);const restored=JSON.parse(JSON.stringify(state));
  assert.deepEqual(projectOwnSteeringIncrement(restored,own(100,0,vector(1)),increment),projectOwnSteeringIncrement(state,own(100,0,vector(1)),increment));
  assert.throws(()=>projectOwnSteeringIncrement(state,{...own(101,0,vector(0)),agentId:8},increment));
  assert.throws(()=>projectOwnSteeringIncrement(state,own(100,0,vector(0)),increment));
});

test('mean protection does not imply individual or clipped-weight protection',()=>{
  const state=createSteeringMeanProjection(7);
  projectOwnSteeringIncrement(state,own(1,0,vector(1,0)),vector(0));
  projectOwnSteeringIncrement(state,own(2,0,vector(0,1)),vector(0));
  const projected=projectOwnSteeringIncrement(state,own(3,0,vector(1,0)),vector(1,-1));
  assert.ok(Math.abs(projected[0]+projected[1])<1e-12);assert.notEqual(projected[0],0);
  const clipped=[Math.min(8,8+projected[0])-8,projected[1]];
  assert.notEqual(clipped[0]+clipped[1],0);
});
