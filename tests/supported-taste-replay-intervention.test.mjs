import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecoupledCueTaste,learnDecoupledCueTaste} from '../learning/decoupled-cue-taste.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('matched replay policies consume identical factual buffers and work',()=>{
  const models=['mixed','fresh'].map(()=>createDecoupledCueTaste(1,1)),examples=[{agentId:1,tick:1,cue:[1,1,1,1],target:0},{agentId:1,tick:2,cue:[-1,-1,-1,-1],target:1}];let selected;
  for(const example of examples){const choices=models.map((model,index)=>learnDecoupledCueTaste(model,example,{replayPolicy:['mixed','fresh'][index]}));assert.deepEqual(choices[0],choices[1]);selected=choices[0];}
  assert.equal(selected.replayTick,1);assert.deepEqual(models[0].reservoir,models[1].reservoir);assert.deepEqual(models[0].recent,models[1].recent);assert.equal(models[0].rngState,models[1].rngState);assert.equal(models[0].work.scalarOperations,models[1].work.scalarOperations);assert.equal(encodedStateBytes(models[0]),encodedStateBytes(models[1]));
  assert.notDeepEqual(models[0].weights,models[1].weights);assert.notEqual(models[0].residuals[15],models[1].residuals[15]);
});

test('physical replay modes preserve matching costs, provenance and reset debt',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]},options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProtection:'protect',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe',cueTastePolicy:'shared-plus-cue'};
  const runs=['mixed','fresh'].map(cueTasteReplay=>new OdorRoutedExperiment({...options,cueTasteReplay,auditSnapshots:true})),events=[[],[]];
  for(const [index,run]of runs.entries())run.attach(event=>{if(event.type==='decision'){events[index].push(event);assert.equal(event.storageBytes,encodedStateBytes(event.auditState));}});
  assert.deepEqual(runs[0].world.checkpoint(),runs[1].world.checkpoint());for(const run of runs)run.advance(1);
  for(let index=0;index<events[0].length;index++){assert.equal(events[0][index].storageBytes,events[1][index].storageBytes);assert.equal(events[0][index].requestedExtra,events[1][index].requestedExtra);}
  const run=runs[1];run.advance(8);const anchor=run.checkpoint(false),bad=structuredClone(anchor);bad.state.cueTasteReplay='mixed';assert.throws(()=>OdorRoutedExperiment.fork(anchor,{phase:'A',seed:1004137408,modelAnchor:bad}));
  const probe=OdorRoutedExperiment.fork(anchor,{phase:'A',seed:1004137408,mode:'reset',compactFrozen:true});for(const fly of probe.world.flies){const state=probe.learners[fly.id];assert.ok(state.cueTaste.weights.every(value=>value===0));assert.ok(state.charge.incurredEnergy>=anchor.state.learners[fly.id].charge.incurredEnergy);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
  const restored=OdorRoutedExperiment.restore(probe.checkpoint());probe.advance(5);restored.advance(5);assert.deepEqual(probe.checkpoint(),restored.checkpoint());
});
