import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecoupledCueTaste,learnDecoupledCueTaste} from '../learning/decoupled-cue-taste.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('balanced and reservoir controls use matched own buffers, RNG and work',()=>{
  const models=['rbase','blend'].map(()=>createDecoupledCueTaste(1,12345));let selectedDifferent=false;
  for(let tick=1;tick<=30;tick++){
    const example={agentId:1,tick,cue:tick%2?[1,-1,1,-1]:[-1,1,-1,1],target:tick%2},choices=models.map((model,index)=>learnDecoupledCueTaste(model,example,{replayPolicy:['rbase','blend'][index]}));
    assert.deepEqual(choices[0],choices[1]);const choice=choices[0];if(choice.coinRecent&&models[0].recent[choice.recentIndex].tick!==models[0].reservoir[choice.reservoirIndex].tick)selectedDifferent=true;
    assert.deepEqual(models[0].reservoir,models[1].reservoir);assert.deepEqual(models[0].recent,models[1].recent);assert.equal(models[0].rngState,models[1].rngState);assert.equal(models[0].work.scalarOperations,models[1].work.scalarOperations);assert.equal(encodedStateBytes(models[0]),encodedStateBytes(models[1]));
  }
  assert.ok(selectedDifferent);assert.notDeepEqual(models[0].weights,models[1].weights);assert.ok(models[1].reservoir.every(record=>record.agentId===1));
});

test('physical balanced modes match first-step prices and restore frozen probes',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]},options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProtection:'protect',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe',cueTastePolicy:'shared-plus-cue'};
  const runs=['rbase','blend'].map(cueTasteReplay=>new OdorRoutedExperiment({...options,cueTasteReplay,auditSnapshots:true})),events=[[],[]];
  for(const [index,run]of runs.entries())run.attach(event=>{if(event.type==='decision'){events[index].push(event);assert.equal(event.storageBytes,encodedStateBytes(event.auditState));}});
  assert.deepEqual(runs[0].world.checkpoint(),runs[1].world.checkpoint());for(const run of runs)run.advance(1);
  for(let index=0;index<events[0].length;index++){assert.equal(events[0][index].storageBytes,events[1][index].storageBytes);assert.equal(events[0][index].requestedExtra,events[1][index].requestedExtra);}
  const run=runs[1];run.advance(8);const anchor=run.checkpoint(false),probe=OdorRoutedExperiment.fork(anchor,{phase:'A',seed:1004137408,mode:'reset',compactFrozen:true});
  for(const fly of probe.world.flies){const state=probe.learners[fly.id];assert.ok(state.cueTaste.weights.every(value=>value===0));assert.ok(state.charge.incurredEnergy>=anchor.state.learners[fly.id].charge.incurredEnergy);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
  const restored=OdorRoutedExperiment.restore(probe.checkpoint());probe.advance(5);restored.advance(5);assert.deepEqual(probe.checkpoint(),restored.checkpoint());
});
