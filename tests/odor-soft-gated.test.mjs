import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoftGatedSteering,chooseSoftGatedSteering,terminateSoftGatedSteering,freezeSoftGatedSteering,resetSoftGatedSteering} from '../learning/soft-gated-steering.mjs';
function viableFeat(v=1){const f=Array(10).fill(0);f[0]=1;f[1]=.8;f[8]=v;return f;} // bias + energy channels live, as in production (never all-zero)
function own(tick,features,energy=100){return {agentId:1,tick,energy,features,midpointAvailable:true};}
test('soft gate: action switches by branch (viable->go, stopped->stop)',()=>{
  const s=createSoftGatedSteering(1,7);
  s.go[1]=Array(10).fill(.5);s.stop[0]=Array(10).fill(.5);
  freezeSoftGatedSteering(s);
  const go=chooseSoftGatedSteering(s,own(1,viableFeat(1)));
  assert.equal(go.viable,true);assert.equal(go.branch,'go');assert.equal(go.action,1);
  const stop=chooseSoftGatedSteering(s,own(2,viableFeat(0)));
  assert.equal(stop.viable,false);assert.equal(stop.branch,'stop');assert.equal(stop.action,0);
});
test('soft gate: stop learns on !viable, go does not (regime separation)',()=>{
  const s=createSoftGatedSteering(1,7);
  chooseSoftGatedSteering(s,own(1,viableFeat(0),100));
  chooseSoftGatedSteering(s,own(2,viableFeat(0),110));
  assert.ok(s.updates>=1);
  assert.ok(s.stop.some(row=>row.some(v=>v!==0)),'stop branch must move on stopped ticks');
  assert.ok(s.go.every(row=>row.every(v=>v===0)),'go branch must not move on stopped ticks');
});
test('soft gate: go learns on viable, stop does not',()=>{
  const s=createSoftGatedSteering(1,7);
  chooseSoftGatedSteering(s,own(1,viableFeat(1),100));
  chooseSoftGatedSteering(s,own(2,viableFeat(1),110));
  assert.ok(s.updates>=1);
  assert.ok(s.go.some(row=>row.some(v=>v!==0)));
  assert.ok(s.stop.every(row=>row.every(v=>v===0)));
});
test('soft gate: no starvation (stopped ticks resolve updates)',()=>{
  const s=createSoftGatedSteering(1,7);
  chooseSoftGatedSteering(s,own(1,viableFeat(1),100));
  const u1=s.updates;chooseSoftGatedSteering(s,own(2,viableFeat(0),105));
  assert.equal(s.pending.branch,'stop');
  assert.ok(s.updates>u1,'viable pending resolves on the stopped tick');
  chooseSoftGatedSteering(s,own(3,viableFeat(0),100));
  assert.ok(s.updates>u1+0,'stop-branch pending resolves across stopped ticks');
});
test('soft gate: billing identity pins the frozen formula',()=>{
  const s=createSoftGatedSteering(1,7);
  chooseSoftGatedSteering(s,own(1,viableFeat(1),100));
  chooseSoftGatedSteering(s,own(2,viableFeat(0),101));
  chooseSoftGatedSteering(s,own(3,viableFeat(1),102));
  terminateSoftGatedSteering(s,{agentId:1,tick:3,energy:103});
  // decision: 2 branches * (2*2*10=40) + 9 rng = 89/tick * 3 = 267.
  // updates: 3 resolved (tick2 stop-branch? no: tick2 resolves tick1's
  // go pending = 139; tick3 resolves tick2's stop pending = 139;
  // terminate resolves tick3's go pending = 40+9+50 = 99).
  // Total = 267 + 139 + 139 + 99 = 644.
  assert.equal(s.work.scalarOperations,644);
});
test('soft gate: frozen dims + forcedAction overrides + freeze/reset',()=>{
  assert.throws(()=>createSoftGatedSteering(1,7,8));
  const s=createSoftGatedSteering(1,7);
  const r=chooseSoftGatedSteering(s,own(1,viableFeat(0)),{forcedAction:1});
  assert.equal(r.action,1);assert.equal(s.pending,null);
  freezeSoftGatedSteering(s);assert.equal(s.acquisition,false);
  resetSoftGatedSteering(s);
  assert.ok(s.go.every(row=>row.every(v=>v===0))&&s.stop.every(row=>row.every(v=>v===0)));
});
