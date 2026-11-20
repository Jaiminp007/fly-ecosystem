// TRACK-K1 fuse-first fixtures (zero bank worlds; synthetic states only).
// The budget fuse runs BEFORE any bank: kernelBill(capacity) + tick allowance
// vs the plan's per-tick-per-founder budget (8.0e9/12/1792/24 = 15503).
import test from 'node:test';
import assert from 'node:assert/strict';
import {KC_PROGRAM,KC_CAPACITY,KC_DIMS,KC_TICK_INPUTS,KC_PROJECTION,
  projectKernelInputs,kernelPredictBill,kernelUpdateBill,kernelBill,
  kernelFitsBudget,KC_TICK_ALLOWANCE,createKernelCriticBody,carryKernelState,
  restoreKernelCriticBody,resetKernelCriticBody} from '../learning/tick-kernel-critic.mjs';

test('projection is frozen-deterministic, shaped, bounded',()=>{
  assert.equal(KC_PROJECTION.length,20);
  assert.ok(KC_PROJECTION.every(r=>r.length===33&&r.every(v=>v>=-1&&v<=1)));
  const x=Array.from({length:33},(_,i)=>((i*37)%11)/5-1);
  const a=projectKernelInputs(x),b=projectKernelInputs(x);
  assert.deepEqual(a,b);
  assert.equal(a.length,20);
  assert.ok(a.every(v=>v>-1&&v<1));
});

test('billing decomposition is exact (hand-computed; V1A capacity 64)',()=>{
  assert.equal(kernelPredictBill(0),5);
  assert.equal(kernelPredictBill(1),69);
  assert.equal(kernelPredictBill(64),4101);
  assert.equal(kernelUpdateBill(0),80);
  assert.equal(kernelUpdateBill(1),144);
  assert.equal(kernelUpdateBill(64),4176);
  for(const r of [0,1,2,32,64])
    assert.equal(kernelBill(r),2*kernelPredictBill(r)+kernelUpdateBill(r));
  assert.equal(kernelBill(0),90);
  assert.equal(kernelBill(1),282);
  assert.equal(kernelBill(64),12378);
});

test('construction carries the accepted program at accepted capacity',()=>{
  const s=createKernelCriticBody(3,12345);
  assert.equal(s.kind,'tick-kernel-critic-v1');
  assert.equal(s.weights.length,161);
  assert.deepEqual(s.kernel.program,KC_PROGRAM);
  assert.equal(s.kernel.capacity,KC_CAPACITY);
  assert.equal(s.kernel.records.length,0);
});

test('restore round-trips a fresh body; reset renews weights and kernel',()=>{
  const s=createKernelCriticBody(3,12345);
  const back=restoreKernelCriticBody(structuredClone(s));
  assert.equal(back.kind,'tick-kernel-critic-v1');
  resetKernelCriticBody(s);
  assert.equal(s.kernel.records.length,0);
  assert.equal(s.kernel.coefficients.length,0);
});

test('BUDGET FUSE re-run at V1A capacity (fits; 256 would fire — V1-ledgered)',()=>{
  const perTickPerFounder=Math.floor(8000000000/12/1792/24);
  assert.equal(perTickPerFounder,15500);
  assert.equal(KC_CAPACITY,64);
  assert.equal(kernelBill(64),12378);
  assert.equal(kernelFitsBudget(64,perTickPerFounder),true);
  assert.ok(kernelBill(64)+KC_TICK_ALLOWANCE<=perTickPerFounder);
  assert.throws(()=>kernelBill(70),/capacity bounds/);
  assert.throws(()=>kernelBill(256),/capacity bounds/);
});

test('carryKernelState carries coefficients and clears records (transplant rule)',()=>{
  const carried=carryKernelState({records: [{input: [1],target: 0.5},{input: [2],target: -0.5}],coefficients: [0.3,-0.2]});
  assert.deepEqual(carried.records,[]);
  assert.deepEqual(carried.coefficients,[0.3,-0.2]);
  const empty=carryKernelState({records: [],coefficients: []});
  assert.deepEqual(empty,{records: [],coefficients: []});
  assert.throws(()=>carryKernelState({records: [{input: [1],target: 0}],coefficients: []}),/agentId|assert|mismatch|Error/);
});
