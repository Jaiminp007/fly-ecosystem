import test from 'node:test';
import assert from 'node:assert/strict';
import {createOdorRoutedMotor,chooseOdorRoutedMotor,observeOdorRoutedMotor,freezeOdorRoutedMotor,resetOdorRoutedMotor} from '../learning/odor-routed-motor.mjs';

const raw=()=>{const value=Array(17).fill(0);value[16]=1;return value;};
const own=(tick,odorPresent,energy=65)=>({agentId:1,tick,energy,raw:raw(),contactPresent:false,odorPresent});
function step(state,tick,odorPresent,energy=65,options={}){
  const choice=chooseOdorRoutedMotor(state,own(tick,odorPresent,energy),options);
  observeOdorRoutedMotor(state,{agentId:1,tick,energy,terminal:false});return choice;
}
test('switch discards unresolved cross-context credit and retains separate own banks',()=>{
  const state=createOdorRoutedMotor(1,256101);
  step(state,1,true,65);const prior=structuredClone(state.banks.present.weights);
  step(state,2,false,64);assert.deepEqual(state.banks.present.weights,prior);
  assert.equal(state.banks.present.skippedBoundaryTransitions,1);assert.equal(state.switches,1);
  step(state,3,false,63);assert.equal(state.banks.absent.transitions,1);assert.equal(state.banks.present.transitions,0);
  assert.ok(state.banks.absent.memory.every(record=>record.agentId===1&&record.tick===2));
  assert.equal(state.work.scalarOperations,3+state.banks.present.work.scalarOperations+state.banks.absent.work.scalarOperations);
});
test('forced controls record the actual speed and never share foreign credit',()=>{
  const state=createOdorRoutedMotor(1,256102);
  const choice=step(state,1,false,65,{fixedMove:-1});assert.equal(choice.action,0);assert.equal(state.banks.absent.pending.action,0);
  step(state,2,false,64,{fixedMove:1});assert.equal(state.banks.absent.memory[0].action,0);
  assert.throws(()=>chooseOdorRoutedMotor(state,{...own(3,true),agentId:2}));
});
test('freeze and reset cover both banks while preserving paid work',()=>{
  const state=createOdorRoutedMotor(1,256103);step(state,1,true);step(state,2,true,64);step(state,3,false,63);step(state,4,false,62);
  freezeOdorRoutedMotor(state);const weights=structuredClone([state.banks.present.weights,state.banks.absent.weights]),work=state.work.scalarOperations;
  step(state,5,true,61);step(state,6,false,60);
  assert.deepEqual([state.banks.present.weights,state.banks.absent.weights],weights);assert.ok(state.work.scalarOperations>work);
  resetOdorRoutedMotor(state);assert.ok(Object.values(state.banks).every(bank=>bank.weights.flat().every(value=>value===0)&&bank.memory.length===0&&bank.acquisition));
});
test('terminal update remains in the active bank and continuation is exact',()=>{
  const state=createOdorRoutedMotor(1,256104);step(state,1,true);step(state,2,false,64);
  const copy=structuredClone(state);
  for(const item of [state,copy]){
    chooseOdorRoutedMotor(item,own(3,false,63));observeOdorRoutedMotor(item,{agentId:1,tick:3,energy:-.01,terminal:true});
  }
  assert.deepEqual(state,copy);assert.ok(state.dead&&state.banks.present.dead&&state.banks.absent.dead);
  assert.ok(state.banks.absent.memory.some(record=>record.terminal&&record.tick===3));assert.throws(()=>chooseOdorRoutedMotor(state,own(4,false)));
});
