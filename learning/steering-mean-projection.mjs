import assert from 'node:assert/strict';
import {STEERING_FEATURES} from './own-steering.mjs';

export function createSteeringMeanProjection(agentId){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0);
  return {agentId,means:Array.from({length:2},()=>Array(STEERING_FEATURES).fill(0)),counts:[0,0],lastTick:null,work:{scalarOperations:2*STEERING_FEATURES+2}};
}

export function projectOwnSteeringIncrement(state,own,increment){
  assert.equal(own.agentId,state.agentId);assert.ok(Number.isSafeInteger(own.tick));
  assert.ok(state.lastTick===null||own.tick>state.lastTick);assert.ok(own.action===0||own.action===1);
  assert.ok(Array.isArray(own.features)&&own.features.length===STEERING_FEATURES&&own.features.every(Number.isFinite));
  assert.ok(Array.isArray(increment)&&increment.length===STEERING_FEATURES&&increment.every(Number.isFinite));
  const mean=state.means[own.action],count=state.counts[own.action];assert.ok(Number.isSafeInteger(count)&&count<Number.MAX_SAFE_INTEGER);
  let norm=0,dot=0;
  for(let index=0;index<STEERING_FEATURES;index++){norm+=mean[index]*mean[index];dot+=mean[index]*increment[index];}
  assert.ok(Number.isFinite(norm)&&Number.isFinite(dot));
  const scale=norm>0?dot/norm:0;assert.ok(Number.isFinite(scale));
  const projected=increment.map((value,index)=>value-scale*mean[index]);
  const nextCount=count+1;
  const nextMean=mean.map((value,index)=>value+(own.features[index]-value)/nextCount);
  assert.ok(projected.every(Number.isFinite)&&nextMean.every(Number.isFinite));
  state.means[own.action]=nextMean;state.counts[own.action]=nextCount;state.lastTick=own.tick;
  state.work.scalarOperations+=128;
  return projected;
}
