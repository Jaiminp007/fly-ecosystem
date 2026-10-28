import test from 'node:test';
import assert from 'node:assert/strict';
import {filteredOverlapRecommendation,verifyFilteredRecommendation} from '../learning/filtered-overlap.mjs';
import {overlapRecommendation} from '../learning/overlap-harvest.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {FilteredOverlapTransfer} from '../learning/filtered-overlap-transfer.mjs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('filter preserves boundary recommendations and bills scratch state',()=>{
  const points=[[-1e-15,0,10],[30,0,10],[32.000001,0,4],[0,0,1]];
  const result=verifyFilteredRecommendation(points);
  assert.equal(result.scratchBytes,encodedStateBytes({separation:0}));
  assert.ok(result.filteredWork>0&&result.originalWork>0);
});

test('seeded finite geometry preserves recommendation and ordering',()=>{
  let seed=9783421;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let trial=0;trial<5000;trial++){
    const points=Array.from({length:Math.floor(random()*20)},()=>[(random()-.5)*2000,(random()-.5)*2000,random()*100]);
    assert.deepEqual(filteredOverlapRecommendation(points,{scalarOperations:0},{separation:0}),overlapRecommendation(points,{scalarOperations:0}));
  }
});

test('work bill includes filter and eligible distance checks',()=>{
  const work={scalarOperations:0},scratch={separation:0};
  filteredOverlapRecommendation([[0,0,1],[1,0,1],[100,0,1]],work,scratch);
  assert.equal(work.scalarOperations,3*4+3*3+3+9);
  assert.equal(scratch.separation,99);
});

test('scratch is billed and checkpoint restore preserves controller and debt',()=>{
  const anchor=new TasteExperiment({history:{seed:256031,cueSeed:256032,resourceSeeds:[256033,256034,256035,256036]},reference:{...VALUE_REFERENCE,founders:2}}).checkpoint(false);
  const first=new FilteredOverlapTransfer(anchor,256037,1);
  for(let tick=0;tick<8;tick++)first.step();
  for(const state of Object.values(first.controllers)){
    assert.equal(state.charge.storageBytes,encodedStateBytes(state));
    assert.ok(Number.isFinite(state.scratch.separation));
  }
  const restored=FilteredOverlapTransfer.restore(first.checkpoint());
  for(let tick=0;tick<8;tick++){first.step();restored.step();}
  assert.deepEqual(first.checkpoint(),restored.checkpoint());
});
