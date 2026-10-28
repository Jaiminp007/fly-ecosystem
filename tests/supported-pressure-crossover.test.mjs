import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installTasteSteeringCrossover} from '../learning/taste-steering-crossover.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('supported factorial copies only paid taste and steering models',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProtection:'protect',spatialSelector:'incremental',cueTastePolicy:'shared-plus-cue'});run.advance(8);
  const anchor=run.checkpoint(false),taste=structuredClone(anchor),steering=structuredClone(anchor);
  for(const fly of anchor.world.world.flies){taste.state.learners[fly.id].cueTaste.weights[0]=2;steering.state.learners[fly.id].steering.contextWeights[1][0][0]=3;}
  const options={phase:'A',seed:1004137408,modelAnchor:anchor,compactFrozen:true},same=OdorRoutedExperiment.fork(anchor,options),mixed=OdorRoutedExperiment.fork(anchor,options),before=structuredClone(same.learners),world=same.world.checkpoint();
  installTasteSteeringCrossover(same,anchor,anchor);installTasteSteeringCrossover(mixed,taste,steering);assert.deepEqual(mixed.world.checkpoint(),world);
  for(const fly of same.world.flies){const left=same.learners[fly.id],right=mixed.learners[fly.id],prior=before[fly.id];assert.equal(left.work.scalarOperations-prior.work.scalarOperations,326);assert.equal(right.work.scalarOperations-prior.work.scalarOperations,326);assert.equal(left.charge.incurredEnergy,right.charge.incurredEnergy);
    assert.equal(right.cueTaste.weights[0],2);assert.equal(right.steering.contextWeights[1][0][0],3);assert.deepEqual(right.steering.support,prior.steering.support);assert.ok(right.charge.outstandingEnergy>=prior.charge.outstandingEnergy);}
  const invalid=structuredClone(anchor);invalid.state.steeringProtection='control';assert.throws(()=>installTasteSteeringCrossover(mixed,invalid,anchor));
  const restored=OdorRoutedExperiment.restore(mixed.checkpoint());mixed.advance(5);restored.advance(5);assert.deepEqual(mixed.checkpoint(),restored.checkpoint());
});
