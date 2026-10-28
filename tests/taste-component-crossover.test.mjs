import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installTasteComponentCrossover} from '../learning/taste-component-crossover.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('shared and residual assignments retain steering, world and matching charges',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]},run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProtection:'protect',spatialSelector:'incremental',cueTastePolicy:'shared-plus-cue'});run.advance(8);const anchor=run.checkpoint(false),shared=structuredClone(anchor),residual=structuredClone(anchor);for(const fly of anchor.world.world.flies){shared.state.learners[fly.id].cueTaste.weights[0]=2;residual.state.learners[fly.id].cueTaste.residuals[0]=3;}
  const options={phase:'A',seed:1004137408,modelAnchor:anchor,compactFrozen:true},same=OdorRoutedExperiment.fork(anchor,options),mixed=OdorRoutedExperiment.fork(anchor,options),before=structuredClone(same.learners),world=same.world.checkpoint();installTasteComponentCrossover(same,anchor,anchor);installTasteComponentCrossover(mixed,shared,residual);assert.deepEqual(mixed.world.checkpoint(),world);
  for(const fly of same.world.flies){const left=same.learners[fly.id],right=mixed.learners[fly.id],prior=before[fly.id];assert.equal(left.work.scalarOperations-prior.work.scalarOperations,27);assert.equal(right.work.scalarOperations-prior.work.scalarOperations,27);assert.equal(left.charge.incurredEnergy,right.charge.incurredEnergy);assert.equal(right.cueTaste.weights[0],2);assert.equal(right.cueTaste.residuals[0],3);assert.deepEqual(right.steering,prior.steering);assert.ok(right.charge.outstandingEnergy>=prior.charge.outstandingEnergy);}
  const invalid=structuredClone(anchor);invalid.state.cueTastePolicy='shared';assert.throws(()=>installTasteComponentCrossover(mixed,invalid,anchor));const restored=OdorRoutedExperiment.restore(mixed.checkpoint());mixed.advance(5);restored.advance(5);assert.deepEqual(mixed.checkpoint(),restored.checkpoint());
});
