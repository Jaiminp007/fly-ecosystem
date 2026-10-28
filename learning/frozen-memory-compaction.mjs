import assert from 'node:assert/strict';
import {encodedStateBytes} from './sarsa-experiment.mjs';

export function compactFrozenOdorRoutedState(state){
  assert.ok(!state.dead&&!state.acquisition&&state.steering&&!state.steering.dead&&!state.steering.acquisition);
  assert.ok(state.steering.pending===null&&Array.isArray(state.taste.memory));
  const arrays=[state.taste.memory];
  for(const bank of Object.values(state.banks)){
    assert.ok(!bank.dead&&!bank.acquisition&&bank.pending===null&&Array.isArray(bank.memory));arrays.push(bank.memory);
  }
  if(Object.hasOwn(state.steering,'memory')){assert.ok(Array.isArray(state.steering.memory));arrays.push(state.steering.memory);}
  if(state.cueTaste){assert.ok(Array.isArray(state.cueTaste.reservoir)&&Array.isArray(state.cueTaste.recent));arrays.push(state.cueTaste.reservoir,state.cueTaste.recent);}
  const visitedBytes=arrays.reduce((sum,array)=>sum+encodedStateBytes(array),0);
  state.taste.memory=[];for(const bank of Object.values(state.banks))bank.memory=[];
  if(Object.hasOwn(state.steering,'memory'))state.steering.memory=[];
  if(state.cueTaste){state.cueTaste.reservoir=[];state.cueTaste.recent=[];}
  const operationCharge=visitedBytes+4+(state.cueTaste?2:0);state.work.scalarOperations+=operationCharge;state.charge.storageBytes=0;
  return {visitedBytes,operationCharge};
}
