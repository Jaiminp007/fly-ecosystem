import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {StallTransfer,speedRecommendation,steeringRecommendation} from '../learning/stall-transfer.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
const history={seed:255001,cueSeed:255002,resourceSeeds:[255003,255004,255005,255006]};
const anchor=()=>new TasteExperiment({history,reference:{...structuredClone(VALUE_REFERENCE),founders:2},learnerOptions:{holdTicks:1,motorRepresentation:'balance',greedyInference:true}}).checkpoint(false);
test('full-angle steering resolves rear ambiguity, saturates, preserves wall fallback and executes exactly',()=>{
  const raw=Array(17).fill(0),work={scalarOperations:0};raw[0]=-1;raw[3]=.5;
  assert.equal(steeringRecommendation(raw,.123,work).turn,1);
  raw[2]=Math.sin(.1);raw[0]=Math.cos(.1);assert.equal(steeringRecommendation(raw,.123,work).turn,Math.atan2(raw[2],raw[0])/.28);
  raw[10]=.01;assert.equal(steeringRecommendation(raw,.123,work).turn,.123);
  raw[10]=0;raw[3]=0;assert.equal(steeringRecommendation(raw,.123,work).turn,.123);assert.equal(work.scalarOperations,40);
  for(const steeringMode of [0,1,2]){
    const events=[],a=new StallTransfer(anchor(),255007,{steeringMode,observer:e=>events.push(e)}),b=new StallTransfer(anchor(),255007,{steeringMode});
    a.advanceTo(8);b.advanceTo(8);assert.deepEqual(a.checkpoint(),b.checkpoint());
    assert.ok(events.every(e=>e.requestedTurn===e.executedTurn&&e.executedMove===(steeringMode===0?0:1)));
    const resumed=StallTransfer.restore(a.checkpoint());a.advanceTo(12);resumed.advanceTo(12);assert.deepEqual(a.checkpoint(),resumed.checkpoint());
  }
});
test('adaptive speed requires every declared condition and full-speed observation preserves exact physics',()=>{
  const raw=Array(17).fill(0);raw[0]=.8;raw[3]=.5;const work={scalarOperations:0};
  assert.equal(speedRecommendation({raw,contactPresent:false},work),1);
  for(const [index,value]of [[0,.4],[3,0],[3,.75],[10,1],[11,1]]){const changed=[...raw];changed[index]=value;assert.equal(speedRecommendation({raw:changed,contactPresent:false},work),0);}
  assert.equal(speedRecommendation({raw,contactPresent:true},work),0);assert.equal(work.scalarOperations,42);
  for(const speedMode of [0,1,2]){
    const events=[],a=new StallTransfer(anchor(),255007,{speedMode,observer:e=>events.push(e)}),b=new StallTransfer(anchor(),255007,{speedMode});
    a.advanceTo(8);b.advanceTo(8);assert.deepEqual(a.checkpoint(),b.checkpoint());assert.ok(events.every(e=>e.requestedMove===e.executedMove));
    if(speedMode!==2)assert.ok(events.every(e=>e.executedMove===speedMode));
  }
});
test('observer target/collision instrumentation leaves the factual world and charged state unchanged, and resumes exactly',()=>{
  const cp=anchor(),events=[],a=new StallTransfer(cp,255007,{observer:e=>events.push(e)}),b=new StallTransfer(cp,255007);
  a.advanceTo(8);b.advanceTo(8);assert.deepEqual(a.checkpoint(),b.checkpoint());assert.ok(events.length>0);
  const c=StallTransfer.restore(a.checkpoint());a.advanceTo(20);c.advanceTo(20);assert.deepEqual(a.checkpoint(),c.checkpoint());
  assert.ok(Object.values(a.run.learners).every(s=>s.charge.operationsBilled===s.work.scalarOperations));
});
test('single-body pause/avoid pulses use actual action bindings, exactly sixteen actions, and preserve terminal debt',()=>{
  for(const action of [0,1,2]){
    const run=new StallTransfer(anchor(),255008);run.pulse(1,action);run.advanceTo(16);
    assert.equal(run.controls[1].pulseRemaining,0);assert.equal(run.run.learners[1].hold.cruise,action<2);run.snapshot();
    if(action===1)assert.equal(run.statistics.actions[1],16);if(action===2)assert.equal(run.statistics.actions[2],16);
  }
  const cp=anchor();for(const f of cp.world.world.flies)f.genome.traits.lifespan=.01;
  const extinct=new StallTransfer(cp,255009);extinct.advanceTo(16);assert.equal(extinct.snapshot().endpoint.survivors,0);assert.ok(extinct.snapshot().endpoint.outstandingEnergy>0);
});
