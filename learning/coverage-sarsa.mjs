import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

export const COVERAGE_MOVES=Object.freeze([-1,0,1]);
export const COVERAGE_DIMENSIONS=13;
const discount=Math.exp(-1/256);
const vector=values=>Array.isArray(values)&&values.length===13&&values.every(Number.isFinite);
const zeros=()=>Array.from({length:3},()=>Array(13).fill(0));
const draw=(state,key)=>{state[key]=advanceRng(state[key]);state.work.scalarOperations+=7;return state[key]/4294967296;};

export function createCoverageBody(agentId,seed){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {schema:1,kind:'three-speed-own-expected-sarsa',agentId,weights:zeros(),eligibility:zeros(),memory:[],memorySeen:0,pending:null,
    acquisition:true,dead:false,lastDecisionTick:0,lastObservedTick:0,decisions:0,transitions:0,skippedBoundaryTransitions:0,
    rngState:seed,replayRngState:(seed^0xa511e9b3)>>>0||1,retentionRngState:(seed^0x9e3779b9)>>>0||1,
    work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0}};
}
export function coverageFeatures(state,raw,contactPresent){
  assert.ok(Array.isArray(raw)&&raw.length===17&&raw.every(Number.isFinite)&&typeof contactPresent==='boolean');
  state.work.scalarOperations+=14;
  return [1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),contactPresent?.25:0,
    raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,contactPresent?raw[13]*.25:0];
}
function values(state,phi){
  assert.ok(vector(phi));state.work.scalarOperations+=78;
  return state.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*phi[index],0));
}
function greedy(state,q){let action=2;for(let index=1;index>=0;index--){state.work.scalarOperations++;if(q[index]>q[action])action=index;}return action;}
function expected(state,q){const best=greedy(state,q);state.work.scalarOperations+=7;return .9*q[best]+.1*(q[0]+q[1]+q[2])/3;}
function validateTransition(state,transition){
  assert.equal(transition.agentId,state.agentId);assert.ok([0,1,2].includes(transition.action));
  assert.ok(vector(transition.phi)&&vector(transition.nextPhi)&&Number.isFinite(transition.reward)&&typeof transition.terminal==='boolean');
}
export function learnCoverageTransition(state,transition,{replay=true}={}){
  validateTransition(state,transition);assert.ok(state.acquisition&&!state.dead);
  const predicted=values(state,transition.phi)[transition.action],next=transition.terminal?0:expected(state,values(state,transition.nextPhi));
  const delta=transition.reward+discount*next-predicted;state.work.scalarOperations+=3;
  for(let action=0;action<3;action++)for(let index=0;index<13;index++){
    state.eligibility[action][index]=discount*.9*state.eligibility[action][index]+(action===transition.action?transition.phi[index]:0);
    state.weights[action][index]=Math.max(-8,Math.min(8,state.weights[action][index]+.05*delta*state.eligibility[action][index]));
  }
  state.work.scalarOperations+=39*8;state.work.liveUpdates++;state.transitions++;state.memorySeen++;
  const record=structuredClone(transition);
  if(state.memory.length<32)state.memory.push(record);
  else{const index=Math.floor(draw(state,'retentionRngState')*state.memorySeen);state.work.scalarOperations+=3;if(index<32)state.memory[index]=record;}
  if(replay){
    const index=Math.floor(draw(state,'replayRngState')*state.memory.length);state.work.scalarOperations+=2;
    const own=state.memory[index];validateTransition(state,own);
    const prediction=values(state,own.phi)[own.action],target=own.reward+(own.terminal?0:discount*expected(state,values(state,own.nextPhi))),error=target-prediction;
    for(let feature=0;feature<13;feature++)state.weights[own.action][feature]=Math.max(-8,Math.min(8,state.weights[own.action][feature]+.01*error*own.phi[feature]));
    state.work.scalarOperations+=13*5+3;state.work.replayUpdates++;
  }
  if(transition.terminal){state.eligibility=zeros();state.work.scalarOperations+=39;}
  return delta;
}
export function chooseCoverageAction(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead);assert.equal(own.tick,state.lastObservedTick+1);assert.notEqual(own.tick,state.lastDecisionTick);
  assert.ok(Number.isFinite(own.energy));const phi=coverageFeatures(state,own.raw,own.contactPresent);
  if(state.pending){
    assert.equal(own.tick-state.pending.tick,1);
    state.work.scalarOperations+=2;
    if(state.acquisition)learnCoverageTransition(state,{agentId:state.agentId,tick:state.pending.tick,action:state.pending.action,phi:state.pending.phi,nextPhi:phi,reward:(own.energy-state.pending.energy)/120,terminal:false});
  }
  const q=values(state,phi),best=greedy(state,q),first=draw(state,'rngState'),second=draw(state,'rngState');state.work.scalarOperations+=3;
  const action=state.acquisition&&first<.1?Math.floor(second*3):best;
  state.pending=state.acquisition?{tick:own.tick,action,phi,energy:own.energy}:null;
  state.work.scalarOperations+=4;
  state.lastDecisionTick=own.tick;state.decisions++;return {action,move:COVERAGE_MOVES[action],probability:state.acquisition?.1/3+(action===best?.9:0):Number(action===best)};
}
export function observeCoverageBody(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead);assert.equal(own.tick,state.lastDecisionTick);assert.equal(own.tick,state.lastObservedTick+1);assert.ok(Number.isFinite(own.energy));
  if(own.terminal&&state.pending){
    state.work.scalarOperations+=2;
    if(state.acquisition)learnCoverageTransition(state,{agentId:state.agentId,tick:state.pending.tick,action:state.pending.action,phi:state.pending.phi,nextPhi:Array(13).fill(0),reward:(own.energy-state.pending.energy)/120,terminal:true});
    state.pending=null;
  }
  state.lastObservedTick=own.tick;state.dead=!!own.terminal;
}
export function freezeCoverageBody(state){
  if(state.pending)state.skippedBoundaryTransitions++;
  state.pending=null;state.acquisition=false;state.eligibility=zeros();state.work.scalarOperations+=40;
}
export function resetCoverageBody(state){
  if(state.pending)state.skippedBoundaryTransitions++;
  state.weights=zeros();state.eligibility=zeros();state.memory=[];state.memorySeen=0;state.pending=null;state.acquisition=true;state.work.scalarOperations+=79;
}
