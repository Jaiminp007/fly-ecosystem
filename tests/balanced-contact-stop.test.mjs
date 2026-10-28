import test from 'node:test';
import assert from 'node:assert/strict';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('matched selector records executed motor and factual stationary credit',()=>{
  let demonstrated=false;
  for(let seed=1;seed<=100&&!demonstrated;seed++){
    const spreadSeed=Math.imul(seed,2654435761)>>>0,states=[createOdorRoutedTasteBody(1,spreadSeed),createOdorRoutedTasteBody(1,spreadSeed)],own={agentId:1,tick:1,energy:80,raw:Array(17).fill(0),cue:[1,-1,1,-1],odorPresent:true,contactPresent:true,contactHomogeneous:true};
    const choices=states.map((state,index)=>chooseOdorRoutedTaste(state,own,{requireHomogeneousContact:true,contactStop:['shadow','stop'][index]}));
    assert.equal(states[0].work.scalarOperations,states[1].work.scalarOperations);assert.equal(encodedStateBytes(states[0]),encodedStateBytes(states[1]));assert.equal(choices[0].accept,choices[1].accept);assert.equal(choices[0].contactStop.eligible,choices[1].contactStop.eligible);
    for(const [index,state]of states.entries()){assert.equal(state.banks.present.pending.action,choices[index].action);assert.equal(state.credit.pending.action,(choices[index].move===-1?2:0)+(choices[index].accept?0:1));}
    if(choices[0].accept&&choices[0].move!==-1){assert.equal(choices[1].move,-1);for(const state of states)observeOdorRoutedTaste(state,{agentId:1,tick:1,energy:80,lastFood:.5,terminal:false});assert.equal(states[0].tasteExamples,0);assert.equal(states[1].tasteExamples,1);demonstrated=true;}
  }
  assert.ok(demonstrated);
});

test('no eligible contact leaves sampled actions unchanged',()=>{
  const states=[createOdorRoutedTasteBody(1,42),createOdorRoutedTasteBody(1,42)],own={agentId:1,tick:1,energy:80,raw:Array(17).fill(0),cue:[1,-1,1,-1],odorPresent:true,contactPresent:true,contactHomogeneous:false};
  const choices=states.map((state,index)=>chooseOdorRoutedTaste(state,own,{requireHomogeneousContact:true,contactStop:['shadow','stop'][index]}));
  assert.deepEqual(choices[0],choices[1]);assert.equal(choices[0].contactStop.eligible,false);assert.equal(states[0].work.scalarOperations,states[1].work.scalarOperations);
});

test('physical matched modes preserve first-step billing and checkpoint replay',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]},options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProtection:'protect',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe',cueTastePolicy:'shared-plus-cue',cueTasteReplay:'rbase'},runs=['shadow','stop'].map(contactStop=>{const run=new OdorRoutedExperiment(options);run.contactStop=contactStop;return run;}),events=[[],[]];
  for(const [index,run]of runs.entries())run.attach(event=>{if(event.type==='decision')events[index].push(event);});
  for(const run of runs)run.advance(1);for(let index=0;index<events[0].length;index++){assert.equal(events[0][index].requestedExtra,events[1][index].requestedExtra);assert.equal(events[0][index].storageBytes,events[1][index].storageBytes);}
  const restored=OdorRoutedExperiment.restore(runs[1].checkpoint());runs[1].attach(null);runs[1].advance(10);restored.advance(10);assert.deepEqual(runs[1].checkpoint(),restored.checkpoint());
});
