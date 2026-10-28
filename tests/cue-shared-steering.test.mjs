import test from 'node:test';
import assert from 'node:assert/strict';
import {cueSteeringRoute,createCueSharedSteering,chooseCueSharedSteering,terminateCueSharedSteering,freezeCueSharedSteering,resetCueSharedSteering} from '../learning/cue-shared-steering.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const features=[1,0,0,0,0,0,0,0],cueA=[-1,-1,-1,-1],cueB=[1,-1,-1,-1];
const own=(agentId,tick,energy,cue,midpointAvailable=true)=>({agentId,tick,energy,cue,features,midpointAvailable});
test('all 16 observed signed cues have distinct routes and absent is separate',()=>{
  const routes=new Set();for(let code=0;code<16;code++){const cue=Array.from({length:4},(_,index)=>(code>>index&1)?1:-1);routes.add(cueSteeringRoute(cue));}
  assert.equal(routes.size,16);assert.equal(cueSteeringRoute([0,0,0,0]),0);assert.throws(()=>cueSteeringRoute([0,1,1,1]));
});
test('cross-cue factual credit updates executed action, shared weights and prior cue only',()=>{
  const state=createCueSharedSteering(1,123456789),routeA=cueSteeringRoute(cueA),routeB=cueSteeringRoute(cueB);
  chooseCueSharedSteering(state,own(1,1,10,cueA),{forcedAction:1});
  chooseCueSharedSteering(state,own(1,2,11,cueB),{forcedAction:0});
  assert.equal(state.weights[1][0],.025/120);assert.equal(state.contextWeights[routeA][1][0],.025/120);
  assert.equal(state.contextWeights[routeB][1][0],0);assert.equal(state.contextWeights[routeA][0][0],0);
  assert.equal(state.pending.route,routeB);assert.equal(state.pending.action,0);assert.equal(state.updates,1);
  assert.throws(()=>chooseCueSharedSteering(state,own(2,3,11,cueA)));
  terminateCueSharedSteering(state,{agentId:1,tick:2,energy:0});assert.equal(state.updates,2);assert.ok(state.dead);
});
test('freeze, reset and JSON continuation keep all context banks explicit',()=>{
  const state=createCueSharedSteering(3,42);chooseCueSharedSteering(state,own(3,1,10,cueA));
  const restored=JSON.parse(JSON.stringify(state));assert.deepEqual(chooseCueSharedSteering(state,own(3,2,11,cueB)),chooseCueSharedSteering(restored,own(3,2,11,cueB)));assert.deepEqual(state,restored);
  assert.equal(state.contextWeights.length,17);assert.ok(encodedStateBytes(state)>2000);
  freezeCueSharedSteering(state);const before=structuredClone(state.contextWeights);chooseCueSharedSteering(state,own(3,3,12,[0,0,0,0]));assert.deepEqual(state.contextWeights,before);
  resetCueSharedSteering(state);assert.ok(state.weights.flat().every(value=>value===0));assert.ok(state.contextWeights.flat(2).every(value=>value===0));
});
