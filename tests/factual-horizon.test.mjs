import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactualHorizon,observeFactualDecision,terminateFactualHorizon,censorFactualHorizon} from '../learning/factual-horizon.mjs';

test('labels become available only after the complete factual horizon',()=>{
  const state=createFactualHorizon(1,3);
  for(let tick=1;tick<=3;tick++)assert.deepEqual(observeFactualDecision(state,{agentId:1,tick,energy:tick,action:tick%2}),[]);
  const records=observeFactualDecision(state,{agentId:1,tick:4,energy:4,action:0});
  assert.equal(records.length,1);assert.equal(records[0].prior.tick,1);assert.equal(records[0].target,3/120);assert.equal(records[0].terminal,false);
  assert.equal(censorFactualHorizon(state),3);assert.throws(()=>observeFactualDecision(state,{agentId:2,tick:5,energy:5}));
});
test('terminal budget energy absorbs every unresolved own action once',()=>{
  const state=createFactualHorizon(7,16);
  observeFactualDecision(state,{agentId:7,tick:1,energy:10});observeFactualDecision(state,{agentId:7,tick:2,energy:8});
  const records=terminateFactualHorizon(state,{agentId:7,tick:2,energy:-.1});
  assert.equal(records.length,2);assert.deepEqual(records.map(record=>record.target),[(-.1-10)/120,(-.1-8)/120]);
  assert.ok(records.every(record=>record.terminal));assert.equal(censorFactualHorizon(state),0);
  assert.throws(()=>terminateFactualHorizon(state,{agentId:7,tick:2,energy:0}));
});
