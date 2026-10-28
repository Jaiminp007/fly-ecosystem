import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {MixedFocalTransfer} from '../learning/mixed-focal-transfer.mjs';
import {applyCueSharedComponentMask} from '../learning/cue-shared-component-mask.mjs';
import {encodedStateBytes,billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
function makeAnchor(){const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:3},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental'});run.advance(15);return run.checkpoint(false);}
function regular(anchor){
  const run=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,steeringMode:'learned',compactFrozen:true});
  for(const fly of run.world.flies){const state=run.learners[fly.id];applyCueSharedComponentMask(state,'residual-only');billSarsaWork(state,run.pricing);state.work.scalarOperations+=encodedStateBytes(state);state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
  return run;
}
test('all-residual mixed implementation matches original physical controller and ledger',()=>{
  const anchor=makeAnchor(),baseline=regular(anchor),mixed=MixedFocalTransfer.create(anchor,{seed:1004137408});
  assert.deepEqual(mixed.world.checkpoint(),baseline.world.checkpoint());assert.deepEqual(mixed.learners,baseline.learners);
  mixed.advance(35);baseline.advance(35);assert.deepEqual(mixed.world.checkpoint(),baseline.world.checkpoint());assert.deepEqual(mixed.learners,baseline.learners);assert.deepEqual(mixed.endpoint(),baseline.endpoint());
});
test('cheap focal preserves prior debt and matches native-full initial command',()=>{
  const anchor=makeAnchor(),id=anchor.world.world.flies[0].id,baseline=regular(anchor),events=[];
  const mixed=MixedFocalTransfer.create(anchor,{seed:1004137408,cheapIds:[id],emit:event=>events.push(structuredClone(event))});
  const prior=baseline.learners[id].charge,cheap=mixed.learners[id].charge;assert.equal(cheap.outstandingEnergy,prior.outstandingEnergy);assert.equal(cheap.incurredEnergy,prior.incurredEnergy);assert.equal(cheap.paidEnergy,prior.paidEnergy);assert.equal(cheap.operationsBilled,0);
  const referenceEvents=[],reference=CoverageExperiment.fork({...structuredClone(anchor),kind:'coverage-world'},{phase:'transfer',seed:1004137408,mode:'native-full',emit:event=>referenceEvents.push(structuredClone(event))});
  assert.deepEqual(mixed.world.checkpoint(),reference.world.checkpoint());mixed.advance(1);reference.advance(1);
  assert.deepEqual(events.find(event=>event.type==='decision'&&event.id===id).outputs,referenceEvents.find(event=>event.type==='decision'&&event.id===id).outputs);
  const candidate=mixed.learners[id];assert.equal(candidate.work.scalarOperations,8);assert.equal(candidate.charge.operationsBilled,8);assert.equal(candidate.charge.storageBytes,encodedStateBytes(candidate));
});
test('mixed controller restores exactly and terminal work/debt remain payable',()=>{
  const anchor=makeAnchor(),id=anchor.world.world.flies[0].id,run=MixedFocalTransfer.create(anchor,{seed:1004137408,cheapIds:[id]});run.advance(15);
  const restored=MixedFocalTransfer.restore(run.checkpoint());run.advance(10);restored.advance(10);assert.deepEqual(run.checkpoint(),restored.checkpoint());
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);
  for(const state of Object.values(run.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
