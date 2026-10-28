import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
function anchor(){
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',auditSnapshots:true});run.advance(15);
  const checkpoint=run.checkpoint(false);for(const [index,fly]of checkpoint.world.world.flies.entries()){fly.x=index<2?6:500;fly.y=300;fly.heading=index<2?Math.PI:0;}
  return checkpoint;
}
test('wall branch preserves first-step commands, RNG and bills actual retained state',()=>{
  const start=anchor(),events={baseline:[],shortcut:[]},settings={phase:'transfer',seed:1004137408,compactFrozen:true};
  const baseline=OdorRoutedExperiment.fork(start,{...settings,emit:event=>events.baseline.push(structuredClone(event))});
  const shortcut=OdorRoutedExperiment.fork(start,{...settings,wallShortcut:true,emit:event=>events.shortcut.push(structuredClone(event))});
  assert.deepEqual(shortcut.world.checkpoint(),baseline.world.checkpoint());
  for(const fly of shortcut.world.flies){const old=baseline.learners[fly.id],candidate=shortcut.learners[fly.id];assert.equal(candidate.work.scalarOperations-old.work.scalarOperations,1);assert.ok(candidate.wallSkip===false);}
  baseline.advance(1);shortcut.advance(1);const fast=events.shortcut.filter(event=>event.type==='decision'&&event.wallShortcut);
  assert.ok(fast.length>=1);assert.ok(events.shortcut.some(event=>event.type==='decision'&&!event.wallShortcut));
  for(const event of fast){
    const original=events.baseline.find(item=>item.type==='decision'&&item.id===event.id);
    assert.ok(original.guard.wall);assert.equal(original.available,false);assert.equal(original.steering.action,0);
    assert.deepEqual(event.outputs,original.outputs);assert.deepEqual(event.choice,original.choice);
    assert.equal(event.recommendation,null);assert.equal(event.features,null);assert.equal(event.steering.predictions,null);assert.equal(event.guard.viable,null);
    assert.equal(event.storageBytes,encodedStateBytes(event.auditState));assert.equal(shortcut.learners[event.id].steering.rngState,baseline.learners[event.id].steering.rngState);
    assert.equal(shortcut.learners[event.id].steering.lastDecisionTick,baseline.learners[event.id].steering.lastDecisionTick);
  }
});
test('shortcut forks retain identical saved models, debt and exact checkpoint continuation',()=>{
  const start=anchor(),settings={phase:'A',seed:1004137408,compactFrozen:true,wallShortcut:true};
  const current=OdorRoutedExperiment.fork(start,settings),saved=OdorRoutedExperiment.fork(start,{...settings,modelAnchor:start}),reset=OdorRoutedExperiment.fork(start,{...settings,mode:'reset'});
  assert.deepEqual(current.world.checkpoint(),saved.world.checkpoint());assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());
  for(const fly of current.world.flies){assert.deepEqual(current.learners[fly.id].steering.contextWeights,saved.learners[fly.id].steering.contextWeights);assert.equal(current.learners[fly.id].work.scalarOperations,saved.learners[fly.id].work.scalarOperations);}
  current.advance(10);const restored=OdorRoutedExperiment.restore(current.checkpoint());current.advance(10);restored.advance(10);assert.deepEqual(current.checkpoint(),restored.checkpoint());
  for(const fly of current.world.flies){current.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  current.advance(2);assert.equal(current.endpoint().survivors,0);assert.ok(current.endpoint().outstandingEnergy>0);
  for(const state of Object.values(current.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('shortcut refuses unsupported architecture',()=>{
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:2}});run.advance(2);
  assert.throws(()=>OdorRoutedExperiment.fork(run.checkpoint(false),{phase:'transfer',seed:1004137408,wallShortcut:true}));
});
