import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {tickFeatures} from './tick-actor-critic.mjs';

export const TICK_VALUE_DIMENSIONS=71;
export const TICK_VALUE_DEFAULTS=Object.freeze({mechanism:'tick-linear-expected-sarsa-v1',dimensions:71,actions:4,
  epsilon:.1,discount:.99,lambda:.9,updateRate:.05,replayRate:.01,capacity:64,recent:16,weightBound:4});
const vector=(values,size)=>Array.isArray(values)&&values.length===size&&values.every(Number.isFinite);
const zeros=()=>Array.from({length:4},()=>Array(71).fill(0));
const canonical=value=>value===0?0:value;
function mathFor(work){
  const op=fn=>(...args)=>{work.scalarOperations++;return canonical(fn(...args));};
  return {add:op((a,b)=>a+b),sub:op((a,b)=>a-b),mul:op((a,b)=>a*b),div:op((a,b)=>a/b),
    sqrt:op(Math.sqrt),max:op(Math.max),min:op(Math.min),floor:op(Math.floor),equal:op((a,b)=>a===b),less:op((a,b)=>a<b)};
}
function unit(state,key){state[key]=advanceRng(state[key]);state.work.scalarOperations+=6;return mathFor(state.work).div(state[key],4294967296);}
function indexDraw(state,key,size){const m=mathFor(state.work);return m.floor(m.mul(unit(state,key),size));}
function phiValid(phi){assert.ok(vector(phi,71)&&phi.every(v=>Math.abs(v)<=1));assert.ok(phi.reduce((n,v)=>n+v*v,0)<=1+1e-12);}
export function createValueBody(agentId,seed,options={}){
  assert.ok(options&&typeof options==='object'&&!Array.isArray(options));for(const key of Object.keys(options))assert.equal(key,'lambda');
  const {lambda=.9}=options;
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  assert.ok(lambda===.9||lambda===0);
  return {schema:1,kind:'own-tick-linear-value',agentId,config:{...TICK_VALUE_DEFAULTS,lambda},weights:zeros(),eligibility:zeros(),
    previous:null,pending:null,recent:[],older:[],olderSeen:0,acquiredTransitions:0,
    rngState:seed,retentionRngState:(seed^0x9e3779b9)>>>0||1,replayRngState:(seed^0xa511e9b3)>>>0||1,
    decisions:0,transitions:0,lastDecisionTick:0,lastObservedTick:0,awaitingObservation:false,acquisition:true,dead:false,
    work:{scalarOperations:2,liveUpdates:0,replayUpdates:0},
    charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0}};
}
export function valueFeatures(state,raw,observation){
  assert.ok(vector(raw,17)&&raw.every(v=>Math.abs(v)<=1));
  assert.equal(raw[16],1);
  const base=tickFeatures(state,raw,observation).map(canonical),m=mathFor(state.work),values=[...base];
  if(state.previous){
    values.push(...state.previous.inputs.map(v=>m.mul(.5,v)));
    for(let action=0;action<4;action++)values.push(m.equal(action,state.previous.action)?.5:0);
    values.push(1);
  }else values.push(...Array(38).fill(0));
  const norm=m.max(1,m.sqrt(values.reduce((n,v)=>m.add(n,m.mul(v,v)),0)));
  const phi=values.map(v=>m.div(v,norm));phiValid(phi);return {base,phi};
}
export function valuePrediction(state,phi){
  phiValid(phi);const m=mathFor(state.work);
  const values=state.weights.map(row=>row.reduce((n,w,i)=>m.add(n,m.mul(w,phi[i])),0));
  const maximum=values.reduce((n,v)=>m.max(n,v),values[0]);
  const ties=values.map(v=>m.equal(v,maximum)),count=ties.reduce((n,tie)=>tie?m.add(n,1):n,0);
  const base=m.div(.1,4),extra=m.div(m.sub(1,.1),count),probabilities=ties.map(tie=>tie?m.add(base,extra):base);
  return {values,probabilities};
}
function expected(state,phi){
  const p=valuePrediction(state,phi),m=mathFor(state.work);
  return p.values.reduce((n,v,i)=>m.add(n,m.mul(v,p.probabilities[i])),0);
}
function remember(state,record){
  state.recent.push(structuredClone(record));
  if(state.recent.length<=16)return;
  const displaced=state.recent.shift();state.olderSeen++;
  if(state.older.length<48)state.older.push(displaced);
  else{const index=indexDraw(state,'retentionRngState',state.olderSeen);if(index<48)state.older[index]=displaced;}
}
function update(state,finalEnergy,nextPhi,terminal,emit){
  const p=state.pending,m=mathFor(state.work);assert.ok(p&&state.acquisition&&!state.dead);
  const reward=m.div(m.sub(finalEnergy,p.initialEnergy),120),prediction=valuePrediction(state,p.phi).values[p.action];
  const nextValue=terminal?0:expected(state,nextPhi),target=terminal?reward:m.add(reward,m.mul(.99,nextValue));
  const delta=m.sub(target,prediction),decay=m.mul(.99,state.config.lambda),step=m.mul(.05,delta);
  for(let action=0;action<4;action++){
    const active=m.equal(action,p.action);
    for(let j=0;j<71;j++){
      state.eligibility[action][j]=m.add(m.mul(decay,state.eligibility[action][j]),active?p.phi[j]:0);
      state.weights[action][j]=m.max(-4,m.min(4,m.add(state.weights[action][j],m.mul(step,state.eligibility[action][j]))));
    }
  }
  state.transitions++;state.acquiredTransitions++;state.work.liveUpdates++;
  const record={agentId:state.agentId,tick:p.tick,duration:1,phi:[...p.phi],action:p.action,reward,nextPhi:[...nextPhi],terminal,
    initialEnergy:p.initialEnergy,finalEnergy,experience:state.transitions};
  remember(state,record);
  const records=[...state.older,...state.recent],selected=records[indexDraw(state,'replayRngState',records.length)];
  const replayPrediction=valuePrediction(state,selected.phi).values[selected.action];
  const replayNextValue=selected.terminal?0:expected(state,selected.nextPhi);
  const replayTarget=selected.terminal?selected.reward:m.add(selected.reward,m.mul(.99,replayNextValue));
  const replayDelta=m.sub(replayTarget,replayPrediction),replayStep=m.mul(.01,replayDelta);
  for(let j=0;j<71;j++)state.weights[selected.action][j]=m.max(-4,m.min(4,m.add(state.weights[selected.action][j],m.mul(replayStep,selected.phi[j]))));
  state.work.replayUpdates++;state.pending=null;
  if(terminal)for(const trace of state.eligibility)trace.fill(0);
  emit(structuredClone({record,prediction,nextValue,target,delta,replay:{experience:selected.experience,prediction:replayPrediction,
    nextValue:replayNextValue,target:replayTarget,delta:replayDelta}}));
}
export function chooseValueAction(state,own,emit=()=>{}){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&!state.awaitingObservation);
  assert.equal(own.tick,state.lastObservedTick+1);assert.ok(Number.isFinite(own.energy));
  const {base,phi}=valueFeatures(state,own.raw,own.observation);
  if(state.pending){assert.equal(state.pending.tick+1,own.tick);update(state,own.energy,phi,false,emit);}
  const {probabilities}=valuePrediction(state,phi),draw=unit(state,'rngState'),m=mathFor(state.work);
  let cumulative=0,action=3;
  for(let index=0;index<4;index++){cumulative=m.add(cumulative,probabilities[index]);if(m.less(draw,cumulative)){action=index;break;}}
  state.pending=state.acquisition?{tick:own.tick,phi:[...phi],action,initialEnergy:own.energy}:null;
  state.previous={inputs:base,action,tick:own.tick};state.decisions++;state.lastDecisionTick=own.tick;state.awaitingObservation=true;
  return action;
}
export function observeValueBody(state,own,emit=()=>{}){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&state.awaitingObservation);
  assert.equal(own.tick,state.lastDecisionTick);assert.equal(own.tick,state.lastObservedTick+1);
  assert.ok(Number.isFinite(own.energy)&&typeof own.terminal==='boolean');
  if(own.terminal&&state.pending)update(state,own.energy,Array(71).fill(0),true,emit);
  state.lastObservedTick=own.tick;state.awaitingObservation=false;state.dead=own.terminal;
}
export function freezeValueBody(state){assert.ok(!state.awaitingObservation);state.acquisition=false;state.pending=null;for(const trace of state.eligibility)trace.fill(0);}
export function resetValueBody(state){
  assert.ok(!state.awaitingObservation);state.weights=zeros();state.eligibility=zeros();state.previous=null;state.pending=null;
  state.recent=[];state.older=[];state.olderSeen=0;state.acquiredTransitions=0;
}
function checkRecord(state,r){
  assert.deepEqual(Object.keys(r).sort(),['agentId','tick','duration','phi','action','reward','nextPhi','terminal','initialEnergy','finalEnergy','experience'].sort());
  assert.equal(r.agentId,state.agentId);assert.ok(Number.isSafeInteger(r.tick)&&r.tick>0&&r.tick<=state.lastDecisionTick);
  assert.equal(r.duration,1);assert.ok(Number.isInteger(r.action)&&r.action>=0&&r.action<4);
  phiValid(r.phi);phiValid(r.nextPhi);assert.equal(typeof r.terminal,'boolean');
  assert.ok(Number.isFinite(r.initialEnergy)&&Number.isFinite(r.finalEnergy)&&Number.isFinite(r.reward));
  assert.ok(Math.abs(r.reward-(r.finalEnergy-r.initialEnergy)/120)<1e-15);
  if(r.terminal)assert.ok(r.nextPhi.every(v=>v===0));
  assert.ok(Number.isSafeInteger(r.experience)&&r.experience>state.transitions-state.acquiredTransitions&&r.experience<=state.transitions);
}
export function restoreValueBody(value){
  assert.equal(value?.schema,1);assert.equal(value.kind,'own-tick-linear-value');
  const sample=createValueBody(value.agentId,value.rngState,{lambda:value.config.lambda});
  assert.deepEqual(value.config,sample.config);assert.deepEqual(Object.keys(value).sort(),Object.keys(sample).sort());
  for(const key of ['rngState','retentionRngState','replayRngState'])assert.ok(Number.isInteger(value[key])&&value[key]>0&&value[key]<=0xffffffff);
  for(const key of ['decisions','transitions','acquiredTransitions','olderSeen','lastDecisionTick','lastObservedTick'])assert.ok(Number.isSafeInteger(value[key])&&value[key]>=0);
  for(const key of ['awaitingObservation','acquisition','dead'])assert.equal(typeof value[key],'boolean');
  assert.equal(value.decisions,value.lastDecisionTick);assert.equal(value.lastDecisionTick,value.lastObservedTick+(value.awaitingObservation?1:0));
  assert.ok(value.acquiredTransitions<=value.transitions&&value.transitions<=value.decisions);
  for(const key of ['weights','eligibility']){assert.ok(Array.isArray(value[key])&&value[key].length===4);for(const row of value[key])assert.ok(vector(row,71));}
  assert.ok(value.weights.every(row=>row.every(v=>Math.abs(v)<=4)));
  assert.equal(value.recent.length,Math.min(16,value.acquiredTransitions));assert.equal(value.olderSeen,Math.max(0,value.acquiredTransitions-16));
  assert.equal(value.older.length,Math.min(48,value.olderSeen));
  const records=[...value.older,...value.recent];assert.equal(new Set(records.map(r=>r.experience)).size,records.length);
  for(const record of records)checkRecord(value,record);
  value.recent.forEach((r,i)=>assert.equal(r.experience,value.transitions-value.recent.length+i+1));
  if(value.recent.length)for(const r of value.older)assert.ok(r.experience<value.recent[0].experience);
  if(value.previous!==null){assert.deepEqual(Object.keys(value.previous).sort(),['inputs','action','tick'].sort());assert.ok(vector(value.previous.inputs,33)&&value.previous.inputs.every(v=>Math.abs(v)<=1));assert.equal(value.previous.tick,value.lastDecisionTick);assert.ok(Number.isInteger(value.previous.action)&&value.previous.action>=0&&value.previous.action<4);}
  if(value.pending!==null){assert.deepEqual(Object.keys(value.pending).sort(),['tick','phi','action','initialEnergy'].sort());assert.ok(value.acquisition&&!value.dead);assert.equal(value.pending.tick,value.lastDecisionTick);phiValid(value.pending.phi);assert.ok(Number.isFinite(value.pending.initialEnergy));assert.ok(Number.isInteger(value.pending.action)&&value.pending.action>=0&&value.pending.action<4);}
  if(value.awaitingObservation&&value.acquisition)assert.notEqual(value.pending,null);
  assert.ok(!(value.dead&&value.awaitingObservation));
  if(value.dead||!value.acquisition){assert.equal(value.pending,null);assert.ok(value.eligibility.every(row=>row.every(v=>v===0)));}
  for(const key of ['scalarOperations','liveUpdates','replayUpdates'])assert.ok(Number.isSafeInteger(value.work[key])&&value.work[key]>=0);
  assert.deepEqual(Object.keys(value.work).sort(),['scalarOperations','liveUpdates','replayUpdates'].sort());
  assert.equal(value.work.liveUpdates,value.transitions);assert.equal(value.work.replayUpdates,value.transitions);
  for(const key of ['operationsBilled','outstandingEnergy','incurredEnergy','paidEnergy','storageBytes'])assert.ok(Number.isFinite(value.charge[key])&&value.charge[key]>=0);
  assert.deepEqual(Object.keys(value.charge).sort(),['operationsBilled','outstandingEnergy','incurredEnergy','paidEnergy','storageBytes'].sort());
  assert.ok(Number.isSafeInteger(value.charge.operationsBilled)&&Number.isSafeInteger(value.charge.storageBytes));
  assert.ok(value.charge.operationsBilled<=value.work.scalarOperations);
  assert.ok(Math.abs(value.charge.incurredEnergy-value.charge.paidEnergy-value.charge.outstandingEnergy)<1e-8);
  return structuredClone(value);
}
