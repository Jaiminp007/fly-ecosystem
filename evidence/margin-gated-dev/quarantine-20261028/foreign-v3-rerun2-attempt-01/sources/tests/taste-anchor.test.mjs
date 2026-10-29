import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteEnergyBody,tasteUpdate,restoreTasteEnergyBody,resetTasteEnergyBody} from '../learning/taste-energy.mjs';

// V3 slow-direction anchor: synthetic checks only (seeds 377001+, auto-excluded
// from future banks by the numeric-token scan). No worlds, no banks.
const rec=(j,v)=>({phi:Array.from({length:11},(_,k)=>k===j?v:0.1*(k+1)),target:1});
const cos=(a,b)=>a.reduce((s,v,j)=>s+v*b[j],0)/Math.sqrt(a.reduce((s,v)=>s+v*v,0)*b.reduce((s,v)=>s+v*v,0));

test('anchor default off is bit-identical to Gen1 (weights and billing)',()=>{
  const a=createTasteEnergyBody(377001,377001),b=createTasteEnergyBody(377001,377001,{slowAnchorRate:0,slowAnchorStrength:0});
  assert.equal(a.weights.slowDir,undefined);assert.equal(b.weights.slowDir,undefined);
  for(let k=0;k<20;k++){tasteUpdate(a,rec(k%11,.5),'live',()=>{});tasteUpdate(b,rec(k%11,.5),'live',()=>{});}
  assert.deepEqual(b.weights,a.weights);assert.deepEqual(b.work,a.work);
});

test('anchor on bills extra ops and moves the trajectory',()=>{
  const c=createTasteEnergyBody(377002,377002),d=createTasteEnergyBody(377002,377002,{slowAnchorRate:1e-3,slowAnchorStrength:.08});
  d.motorPending={tick:1,phi:Array(16).fill(0),cruise:true,baseProbability:0.9,probability:0.9,initialEnergy:50}; // fail-closed gate needs a pending decision
  assert.ok(Array.isArray(d.weights.slowDir)&&d.weights.slowDir.every(v=>v===0));
  for(let k=0;k<20;k++){tasteUpdate(c,rec(k%11,.5),'live',()=>{});tasteUpdate(d,rec(k%11,.5),'live',()=>{});}
  assert.ok(d.work.scalarOperations>c.work.scalarOperations);
  assert.ok(d.weights.taste.some((v,j)=>v!==c.weights.taste[j]));
  assert.ok(d.weights.taste.every(Number.isFinite)&&d.weights.slowDir.every(Number.isFinite));
});

test('anchor pull is rotation-only: raises alignment faster than control',()=>{
  const mk=lam=>{const s=createTasteEnergyBody(377003,377003,lam>0?{slowAnchorRate:1e-3,slowAnchorStrength:lam}:{});return s;};
  const run=(s,steps)=>{for(let k=0;k<steps;k++)tasteUpdate(s,{phi:Array.from({length:11},(_,j)=>j===0?.5:.05*(j+1)),target:1},'live',()=>{});};
  const c=mk(0),d=mk(.08);
  for(const s of [c,d]){s.weights.taste=[1,...Array(10).fill(0)];}
  d.motorPending={tick:1,phi:Array(16).fill(0),cruise:true,baseProbability:0.9,probability:0.9,initialEnergy:50}; // fail-closed gate needs a pending decision
  d.weights.slowDir=[0,1,...Array(9).fill(0)];
  const cos0=cos(d.weights.taste,d.weights.slowDir);
  run(c,1);run(d,1);
  const dc=cos(c.weights.taste,[0,1,...Array(9).fill(0)])-cos0;
  const dd=cos(d.weights.taste,d.weights.slowDir)-cos0;
  assert.ok(dd>dc&&dd>0);
});

test('zero slow norm skips the pull (no NaN) while the EMA tracks',()=>{
  const s=createTasteEnergyBody(377004,377004,{slowAnchorRate:1e-3,slowAnchorStrength:.08});
  s.motorPending={tick:1,phi:Array(16).fill(0),cruise:true,baseProbability:0.9,probability:0.9,initialEnergy:50}; // fail-closed gate needs a pending decision
  tasteUpdate(s,rec(0,.5),'live',()=>{});
  assert.ok(s.weights.taste.every(Number.isFinite));
  assert.ok(s.weights.slowDir.some(v=>v!==0));
  assert.ok(s.weights.slowDir.every(v=>Math.abs(v)<=8));
});

test('anchor state survives checkpoint restore and clears on reset',()=>{
  let s=createTasteEnergyBody(377005,377005,{slowAnchorRate:1e-3,slowAnchorStrength:.02});
  s.motorPending={tick:1,phi:Array(16).fill(0),cruise:true,baseProbability:0.9,probability:0.9,initialEnergy:50}; // fail-closed gate needs a pending decision
  for(let k=0;k<5;k++)tasteUpdate(s,rec(k,.5),'replay',()=>{});
  s.motorPending=null; // synthetic pending opened the gate; restore sees probe-like clean state
  s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  assert.ok(s.weights.slowDir.some(v=>v!==0));
  resetTasteEnergyBody(s);
  assert.ok(s.weights.taste.every(v=>v===0)&&s.weights.slowDir.every(v=>v===0));
});

test('anchor rejects dead or out-of-scope combos',()=>{
  assert.throws(()=>createTasteEnergyBody(377006,377006,{slowAnchorRate:0,slowAnchorStrength:.02}),/.*/);
  assert.throws(()=>createTasteEnergyBody(377006,377006,{slowAnchorRate:1e-3,slowAnchorStrength:.02,streams:2}),/.*/);
  assert.throws(()=>createTasteEnergyBody(377006,377006,{slowAnchorRate:1e-3,slowAnchorStrength:.02,phaseSlots:2}),/.*/);
});
