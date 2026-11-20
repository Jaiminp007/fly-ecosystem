import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

// ODOR DEV ROUND 6 B2 soft-gated mixture (PLAN V1 §1-2, FROZEN).
// Two 2xD learning experts, hard-switched by the viability channel
// phi[D-2] (the R3 10-dim guard channel; viable>=0.5): go-branch acts
// and updates on viable ticks, stop-branch acts and updates on
// !viable ticks (same TD formula, rate, bounds as the live rule).
// Every non-forced tick sets pending on the ACTIVE branch, so
// stopped ticks resolve updates (no starvation — the R5 failure).
// Regime separation: the inactive branch never updates from a
// tick it did not act on. forcedAction (probe replay) overrides the
// gate, same as B1. Null-default: B1's module untouched by this file.
export const SOFT_GATED_DIMS=10;
export function createSoftGatedSteering(agentId,seed,dims=SOFT_GATED_DIMS){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  assert.equal(dims,SOFT_GATED_DIMS);
  const zeros=()=>Array.from({length:2},()=>Array(dims).fill(0));
  return {agentId,softGated:true,go:zeros(),stop:zeros(),pending:null,rngState:seed,
    acquisition:true,dead:false,lastDecisionTick:null,updates:0,work:{scalarOperations:0}};
}
function branchValues(branch,D,work,features){
  work.scalarOperations+=2*2*D;
  return branch.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*features[index],0));
}
function validateSoft(state,own,D){
  assert.equal(own.agentId,state.agentId);assert.ok(Number.isInteger(own.tick));
  assert.ok(Number.isFinite(own.energy));assert.ok(Array.isArray(own.features)&&own.features.length===D&&own.features.every(Number.isFinite));
  assert.equal(typeof own.midpointAvailable,'boolean');assert.ok(!state.dead);
}
function updateBranch(state,branch,energy,nextFeatures,available,terminal){
  const pending=state.pending;assert.ok(pending&&pending.branch===branch&&Number.isFinite(energy));
  const weights=state[branch],D=weights[0].length;
  const prediction=branchValues(weights,D,state.work,pending.features)[pending.action];
  const next=terminal?0:branchValues(weights,D,state.work,nextFeatures);
  const bootstrap=terminal?0:available?Math.max(...next):next[0];
  const reward=(energy-pending.energy)/120,delta=reward+Math.exp(-1/256)*bootstrap-prediction;
  state.work.scalarOperations+=9;
  for(let index=0;index<weights[pending.action].length;index++){
    const value=weights[pending.action][index]+.05*delta*pending.features[index];
    weights[pending.action][index]=Math.max(-8,Math.min(8,value));
  }
  state.work.scalarOperations+=5*weights[pending.action].length;state.updates++;state.pending=null;
}
export function chooseSoftGatedSteering(state,own,{forcedAction=null}={}){
  const D=state.go[0].length;validateSoft(state,own,D);
  assert.ok(forcedAction===null||forcedAction===0||forcedAction===1&&own.midpointAvailable);
  if(state.pending){assert.equal(own.tick,state.pending.tick+1);updateBranch(state,state.pending.branch,own.energy,own.features,own.midpointAvailable,false);}
  else if(state.lastDecisionTick!==null)assert.ok(own.tick>state.lastDecisionTick);
  const goPred=branchValues(state.go,D,state.work,own.features);
  const stopPred=branchValues(state.stop,D,state.work,own.features);
  const viable=own.features[D-2]>=.5;
  const active=viable?'go':'stop',pred=viable?goPred:stopPred;
  const best=own.midpointAvailable&&pred[1]>pred[0]?1:0;
  state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=9;
  const explored=state.acquisition&&own.midpointAvailable&&state.rngState/4294967296<.1?1-best:best;
  const action=forcedAction===null?explored:forcedAction;
  state.pending=(state.acquisition&&forcedAction===null)?{tick:own.tick,energy:own.energy,action,features:[...own.features],branch:active}:null;
  state.lastDecisionTick=own.tick;return {action,proposed:explored,predictions:pred,viable,branch:active};
}
export function terminateSoftGatedSteering(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&Number.isFinite(own.energy));
  if(state.pending){assert.equal(own.tick,state.pending.tick);updateBranch(state,state.pending.branch,own.energy,null,false,true);}
  state.dead=true;
}
export function freezeSoftGatedSteering(state){
  assert.ok(!state.dead);state.pending=null;state.acquisition=false;
}
export function resetSoftGatedSteering(state){
  assert.ok(!state.dead);for(const weights of state.go)weights.fill(0);for(const weights of state.stop)weights.fill(0);
  state.pending=null;state.work.scalarOperations+=2*2*state.go[0].length;
}
