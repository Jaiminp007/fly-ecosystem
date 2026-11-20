import test from 'node:test';
import assert from 'node:assert/strict';
import {createGatedSteering,chooseGatedSteering,terminateGatedSteering,freezeGatedSteering,resetGatedSteering} from '../learning/gated-steering.mjs';
function viableFeat(v=1){const f=Array(10).fill(0);f[8]=v;return f;}
function own(tick,features,energy=100){return {agentId:1,tick,energy,features,midpointAvailable:true};}
test('gated pair: gate switches (viable->go argmax, stopped->0)',()=>{
  const s=createGatedSteering(1,7);s.go[1]=Array(10).fill(.5);
  freezeGatedSteering(s); // deterministic: no epsilon-explore, no pending
  const go=chooseGatedSteering(s,own(1,viableFeat(1)));
  assert.equal(go.viable,true);assert.equal(go.action,1);
  const stop=chooseGatedSteering(s,own(2,viableFeat(0)));
  assert.equal(stop.viable,false);assert.equal(stop.action,0);
});
test('gated pair: stop branch validated-but-unused (all-zero forever)',()=>{
  const s=createGatedSteering(1,7);
  let energy=100;
  for(let t=1;t<=12;t++){energy+=t%2?1:-1;chooseGatedSteering(s,own(t,viableFeat(t%3===0?0:1),energy));}
  assert.ok(s.stop.every(row=>row.every(v=>v===0)));
  assert.ok(s.updates>0);
});
test('gated pair: go branch learns on viable ticks only',()=>{
  const s=createGatedSteering(1,7);
  const before=s.work.scalarOperations;
  chooseGatedSteering(s,own(1,viableFeat(1),100));
  assert.equal(s.pending===null,false);
  chooseGatedSteering(s,own(2,viableFeat(1),110));
  assert.ok(s.updates>=1);assert.ok(s.work.scalarOperations>before);
  const u1=s.updates;chooseGatedSteering(s,own(3,viableFeat(0),105));
  assert.equal(s.pending,null);assert.equal(s.updates,u1+1);
});
test('gated pair: billing identity pins the frozen formula',()=>{
  const s=createGatedSteering(1,7);
  chooseGatedSteering(s,own(1,viableFeat(1),100));
  chooseGatedSteering(s,own(2,viableFeat(1),101));
  chooseGatedSteering(s,own(3,viableFeat(0),102));
  terminateGatedSteering(s,{agentId:1,tick:3,energy:103});
  // decision: 2 branches * (2*2*D=40) + 9 rng = 89/tick * 3 = 267.
  // updates: 2 resolved (tick2 live + tick3 stopped-tick resolving
  // tick2's viable pending): live = 40+40+9+50 = 139 each.
  // terminate: pending null. Total = 267 + 278 = 545.
  assert.equal(s.work.scalarOperations,545);
});
test('gated pair: frozen dims + forcedAction overrides gate',()=>{
  assert.throws(()=>createGatedSteering(1,7,8));
  const s=createGatedSteering(1,7);
  const r=chooseGatedSteering(s,own(1,viableFeat(0)),{forcedAction:1});
  assert.equal(r.action,1);assert.equal(s.pending,null);
});
test('gated pair: freeze/reset semantics',()=>{
  const s=createGatedSteering(1,7);
  chooseGatedSteering(s,own(1,viableFeat(1),100));
  freezeGatedSteering(s);assert.equal(s.acquisition,false);assert.equal(s.pending,null);
  resetGatedSteering(s);
  assert.ok(s.go.every(row=>row.every(v=>v===0)));
});
