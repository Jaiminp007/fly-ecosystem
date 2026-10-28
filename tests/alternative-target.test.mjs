import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleTargetPair,harvestRateChoice,AlternativeTargetTransfer} from '../learning/alternative-target.mjs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const anchor=()=>new TasteExperiment({history:{seed:256001,cueSeed:256002,resourceSeeds:[256003,256004,256005,256006]},reference:{...structuredClone(VALUE_REFERENCE),founders:2}}).checkpoint(false);
test('visible encoder ranks native candidates stably and excludes the existing sensory threshold',()=>{
  const work={scalarOperations:0},fly={x:0,y:0,heading:0},patches=[{x:10,y:0,amount:1},{x:0,y:10,amount:1},{x:0,y:0,amount:.06}];
  const pair=visibleTargetPair(fly,patches,work);assert.deepEqual(pair[0],[1,10,1,0]);assert.ok(Math.abs(pair[1][3]-1)<1e-12);
  assert.deepEqual(visibleTargetPair(fly,[],work),[[0,0,0,0],[0,0,0,0]]);
  const decision=harvestRateChoice([[3,100,1,0],[1,15,1,0]],30,work);assert.equal(decision.choice,1);assert.ok(work.scalarOperations>0);
});
test('matched encodings, observer neutrality and exact resumed physical/charged state',()=>{
  const cp=anchor(),events=[],observed=new AlternativeTargetTransfer(cp,256007,1,{observer:event=>events.push(event)}),plain=new AlternativeTargetTransfer(cp,256007,1),native=new AlternativeTargetTransfer(cp,256007,0);
  assert.deepEqual(observed.world.checkpoint(),native.world.checkpoint());
  for(const id of observed.founderIds)assert.equal(encodedStateBytes(observed.controllers[id]),encodedStateBytes(native.controllers[id]));
  for(let tick=0;tick<8;tick++){observed.step();plain.step();}
  assert.deepEqual(observed.checkpoint(),plain.checkpoint());
  const resumed=AlternativeTargetTransfer.restore(plain.checkpoint());for(let tick=0;tick<8;tick++){plain.step();resumed.step();}
  assert.deepEqual(plain.checkpoint(),resumed.checkpoint());assert.ok(events.every(event=>event.outputs[1]===1&&event.outputs[2]===1));
});
test('extinction settles inherited work and retains unpaid controller debt',()=>{
  const cp=anchor();for(const fly of cp.world.world.flies){cp.world.world.initialEnergy-=fly.energy-1e-9;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  const run=new AlternativeTargetTransfer(cp,256008,1),end=run.advance();assert.equal(end.survivors,0);assert.ok(end.outstandingEnergy>0);
  for(const state of Object.values(run.controllers))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
