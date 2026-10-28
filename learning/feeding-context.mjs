import assert from 'node:assert/strict';

export const FEEDING_MODELS=Object.freeze(['raw','context','delayed']);
export function feedingContextFeatures(own,probability,delayed,mode){
  assert.ok(FEEDING_MODELS.includes(mode));assert.ok(own.raw.length===17&&own.raw.every(Number.isFinite));
  assert.ok([probability,delayed].every(value=>Number.isFinite(value)&&value>=0&&value<=1));
  const raw=own.raw,base=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,own.contactPresent?raw[13]*.25:0];
  const context=2*(mode==='delayed'?delayed:probability)-1;
  return mode==='raw'?base:[...base,...base.map(value=>value*context)];
}
export function createFeedingPredictor(agentId,mode){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&FEEDING_MODELS.includes(mode));
  const dimensions=mode==='raw'?13:26;
  return {agentId,mode,dimensions,weights:Array.from({length:3},()=>Array(dimensions).fill(0)),updates:0,scalarOperations:0,frozen:false};
}
export function predictFeedingEnergy(state,{agentId,action,phi}){
  assert.equal(agentId,state.agentId);assert.ok([0,1,2].includes(action));assert.ok(phi.length===state.dimensions&&phi.every(Number.isFinite));
  state.scalarOperations+=2*state.dimensions;
  return state.weights[action].reduce((sum,weight,index)=>sum+weight*phi[index],0);
}
export function trainFeedingEnergy(state,record){
  assert.ok(!state.frozen&&Number.isFinite(record.target));const prediction=predictFeedingEnergy(state,record);
  const norm=record.phi.reduce((sum,value)=>sum+value*value,1),step=.1*(record.target-prediction)/norm;
  for(let index=0;index<state.dimensions;index++)state.weights[record.action][index]=Math.max(-8,Math.min(8,state.weights[record.action][index]+step*record.phi[index]));
  state.scalarOperations+=6*state.dimensions+3;state.updates++;return prediction;
}
