import test from 'node:test';
import assert from 'node:assert/strict';
import {OwnSteeringExperiment} from '../learning/own-steering-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const reference={...VALUE_REFERENCE,founders:4};
test('physical actions, work and encoded memory follow the executed control',()=>{
  for(const steeringMode of ['learned','native','guarded']){
    const events=[],run=new OwnSteeringExperiment({history,reference,steeringMode,emit:event=>{
      if(event.type==='decision')assert.equal(event.storageBytes,encodedStateBytes(run.learners[event.id]));
      events.push(structuredClone(event));
    }});
    run.advance(20);
    for(const event of events.filter(event=>event.type==='decision')){
      if(steeringMode==='native')assert.equal(event.steering.action,0);
      if(steeringMode==='guarded')assert.equal(event.steering.action,Number(event.available));
      assert.ok(event.steering.action===0||event.available);
      assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
      const distance=Math.hypot(...event.recommendation.point),raw=event.own.raw;
      const sine=event.steering.action===1&&distance>0?event.recommendation.point[1]/distance:raw[2]-raw[1];
      assert.equal(event.outputs[0],Math.tanh(2*sine+1.8*(raw[10]-raw[11])));
    }
    for(const state of Object.values(run.learners)){
      assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
      assert.ok(state.work.scalarOperations>=state.steering.work.scalarOperations);
    }
  }
});
test('checkpoint restore preserves acquisition physics and learner state',()=>{
  const first=new OwnSteeringExperiment({history,reference,emit:()=>{}}),plain=new OwnSteeringExperiment({history,reference});
  first.advance(20);plain.advance(20);assert.deepEqual(first.checkpoint(),plain.checkpoint());
  const resumed=OwnSteeringExperiment.restore(first.checkpoint());first.advance(20);resumed.advance(20);
  assert.deepEqual(first.checkpoint(),resumed.checkpoint());
});
test('audit snapshots do not alter physics, learner state or bills',()=>{
  const ordinary=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual'});
  const audited=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual',auditSnapshots:true,emit:()=>{}});
  ordinary.advance(30);audited.advance(30);
  assert.deepEqual(ordinary.world.checkpoint(),audited.world.checkpoint());
  assert.deepEqual(ordinary.learners,audited.learners);
});
test('terminal updates stay billed as debt',()=>{
  const run=new OwnSteeringExperiment({history,reference});
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);const endpoint=run.endpoint();assert.equal(endpoint.survivors,0);assert.ok(endpoint.outstandingEnergy>0);
  for(const state of Object.values(run.learners)){assert.equal(state.charge.operationsBilled,state.work.scalarOperations);assert.ok(state.steering.dead);}
});
test('frozen and reset probes share physics, preserve debt and never learn',()=>{
  const run=new OwnSteeringExperiment({history,reference});run.advance(30);
  const anchor=run.checkpoint(false),options={phase:'transfer',seed:1004137408,fixedMove:1};
  const current=OwnSteeringExperiment.fork(anchor,options),reset=OwnSteeringExperiment.fork(anchor,{...options,mode:'reset'});
  assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());
  assert.ok(current.endpoint().budgetAdjustedEnergyPerFounder<0);
  for(const fly of reset.world.flies){const state=reset.learners[fly.id];assert.ok(state.steering.weights.flat().every(value=>value===0));assert.ok(state.weights.flat().every(value=>value===0));}
  const weights=Object.fromEntries(current.world.flies.map(fly=>[fly.id,structuredClone(current.learners[fly.id].steering.weights)]));
  current.advance(30);reset.advance(30);
  for(const [id,value] of Object.entries(weights))assert.deepEqual(current.learners[id].steering.weights,value);
  for(const state of Object.values(current.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  const restored=OwnSteeringExperiment.restore(current.checkpoint());current.advance(30);restored.advance(30);assert.deepEqual(current.checkpoint(),restored.checkpoint());
});
test('probe stops at its declared boundary and cue families remain accessible',()=>{
  const run=new OwnSteeringExperiment({history,reference});run.advance(15);const anchor=run.checkpoint(false);
  for(const phase of ['A','B','C']){
    const probe=OwnSteeringExperiment.fork(anchor,{phase,seed:1004137408,steeringMode:'native'});
    assert.equal(probe.resource.family,phase);probe.advance(300);assert.ok(probe.world.tick<=anchor.world.world.tick+256);
    if(probe.world.flies.length)assert.equal(probe.world.tick,anchor.world.world.tick+256);
  }
});
test('earlier own models are compared on the later physical state with matched setup work',()=>{
  const run=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual'});run.advance(20);
  const earlier=run.checkpoint(false);run.advance(20);const later=run.checkpoint(false);
  const before=structuredClone(earlier),options={phase:'A',seed:1004137408};
  const old=OwnSteeringExperiment.fork(later,{...options,modelAnchor:earlier}),current=OwnSteeringExperiment.fork(later,options);
  assert.deepEqual(old.world.checkpoint(),current.world.checkpoint());assert.deepEqual(earlier,before);
  for(const fly of old.world.flies){
    const id=fly.id,source=earlier.state.learners[id];
    assert.deepEqual(old.learners[id].weights,source.weights);assert.deepEqual(old.learners[id].taste.weights,source.taste.weights);
    assert.deepEqual(old.learners[id].steering.weights,source.steering.weights);
    assert.equal(old.learners[id].work.scalarOperations,current.learners[id].work.scalarOperations);
    assert.equal(old.learners[id].charge.incurredEnergy,current.learners[id].charge.incurredEnergy);
  }
  const mismatched=structuredClone(earlier);mismatched.state.history.seed++;
  assert.throws(()=>OwnSteeringExperiment.fork(later,{...options,modelAnchor:mismatched}));
  assert.throws(()=>OwnSteeringExperiment.fork(later,{...options,modelAnchor:earlier,mode:'reset'}));
  const frozen=Object.fromEntries(old.world.flies.map(fly=>[fly.id,structuredClone(old.learners[fly.id].steering.weights)]));
  old.advance(15);for(const [id,weights]of Object.entries(frozen))assert.deepEqual(old.learners[id].steering.weights,weights);
});
test('cheap native transfer control starts from the identical physical world',()=>{
  const run=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual'});run.advance(30);
  const anchor=run.checkpoint(false),options={phase:'transfer',seed:1004137408};
  const candidate=OwnSteeringExperiment.fork(anchor,options),coverage=structuredClone(anchor);coverage.kind='coverage-world';
  const native=CoverageExperiment.fork(coverage,{...options,mode:'native-full'});
  assert.deepEqual(candidate.world.checkpoint(),native.world.checkpoint());
  assert.equal(candidate.startingDebt,native.startingDebt);native.advance(8);
  for(const state of Object.values(native.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('fixed-speed frozen probe executes full speed while retaining the learner',()=>{
  const run=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual'});run.advance(25);
  const events=[],probe=OwnSteeringExperiment.fork(run.checkpoint(false),{phase:'transfer',seed:1004137408,fixedMove:1,emit:event=>events.push(event)});
  probe.advance(15);
  for(const event of events.filter(event=>event.type==='decision')){assert.equal(event.choice.action,2);assert.equal(event.outputs[1],1);}
  for(const state of Object.values(probe.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
