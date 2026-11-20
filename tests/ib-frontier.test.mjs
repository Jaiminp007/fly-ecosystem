// IB-FRONTIER V1 fixtures (7/7 green required; synthetic tables only, zero bank worlds).
import test from 'node:test';
import assert from 'node:assert/strict';
import {cueArrays,identityValenceBits,rateCurve,effectiveK,ibFrontierOnFrozenRows} from '../scripts/ib-frontier.mjs';

test('valence-sufficient table: gap 0, k95 = k99 = 2',()=>{
  // Two harmful cues (turn .9) + two beneficial (turn .1): identity adds nothing over valence.
  const contact=[500,500,500,500], turn=[450,450,50,50], label=['harmful','harmful','beneficial','beneficial'];
  const iv=identityValenceBits(contact,turn,label,0);
  assert.ok(Math.abs(iv.gap)<1e-9);
  const curve=rateCurve(contact,turn,0);
  assert.equal(effectiveK(curve,0.95),2);
  assert.equal(effectiveK(curve,0.99),2);
});

test('cue-specific table: gap > 0 and k95 > 2',()=>{
  // Same valence, different rates: harmful cues turn .9 vs .5.
  const contact=[500,500,500], turn=[450,250,50], label=['harmful','harmful','beneficial'];
  const iv=identityValenceBits(contact,turn,label,0);
  assert.ok(iv.gap>0.02);
  const curve=rateCurve(contact,turn,0);
  assert.equal(effectiveK(curve,0.95),3);
});

test('curve monotonicity exact without smoothing',()=>{
  const contact=[300,300,300,300], turn=[270,200,100,30], label=['harmful','harmful','beneficial','beneficial'];
  const curve=rateCurve(contact,turn,0);
  for(let i=1;i<curve.length;i++)assert.ok(curve[i].bits<=curve[i-1].bits+1e-12);
  assert.equal(curve[0].k,4);
  assert.equal(curve[curve.length-1].k,1);
});

test('cueArrays parses, sorts, skips zero-contact, rejects malformed/labels',()=>{
  const a=cueArrays({
    'b':{contact:10,turn:3,beneficial:1,harmful:0,label:'beneficial'},
    'a':{contact:20,turn:19,beneficial:0,harmful:5,label:'harmful'},
    'z':{contact:0,turn:0,beneficial:0,harmful:0,label:'harmful'}});
  assert.deepEqual(a.keys,['a','b']);
  assert.deepEqual(a.turn,[19,3]);
  assert.throws(()=>cueArrays({'x':{contact:5,turn:6,beneficial:0,harmful:1,label:'harmful'}}),/Malformed/);
  assert.throws(()=>cueArrays({'x':{contact:5,turn:2,beneficial:0,harmful:1,label:'tied'}}),/Unknown/);
});

test('effectiveK edge cases: empty information and full-at-k1',()=>{
  assert.equal(effectiveK([{k:3,bits:0},{k:2,bits:0},{k:1,bits:0}],0.95),1);
  assert.equal(effectiveK([{k:2,bits:0.5},{k:1,bits:0.5}],0.95),1);
});

test('unlearned-like flat table: identity ~= 0 bits',()=>{
  const contact=[400,400,400,400], turn=[20,20,20,20], label=['harmful','harmful','beneficial','beneficial'];
  const iv=identityValenceBits(contact,turn,label);
  assert.ok(iv.identity<0.01&&iv.valence<0.01);
});

test('frozen rows: candidate gap < 0.05 (valence-sufficient), unlearned ~= 0, deterministic',()=>{
  const v=ibFrontierOnFrozenRows('evidence/turn-gated-dev/attempt-01/rows');
  assert.ok(v.candidate.gap<0.05);
  assert.equal(v.candidate.k95,2);
  assert.equal(v.candidate.k99,2);
  assert.equal(v.candidate.degenerate,false);
  assert.ok(v.unlearned.identityBits<0.01);
  assert.equal(v.unlearned.degenerate,true);
  const v2=ibFrontierOnFrozenRows('evidence/turn-gated-dev/attempt-01/rows');
  assert.deepEqual(v2,v);
});
