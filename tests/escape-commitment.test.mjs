import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {StallTransfer} from '../learning/stall-transfer.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const anchor=()=>new TasteExperiment({history:{seed:255101,cueSeed:255102,resourceSeeds:[255103,255104,255105,255106]},reference:{...structuredClone(VALUE_REFERENCE),founders:2},learnerOptions:{holdTicks:1,motorRepresentation:'balance',greedyInference:true}}).checkpoint(false);
test('commitment preserves eating and full speed for twelve actual turns, then resumes native steering',()=>{
  const events=[],run=new StallTransfer(anchor(),255107,{speedMode:1,escapeMode:1,observer:event=>events.push(event)});
  run.commitEscape(1);run.advanceTo(16);
  const focal=events.filter(event=>event.id===1);
  assert.equal(focal.length,16);assert.ok(focal.slice(0,12).every(event=>event.executedMove===1&&event.action===0&&event.escape.executedTurn===1&&event.escape.eat===1));
  assert.equal(run.controls[1].escapeRemaining,0);
  const expected=Math.tanh(2*(focal[12].raw[2]-focal[12].raw[1])+1.8*(focal[12].raw[10]-focal[12].raw[11]));
  assert.equal(focal[12].escape.executedTurn,expected);
  assert.ok(Object.values(run.run.learners).every(state=>state.charge.operationsBilled===state.work.scalarOperations));
});
test('matched modes have identical encoding and work, observer neutrality, exact continuation and terminal debt',()=>{
  const checkpoint=anchor(),events=[],control=new StallTransfer(checkpoint,255107,{speedMode:1,escapeMode:0}),active=new StallTransfer(checkpoint,255107,{speedMode:1,escapeMode:1});
  assert.deepEqual(control.run.world.checkpoint(),active.run.world.checkpoint());
  for(const id of control.run.founderIds)assert.equal(encodedStateBytes({...control.run.learners[id],timing:control.controls[id]}),encodedStateBytes({...active.run.learners[id],timing:active.controls[id]}));
  control.advanceTo(4);active.advanceTo(4);assert.equal(control.run.endpoint().scalarOperations,active.run.endpoint().scalarOperations);
  const observed=StallTransfer.restore(active.checkpoint(),{observer:event=>events.push(event)}),resumed=StallTransfer.restore(active.checkpoint());
  for(const run of [active,observed,resumed]){run.commitEscape(1);run.advanceTo(16);}
  assert.deepEqual(active.checkpoint(),observed.checkpoint());assert.deepEqual(active.checkpoint(),resumed.checkpoint());
  for(const fly of checkpoint.world.world.flies)fly.genome.traits.lifespan=.01;
  const dead=new StallTransfer(checkpoint,255107,{speedMode:1,escapeMode:1});dead.commitEscape(1);dead.advanceTo(16);
  assert.equal(dead.snapshot().endpoint.survivors,0);assert.ok(dead.snapshot().endpoint.outstandingEnergy>0);
});
