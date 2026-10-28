import assert from 'node:assert/strict';
import {createReadStream,readdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {overlapRecommendation} from '../learning/overlap-harvest.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const traces=join(root,'evidence/guarded-overlap/20261026-v2/traces');
const output=join(root,'evidence/guarded-overlap/20261026-v2/index-census.json');
assert.ok(!existsSync(output),'Do not overwrite existing diagnostic evidence');
function indexed(points){
  const cells=new Map(),coordinates=[];
  for(let index=0;index<points.length;index++){
    const column=Math.floor(points[index][0]/30),row=Math.floor(points[index][1]/30),key=column+','+row;
    coordinates.push([column,row]);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(index);
  }
  let score=0,point=[0,0],pair=[-1,-1],candidates=0;
  for(const [forward,lateral,amount]of points){
    const value=amount/(Math.hypot(forward,lateral)+20);if(value>score){score=value;point=[forward,lateral];}
  }
  for(let first=0;first<points.length;first++){
    const [column,row]=coordinates[first],neighbors=[];
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      for(const second of cells.get((column+dx)+','+(row+dy))??[])if(second>first)neighbors.push(second);
    }
    neighbors.sort((left,right)=>left-right);
    for(const second of neighbors){
      candidates++;
      const left=points[first],right=points[second];
      if(Math.hypot(left[0]-right[0],left[1]-right[1])>30)continue;
      const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);
      if(value>score){score=value;point=midpoint;pair=[first,second];}
    }
  }
  return {recommendation:{point,pair,score},candidates};
}
let state=123456789;
function random(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}
const boundary=[[],[[0,0,1]],[[0,0,1],[30,0,1]],[[0,0,1],[30.000000001,0,1]],
  [[-30,0,1],[0,0,1]],[[0,0,1],[0,0,1],[0,0,1]],[[0,-30,1],[0,0,1],[30,0,1],[-30,0,1]]];
let synthetic=0;
for(let trial=0;trial<1000;trial++)boundary.push(Array.from({length:Math.floor(random()*50)},()=>[(random()-.5)*240,(random()-.5)*240,random()*8]));
for(const points of boundary){assert.deepEqual(indexed(points).recommendation,overlapRecommendation(points,{scalarOperations:0}));synthetic++;}
const rows=[],histogram={};let decisions=0,allPairs=0,candidatePairs=0,pointsTotal=0;
for(const name of readdirSync(traces).filter(name=>name.endsWith('-guarded.jsonl')).sort()){
  const row={path:'evidence/guarded-overlap/20261026-v2/traces/'+name,decisions:0,points:0,allPairs:0,candidatePairs:0},hash=createHash('sha256');
  const source=createReadStream(join(traces,name));source.on('data',block=>hash.update(block));
  for await(const line of createInterface({input:source,crlfDelay:Infinity})){
    const event=JSON.parse(line);if(event.type!=='decision')continue;
    const points=event.points,result=indexed(points),expected=overlapRecommendation(points,{scalarOperations:0});
    assert.deepEqual(result.recommendation,expected);
    row.decisions++;row.points+=points.length;row.allPairs+=points.length*(points.length-1)/2;row.candidatePairs+=result.candidates;
    histogram[points.length]=(histogram[points.length]??0)+1;
  }
  row.sha256=hash.digest('hex');rows.push(row);decisions+=row.decisions;pointsTotal+=row.points;allPairs+=row.allPairs;candidatePairs+=row.candidatePairs;
}
const result={schema:1,kind:'offline-exact-index-feasibility-census',sourceSha256:createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  syntheticCases:synthetic,decisions,points:pointsTotal,allPairs,candidatePairs,histogram,rows,
  avoidedDistanceOperations:4*(allPairs-candidatePairs),
  minimalCoordinateOperations:4*pointsTotal,
  caveat:'Offline equivalence on synthetic cases and captured guarded trajectories only; no paid physical replay. Candidate filtering omits map/string creation, nine lookups per point, neighbor enumeration/sorting and dynamic memory bills. Coordinate operation count is a lower bound, not a complete index price. This is not acquired learning or an autonomous revision.'};
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
