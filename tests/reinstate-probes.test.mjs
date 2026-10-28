// Fixture tests for the R1 reinstatement instrument (zero worlds).
// The probe path (runTasteProbe) is frozen code already covered by V2; these
// tests pin the pure subsystem-swap logic and the retention combination.
import assert from 'node:assert/strict';
import test from 'node:test';
import {buildReinstateClone,aMarginsOf} from '../scripts/reinstate-probes.mjs';

const learner=(taste,actor)=>({weights:{taste,actor,critic:[0,0]},eligibility:{actor:[0,0],critic:[0,0]},
  tasteScale:.25,priorLogit:1,tdRms:1,dead:false});
const anchor=learners=>({state:{codebook:{A:[{bits:[1,1,1,1],valence:1}]},learners}});

test('taste swap exchanges readout only, donor and recipient intact',()=>{
  const atC=anchor({f:learner([1,2],[3,4])}),atA=anchor({f:learner([9,9],[8,8])});
  const clone=buildReinstateClone(atC,atA,'taste');
  assert.deepEqual(clone.state.learners.f.weights.taste,[9,9]);
  assert.deepEqual(clone.state.learners.f.weights.actor,[3,4]);
  assert.deepEqual(atC.state.learners.f.weights.taste,[1,2]);
  assert.deepEqual(atA.state.learners.f.weights.taste,[9,9]);
});

test('motor swap exchanges actor/critic/eligibility/tdRms only',()=>{
  const atC=anchor({f:learner([1,2],[3,4])}),atA=anchor({f:learner([9,9],[8,8])});
  atA.state.learners.f.eligibility.actor=[5,5];atA.state.learners.f.tdRms=2;
  const clone=buildReinstateClone(atC,atA,'motor');
  assert.deepEqual(clone.state.learners.f.weights.actor,[8,8]);
  assert.deepEqual(clone.state.learners.f.weights.taste,[1,2]);
  assert.deepEqual(clone.state.learners.f.eligibility.actor,[5,5]);
  assert.equal(clone.state.learners.f.tdRms,2);
});

test('swap requires matched founders',()=>{
  assert.throws(()=>buildReinstateClone(anchor({f:learner([1],[2])}),anchor({g:learner([1],[2])}),'taste'));
});

test('margins are sign-correct on a trivial readout',()=>{
  const a=anchor({f:learner([10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0],[0,0])});
  const m=aMarginsOf(a);
  assert.ok(m.mean>0&&m.fracPos===1);
});
