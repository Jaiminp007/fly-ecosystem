import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

const scale=Math.sqrt(11),prior=Math.log(3);
export function createTwoTimescaleTaste(agentId,seed){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {agentId,weights:Array(11).fill(0),reservoir:[],recent:[],seen:0,rngState:seed,lastTick:0,updates:0,work:{scalarOperations:11}};
}
function draw(state){state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=7;return state.rngState/4294967296;}
function features(cue){const phi=[1,...cue];for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)phi.push(cue[first]*cue[second]);return phi;}
function update(state,record){
  const logit=prior+state.weights.reduce((sum,weight,index)=>sum+weight*record.phi[index],0)/scale,error=record.target-1/(1+Math.exp(-logit)),step=.5*error/scale;
  for(let index=0;index<11;index++)state.weights[index]=Math.max(-8,Math.min(8,state.weights[index]+step*record.phi[index]));state.work.scalarOperations+=81;state.updates++;
}
export function learnTwoTimescaleTaste(state,example,policy){
  assert.deepEqual(Object.keys(example).sort(),['agentId','cue','target','tick']);
  assert.ok(['uniform','recent-mix'].includes(policy));assert.equal(example.agentId,state.agentId);assert.ok(Number.isInteger(example.tick)&&example.tick>state.lastTick);
  assert.ok(Array.isArray(example.cue)&&example.cue.length===4&&example.cue.every(value=>value===-1||value===1));assert.ok(example.target===0||example.target===1);
  const record={agentId:state.agentId,tick:example.tick,phi:features(example.cue),target:example.target};state.work.scalarOperations+=20;state.seen++;state.lastTick=example.tick;
  const retention=draw(state),reservoirDraw=draw(state),recentDraw=draw(state),coin=draw(state);
  if(state.reservoir.length<32){state.reservoir.push(structuredClone(record));state.work.scalarOperations++;}
  else{const index=Math.floor(retention*state.seen);state.work.scalarOperations+=2;if(index<32){state.reservoir[index]=structuredClone(record);state.work.scalarOperations++;}}
  if(state.recent.length===8){state.recent.shift();state.work.scalarOperations+=8;}state.recent.push(structuredClone(record));state.work.scalarOperations++;
  const reservoirIndex=Math.floor(reservoirDraw*state.reservoir.length),recentIndex=Math.floor(recentDraw*state.recent.length),coinRecent=coin<.5,useRecent=policy==='recent-mix'&&coinRecent;state.work.scalarOperations+=5;
  update(state,record);const replay=useRecent?state.recent[recentIndex]:state.reservoir[reservoirIndex];update(state,replay);
  return {reservoirIndex,recentIndex,useRecent,replayTick:replay.tick};
}
