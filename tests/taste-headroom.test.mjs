import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimingState,timingDecision,runTimingHeadroom} from '../learning/taste-headroom.mjs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
const own=(contact=true,food=.8,forward=-1,target=.8)=>{const raw=Array(17).fill(0);raw[0]=forward;raw[3]=target;raw[13]=food;raw[16]=1;return {raw,contactPresent:contact};};
test('harvest cap, condition termination and mandatory cruise prevent indefinite waiting',()=>{
  const state=createTimingState(),work={scalarOperations:0};
  const actions=Array.from({length:12},()=>timingDecision(state,own(),'harvest',work).action);
  assert.deepEqual(actions,[0,2,2,2,2,0,2,2,2,2,0,2]);
  assert.equal(timingDecision(state,own(false),'harvest',work).action,0);
  assert.equal(timingDecision(state,own(),'harvest',work).action,2);assert.ok(work.scalarOperations>0);
});
test('alignment disarms at entry and cannot repeatedly restart after a cap until rearmed',()=>{
  const state=createTimingState(),work={scalarOperations:0},behind=own(false,0,-1);
  assert.deepEqual(Array.from({length:8},()=>timingDecision(state,behind,'alignment',work).action),[0,2,2,2,2,0,0,0]);
  assert.equal(timingDecision(state,own(false,0,.6),'alignment',work).action,0);
  assert.equal(timingDecision(state,behind,'alignment',work).action,2);
  assert.equal(timingDecision(state,own(false,0,.6),'alignment',work).action,0);
});
test('physical cruise override suppresses opposite shadow logits with equal encoding/cost and preserves death debt',()=>{
  const history={seed:255001,cueSeed:255002,resourceSeeds:[255003,255004,255005,255006]};
  const run=new TasteExperiment({history,reference:{...structuredClone(VALUE_REFERENCE),founders:2},learnerOptions:{holdTicks:1,motorRepresentation:'balance',greedyInference:true}});
  const a=run.checkpoint(false),b=structuredClone(a);
  for(const s of Object.values(a.state.learners))s.weights.actor[0]=8;
  for(const s of Object.values(b.state.learners))s.weights.actor[0]=-8;
  const spec={policy:'cruise',seed:255007,ticks:8,emit:()=>{}},left=runTimingHeadroom(a,spec),right=runTimingHeadroom(b,spec);
  assert.deepEqual(left.finalWorld,right.finalWorld);assert.equal(left.value,right.value);assert.equal(left.finalEncodedBytes,right.finalEncodedBytes);assert.equal(left.weightsUnchanged,true);
  const dying=structuredClone(a);for(const f of dying.world.world.flies)f.genome.traits.lifespan=.01;
  const death=runTimingHeadroom(dying,spec);assert.equal(death.survivors,0);assert.equal(death.endpoint.founders,2);
  assert.ok(death.endpoint.outstandingEnergy>0);assert.ok(Object.values(death.finalLearners).every(s=>s.dead&&s.credit.pending===null&&s.motorPending===null));
});
