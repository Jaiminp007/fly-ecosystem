import test from 'node:test';
import assert from 'node:assert/strict';
import {filteredOverlapRecommendation} from '../learning/filtered-overlap.mjs';
import {indexedOverlapRecommendation} from '../learning/indexed-overlap.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

function compare(points,initial=7){
  const baseline={separation:initial},indexed={separation:initial},oldWork={scalarOperations:0},newWork={scalarOperations:0};
  assert.deepEqual(indexedOverlapRecommendation(points,newWork,indexed),filteredOverlapRecommendation(points,oldWork,baseline));
  assert.equal(indexed.separation,baseline.separation);assert.ok(newWork.scalarOperations>0);
  assert.ok(encodedStateBytes(indexed)>encodedStateBytes(baseline));
}
test('negative boundaries, duplicates, ties and unsafe cells preserve strict order',()=>{
  for(const points of [[],[[0,0,1]],[[-32,0,1],[0,0,1],[32,0,1]],[[0,0,3],[0,0,3],[0,0,3]],
    [[-1e-12,1,2],[30-1e-12,1,2],[32,1,2],[-32,1,2]],[[1e300,0,1],[1e300,0,2]]])compare(points);
});
test('out-of-order bucket ties retain the original lexicographic pair',()=>{
  const points=[[0,0,1],[16,0,1],[-16,0,1]],result=indexedOverlapRecommendation(points,{scalarOperations:0},{separation:0});
  assert.deepEqual(result.pair,[0,1]);compare(points);
});
test('seeded finite geometry and deliberately tied points preserve recommendations',()=>{
  let seed=9783421;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let trial=0;trial<5000;trial++){
    const points=Array.from({length:Math.floor(random()*80)},()=>[(random()-.5)*400,(random()-.5)*400,random()*100]);
    if(points.length>3&&trial%3===0){points[1]=[...points[0]];points[3]=[...points[2]];}
    compare(points);
  }
});
