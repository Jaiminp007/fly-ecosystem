import test from 'node:test';
import assert from 'node:assert/strict';
import {filteredOverlapRecommendation} from '../learning/filtered-overlap.mjs';
import {incrementalOverlapRecommendation} from '../learning/incremental-overlap.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

function compare(points){
  const old={separation:7},candidate={separation:7},oldWork={scalarOperations:0},newWork={scalarOperations:0};
  assert.deepEqual(incrementalOverlapRecommendation(points,newWork,candidate),filteredOverlapRecommendation(points,oldWork,old));
  assert.equal(candidate.separation,old.separation);assert.ok(newWork.scalarOperations>0);assert.ok(encodedStateBytes(candidate)>encodedStateBytes(old));
}
test('boundary, duplicate and unsafe geometries match exactly',()=>{
  for(const points of [[],[[0,0,1]],[[-32,0,1],[0,0,1],[32,0,1]],[[0,0,3],[0,0,3],[0,0,3]],
    [[-1e-12,1,2],[30-1e-12,1,2],[32,1,2],[-32,1,2]],[[1e300,0,1],[1e300,0,2]]])compare(points);
});
test('exact ties retain the original lexicographic pair',()=>{
  const points=[[0,0,1],[16,0,1],[-16,0,1]],result=incrementalOverlapRecommendation(points,{scalarOperations:0},{separation:0});
  assert.deepEqual(result.pair,[0,1]);compare(points);
});
test('seeded geometries and ties retain recommendations',()=>{
  let seed=316723;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let trial=0;trial<5000;trial++){
    const points=Array.from({length:Math.floor(random()*80)},()=>[(random()-.5)*400,(random()-.5)*400,random()*100]);
    if(points.length>3&&trial%3===0){points[1]=[...points[0]];points[3]=[...points[2]];}
    compare(points);
  }
});
