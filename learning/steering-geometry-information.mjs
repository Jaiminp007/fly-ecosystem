import assert from 'node:assert/strict';

export const GEOMETRY_MODELS=Object.freeze(['base','geometry','delayed']);
export function steeringGeometryContext(recommendation){
  assert.ok(Number.isFinite(recommendation.score)&&Array.isArray(recommendation.point)&&recommendation.point.length===2&&recommendation.point.every(Number.isFinite));
  return [Math.tanh(recommendation.score),...recommendation.point.map(value=>Math.max(-1,Math.min(1,value/100)))];
}
export function steeringGeometryFeatures(features,current,previous,mode){
  assert.ok(GEOMETRY_MODELS.includes(mode));assert.ok(Array.isArray(features)&&features.length===8&&features.every(Number.isFinite));
  assert.ok([current,previous].every(value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite)));
  return mode==='base'?[...features]:[...features,...(mode==='geometry'?current:previous)];
}
export function createSteeringGeometryPredictor(agentId,mode){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&GEOMETRY_MODELS.includes(mode));
  const dimensions=mode==='base'?8:11;
  return {agentId,mode,weights:Array.from({length:2},()=>Array(dimensions).fill(0)),updates:0,scalarOperations:0,frozen:false};
}
export function predictSteeringGeometry(state,record){
  assert.equal(record.agentId,state.agentId);assert.ok([0,1].includes(record.action));
  assert.ok(record.phi.length===state.weights[0].length&&record.phi.every(Number.isFinite));
  state.scalarOperations+=2*record.phi.length;
  return state.weights[record.action].reduce((sum,weight,index)=>sum+weight*record.phi[index],0);
}
export function trainSteeringGeometry(state,record){
  assert.ok(!state.frozen&&Number.isFinite(record.target));const prediction=predictSteeringGeometry(state,record);
  const norm=record.phi.reduce((sum,value)=>sum+value*value,1),step=.1*(record.target-prediction)/norm;
  for(let index=0;index<record.phi.length;index++)state.weights[record.action][index]=Math.max(-8,Math.min(8,state.weights[record.action][index]+step*record.phi[index]));
  state.scalarOperations+=6*record.phi.length+3;state.updates++;return prediction;
}
