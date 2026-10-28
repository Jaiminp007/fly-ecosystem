import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

export const STEERING_FEATURES=8;
export function createOwnSteering(agentId,seed){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {agentId,weights:Array.from({length:2},()=>Array(STEERING_FEATURES).fill(0)),pending:null,rngState:seed,
    acquisition:true,dead:false,lastDecisionTick:null,updates:0,work:{scalarOperations:0}};
}
function values(state,features){
  state.work.scalarOperations+=2*2*STEERING_FEATURES;
  return state.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*features[index],0));
}
function validate(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(Number.isInteger(own.tick));
  assert.ok(Number.isFinite(own.energy));assert.ok(Array.isArray(own.features)&&own.features.length===STEERING_FEATURES&&own.features.every(Number.isFinite));
  assert.equal(typeof own.midpointAvailable,'boolean');assert.ok(!state.dead);
}
function update(state,energy,nextFeatures,available,terminal){
  const pending=state.pending;assert.ok(pending&&Number.isFinite(energy));
  const prediction=values(state,pending.features)[pending.action];
  const next=terminal?0:values(state,nextFeatures),bootstrap=terminal?0:available?Math.max(...next):next[0];
  const reward=(energy-pending.energy)/120,delta=reward+Math.exp(-1/256)*bootstrap-prediction;
  state.work.scalarOperations+=9;
  for(let index=0;index<STEERING_FEATURES;index++){
    const value=state.weights[pending.action][index]+.05*delta*pending.features[index];
    state.weights[pending.action][index]=Math.max(-8,Math.min(8,value));
  }
  state.work.scalarOperations+=5*STEERING_FEATURES;state.updates++;state.pending=null;
}
export function chooseOwnSteering(state,own,{forcedAction=null}={}){
  validate(state,own);
  assert.ok(forcedAction===null||forcedAction===0||forcedAction===1&&own.midpointAvailable);
  if(state.pending){assert.equal(own.tick,state.pending.tick+1);update(state,own.energy,own.features,own.midpointAvailable,false);}
  else if(state.lastDecisionTick!==null)assert.ok(own.tick>state.lastDecisionTick);
  const predictions=values(state,own.features),best=own.midpointAvailable&&predictions[1]>predictions[0]?1:0;
  state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=9;
  const proposed=state.acquisition&&own.midpointAvailable&&state.rngState/4294967296<.1?1-best:best;
  const action=forcedAction===null?proposed:forcedAction;
  state.pending=state.acquisition?{tick:own.tick,energy:own.energy,action,features:[...own.features]}:null;
  state.lastDecisionTick=own.tick;return {action,proposed,predictions};
}
export function terminateOwnSteering(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&Number.isFinite(own.energy));
  if(state.pending){assert.equal(own.tick,state.pending.tick);update(state,own.energy,null,false,true);}
  state.dead=true;
}
export function freezeOwnSteering(state){
  assert.ok(!state.dead);state.pending=null;state.acquisition=false;
}
export function resetOwnSteering(state){
  assert.ok(!state.dead);for(const weights of state.weights)weights.fill(0);
  state.pending=null;state.work.scalarOperations+=2*STEERING_FEATURES;
}
