import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'replay'};
test('world replay charges growing own memory and restores exact continuation',()=>{
  const events=[],run=new OdorRoutedExperiment({...options,auditSnapshots:true,emit:event=>events.push(structuredClone(event))});
  run.advance(40);
  const decisions=events.filter(event=>event.type==='decision');assert.ok(decisions.length>0);
  for(const event of decisions){
    assert.equal(event.storageBytes,encodedStateBytes(event.auditState));
    assert.equal(event.auditState.charge.operationsBilled,event.work);
    for(const record of event.auditState.steering.memory)assert.equal(record.agentId,event.id);
  }
  assert.ok(Object.values(run.learners).some(state=>state.steering.memory.length>0));
  const resumed=OdorRoutedExperiment.restore(run.checkpoint());run.advance(15);resumed.advance(15);
  assert.deepEqual(run.checkpoint(),resumed.checkpoint());
  for(const state of Object.values(run.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('matched probes retain paid replay memory or clear it on reset',()=>{
  const run=new OdorRoutedExperiment(options);run.advance(25);const earlier=run.checkpoint(false);run.advance(10);
  const anchor=run.checkpoint(false),probe={phase:'A',seed:1004137408};
  const current=OdorRoutedExperiment.fork(anchor,probe),saved=OdorRoutedExperiment.fork(anchor,{...probe,modelAnchor:earlier});
  const reset=OdorRoutedExperiment.fork(anchor,{...probe,mode:'reset'});
  assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());assert.deepEqual(saved.world.checkpoint(),current.world.checkpoint());
  for(const fly of current.world.flies){
    const currentState=current.learners[fly.id],savedState=saved.learners[fly.id],resetState=reset.learners[fly.id];
    assert.ok(!currentState.steering.acquisition&&!savedState.steering.acquisition&&!resetState.steering.acquisition);
    assert.deepEqual(savedState.steering.weights,earlier.state.learners[fly.id].steering.weights);
    assert.deepEqual(savedState.steering.memory,currentState.steering.memory);
    assert.equal(resetState.steering.memory.length,0);assert.ok(resetState.steering.weights.flat().every(value=>value===0));
  }
  current.advance(3);reset.advance(3);
  for(const state of Object.values(current.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('terminal replay work remains billed after extinction',()=>{
  const run=new OdorRoutedExperiment(options);run.advance(1);
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);
  for(const state of Object.values(run.learners)){
    assert.ok(state.steering.dead);assert.ok(state.steering.memory.some(record=>record.terminal));
    assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  }
});
