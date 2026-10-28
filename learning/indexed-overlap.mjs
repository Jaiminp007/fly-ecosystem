import {filteredOverlapRecommendation} from './filtered-overlap.mjs';

export function indexedOverlapRecommendation(points,work,scratch){
  scratch.bins={};work.scalarOperations++;
  let safe=true;
  for(const [forward]of points){
    const cell=Math.floor(forward/32);work.scalarOperations+=3;
    if(!Number.isSafeInteger(cell)||Math.abs(cell)>=Number.MAX_SAFE_INTEGER){safe=false;break;}
  }
  if(!safe)return filteredOverlapRecommendation(points,work,scratch);
  let score=0,point=[0,0],pair=[-1,-1];
  for(let index=0;index<points.length;index++){
    const [forward,lateral,amount]=points[index],value=amount/(Math.hypot(forward,lateral)+20),cell=Math.floor(forward/32);
    work.scalarOperations+=10;
    if(value>score){score=value;point=[forward,lateral];}
    const key=String(cell);if(!Object.hasOwn(scratch.bins,key)){scratch.bins[key]=[];work.scalarOperations+=2;}
    scratch.bins[key].push(index);work.scalarOperations+=2;
  }
  for(let first=0;first<points.length;first++){
    const left=points[first],cell=Math.floor(left[0]/32);work.scalarOperations+=3;
    for(let offset=-1;offset<=1;offset++){
      const bucket=scratch.bins[String(cell+offset)]??[];work.scalarOperations+=3;
      for(const second of bucket){
        work.scalarOperations++;if(second<=first)continue;
        const right=points[second],separation=Math.abs(left[0]-right[0]);work.scalarOperations+=3;
        if(separation>32)continue;
        const distance=Math.hypot(separation,left[1]-right[1]);work.scalarOperations+=3;if(distance>30)continue;
        const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);
        work.scalarOperations+=11;
        if(value>score||value===score&&pair[0]>=0&&(first<pair[0]||first===pair[0]&&second<pair[1])){score=value;point=midpoint;pair=[first,second];}
      }
    }
  }
  if(points.length>=2){scratch.separation=Math.abs(points[points.length-2][0]-points[points.length-1][0]);work.scalarOperations+=3;}
  return {point,pair,score};
}
