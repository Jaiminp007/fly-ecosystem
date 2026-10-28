import {filteredOverlapRecommendation} from './filtered-overlap.mjs';

export function incrementalOverlapRecommendation(points,work,scratch){
  scratch.bins={};work.scalarOperations++;
  for(const [forward]of points){
    const cell=Math.floor(forward/32);work.scalarOperations+=3;
    if(!Number.isSafeInteger(cell)||Math.abs(cell)>=Number.MAX_SAFE_INTEGER)return filteredOverlapRecommendation(points,work,scratch);
  }
  let score=0,point=[0,0],pair=[-1,-1];
  for(const [forward,lateral,amount]of points){const value=amount/(Math.hypot(forward,lateral)+20);work.scalarOperations+=4;if(value>score){score=value;point=[forward,lateral];}}
  for(let second=0;second<points.length;second++){
    const right=points[second],cell=Math.floor(right[0]/32);work.scalarOperations+=3;
    for(let offset=-1;offset<=1;offset++){
      const bucket=scratch.bins[String(cell+offset)]??[];work.scalarOperations+=3;
      for(const first of bucket){
        const left=points[first],separation=Math.abs(left[0]-right[0]);work.scalarOperations+=4;
        if(separation>32)continue;
        const distance=Math.hypot(separation,left[1]-right[1]);work.scalarOperations+=3;if(distance>30)continue;
        const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);work.scalarOperations+=11;
        if(value>score||value===score&&pair[0]>=0&&(first<pair[0]||first===pair[0]&&second<pair[1])){score=value;point=midpoint;pair=[first,second];}
      }
    }
    const key=String(cell);if(!Object.hasOwn(scratch.bins,key)){scratch.bins[key]=[];work.scalarOperations+=2;}
    scratch.bins[key].push(second);work.scalarOperations+=2;
  }
  if(points.length>=2){scratch.separation=Math.abs(points[points.length-2][0]-points[points.length-1][0]);work.scalarOperations+=3;}
  return {point,pair,score};
}
