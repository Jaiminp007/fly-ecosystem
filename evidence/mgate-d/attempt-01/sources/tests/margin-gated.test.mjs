// M-GATE fixture tests (zero worlds). Frozen bars: plan V1 G5 + amendment V1a.
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
const rec=()=>({phi:Array(TASTE_DIMS).fill(0.1),target:1});
const run=(tau,bp,anchorStrength=1)=>{
  const s=mk(tau,bp,anchorStrength);
  tasteUpdate(s,rec(),'live',()=>{},1);
  return s;
};

test('defaults V3-compatible open (0) and old-checkpoint restore compat',()=>{
  assert.equal(TASTE_ENERGY_DEFAULTS.marginGateTau,0);
  const s=createTasteEnergyBody(11,11,{});
  assert.equal(s.config.marginGateTau,0);
  const old=createTasteEnergyBody(11,11,{slowAnchorRate:.5,slowAnchorStrength:1});
  delete old.config.marginGateTau;
  const r=restoreTasteEnergyBody(structuredClone(old));
  assert.equal(r.config.marginGateTau,0);
});

test('tau threshold: 0 open, null closed, 0.2 splits by margin',()=>{
  const open=run(0,0.9),closed=run(null,0.9);
  assert.notDeepEqual(open.weights.taste,closed.weights.taste);
  const hi=run(0.2,0.9); // margin 0.4 >= 0.2
  assert.deepEqual(hi.weights.taste,open.weights.taste);
  const lo=run(0.2,0.55); // margin 0.05 < 0.2
  assert.deepEqual(lo.weights.taste,closed.weights.taste);
});

test('null pending fail-closed (equals null-tau run)',()=>{
  const a=run(0,null),b=run(null,0.9);
  assert.deepEqual(a.weights.taste,b.weights.taste);
});

test('billing uniform: gate eval exactly 3 ops, anchor only when open',()=>{
  const g0=run(0,0.9),gi=run(null,0.9),base=run(0,0.9,0);
  assert.equal(gi.work.scalarOperations-base.work.scalarOperations,3);
  assert.equal(g0.work.scalarOperations,run(0.2,0.9).work.scalarOperations);
  assert.equal(gi.work.scalarOperations,run(0.2,0.55).work.scalarOperations);
});

test('invalid tau rejected (negative, NaN, Infinity)',()=>{
  assert.throws(()=>createTasteEnergyBody(11,11,{marginGateTau:-1}));
  assert.throws(()=>createTasteEnergyBody(11,11,{marginGateTau:NaN}));
  assert.throws(()=>createTasteEnergyBody(11,11,{marginGateTau:Infinity}));
});
