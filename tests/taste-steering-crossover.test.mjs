import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installTasteSteeringCrossover} from '../learning/taste-steering-crossover.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('component crossover preserves physical state and charges equal real model copies',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter'});
  run.advance(4);const first=run.checkpoint(false),second=structuredClone(first);
  for(const fly of second.world.world.flies){second.state.learners[fly.id].taste.weights[0]=2;second.state.learners[fly.id].steering.contextWeights[0][1][0]=3;}
  const options={phase:'A',seed:1004137408,modelAnchor:first,compactFrozen:true},same=OdorRoutedExperiment.fork(first,options),mixed=OdorRoutedExperiment.fork(first,options);
  const before=structuredClone(same.learners),physical=same.world.checkpoint();installTasteSteeringCrossover(same,first,first);installTasteSteeringCrossover(mixed,second,first);
  assert.deepEqual(same.world.checkpoint(),physical);assert.deepEqual(mixed.world.checkpoint(),physical);
  for(const fly of same.world.flies){const original=before[fly.id],left=same.learners[fly.id],right=mixed.learners[fly.id];
    assert.equal(left.work.scalarOperations-original.work.scalarOperations,299);assert.equal(right.work.scalarOperations-original.work.scalarOperations,299);
    assert.equal(left.charge.incurredEnergy,right.charge.incurredEnergy);assert.equal(right.taste.weights[0],2);assert.deepEqual(right.steering.contextWeights,left.steering.contextWeights);
    assert.deepEqual(right.banks.present.weights,left.banks.present.weights);assert.equal(left.charge.operationsBilled,left.work.scalarOperations);
  }
  const restored=OdorRoutedExperiment.restore(mixed.checkpoint());mixed.advance(5);restored.advance(5);assert.deepEqual(mixed.checkpoint(),restored.checkpoint());
});

test('cue taste crossover copies and bills both factual model components',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter',cueTastePolicy:'shared-plus-cue'});
  run.advance(4);const first=run.checkpoint(false),second=structuredClone(first);
  for(const fly of second.world.world.flies){second.state.learners[fly.id].cueTaste.weights[0]=2;second.state.learners[fly.id].cueTaste.residuals[0]=3;}
  const options={phase:'A',seed:1004137408,modelAnchor:first,compactFrozen:true},same=OdorRoutedExperiment.fork(first,options),mixed=OdorRoutedExperiment.fork(first,options);
  const before=structuredClone(same.learners),physical=same.world.checkpoint();installTasteSteeringCrossover(same,first,first);installTasteSteeringCrossover(mixed,second,first);
  assert.deepEqual(mixed.world.checkpoint(),physical);
  for(const fly of same.world.flies){const original=before[fly.id],left=same.learners[fly.id],right=mixed.learners[fly.id];
    assert.equal(left.work.scalarOperations-original.work.scalarOperations,326);assert.equal(right.work.scalarOperations-original.work.scalarOperations,326);
    assert.equal(left.charge.incurredEnergy,right.charge.incurredEnergy);assert.ok(left.charge.outstandingEnergy>=original.charge.outstandingEnergy);
    assert.equal(right.cueTaste.weights[0],2);assert.equal(right.cueTaste.residuals[0],3);assert.deepEqual(right.steering.weights,left.steering.weights);
    assert.equal(left.charge.operationsBilled,left.work.scalarOperations);
  }
  const restored=OdorRoutedExperiment.restore(mixed.checkpoint());mixed.advance(5);restored.advance(5);assert.deepEqual(mixed.checkpoint(),restored.checkpoint());
});
