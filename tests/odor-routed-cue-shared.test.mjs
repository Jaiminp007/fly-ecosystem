import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental'};
test('cue-shared acquisition pays initial banks and restores exact physical continuation',()=>{
  const events=[],run=new OdorRoutedExperiment({...options,auditSnapshots:true,emit:event=>events.push(structuredClone(event))});
  for(const state of Object.values(run.learners)){assert.ok(state.work.scalarOperations>=288);assert.equal(state.steering.contextWeights.length,17);}
  run.advance(30);for(const event of events.filter(item=>item.type==='decision'))assert.equal(event.storageBytes,encodedStateBytes(event.auditState));
  for(const state of Object.values(run.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  const restored=OdorRoutedExperiment.restore(run.checkpoint());run.advance(20);restored.advance(20);assert.deepEqual(run.checkpoint(),restored.checkpoint());
});
test('matched saved/current/reset forks copy and bill every bank',()=>{
  const run=new OdorRoutedExperiment(options);run.advance(20);const earlier=run.checkpoint(false);run.advance(20);const later=run.checkpoint(false);
  for(const fly of later.world.world.flies)later.state.learners[fly.id].steering.contextWeights[1][0][0]=5;
  const settings={phase:'A',seed:1004137408},current=OdorRoutedExperiment.fork(later,settings),saved=OdorRoutedExperiment.fork(later,{...settings,modelAnchor:earlier}),reset=OdorRoutedExperiment.fork(later,{...settings,mode:'reset'});
  assert.deepEqual(current.world.checkpoint(),saved.world.checkpoint());assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());
  for(const fly of current.world.flies){
    const old=earlier.state.learners[fly.id].steering,now=current.learners[fly.id],prior=saved.learners[fly.id],empty=reset.learners[fly.id];
    assert.deepEqual(prior.steering.contextWeights,old.contextWeights);assert.equal(now.steering.contextWeights[1][0][0],5);
    assert.equal(now.work.scalarOperations,prior.work.scalarOperations);assert.equal(now.charge.incurredEnergy,prior.charge.incurredEnergy);
    assert.ok(empty.steering.contextWeights.flat(2).every(value=>value===0));assert.ok(empty.steering.weights.flat().every(value=>value===0));
  }
  const frozen=structuredClone(saved.learners);saved.advance(10);
  for(const fly of saved.world.flies)assert.deepEqual(saved.learners[fly.id].steering.contextWeights,frozen[fly.id].steering.contextWeights);
});
test('terminal work and compacted cue-shared weights remain owed and intact',()=>{
  const run=new OdorRoutedExperiment(options);run.advance(10);const anchor=run.checkpoint(false),probe=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,compactFrozen:true});
  for(const fly of probe.world.flies)assert.deepEqual(probe.learners[fly.id].steering.contextWeights,anchor.state.learners[fly.id].steering.contextWeights);
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);
  for(const state of Object.values(run.learners)){assert.ok(state.steering.dead);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
});
