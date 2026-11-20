// MAXENT-BASELINE V1 fixtures (6/6 green required; synthetic tables only, zero bank worlds).
import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateCueTable,mutualInformationBits,scoreArmBits,maxentBaselineOnFrozenRows,MAXENT_ALPHA} from '../scripts/maxent-baseline.mjs';

test('exact bits on a hand-checkable 2x2 table',()=>{
  // H=100 (Th=80), B=100 (Tb=20), alpha=0 -> closed form.
  const I=mutualInformationBits(100,80,100,20,0);
  // p(turn|harm)=.8, p(turn|ben)=.2, marginal .5: I = 1 - H(.8) bits.
  const h=p=>-(p*Math.log2(p)+(1-p)*Math.log2(1-p));
  assert.ok(Math.abs(I-(1-h(0.8)))<1e-12);
});

test('Laplace smoothing handles zero cells without NaN',()=>{
  const I=mutualInformationBits(50,50,50,0); // beneficial never turns
  assert.ok(Number.isFinite(I)&&I>0);
  const I0=mutualInformationBits(0,0,0,0); // empty table -> uniform prior -> 0 bits
  assert.ok(Math.abs(I0)<1e-12);
});

test('marginal-matched MaxEnt null has I identically 0 and matches the marginal',()=>{
  const s=scoreArmBits(1000,810,1000,50);
  assert.ok(Math.abs(s.pTurnHarm-0.81)<1e-12);
  assert.ok(Math.abs(s.pTurnBen-0.05)<1e-12);
  assert.equal(s.maxEntNull.bits,0);
  assert.equal(s.maxEntNull.pTurnHarm,s.pTurn);
  assert.equal(s.maxEntNull.pTurnBen,s.pTurn);
  assert.ok(Math.abs(s.bits-0.0)>0.3); // strong discrimination carries substantial bits
});

test('unlearned-like flat table carries ~0 bits',()=>{
  const s=scoreArmBits(1000,400,1000,400); // identical rates -> no information
  assert.ok(s.bits<0.01);
});

test('aggregateCueTable parses labels and skips zero-contact cues, rejects malformed',()=>{
  const a=aggregateCueTable({
    '1,1,-1,-1':{contact:100,turn:5,beneficial:50,harmful:0,label:'beneficial'},
    '-1,1,-1,1':{contact:100,turn:95,beneficial:0,harmful:40,label:'harmful'},
    '0,0,0,0':{contact:0,turn:0,beneficial:0,harmful:0,label:'harmful'}});
  assert.deepEqual(a,{H:100,Th:95,B:100,Tb:5});
  assert.throws(()=>aggregateCueTable({'x':{contact:10,turn:11,beneficial:0,harmful:1,label:'harmful'}}),/Malformed/);
  assert.throws(()=>aggregateCueTable({'x':{contact:10,turn:5,beneficial:0,harmful:1,label:'tied'}}),/Unknown/);
});

test('frozen TURN-GATE V1 rows read deterministically with unlearned ~0 bits (consistency)',()=>{
  const v=maxentBaselineOnFrozenRows('evidence/turn-gated-dev/attempt-01/rows');
  assert.ok(v.candidate.bits>0.3); // headline discrimination is information-rich
  assert.ok(v.unlearned.bits<0.05); // flat behavior ~= MaxEnt null (pre-registered check)
  assert.ok(v.candidate.pTurnHarm>0.5&&v.candidate.pTurnBen<0.5);
  const v2=maxentBaselineOnFrozenRows('evidence/turn-gated-dev/attempt-01/rows');
  assert.deepEqual(v2,v); // deterministic recomputation
});
