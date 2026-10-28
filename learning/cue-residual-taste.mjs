import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

const scale=Math.sqrt(11),prior=Math.log(3);
function cueIndex(cue){assert.ok(Array.isArray(cue)&&cue.length===4&&cue.every(value=>value===-1||value===1));return cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);}
function features(cue){const phi=[1,...cue];for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)phi.push(cue[first]*cue[second]);return phi;}
export function createCueResidualTaste(agentId,seed){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {agentId,weights:Array(11).fill(0),residuals:Array(16).fill(0),reservoir:[],recent:[],seen:0,rngState:seed,lastTick:0,updates:0,work:{scalarOperations:27}};
}
function draw(state){state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=7;return state.rngState/4294967296;}
function rawScore(state,phi,index,policy){const dot=state.weights.reduce((sum,value,position)=>sum+value*phi[position],0),mask=Number(policy==='shared-plus-cue');return prior+dot/scale+mask*state.residuals[index];}
function update(state,record,policy){
  const index=cueIndex(record.phi.slice(1,5)),error=record.target-1/(1+Math.exp(-rawScore(state,record.phi,index,policy))),step=.5*error/scale,residualStep=.5*error;
  for(let position=0;position<11;position++)state.weights[position]=Math.max(-8,Math.min(8,state.weights[position]+step*record.phi[position]));
  state.residuals[index]=Math.max(-8,Math.min(8,state.residuals[index]+residualStep));state.work.scalarOperations+=95;state.updates++;
}
export function learnCueResidualTaste(state,example,policy){
  assert.deepEqual(Object.keys(example).sort(),['agentId','cue','target','tick']);assert.ok(['shared','shared-plus-cue'].includes(policy));assert.equal(example.agentId,state.agentId);assert.ok(Number.isInteger(example.tick)&&example.tick>state.lastTick);
  cueIndex(example.cue);assert.ok(example.target===0||example.target===1);const record={agentId:state.agentId,tick:example.tick,phi:features(example.cue),target:example.target};state.work.scalarOperations+=20;state.seen++;state.lastTick=example.tick;
  const retention=draw(state),reservoirDraw=draw(state),recentDraw=draw(state),coin=draw(state);
  if(state.reservoir.length<32){state.reservoir.push(structuredClone(record));state.work.scalarOperations++;}else{const index=Math.floor(retention*state.seen);state.work.scalarOperations+=2;if(index<32){state.reservoir[index]=structuredClone(record);state.work.scalarOperations++;}}
  if(state.recent.length===8){state.recent.shift();state.work.scalarOperations+=8;}state.recent.push(structuredClone(record));state.work.scalarOperations++;
  const reservoirIndex=Math.floor(reservoirDraw*state.reservoir.length),recentIndex=Math.floor(recentDraw*state.recent.length),coinRecent=coin<.5;state.work.scalarOperations+=5;
  update(state,record,policy);update(state,state.reservoir[reservoirIndex],policy);return {reservoirIndex,recentIndex,coinRecent,replayTick:state.reservoir[reservoirIndex].tick};
}
export function predictCueResidualTaste(state,cue,policy){
  assert.ok(['shared','shared-plus-cue'].includes(policy));const index=cueIndex(cue),logit=rawScore(state,features(cue),index,policy);return .05+.9/(1+Math.exp(-logit));
}
