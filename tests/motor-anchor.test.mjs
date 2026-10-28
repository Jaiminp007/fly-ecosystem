import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteEnergyBody,progressUpdate,restoreTasteEnergyBody,resetTasteEnergyBody} from '../learning/taste-energy.mjs';

// M-ACTOR motor anchor: synthetic checks only (seeds 378001+, auto-excluded
// from future banks by the numeric-token scan). No worlds, no banks.
const N=16; // shared motorRepresentation default dimensions
const phi=(j,v)=>Array.from({length:N},(_,k)=>k===j?v:0.05*(k+1));
const pend=(j,v)=>({cruise:true,contactPresent:false,tick:1,phi:phi(j,v),baseProbability:.6,probability:.59,initialEnergy:10,proximity:1});
const step=(s,j=0,v=.5)=>{s.motorPending=pend(j,v);progressUpdate(s,12,[0,0,0,0],false,()=>{});};
const cos=(a,b)=>a.reduce((s,v,j)=>s+v*b[j],0)/Math.sqrt(a.reduce((s,v)=>s+v*v,0)*b.reduce((s,v)=>s+v*v,0));
const opts=()=>({holdTicks:1,motorRule:'progress'});

test('motor anchor default off is bit-identical to Gen1 (weights and billing)',()=>{
  const a=createTasteEnergyBody(378001,378001,opts()),b=createTasteEnergyBody(378001,378001,{...opts(),motorAnchorRate:0,motorAnchorStrength:0});
  assert.equal(a.weights.slowMotorDir,undefined);assert.equal(b.weights.slowMotorDir,undefined);
  for(let k=0;k<20;k++){step(a,k%N);step(b,k%N);}
  assert.deepEqual(b.weights,a.weights);assert.deepEqual(b.work,a.work);
});

test('motor anchor on bills extra ops and moves the trajectory',()=>{
  const c=createTasteEnergyBody(378002,378002,opts()),d=createTasteEnergyBody(378002,378002,{...opts(),motorAnchorRate:1e-3,motorAnchorStrength:.08});
  assert.ok(Array.isArray(d.weights.slowMotorDir)&&d.weights.slowMotorDir.every(v=>v===0));
  for(let k=0;k<20;k++){step(c,k%N);step(d,k%N);}
  assert.ok(d.work.scalarOperations>c.work.scalarOperations);
  assert.ok(d.weights.actor.some((v,j)=>v!==c.weights.actor[j]));
  assert.ok(d.weights.actor.every(Number.isFinite)&&d.weights.slowMotorDir.every(Number.isFinite));
});

test('motor anchor pull is rotation-only: raises alignment faster than control',()=>{
  const mk=lam=>createTasteEnergyBody(378003,378003,lam>0?{...opts(),motorAnchorRate:1e-3,motorAnchorStrength:lam}:opts());
  const c=mk(0),d=mk(.08);
  for(const s of [c,d]){s.weights.actor=[1,...Array(N-1).fill(0)];}
  d.weights.slowMotorDir=[0,1,...Array(N-2).fill(0)];
  const target=[0,1,...Array(N-2).fill(0)],cos0=cos(d.weights.actor,d.weights.slowMotorDir);
  step(c);step(d);
  const dc=cos(c.weights.actor,target)-cos0,dd=cos(d.weights.actor,d.weights.slowMotorDir)-cos0;
  assert.ok(dd>dc&&dd>0);
});

test('zero slow norm skips the pull (no NaN) while the EMA tracks',()=>{
  const s=createTasteEnergyBody(378004,378004,{...opts(),motorAnchorRate:1e-3,motorAnchorStrength:.08});
  step(s);
  assert.ok(s.weights.actor.every(Number.isFinite));
  assert.ok(s.weights.slowMotorDir.some(v=>v!==0));
  assert.ok(s.weights.slowMotorDir.every(v=>Math.abs(v)<=8));
});

test('motor anchor state survives checkpoint restore and clears on reset',()=>{
  let s=createTasteEnergyBody(378005,378005,{...opts(),motorAnchorRate:1e-3,motorAnchorStrength:.02});
  for(let k=0;k<5;k++)step(s,k);
  s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  assert.ok(s.weights.slowMotorDir.some(v=>v!==0));
  resetTasteEnergyBody(s);
  assert.ok(s.weights.actor.every(v=>v===0)&&s.weights.slowMotorDir.every(v=>v===0));
});

test('motor anchor rejects dead or out-of-scope combos',()=>{
  assert.throws(()=>createTasteEnergyBody(378006,378006,{...opts(),motorAnchorRate:0,motorAnchorStrength:.02}),/.*/);
  assert.throws(()=>createTasteEnergyBody(378006,378006,{...opts(),motorAnchorRate:1e-3,motorAnchorStrength:.02,streams:2}),/.*/);
  assert.throws(()=>createTasteEnergyBody(378006,378006,{...opts(),motorAnchorRate:1e-3,motorAnchorStrength:.02,phaseSlots:2}),/.*/);
});
