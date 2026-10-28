import assert from 'node:assert/strict';
import {overlapRecommendation} from './overlap-harvest.mjs';
import {encodedStateBytes} from './sarsa-experiment.mjs';

export function filteredOverlapRecommendation(points,work,scratch){
  let score=0,point=[0,0],pair=[-1,-1];
  for(const [forward,lateral,amount] of points){
    const value=amount/(Math.hypot(forward,lateral)+20);work.scalarOperations+=4;
    if(value>score){score=value;point=[forward,lateral];}
  }
  for(let first=0;first<points.length;first++)for(let second=first+1;second<points.length;second++){
    const left=points[first],right=points[second];
    scratch.separation=Math.abs(left[0]-right[0]);work.scalarOperations+=3;
    if(scratch.separation>32)continue;
    const distance=Math.hypot(scratch.separation,left[1]-right[1]);work.scalarOperations+=3;
    if(distance>30)continue;
    const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);work.scalarOperations+=9;
    if(value>score){score=value;point=midpoint;pair=[first,second];}
  }
  return {point,pair,score};
}

export function verifyFilteredRecommendation(points){
  const scratch={separation:0},filteredWork={scalarOperations:0},originalWork={scalarOperations:0};
  const result=filteredOverlapRecommendation(points,filteredWork,scratch);
  assert.deepEqual(result,overlapRecommendation(points,originalWork));
  return {filteredWork:filteredWork.scalarOperations,originalWork:originalWork.scalarOperations,scratchBytes:encodedStateBytes(scratch)};
}
