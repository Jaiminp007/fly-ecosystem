import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {encodedStateBytes} from './sarsa-experiment.mjs';

export function createContactActionBandit(agentId,seed,{replay=false}={}){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  assert.equal(typeof replay,'boolean');const state={schema:1,agentId,weights:Array.from({length:2},()=>Array(7).fill(0)),rngState:seed,acquisition:true,pending:null,lastTick:0,counts:[0,0],updates:0,work:{scalarOperations:14}};
  if(replay){state.memory=[];state.memorySeen=0;state.retentionRngState=(seed^0x3a821f97)>>>0||1;state.replayRngState=(seed^0x9e3779b9)>>>0||1;state.work.scalarOperations+=4;}return state;
}

export function chooseContactAction(state,own,{mode}){
  assert.equal(own.agentId,state.agentId);assert.ok(state.pending===null&&Number.isSafeInteger(own.tick)&&own.tick>state.lastTick);assert.ok(['learned','random','shadow'].includes(mode));assert.ok(Array.isArray(own.cue)&&own.cue.length===4&&own.cue.every(value=>value===-1||value===1));assert.ok(Number.isFinite(own.energy)&&Number.isFinite(own.feedProbability)&&own.feedProbability>=0&&own.feedProbability<=1);
  const features=[1,...own.cue,Math.max(0,Math.min(1,own.energy/120)),own.feedProbability],values=state.weights.map(weights=>weights.reduce((sum,value,index)=>sum+value*features[index],0));state.rngState=advanceRng(state.rngState);const explore=state.rngState/4294967296;state.rngState=advanceRng(state.rngState);const randomAction=Number(state.rngState/4294967296>=.5),best=Number(values[1]>values[0]),action=mode==='shadow'?0:mode==='random'?randomAction:state.acquisition&&explore<.1?randomAction:best;
  state.pending={tick:own.tick,energy:own.energy,features,action};state.lastTick=own.tick;state.work.scalarOperations+=100;return {action,values,randomAction};
}

export function contactActionObservationOperations(state,replayPolicy=null){assert.ok(replayPolicy===null||['fresh','reservoir'].includes(replayPolicy)&&Array.isArray(state.memory));return 70+(state.acquisition&&replayPolicy!==null?160:0);}

export function observeContactAction(state,own,{replayPolicy=null}={}){
  assert.equal(own.agentId,state.agentId);assert.ok(state.pending&&own.tick===state.pending.tick&&Number.isFinite(own.energy)&&typeof own.terminal==='boolean');const cost=contactActionObservationOperations(state,replayPolicy),pending=state.pending,reward=Math.max(-1,Math.min(1,(own.energy-pending.energy)/120));let replayTick=null;
  if(state.acquisition){const record={agentId:state.agentId,tick:own.tick,features:[...pending.features],action:pending.action,reward},update=sample=>{assert.equal(sample.agentId,state.agentId);const prediction=state.weights[sample.action].reduce((sum,value,index)=>sum+value*sample.features[index],0),error=sample.reward-prediction;for(let index=0;index<7;index++)state.weights[sample.action][index]=Math.max(-8,Math.min(8,state.weights[sample.action][index]+.05*error*sample.features[index]));state.updates++;};let selected=null;
    if(replayPolicy!==null){state.memorySeen++;state.retentionRngState=advanceRng(state.retentionRngState);const retention=state.retentionRngState/4294967296;state.replayRngState=advanceRng(state.replayRngState);const replay=state.replayRngState/4294967296;if(state.memory.length<32)state.memory.push(structuredClone(record));else{const index=Math.floor(retention*state.memorySeen);if(index<32)state.memory[index]=structuredClone(record);}selected=state.memory[Math.floor(replay*state.memory.length)];replayTick=selected.tick;}
    update(record);if(replayPolicy!==null)update(replayPolicy==='fresh'?record:selected);state.counts[pending.action]++;}
  state.pending=null;state.work.scalarOperations+=cost;return {action:pending.action,reward,...(replayPolicy!==null?{replayTick}:{})};
}

export function freezeContactAction(state){assert.equal(state.pending,null);state.acquisition=false;state.work.scalarOperations++;}
export function resetContactAction(state){assert.equal(state.pending,null);const memoryCost=state.memory?encodedStateBytes(state.memory)+1:0;state.weights=Array.from({length:2},()=>Array(7).fill(0));state.counts=[0,0];state.updates=0;state.acquisition=true;if(state.memory){state.memory=[];state.memorySeen=0;}state.work.scalarOperations+=17+memoryCost;}
