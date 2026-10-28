import test from 'node:test';
import assert from 'node:assert/strict';
import {createCueResidualTaste,learnCueResidualTaste,predictCueResidualTaste} from '../learning/cue-residual-taste.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

test('shadow and active residuals have matched memory, draws and declared work',()=>{
  const shared=createCueResidualTaste(1,12345),active=structuredClone(shared);let different=false;
  for(let tick=1;tick<=100;tick++){const example={agentId:1,tick,cue:tick%2?[1,-1,1,-1]:[-1,-1,1,-1],target:Number(tick%2===1)};
    const first=learnCueResidualTaste(shared,example,'shared'),second=learnCueResidualTaste(active,example,'shared-plus-cue');assert.deepEqual(first,second);
    assert.deepEqual(shared.reservoir,active.reservoir);assert.deepEqual(shared.recent,active.recent);assert.equal(shared.rngState,active.rngState);assert.equal(shared.work.scalarOperations,active.work.scalarOperations);assert.equal(encodedStateBytes(shared),encodedStateBytes(active));
    different ||= predictCueResidualTaste(shared,example.cue,'shared')!==predictCueResidualTaste(active,example.cue,'shared-plus-cue');
  }
  assert.ok(different);assert.equal(shared.residuals.length,16);assert.equal(shared.updates,200);assert.equal(active.updates,200);
});
test('rejects phase metadata, foreign owners and absent cues',()=>{
  const state=createCueResidualTaste(1,12345),example={agentId:1,tick:1,cue:[1,-1,1,-1],target:1};
  assert.throws(()=>learnCueResidualTaste(state,{...example,phase:'A'},'shared'));assert.throws(()=>learnCueResidualTaste(state,{...example,agentId:2},'shared'));assert.throws(()=>learnCueResidualTaste(state,{...example,cue:[0,0,0,0]},'shared'));
  learnCueResidualTaste(state,example,'shared');assert.throws(()=>learnCueResidualTaste(state,example,'shared'));
});
