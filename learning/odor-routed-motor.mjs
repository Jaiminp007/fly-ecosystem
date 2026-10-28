import assert from 'node:assert/strict';
import {createCoverageBody,chooseCoverageAction,observeCoverageBody,freezeCoverageBody,resetCoverageBody} from './coverage-sarsa.mjs';

export function createOdorRoutedMotor(agentId,seed){
  assert.ok(Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {schema:1,kind:'odor-routed-own-motor',agentId,route:null,acquisition:true,dead:false,lastDecisionTick:0,lastObservedTick:0,
    switches:0,work:{scalarOperations:0},banks:{present:createCoverageBody(agentId,seed),absent:createCoverageBody(agentId,(seed^0x629d7b31)>>>0||1)}};
}
function sync(state,bank,before){state.work.scalarOperations+=bank.work.scalarOperations-before;}
export function chooseOdorRoutedMotor(state,own,{fixedMove=null}={}){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead);assert.equal(own.tick,state.lastObservedTick+1);
  assert.notEqual(own.tick,state.lastDecisionTick);assert.equal(typeof own.odorPresent,'boolean');
  assert.ok(fixedMove===null||[-1,0,1].includes(fixedMove));
  const route=own.odorPresent?'present':'absent';state.work.scalarOperations++;
  if(state.route!==null&&state.route!==route){
    const old=state.banks[state.route],before=old.work.scalarOperations;
    if(old.pending){old.skippedBoundaryTransitions++;old.pending=null;}
    old.eligibility=Array.from({length:3},()=>Array(13).fill(0));old.work.scalarOperations+=40;
    sync(state,old,before);state.switches++;
  }
  state.route=route;const bank=state.banks[route],before=bank.work.scalarOperations;
  bank.lastObservedTick=own.tick-1;
  const choice=chooseCoverageAction(bank,own),proposed=choice.action,move=fixedMove??choice.move;
  if(fixedMove!==null&&bank.pending)bank.pending.action=move+1;
  sync(state,bank,before);state.lastDecisionTick=own.tick;
  return {...choice,proposed,action:move+1,move,route};
}
export function observeOdorRoutedMotor(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead);assert.equal(own.tick,state.lastDecisionTick);
  assert.equal(own.tick,state.lastObservedTick+1);assert.equal(typeof own.terminal,'boolean');
  const active=state.banks[state.route],before=active.work.scalarOperations;
  observeCoverageBody(active,own);sync(state,active,before);state.lastObservedTick=own.tick;
  if(own.terminal){
    const inactive=state.banks[state.route==='present'?'absent':'present'];assert.equal(inactive.pending,null);inactive.dead=true;state.dead=true;
  }
}
export function freezeOdorRoutedMotor(state){
  assert.ok(!state.dead);
  for(const bank of Object.values(state.banks)){const before=bank.work.scalarOperations;freezeCoverageBody(bank);sync(state,bank,before);}
  state.acquisition=false;
}
export function resetOdorRoutedMotor(state){
  assert.ok(!state.dead);
  for(const bank of Object.values(state.banks)){const before=bank.work.scalarOperations;resetCoverageBody(bank);sync(state,bank,before);}
  state.route=null;state.acquisition=true;
}
