import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {STEERING_FEATURES} from './own-steering.mjs';
import {createSteeringMeanProjection,projectOwnSteeringIncrement} from './steering-mean-projection.mjs';
import {encodedStateBytes} from './sarsa-experiment.mjs';

const discount=Math.exp(-1/256),bankCount=17;
const matrix=()=>Array.from({length:2},()=>Array(STEERING_FEATURES).fill(0));
export function cueSteeringRoute(cue){
  assert.ok(Array.isArray(cue)&&cue.length===4);
  if(cue.every(value=>value===0))return 0;
  assert.ok(cue.every(value=>value===-1||value===1));
  return 1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);
}
export function createCueSharedSteering(agentId,seed,projectionMode=null,protectionMode=null){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  assert.ok(projectionMode===null||['control','project'].includes(projectionMode));
  assert.ok(protectionMode===null||projectionMode===null&&['control','protect'].includes(protectionMode));
  const state={agentId,weights:matrix(),contextWeights:Array.from({length:bankCount},matrix),pending:null,rngState:seed,
    acquisition:true,dead:false,lastDecisionTick:null,updates:0,work:{scalarOperations:2*STEERING_FEATURES*(bankCount+1)}};
  if(projectionMode!==null){state.projectionMode=projectionMode;state.projection=createSteeringMeanProjection(agentId);state.work.scalarOperations+=state.projection.work.scalarOperations+2;}
  if(protectionMode!==null){state.protectionMode=protectionMode;state.support=Array.from({length:bankCount},()=>[false,false]);state.work.scalarOperations+=bankCount*2+2;}
  return state;
}
function values(state,route,features){
  state.work.scalarOperations+=3*2*STEERING_FEATURES;
  return state.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+state.contextWeights[route][action][index])*features[index],0));
}
function update(state,energy,nextRoute,nextFeatures,available,terminal){
  const pending=state.pending;assert.ok(pending&&Number.isFinite(energy));
  const prediction=values(state,pending.route,pending.features)[pending.action],next=terminal?0:values(state,nextRoute,nextFeatures);
  const bootstrap=terminal?0:available?Math.max(...next):next[0],delta=(energy-pending.energy)/120+discount*bootstrap-prediction;
  state.work.scalarOperations+=9;
  let increments=null,projected=null;
  if(state.projection){
    increments=pending.features.map(feature=>.025*delta*feature);const before=state.projection.work.scalarOperations;
    projected=projectOwnSteeringIncrement(state.projection,{agentId:state.agentId,tick:pending.tick,action:pending.action,features:pending.features},increments);
    state.work.scalarOperations+=state.projection.work.scalarOperations-before+2*STEERING_FEATURES+1;
  }
  for(let index=0;index<STEERING_FEATURES;index++){
    const increment=increments?increments[index]:.025*delta*pending.features[index],shared=state.projectionMode==='project'?projected[index]:increment;
    const previous=state.weights[pending.action][index];state.weights[pending.action][index]=Math.max(-8,Math.min(8,previous+shared));
    const bank=state.contextWeights[pending.route][pending.action];bank[index]=Math.max(-8,Math.min(8,bank[index]+increment));
    if(state.support){
      const change=state.weights[pending.action][index]-previous;
      for(let route=0;route<bankCount;route++)if(route!==pending.route&&state.support[route][pending.action]){
        const other=state.contextWeights[route][pending.action],compensated=Math.max(-8,Math.min(8,other[index]-change));
        other[index]=state.protectionMode==='protect'?compensated:other[index];
      }
    }
  }
  if(state.support){state.support[pending.route][pending.action]=true;state.work.scalarOperations+=bankCount*STEERING_FEATURES*7+bankCount*4+2;}
  state.work.scalarOperations+=9*STEERING_FEATURES;state.updates++;state.pending=null;
}
export function chooseCueSharedSteering(state,own,{forcedAction=null}={}){
  assert.equal(own.agentId,state.agentId);assert.ok(Number.isInteger(own.tick)&&Number.isFinite(own.energy)&&!state.dead);
  assert.ok(Array.isArray(own.features)&&own.features.length===STEERING_FEATURES&&own.features.every(Number.isFinite));
  assert.equal(typeof own.midpointAvailable,'boolean');assert.ok(forcedAction===null||forcedAction===0||forcedAction===1&&own.midpointAvailable);
  const route=cueSteeringRoute(own.cue);state.work.scalarOperations+=9;
  if(state.pending){assert.equal(own.tick,state.pending.tick+1);update(state,own.energy,route,own.features,own.midpointAvailable,false);}
  else if(state.lastDecisionTick!==null)assert.ok(own.tick>state.lastDecisionTick);
  const predictions=values(state,route,own.features),best=own.midpointAvailable&&predictions[1]>predictions[0]?1:0;
  state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=9;
  const proposed=state.acquisition&&own.midpointAvailable&&state.rngState/4294967296<.1?1-best:best;
  const action=forcedAction===null?proposed:forcedAction;
  state.pending=state.acquisition?{tick:own.tick,energy:own.energy,route,action,features:[...own.features]}:null;
  if(state.acquisition)state.work.scalarOperations+=STEERING_FEATURES;
  state.lastDecisionTick=own.tick;return {action,proposed,predictions};
}
export function terminateCueSharedSteering(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&Number.isFinite(own.energy));
  if(state.pending){assert.equal(own.tick,state.pending.tick);update(state,own.energy,null,null,false,true);}
  state.dead=true;
}
export function freezeCueSharedSteering(state){assert.ok(!state.dead);state.pending=null;state.acquisition=false;}
export function resetCueSharedSteering(state){
  assert.ok(!state.dead);for(const row of state.weights)row.fill(0);for(const bank of state.contextWeights)for(const row of bank)row.fill(0);
  if(state.projection){const cost=encodedStateBytes(state.projection);state.projection=createSteeringMeanProjection(state.agentId);state.work.scalarOperations+=cost+state.projection.work.scalarOperations+1;}
  if(state.support){const cost=encodedStateBytes(state.support);state.support=Array.from({length:bankCount},()=>[false,false]);state.work.scalarOperations+=cost+bankCount*2+1;}
  state.pending=null;state.work.scalarOperations+=2*STEERING_FEATURES*(bankCount+1);
}
