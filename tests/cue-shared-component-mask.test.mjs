import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {applyCueSharedComponentMask} from '../learning/cue-shared-component-mask.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
test('four interventions preserve other components and bill equal setup work',()=>{
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:2},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental'});
  const active=run.learners[run.world.flies[0].id];assert.throws(()=>applyCueSharedComponentMask(active,'full'));
  run.advance(10);const probe=OdorRoutedExperiment.fork(run.checkpoint(false),{phase:'transfer',seed:1004137408,compactFrozen:true});
  for(const fly of probe.world.flies){
    const original=probe.learners[fly.id];original.steering.weights[0][0]=3;original.steering.contextWeights[0][0][0]=5;
    for(const mode of ['full','shared-only','residual-only','native']){
      const state=structuredClone(original),before=state.work.scalarOperations,debt=state.charge.outstandingEnergy;
      applyCueSharedComponentMask(state,mode);assert.equal(state.work.scalarOperations-before,16);billSarsaWork(state,probe.pricing);
      assert.ok(Math.abs(state.charge.outstandingEnergy-debt-16*probe.pricing.operationEnergy)<1e-10);
      assert.equal(state.steering.weights[0][0],mode==='residual-only'?0:3);assert.equal(state.steering.contextWeights[0][0][0],mode==='shared-only'?0:5);
      assert.deepEqual(state.steering.contextWeights.slice(1),original.steering.contextWeights.slice(1));assert.deepEqual(state.taste,original.taste);assert.deepEqual(state.banks,original.banks);
    }
  }
});
