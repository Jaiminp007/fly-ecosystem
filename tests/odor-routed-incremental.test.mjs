import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'replay'};
test('incremental selector preserves first observations and bills retained index',()=>{
  const events={},runs={};
  for(const spatialSelector of ['filtered','incremental']){
    events[spatialSelector]=[];runs[spatialSelector]=new OdorRoutedExperiment({...options,spatialSelector,auditSnapshots:true,emit:event=>events[spatialSelector].push(structuredClone(event))});
  }
  assert.deepEqual(runs.filtered.world.checkpoint(),runs.incremental.world.checkpoint());runs.filtered.advance(1);runs.incremental.advance(1);
  const filtered=events.filtered.filter(event=>event.type==='decision'),incremental=events.incremental.filter(event=>event.type==='decision');assert.equal(filtered.length,incremental.length);
  for(let index=0;index<filtered.length;index++){
    const old=filtered[index],current=incremental[index];assert.equal(old.id,current.id);assert.deepEqual(old.recommendation,current.recommendation);assert.deepEqual(old.outputs,current.outputs);
    assert.equal(current.storageBytes,encodedStateBytes(current.auditState));assert.ok(current.auditState.scratch.bins);
  }
  runs.incremental.advance(25);for(const state of Object.values(runs.incremental.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  const restored=OdorRoutedExperiment.restore(runs.incremental.checkpoint());runs.incremental.advance(15);restored.advance(15);assert.deepEqual(runs.incremental.checkpoint(),restored.checkpoint());
});
test('indexed forks and terminal obligations remain paid',()=>{
  const run=new OdorRoutedExperiment({...options,spatialSelector:'incremental'});run.advance(20);const anchor=run.checkpoint(false);
  const current=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408}),reset=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,mode:'reset'});
  assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());current.advance(3);reset.advance(3);
  for(const fly of current.world.flies){current.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  current.advance(2);assert.equal(current.endpoint().survivors,0);assert.ok(current.endpoint().outstandingEnergy>0);
  for(const state of Object.values(current.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
