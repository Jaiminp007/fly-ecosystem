import test from 'node:test';
import assert from 'node:assert/strict';
import {createTwoTimescaleTaste,learnTwoTimescaleTaste} from '../learning/two-timescale-taste.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

test('replay variants share factual stores, RNG and costs while differing only in selection',()=>{
  const uniform=createTwoTimescaleTaste(7,12345),recent=structuredClone(uniform);let differences=0;
  for(let tick=1;tick<=100;tick++){const example={agentId:7,tick,cue:tick%2?[1,-1,1,-1]:[-1,1,-1,1],target:Number(tick%3===0)};
    const left=learnTwoTimescaleTaste(uniform,example,'uniform'),right=learnTwoTimescaleTaste(recent,example,'recent-mix');differences+=Number(left.replayTick!==right.replayTick);
    assert.deepEqual(uniform.reservoir,recent.reservoir);assert.deepEqual(uniform.recent,recent.recent);assert.equal(uniform.rngState,recent.rngState);assert.equal(uniform.work.scalarOperations,recent.work.scalarOperations);assert.equal(encodedStateBytes(uniform),encodedStateBytes(recent));
  }
  assert.ok(differences>0);assert.equal(uniform.reservoir.length,32);assert.equal(uniform.recent.length,8);assert.equal(uniform.updates,200);assert.equal(recent.updates,200);
});
test('rejects foreign identities, stale ticks, invalid cues and unknown policy',()=>{
  const state=createTwoTimescaleTaste(7,12345),example={agentId:7,tick:1,cue:[1,-1,1,-1],target:1};
  assert.throws(()=>learnTwoTimescaleTaste(state,{...example,agentId:8},'uniform'));assert.throws(()=>learnTwoTimescaleTaste(state,{...example,cue:[0,0,0,0]},'uniform'));assert.throws(()=>learnTwoTimescaleTaste(state,example,'oracle'));
  assert.throws(()=>learnTwoTimescaleTaste(state,{...example,phase:'B'},'uniform'));
  learnTwoTimescaleTaste(state,example,'uniform');assert.throws(()=>learnTwoTimescaleTaste(state,example,'uniform'));
});
