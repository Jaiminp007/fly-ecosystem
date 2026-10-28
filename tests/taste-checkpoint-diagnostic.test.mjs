import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnosticFeatures,diagnosticAcceptance,diagnosticScores} from '../learning/taste-checkpoint-diagnostic.mjs';

test('features and zero-weight prior match the taste policy',()=>{
  assert.deepEqual(diagnosticFeatures([1,-1,1,-1]),[1,1,-1,1,-1,-1,1,-1,-1,1,-1]);
  assert.ok(Math.abs(diagnosticAcceptance(Array(11).fill(0),[1,-1,1,-1])-.725)<1e-12);
});
test('diagnostic scores distinguish predictive and reversed cue weights',()=>{
  const cues=[{bits:[1,1,1,1],valence:1},{bits:[-1,1,1,1],valence:-1}],weights=Array(11).fill(0);weights[1]=8;
  const forward=diagnosticScores(weights,cues),reverse=diagnosticScores(weights.map(value=>-value),cues);
  assert.ok(forward.separation>0&&reverse.separation<0&&forward.logLoss<reverse.logLoss);
});
