import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoverageBody,coverageFeatures,learnCoverageTransition,chooseCoverageAction,observeCoverageBody,freezeCoverageBody,resetCoverageBody} from '../learning/coverage-sarsa.mjs';

const raw=()=>{const values=Array(17).fill(0);values[16]=1;return values;};
test('all three commands have actual acquisition support and default/frozen ties favor full speed',()=>{
  const state=createCoverageBody(1,256101),counts=[0,0,0];
  for(let tick=1;tick<=512;tick++){
    const choice=chooseCoverageAction(state,{agentId:1,tick,raw:raw(),contactPresent:false,energy:65});counts[choice.action]++;
    assert.ok(choice.probability>0);observeCoverageBody(state,{agentId:1,tick,energy:65,terminal:false});
  }
  assert.ok(counts.every(count=>count>0));freezeCoverageBody(state);const before=structuredClone(state.weights);
  const choice=chooseCoverageAction(state,{agentId:1,tick:513,raw:raw(),contactPresent:false,energy:65});assert.equal(choice.move,1);assert.deepEqual(state.weights,before);
  assert.equal(state.skippedBoundaryTransitions,1);
});
test('only own actual transitions enter reservoir and terminal reward updates the executed action',()=>{
  const state=createCoverageBody(1,256102),phi=coverageFeatures(state,raw(),false),transition={agentId:1,tick:1,phi,nextPhi:Array(13).fill(0),action:2,reward:1,terminal:true};
  learnCoverageTransition(state,transition,{replay:false});assert.equal(state.weights[2][0],.05);assert.equal(state.weights[0][0],0);assert.equal(state.memory.length,1);
  assert.throws(()=>learnCoverageTransition(state,{...transition,agentId:2}));
  for(let index=0;index<64;index++)learnCoverageTransition(state,{...transition,tick:index+2},{replay:true});
  assert.equal(state.memory.length,32);assert.ok(state.memory.every(record=>record.agentId===1));assert.ok(state.work.scalarOperations>0);
  const work=state.work.scalarOperations;resetCoverageBody(state);assert.ok(state.weights.flat().every(weight=>weight===0));assert.equal(state.memory.length,0);assert.ok(state.work.scalarOperations>work);
});
test('exact serializable continuation and terminal completion preserve deterministic learning',()=>{
  const first=createCoverageBody(1,256103);
  chooseCoverageAction(first,{agentId:1,tick:1,raw:raw(),contactPresent:false,energy:65});observeCoverageBody(first,{agentId:1,tick:1,energy:64,terminal:false});
  const second=structuredClone(first);
  for(const state of [first,second]){
    chooseCoverageAction(state,{agentId:1,tick:2,raw:raw(),contactPresent:false,energy:64});observeCoverageBody(state,{agentId:1,tick:2,energy:-.01,terminal:true});
  }
  assert.deepEqual(first,second);assert.equal(first.pending,null);assert.ok(first.dead);assert.equal(first.transitions,2);
});
