import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

// ODOR DEV ROUND 5 B1 gated-pair steering head (PLAN V1 §1-2, FROZEN).
// Two 2xD linear branches (go/stop) + hard switch on the viability
// channel phi[D-2] (the R3 10-dim guard channel; viable>=0.5).
// Viable tick: identical machinery to chooseOwnSteering on the go
// branch (epsilon-greedy, pending, TD update next tick).
// Stopped tick (!viable): forced action 0, NO new pending; the stop
// branch is computed (honest billing) but never read for action and
// never updated (validated-but-unused: stays all-zero forever).
// Pending from a prior viable tick is still resolved on a stopped
// tick: that update belongs to the viable go-decision, not to the
// stopped tick (no NEW learning is created while stopped).
// forcedAction (probe replay) overrides the gate, same as legacy.
// Null-default: legacy own-steering path untouched by this module.
export const GATED_DIMS=10;
export function createGatedSteering(agentId,seed,dims=GATED_DIMS){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  assert.equal(dims,GATED_DIMS);
  const zeros=()=>Array.from({length:2},()=>Array(dims).fill(0));
  return {agentId,gatedPair:true,go:zeros(),stop:zeros(),pending:null,rngState:seed,
    acquisition:true,dead:false,lastDecisionTick:null,updates:0,work:{scalarOperations:0}};
}
function branchValues(branch,D,work,features){
  work.scalarOperations+=2*2*D;
  return branch.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*features[index],0));
}
function validateGated(state,own,D){
  assert.equal(own.agentId,state.agentId);assert.ok(Number.isInteger(own.tick));
  assert.ok(Number.isFinite(own.energy));assert.ok(Array.isArray(own.features)&&own.features.length===D&&own.features.every(Number.isFinite));
  assert.equal(typeof own.midpointAvailable,'boolean');assert.ok(!state.dead);
}
function updateGo(state,energy,nextFeatures,available,terminal){
  const pending=state.pending;assert.ok(pending&&Number.isFinite(energy));
  const prediction=branchValues(state.go,state.go[0].length,state.work,pending.features)[pending.action];
  const next=terminal?0:branchValues(state.go,state.go[0].length,state.work,nextFeatures);
  const bootstrap=terminal?0:available?Math.max(...next):next[0];
  const reward=(energy-pending.energy)/120,delta=reward+Math.exp(-1/256)*bootstrap-prediction;
  state.work.scalarOperations+=9;
  for(let index=0;index<state.go[pending.action].length;index++){
    const value=state.go[pending.action][index]+.05*delta*pending.features[index];
    state.go[pending.action][index]=Math.max(-8,Math.min(8,value));
  }
  state.work.scalarOperations+=5*state.go[pending.action].length;state.updates++;state.pending=null;
}
export function chooseGatedSteering(state,own,{forcedAction=null}={}){
  const D=state.go[0].length;validateGated(state,own,D);
  assert.ok(forcedAction===null||forcedAction===0||forcedAction===1&&own.midpointAvailable);
  if(state.pending){assert.equal(own.tick,state.pending.tick+1);updateGo(state,own.energy,own.features,own.midpointAvailable,false);}
  else if(state.lastDecisionTick!==null)assert.ok(own.tick>state.lastDecisionTick);
  const goPred=branchValues(state.go,D,state.work,own.features);
  const stopPred=branchValues(state.stop,D,state.work,own.features);
  assert.ok(stopPred.every(Number.isFinite));
  const viable=own.features[D-2]>=.5;
  const best=own.midpointAvailable&&goPred[1]>goPred[0]?1:0;
  state.rngState=advanceRng(state.rngState);state.work.scalarOperations+=9;
  const explored=state.acquisition&&own.midpointAvailable&&state.rngState/4294967296<.1?1-best:best;
  const action=forcedAction===null?(viable?explored:0):forcedAction;
  state.pending=(state.acquisition&&forcedAction===null&&viable)?{tick:own.tick,energy:own.energy,action,features:[...own.features]}:null;
  state.lastDecisionTick=own.tick;return {action,proposed:explored,predictions:goPred,viable};
}
export function terminateGatedSteering(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&Number.isFinite(own.energy));
  if(state.pending){assert.equal(own.tick,state.pending.tick);updateGo(state,own.energy,null,false,true);}
  state.dead=true;
}
export function freezeGatedSteering(state){
  assert.ok(!state.dead);state.pending=null;state.acquisition=false;
}
export function resetGatedSteering(state){
  assert.ok(!state.dead);for(const weights of state.go)weights.fill(0);for(const weights of state.stop)weights.fill(0);
  state.pending=null;state.work.scalarOperations+=2*2*state.go[0].length;
}
