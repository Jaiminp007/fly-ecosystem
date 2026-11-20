// Track-T1 module fixtures: taste-kernel construction/bounds/billing/carry/dispatch/targets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteKernelBody,tasteKernelPrediction,carryTasteKernelState,chooseTasteKernelAction,observeTasteKernelBody,TASTE_KERNEL_PROGRAM,TK_CAPACITY,tasteKernelBill,TK_FUSE_BILL} from '../learning/taste-kernel.mjs';
import {TASTE_ARMS} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {beginStationaryTasteAction} from '../learning/stationary-taste-credit.mjs';
import {updateKernel} from '../learning/kernel-learner.mjs';

test('taste-kernel construction: program/capacity/dims/linear-frozen',()=>{
  const w=createTasteKernelBody(7,12345,{...BT_LEARNER_OPTIONS});
  assert.equal(w.kind,'taste-kernel-v1');
  assert.deepEqual(w.kernel.program,TASTE_KERNEL_PROGRAM);
  assert.equal(w.kernel.capacity,TK_CAPACITY);
  assert.equal(w.kernel.dimensions,w.config.tasteDimensions);
  assert.equal(w.config.tasteLearning,false);
  assert.equal(w.kernel.records.length,0);
});
test('taste-kernel phi bounded by construction (orthogonal 16-dim)',()=>{
  const w=createTasteKernelBody(7,12345,{...BT_LEARNER_OPTIONS});
  assert.equal(w.config.tasteDimensions,16);
  assert.ok(Math.abs(w.tasteScale-1/Math.sqrt(16))<1e-15);
});
test('taste-kernel billing exactness + fuse fits allowance',()=>{
  assert.equal(tasteKernelBill(64),2*(64*64+5)+(64*64+80));
  assert.equal(TK_FUSE_BILL,12378);
  assert.ok(TK_FUSE_BILL+2000<=15500,'fuse must fit per-tick-per-founder allowance (V1A math)');
});
test('taste-kernel arm registered; candidate still maps to linear path',()=>{
  assert.ok(TASTE_ARMS.includes('tasteKernel'));
  assert.ok(TASTE_ARMS.includes('candidate'));
});
test('taste-kernel carry: coefficients carried, records cleared',()=>{
  const w=createTasteKernelBody(7,12345,{...BT_LEARNER_OPTIONS});
  const phi=Array(16).fill(0.1);phi[0]=1;
  updateKernel(w.kernel,phi,1);updateKernel(w.kernel,phi.map(v=>-v),0);
  assert.equal(w.kernel.records.length,2);
  assert.equal(w.kernel.seen,2);
  const carried=carryTasteKernelState(w);
  assert.equal(carried.records.length,0);
  assert.equal(carried.seen,2);
  assert.equal(carried.capacity,TK_CAPACITY);
  assert.deepEqual(carried.coefficients.slice(0,2),w.kernel.coefficients.slice(0,2));
});
test('taste-kernel synthetic choose-observe cycle runs clean',()=>{
  const w=createTasteKernelBody(3,999,{...BT_LEARNER_OPTIONS});
  const raw=Array(17).fill(0);raw[16]=1;raw[3]=0.5;
  const own={agentId:3,tick:1,energy:65,raw,cue:[1,1,-1,-1],contactPresent:true,odorPresent:true};
  const action=chooseTasteKernelAction(w,own,()=>{});
  assert.ok([0,1,2,3].includes(action));
  assert.equal(w.awaitingObservation,true);
  const p=tasteKernelPrediction(w,Array(16).fill(0));
  assert.ok(p>=0&&p<=1,'mapped prediction in [0,1]');
});
test('taste-kernel targets binary through observe path',()=>{
  const w=createTasteKernelBody(5,777,{...BT_LEARNER_OPTIONS});
  const t=w,cue=[1,-1,1,-1];
  if(t.balance)t.balance.before=65;
  t.lastDecisionTick=1;t.lastObservedTick=0;t.awaitingObservation=true;
  beginStationaryTasteAction(t.credit,{agentId:5,tick:1,action:2,cue,contactPresent:true});
  observeTasteKernelBody(w,{agentId:5,tick:1,energy:66,terminal:false,lastFood:0.5},()=>{});
  assert.equal(w.kernel.records.length,1);
  assert.equal(w.kernel.records[0].target,1);
  t.lastDecisionTick=2;t.lastObservedTick=1;t.awaitingObservation=true;
  beginStationaryTasteAction(t.credit,{agentId:5,tick:2,action:2,cue,contactPresent:true});
  observeTasteKernelBody(w,{agentId:5,tick:2,energy:64,terminal:false,lastFood:-0.3},()=>{});
  assert.equal(w.kernel.records.length,2);
  assert.equal(w.kernel.records[1].target,0);
  assert.ok(w.kernel.records.every(r=>r.target===0||r.target===1),'targets binary');
});
