import test from 'node:test';
import assert from 'node:assert/strict';
import {overlapObservation,overlapRecommendation,OverlapTransfer} from '../learning/overlap-harvest.mjs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const anchor=()=>new TasteExperiment({history:{seed:256021,cueSeed:256022,resourceSeeds:[256023,256024,256025,256026]},reference:{...VALUE_REFERENCE,founders:2}}).checkpoint(false);
test('only observable overlapping pairs create virtual targets; source grid is excluded',()=>{
  const work={scalarOperations:0};
  const points=overlapObservation({x:10,y:20,heading:0},[{x:40,y:10,amount:1},{x:40,y:30,amount:1},{x:10,y:20,amount:.06}],work);
  assert.deepEqual(points,[[30,-10,1],[30,10,1]]);
  const result=overlapRecommendation(points,work);assert.deepEqual(result.point,[30,0]);assert.deepEqual(result.pair,[0,1]);assert.equal(result.score,.04);
  assert.deepEqual(overlapRecommendation([[30,-16,1],[30,16,1]],work).pair,[-1,-1]);
  const rotated=overlapObservation({x:10,y:20,heading:Math.PI/2},[{x:40,y:20,amount:1}],work);assert.ok(Math.abs(rotated[0][0])<1e-12);assert.equal(rotated[0][1],-30);
});
test('observers are neutral, continuation is exact and matched native shares start physics',()=>{
  const cp=anchor(),events=[],observed=new OverlapTransfer(cp,256027,1,{observer:event=>events.push(event)}),plain=new OverlapTransfer(cp,256027,1),native=new OverlapTransfer(cp,256027,0);
  assert.deepEqual(observed.world.checkpoint(),native.world.checkpoint());
  for(let tick=0;tick<8;tick++){observed.step();plain.step();}
  assert.deepEqual(observed.checkpoint(),plain.checkpoint());
  const restored=OverlapTransfer.restore(plain.checkpoint());for(let tick=0;tick<8;tick++){plain.step();restored.step();}
  assert.deepEqual(plain.checkpoint(),restored.checkpoint());assert.ok(events.some(event=>event.type==='decision'));
});
test('extinction retains inherited and current unpaid work',()=>{
  const cp=anchor();for(const fly of cp.world.world.flies){cp.world.world.initialEnergy-=fly.energy-1e-9;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  const run=new OverlapTransfer(cp,256028,1),end=run.advance();assert.equal(end.survivors,0);assert.ok(end.outstandingEnergy>0);
});
