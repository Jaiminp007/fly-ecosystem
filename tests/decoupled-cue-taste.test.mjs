import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecoupledCueTaste,learnDecoupledCueTaste,predictDecoupledCueTaste} from '../learning/decoupled-cue-taste.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

test('matched models remain identical and unseen cues preserve shared predictions',()=>{
  const first=createDecoupledCueTaste(1,12345),second=structuredClone(first),seen=[1,-1,1,-1],unseen=[-1,-1,1,-1];
  for(let tick=1;tick<=50;tick++){const factual={agentId:1,tick,cue:seen,target:1};assert.deepEqual(learnDecoupledCueTaste(first,factual),learnDecoupledCueTaste(second,factual));assert.deepEqual(first,second);assert.equal(encodedStateBytes(first),encodedStateBytes(second));}
  assert.equal(predictDecoupledCueTaste(first,unseen,'shared'),predictDecoupledCueTaste(first,unseen,'shared-plus-cue'));
  assert.notEqual(predictDecoupledCueTaste(first,seen,'shared'),predictDecoupledCueTaste(first,seen,'shared-plus-cue'));assert.equal(first.updates,100);
});
test('only factual own cue records enter updates',()=>{
  const state=createDecoupledCueTaste(1,55),example={agentId:1,tick:1,cue:[1,-1,1,-1],target:0};
  assert.throws(()=>learnDecoupledCueTaste(state,{...example,phase:'A'}));assert.throws(()=>learnDecoupledCueTaste(state,{...example,agentId:2}));assert.throws(()=>learnDecoupledCueTaste(state,{...example,cue:[0,0,0,0]}));learnDecoupledCueTaste(state,example);assert.throws(()=>learnDecoupledCueTaste(state,example));
});
