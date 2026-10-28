import test from 'node:test';
import assert from 'node:assert/strict';
import {createCueSharedSteering,freezeCueSharedSteering} from '../learning/cue-shared-steering.mjs';
import {certifyFrozenNativeSteering} from '../learning/native-steering-certificate.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

function exact(state,context,known,distance,bearing){
  const features=[...known,distance,bearing];return state.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+state.contextWeights[context][action][index])*features[index],0));
}
test('wall proof and strict score margin never certify a tie',()=>{
  const state=createCueSharedSteering(1,2),raw=Array(17).fill(0),work={scalarOperations:0},scratch={};freezeCueSharedSteering(state);
  assert.equal(certifyFrozenNativeSteering(state,{raw,energy:10},work,scratch),false);raw[10]=1;
  assert.equal(certifyFrozenNativeSteering(state,{raw,energy:10},work,scratch),true);assert.equal(scratch.reason,1);assert.ok(encodedStateBytes(scratch)>0);
  raw[10]=0;state.weights[0][0]=1;assert.equal(certifyFrozenNativeSteering(state,{raw,energy:10},work,scratch),true);assert.equal(scratch.reason,2);
});
test('safe certificates imply native action for every cue and spatial extreme',()=>{
  let seed=846231;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  let successes=0;
  for(let trial=0;trial<500;trial++){
    const state=createCueSharedSteering(1,trial+1);freezeCueSharedSteering(state);
    for(const row of state.weights)for(let index=0;index<8;index++)row[index]=(random()-.5)*2;
    for(const bank of state.contextWeights)for(const row of bank)for(let index=0;index<8;index++)row[index]=(random()-.5)*.1;
    if(trial%2===0)state.weights[0][0]+=4;
    const raw=Array(17).fill(0);raw[12]=2*random()-1;raw[13]=2*random()-1;const energy=120*random(),work={scalarOperations:0},scratch={};
    const safe=certifyFrozenNativeSteering(state,{raw,energy},work,scratch);if(!safe)continue;successes++;
    const known=[1,energy/120,0,0,raw[13],raw[12]];
    for(let route=0;route<17;route++)for(const distance of [0,1])for(const bearing of [-1,1]){const values=exact(state,route,known,distance,bearing);assert.ok(values[0]>=values[1]);}
  }
  assert.ok(successes>100);
});
test('training is rejected and invalid observations fall back',()=>{
  const state=createCueSharedSteering(1,1),raw=Array(17).fill(0);
  assert.throws(()=>certifyFrozenNativeSteering(state,{raw,energy:1},{scalarOperations:0},{}));freezeCueSharedSteering(state);
  raw[0]=NaN;assert.equal(certifyFrozenNativeSteering(state,{raw,energy:1},{scalarOperations:0},{}),false);
});
