import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {STEERING_FEATURES} from './own-steering.mjs';

const discount=Math.exp(-1/256);
const validFeatures=features=>Array.isArray(features)&&features.length===STEERING_FEATURES&&features.every(Number.isFinite);
const draw=(state,key)=>{state[key]=advanceRng(state[key]);state.work.scalarOperations+=7;return state[key]/4294967296;};
const values=(state,features)=>{
  state.work.scalarOperations+=2*2*STEERING_FEATURES;
  return state.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*features[index],0));
};
export function createReplaySteering(agentId,seed){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {agentId,weights:Array.from({length:2},()=>Array(STEERING_FEATURES).fill(0)),pending:null,rngState:seed,
    retentionRngState:(seed^0x9e3779b9)>>>0||1,replayRngState:(seed^0xa511e9b3)>>>0||1,
    memory:[],seen:0,acquisition:true,dead:false,lastDecisionTick:null,updates:0,replayUpdates:0,work:{scalarOperations:0}};
}
function learn(state,energy,nextFeatures,available,terminal){
  const pending=state.pending;
  assert.ok(pending&&Number.isFinite(energy));
  const record={agentId:state.agentId,tick:pending.tick,action:pending.action,features:[...pending.features],
    nextFeatures:terminal?null:[...nextFeatures],available:terminal?false:available,reward:(energy-pending.energy)/120,terminal};
  state.work.scalarOperations+=terminal?12:20;
  apply(state,record,.05);
  state.updates++;state.seen++;state.work.scalarOperations+=2;
  if(state.memory.length<32)state.memory.push(record);
  else{const index=Math.floor(draw(state,'retentionRngState')*state.seen);state.work.scalarOperations+=3;if(index<32)state.memory[index]=record;}
  const index=Math.floor(draw(state,'replayRngState')*state.memory.length);state.work.scalarOperations+=2;
  apply(state,state.memory[index],.01);state.replayUpdates++;state.pending=null;
}
function apply(state,record,rate){
  assert.equal(record.agentId,state.agentId);
  const prediction=values(state,record.features)[record.action];
  const next=record.terminal?0:values(state,record.nextFeatures),bootstrap=record.terminal?0:record.available?Math.max(...next):next[0];
  const delta=record.reward+discount*bootstrap-prediction;state.work.scalarOperations+=4;
  for(let index=0;index<STEERING_FEATURES;index++){
    const value=state.weights[record.action][index]+rate*delta*record.features[index];
    state.weights[record.action][index]=Math.max(-8,Math.min(8,value));
  }
  state.work.scalarOperations+=5*STEERING_FEATURES;
}
export function chooseReplaySteering(state,own,{forcedAction=null}={}){
  assert.equal(own.agentId,state.agentId);assert.ok(Number.isInteger(own.tick)&&Number.isFinite(own.energy)&&validFeatures(own.features));
  assert.equal(typeof own.midpointAvailable,'boolean');assert.ok(!state.dead);
  assert.ok(forcedAction===null||forcedAction===0||forcedAction===1&&own.midpointAvailable);
  if(state.pending){assert.equal(own.tick,state.pending.tick+1);learn(state,own.energy,own.features,own.midpointAvailable,false);}
  else if(state.lastDecisionTick!==null)assert.ok(own.tick>state.lastDecisionTick);
  const predictions=values(state,own.features),best=own.midpointAvailable&&predictions[1]>predictions[0]?1:0;
  state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=9;
  const proposed=state.acquisition&&own.midpointAvailable&&state.rngState/4294967296<.1?1-best:best;
  const action=forcedAction===null?proposed:forcedAction;
  state.pending=state.acquisition?{tick:own.tick,energy:own.energy,action,features:[...own.features]}:null;
  if(state.acquisition)state.work.scalarOperations+=STEERING_FEATURES;
  state.lastDecisionTick=own.tick;return {action,proposed,predictions};
}
export function terminateReplaySteering(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&Number.isFinite(own.energy));
  if(state.pending){assert.equal(own.tick,state.pending.tick);learn(state,own.energy,null,false,true);}
  state.dead=true;
}
export function freezeReplaySteering(state){assert.ok(!state.dead);state.pending=null;state.acquisition=false;}
export function resetReplaySteering(state){
  assert.ok(!state.dead);for(const weights of state.weights)weights.fill(0);
  state.pending=null;state.memory=[];state.seen=0;state.work.scalarOperations+=2*STEERING_FEATURES+2;
}
