import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe'};
test('custom schedule preserves continuous world, debt and exact checkpoint continuation',()=>{
  const run=new OdorRoutedExperiment({...options,phaseDurations:[2,3,2,2]});run.advance(2);assert.equal(run.world.tick,2);assert.equal(run.phaseIndex,0);
  const before=run.checkpoint(),restored=OdorRoutedExperiment.restore(before);run.advance(3);restored.advance(3);assert.deepEqual(run.checkpoint(),restored.checkpoint());
  assert.equal(run.world.tick,5);assert.equal(run.phaseIndex,1);assert.equal(run.phaseEnd,5);run.advance(2);assert.equal(run.phaseIndex,2);assert.equal(run.phaseEnd,7);
  run.advance(2);assert.equal(run.phaseIndex,3);assert.equal(run.phaseEnd,9);assert.equal(run.transfer,true);assert.equal(run.world.tick,9);
  for(const state of Object.values(run.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  const anchor=run.checkpoint(false),probe=OdorRoutedExperiment.fork(anchor,{phase:'A',seed:1004137408});assert.equal(probe.phaseEnd,probe.world.tick+256);
});
test('default schedule remains unchanged and invalid duration lists are rejected',()=>{
  const run=new OdorRoutedExperiment(options);assert.equal(run.phaseEnd,512);assert.equal(Object.hasOwn(run,'phaseDurations'),false);
  for(const phaseDurations of [[1,2,3],[1,2,0,4],[1,2,3,4.5],'x'])assert.throws(()=>new OdorRoutedExperiment({...options,phaseDurations}));
});
