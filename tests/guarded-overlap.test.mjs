import test from 'node:test';
import assert from 'node:assert/strict';
import {overlapGuard,GuardedOverlapTransfer} from '../learning/guarded-overlap.mjs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const anchor=()=>new TasteExperiment({history:{seed:256031,cueSeed:256032,resourceSeeds:[256033,256034,256035,256036]},reference:{...VALUE_REFERENCE,founders:2}}).checkpoint(false);
test('wall and own travel budget, not arbitrary energy thresholds, determine admissibility',()=>{
  const raw=Array(17).fill(0),work={scalarOperations:0};
  const near=overlapGuard([30,0],raw,.5,30,.05,work);assert.equal(near.requiredEnergy,.25);assert.ok(near.viable&&!near.wall);
  assert.ok(!overlapGuard([30,0],raw,.25,30,.05,work).viable);
  assert.ok(!overlapGuard([90,0],raw,.5,30,.05,work).viable);
  raw[10]=1;assert.ok(overlapGuard([30,0],raw,10,30,.05,work).wall);assert.equal(work.scalarOperations,60);
});
test('guarded, unguarded and native modes share starting physics and exact resumed pricing state',()=>{
  const cp=anchor(),events=[],first=new GuardedOverlapTransfer(cp,256037,1,{observer:event=>events.push(event)}),plain=new GuardedOverlapTransfer(cp,256037,1),native=new GuardedOverlapTransfer(cp,256037,0),unguarded=new GuardedOverlapTransfer(cp,256037,2);
  assert.deepEqual(first.world.checkpoint(),native.world.checkpoint());assert.deepEqual(first.world.checkpoint(),unguarded.world.checkpoint());
  for(let tick=0;tick<8;tick++){first.step();plain.step();}assert.deepEqual(first.checkpoint(),plain.checkpoint());
  const resumed=GuardedOverlapTransfer.restore(plain.checkpoint());for(let tick=0;tick<8;tick++){plain.step();resumed.step();}assert.deepEqual(plain.checkpoint(),resumed.checkpoint());
  for(const event of events.filter(event=>event.type==='decision'))assert.equal(event.midpoint,event.pair[0]>=0&&!event.guard.wall&&event.guard.viable);
});
test('terminal work retains inherited/current debt without reviving founders',()=>{
  const cp=anchor();for(const fly of cp.world.world.flies){cp.world.world.initialEnergy-=fly.energy-1e-9;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  const run=new GuardedOverlapTransfer(cp,256038,1),endpoint=run.advance();assert.equal(endpoint.survivors,0);assert.ok(endpoint.outstandingEnergy>0);
});
