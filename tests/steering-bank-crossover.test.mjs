import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installSteeringBankCrossover} from '../learning/steering-bank-crossover.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('paid crossover changes only selected shared and absent weights',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProjection:'project',spatialSelector:'incremental',cueTastePolicy:'shared-plus-cue'});
  run.advance(8);const original=run.checkpoint(false),shared=structuredClone(original),bank=structuredClone(original);
  for(const fly of original.world.world.flies){shared.state.learners[fly.id].steering.weights[0][0]=3;bank.state.learners[fly.id].steering.contextWeights[0][0][0]=4;bank.state.learners[fly.id].steering.contextWeights[1][0][0]=5;}
  const options={phase:'transfer',seed:1004137408,compactFrozen:true},same=OdorRoutedExperiment.fork(original,options),mixed=OdorRoutedExperiment.fork(original,options),prior=structuredClone(same.learners),world=same.world.checkpoint();
  installSteeringBankCrossover(same,original,original);installSteeringBankCrossover(mixed,shared,bank);
  assert.deepEqual(mixed.world.checkpoint(),world);
  for(const fly of same.world.flies){const left=same.learners[fly.id],right=mixed.learners[fly.id],before=prior[fly.id];
    assert.equal(left.work.scalarOperations-before.work.scalarOperations,304);assert.equal(right.work.scalarOperations-before.work.scalarOperations,304);assert.equal(left.charge.incurredEnergy,right.charge.incurredEnergy);
    assert.equal(right.steering.weights[0][0],3);assert.equal(right.steering.contextWeights[0][0][0],4);assert.equal(right.steering.contextWeights[1][0][0],before.steering.contextWeights[1][0][0]);
    assert.deepEqual(right.steering.projection,before.steering.projection);assert.deepEqual(right.cueTaste,before.cueTaste);assert.ok(right.charge.outstandingEnergy>=before.charge.outstandingEnergy);
  }
  const restored=OdorRoutedExperiment.restore(mixed.checkpoint());mixed.advance(5);restored.advance(5);assert.deepEqual(mixed.checkpoint(),restored.checkpoint());
});
