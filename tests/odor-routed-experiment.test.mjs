import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {readFileSync} from 'node:fs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const reference={...VALUE_REFERENCE,founders:4};
test('matched physical arms charge both routed banks and execute their commands',()=>{
  const starts=[];
  for(const steeringMode of ['learned','native','guarded']){
    const events=[],run=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual',steeringMode,emit:event=>{
      if(event.type==='decision')assert.equal(event.storageBytes,encodedStateBytes(run.learners[event.id]));
      events.push(structuredClone(event));
    }});
    starts.push(run.world.checkpoint());run.advance(20);
    for(const event of events.filter(event=>event.type==='decision')){
      assert.equal(event.choice.route,event.own.odorPresent?'present':'absent');
      assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
      if(steeringMode==='native')assert.equal(event.steering.action,0);
      if(steeringMode==='guarded')assert.equal(event.steering.action,Number(event.available));
    }
    for(const state of Object.values(run.learners)){
      assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
      assert.ok(state.charge.storageBytes>=encodedStateBytes(state.banks));
    }
  }
  assert.deepEqual(starts[0],starts[1]);assert.deepEqual(starts[0],starts[2]);
});
test('odor-free acquisition uses actual absent-route experience without modifying present weights',()=>{
  const events=[],run=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual',emit:event=>events.push(structuredClone(event))});
  run.advance(20);const before=Object.fromEntries(Object.entries(run.learners).map(([id,state])=>[id,structuredClone(state.banks.present.weights)]));
  run.phaseIndex=2;run.phaseEnd=run.world.tick;run.advance(16);
  assert.equal(run.world.config.cueForaging,false);assert.equal(run.phaseIndex,3);
  const decisions=events.filter(event=>event.type==='decision'&&event.tick>20);assert.ok(decisions.length>0);
  for(const event of decisions){assert.equal(event.own.odorPresent,false);assert.equal(event.choice.route,'absent');assert.ok(event.choice.accept);}
  for(const [id,weights]of Object.entries(before))assert.deepEqual(run.learners[id].banks.present.weights,weights);
  assert.ok(Object.values(run.learners).some(state=>state.banks.absent.transitions>0));
});
test('checkpoint restore, frozen/reset probes and cheap control preserve physical state',()=>{
  const run=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual'});run.advance(20);
  const resumed=OdorRoutedExperiment.restore(run.checkpoint());run.advance(20);resumed.advance(20);assert.deepEqual(run.checkpoint(),resumed.checkpoint());
  const anchor=run.checkpoint(false),options={phase:'transfer',seed:1004137408};
  const current=OdorRoutedExperiment.fork(anchor,options),reset=OdorRoutedExperiment.fork(anchor,{...options,mode:'reset'});
  const cheapAnchor=structuredClone(anchor);cheapAnchor.kind='coverage-world';const cheap=CoverageExperiment.fork(cheapAnchor,{...options,mode:'native-full'});
  assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());assert.deepEqual(current.world.checkpoint(),cheap.world.checkpoint());
  const before=Object.fromEntries(current.world.flies.map(fly=>[fly.id,structuredClone(current.learners[fly.id].banks)]));
  for(const fly of reset.world.flies)for(const bank of Object.values(reset.learners[fly.id].banks))assert.ok(bank.weights.flat().every(value=>value===0));
  current.advance(16);
  for(const [id,banks]of Object.entries(before))for(const route of ['present','absent'])assert.deepEqual(current.learners[id].banks[route].weights,banks[route].weights);
  for(const state of Object.values(current.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('terminal routed updates and inherited work remain owed after extinction',()=>{
  const run=new OdorRoutedExperiment({history,reference});
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);
  for(const state of Object.values(run.learners)){assert.ok(state.dead);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
});
test('fourth-phase checkpoint is real, and transfer uses a separate seed',()=>{
  const run=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual'});run.advance(20);
  run.phaseIndex=2;run.phaseEnd=run.world.tick;run.advance(256);
  if(run.world.flies.length){
    assert.ok(run.anchors.D);assert.equal(run.anchors.D.world.world.tick,276);
    const anchor=run.anchors.D,probe=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408});
    assert.notEqual(history.resourceSeeds[3],1004137408);assert.equal(probe.world.config.cueForaging,false);
    assert.notDeepEqual(probe.world.food.map(patch=>[patch.x,patch.y]),run.world.food.map(patch=>[patch.x,patch.y]));
  }else assert.equal(run.anchors.D,undefined);
});
test('earlier routed model copies own banks onto later bodies with matched charges',()=>{
  const run=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual'});run.advance(15);
  const earlier=run.checkpoint(false);run.advance(15);const later=run.checkpoint(false);
  const options={phase:'A',seed:1004137408},saved=OdorRoutedExperiment.fork(later,{...options,modelAnchor:earlier}),current=OdorRoutedExperiment.fork(later,options);
  assert.deepEqual(saved.world.checkpoint(),current.world.checkpoint());
  for(const fly of saved.world.flies){
    const source=earlier.state.learners[fly.id],state=saved.learners[fly.id];
    for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,source.banks[route].weights);
    assert.deepEqual(state.taste.weights,source.taste.weights);assert.deepEqual(state.steering.weights,source.steering.weights);
    assert.equal(state.work.scalarOperations,current.learners[fly.id].work.scalarOperations);
    assert.equal(state.charge.incurredEnergy,current.learners[fly.id].charge.incurredEnergy);
  }
});
test('all reused histories separate odor-free acquisition and transfer seeds',()=>{
  const protocol=JSON.parse(readFileSync(new URL('../evidence/taste-development/attempt-15-progress/protocol.json',import.meta.url),'utf8'));
  assert.equal(protocol.histories.length,8);
  for(const item of protocol.histories)assert.notEqual(item.resourceSeeds[3],item.probeSeeds.transfer);
});
test('matched frozen and reset regimes retain their boundary setup bills',()=>{
  const frozen=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual',trainingRegime:'freeze-after-A'});
  const reset=new OdorRoutedExperiment({history,reference,acquisitionGeometry:'continual',trainingRegime:'reset-each-phase'});
  frozen.advance(20);reset.advance(20);
  const before=Object.fromEntries(frozen.world.flies.map(fly=>[fly.id,structuredClone(frozen.learners[fly.id].banks)]));
  frozen.phaseEnd=frozen.world.tick;reset.phaseEnd=reset.world.tick;frozen.advance(1);reset.advance(1);
  for(const fly of frozen.world.flies){
    const state=frozen.learners[fly.id];assert.ok(!state.acquisition&&!state.steering.acquisition);
    for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,before[fly.id][route].weights);
    assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  }
  for(const fly of reset.world.flies){
    const state=reset.learners[fly.id];assert.ok(state.acquisition&&state.steering.acquisition);
    for(const bank of Object.values(state.banks))assert.ok(bank.weights.flat().every(value=>value===0));
    assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  }
});
