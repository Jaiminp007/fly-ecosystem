import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {chooseOdorRoutedTaste,observeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';
import {chooseOwnSteering} from '../learning/own-steering.mjs';
import {chooseReplaySteering} from '../learning/replay-steering.mjs';
import {compactFrozenOdorRoutedState} from '../learning/frozen-memory-compaction.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',spatialSelector:'incremental'};
test('active state is rejected without mutation',()=>{
  const run=new OdorRoutedExperiment(options),state=run.learners[run.world.flies[0].id],before=structuredClone(state);
  assert.throws(()=>compactFrozenOdorRoutedState(state));assert.deepEqual(state,before);
});
for(const steeringLearner of ['original','replay'])test(`${steeringLearner} compaction preserves same-input frozen inference and route changes`,()=>{
  const run=new OdorRoutedExperiment({...options,steeringLearner});run.advance(35);const anchor=run.checkpoint(false),untouched=structuredClone(anchor);
  const settings={phase:'transfer',seed:1004137408},original=OdorRoutedExperiment.fork(anchor,settings),compact=OdorRoutedExperiment.fork(anchor,{...settings,compactFrozen:true});
  assert.deepEqual(anchor,untouched);assert.deepEqual(original.world.checkpoint(),compact.world.checkpoint());
  for(const fly of compact.world.flies){
    const old=original.learners[fly.id],state=compact.learners[fly.id],arrays=[old.taste.memory,...Object.values(old.banks).map(bank=>bank.memory)];
    if(old.steering.memory)arrays.push(old.steering.memory);
    const operations=arrays.reduce((sum,array)=>sum+encodedStateBytes(array),0)+4;
    assert.equal(state.work.scalarOperations-old.work.scalarOperations,operations);
    assert.ok(encodedStateBytes(state)<=encodedStateBytes(old));assert.equal(state.charge.storageBytes,0);
    assert.deepEqual(state.steering.weights,old.steering.weights);assert.deepEqual(state.taste.weights,old.taste.weights);
    for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,old.banks[route].weights);
    for(const [offset,odorPresent]of [true,false,true].entries()){
      const own={agentId:fly.id,tick:run.world.tick+offset+1,energy:20,raw:Array(17).fill(0),cue:odorPresent?[1,-1,1,-1]:[0,0,0,0],contactPresent:true,odorPresent};
      assert.deepEqual(chooseOdorRoutedTaste(state,own),chooseOdorRoutedTaste(old,own));
      const steeringOwn={agentId:fly.id,tick:own.tick,energy:20,features:[1,.2,0,0,0,0,.1,-.3],midpointAvailable:true};
      const choose=steeringLearner==='replay'?chooseReplaySteering:chooseOwnSteering;
      assert.deepEqual(choose(state.steering,steeringOwn),choose(old.steering,steeringOwn));
      const observed={agentId:fly.id,tick:own.tick,energy:20,lastFood:0,terminal:false};observeOdorRoutedTaste(state,observed);observeOdorRoutedTaste(old,observed);
    }
  }
});
test('compacted indexed probes preserve setup costs, restore and terminal debt',()=>{
  const run=new OdorRoutedExperiment({...options,steeringLearner:'replay'});run.advance(30);const anchor=run.checkpoint(false),settings={phase:'transfer',seed:1004137408,compactFrozen:true};
  const compact=OdorRoutedExperiment.fork(anchor,settings),reset=OdorRoutedExperiment.fork(anchor,{...settings,mode:'reset'});
  assert.deepEqual(compact.world.checkpoint(),reset.world.checkpoint());compact.advance(10);
  for(const state of Object.values(compact.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  const restored=OdorRoutedExperiment.restore(compact.checkpoint());compact.advance(5);restored.advance(5);assert.deepEqual(compact.checkpoint(),restored.checkpoint());
  for(const fly of compact.world.flies){compact.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  compact.advance(2);assert.equal(compact.endpoint().survivors,0);assert.ok(compact.endpoint().outstandingEnergy>0);
  for(const state of Object.values(compact.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
