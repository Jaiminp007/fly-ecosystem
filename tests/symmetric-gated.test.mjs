// S-GATE fixture tests (zero worlds). Frozen bars: plan V1 G3/G5.
// Masked apply: compute-always + apply-gated. Billing constant at identical
// states; application is the only behavioral difference.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteEnergyBody,tasteUpdate,restoreTasteEnergyBody,TASTE_ENERGY_DEFAULTS} from '../learning/taste-energy.mjs';

const TASTE_DIMS=TASTE_ENERGY_DEFAULTS.tasteDimensions;
const mk=(tau,bp,anchorStrength=1)=>{
  const s=createTasteEnergyBody(11,11,{slowAnchorRate:.5,slowAnchorStrength:anchorStrength,marginGateTau:tau});
  s.weights.taste=Array.from({length:TASTE_DIMS},(_,j)=>(j%2?0.3:-0.2));
  if(anchorStrength>0)s.weights.slowDir=Array(TASTE_DIMS).fill(0.1);
  s.motorPending=bp===null?null:{tick:1,phi:Array(16).fill(0),cruise:true,baseProbability:bp,probability:bp,initialEnergy:50};
  return s;
};
const rec=(j=0)=>({phi:Array.from({length:TASTE_DIMS},(_,k)=>k===j?0.5:0.1*(k+1)),target:1});
const runN=(tau,bp,n,anchorStrength=1)=>{
  const s=mk(tau,bp,anchorStrength);
  for(let k=0;k<n;k++)tasteUpdate(s,rec(k%TASTE_DIMS),'live',()=>{},1);
  return s;
};

test('tau 0.3 splits: margin .35 opens (equals tau-0), margin .2 closes (equals null)',()=>{
  const open=runN(0.3,0.85,1),refOpen=runN(0,0.85,1);
  assert.deepEqual(open.weights.taste,refOpen.weights.taste);
  assert.equal(open.work.scalarOperations,refOpen.work.scalarOperations);
  const shut=runN(0.3,0.7,1),refShut=runN(null,0.7,1);
  assert.deepEqual(shut.weights.taste,refShut.weights.taste);
  assert.equal(shut.work.scalarOperations,refShut.work.scalarOperations);
  assert.notDeepEqual(open.weights.taste,shut.weights.taste);
});

test('billing stays symmetric under divergence (20 updates from zero slowDir)',()=>{
  const open=runN(0,0.9,20),shut=runN(null,0.9,20);
  assert.notDeepEqual(open.weights.taste,shut.weights.taste);
  assert.notDeepEqual(open.weights.slowDir,shut.weights.slowDir); // EMA tracks in both
  assert.equal(open.work.scalarOperations,shut.work.scalarOperations);
});

test('null fail-closed through masked path (equals null-tau, ops included)',()=>{
  const a=runN(0,null,1),b=runN(null,0.9,1);
  assert.deepEqual(a.weights.taste,b.weights.taste);
  assert.equal(a.work.scalarOperations,b.work.scalarOperations);
});

test('tau 0.3 survives JSON checkpoint restore with identical behavior',()=>{
  const pend=()=>({tick:1,phi:Array(16).fill(0),cruise:true,baseProbability:0.85,probability:0.85,initialEnergy:50});
  const s=mk(0.3,0.85);s.motorPending=null; // synthetic pending is not restore-valid; config round-trip is what's tested
  const r=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  assert.equal(r.config.marginGateTau,0.3);
  s.motorPending=pend();r.motorPending=pend();
  tasteUpdate(s,rec(),'live',()=>{},1);tasteUpdate(r,rec(),'live',()=>{},1);
  assert.deepEqual(r.weights.taste,s.weights.taste);
  assert.equal(r.work.scalarOperations,s.work.scalarOperations);
});
