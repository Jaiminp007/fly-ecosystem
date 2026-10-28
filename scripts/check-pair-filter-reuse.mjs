import assert from 'node:assert/strict';
import {createReadStream,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {overlapRecommendation} from '../learning/overlap-harvest.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const directory=join(root,'evidence/guarded-overlap/20261026-v2/traces');
function filtered(points,work){
  let score=0,point=[0,0],pair=[-1,-1],distanceChecks=0;
  for(const [forward,lateral,amount] of points){
    const value=amount/(Math.hypot(forward,lateral)+20);work.scalarOperations+=4;
    if(value>score){score=value;point=[forward,lateral];}
  }
  for(let first=0;first<points.length;first++)for(let second=first+1;second<points.length;second++){
    const left=points[first],right=points[second];
    const separation=Math.abs(left[0]-right[0]);work.scalarOperations+=3;
    if(separation>32)continue;
    const distance=Math.hypot(separation,left[1]-right[1]);work.scalarOperations+=3;distanceChecks++;
    if(distance>30)continue;
    const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);work.scalarOperations+=9;
    if(value>score){score=value;point=midpoint;pair=[first,second];}
  }
  return {recommendation:{point,pair,score},distanceChecks};
}
const cases=[[],[[-1e-15,0,10],[30,0,10]],[[0,0,10],[32,0,10]],[[0,0,10],[32.0000001,0,10]],
  [[0,0,1],[0,0,1],[30,0,1]],[[0,0,10],[0,30,10]],[[0,0,10],[0,31,10]]];
for(const points of cases)assert.deepEqual(filtered(points,{scalarOperations:0}).recommendation,overlapRecommendation(points,{scalarOperations:0}));
let decisions=0,allPairs=0,distanceChecks=0,originalWork=0,filterWork=0;const rows=[];
for(const name of readdirSync(directory).filter(name=>name.endsWith('-guarded.jsonl')).sort()){
  const source=createReadStream(join(directory,name)),hash=createHash('sha256');source.on('data',block=>hash.update(block));
  const row={path:'evidence/guarded-overlap/20261026-v2/traces/'+name,decisions:0,allPairs:0,distanceChecks:0,originalWork:0,filterWork:0};
  for await(const line of createInterface({input:source,crlfDelay:Infinity})){
    const event=JSON.parse(line);if(event.type!=='decision')continue;
    const original={scalarOperations:0},candidate={scalarOperations:0},actual=filtered(event.points,candidate);
    assert.deepEqual(actual.recommendation,overlapRecommendation(event.points,original));
    row.decisions++;row.allPairs+=event.points.length*(event.points.length-1)/2;row.distanceChecks+=actual.distanceChecks;
    row.originalWork+=original.scalarOperations;row.filterWork+=candidate.scalarOperations;
  }
  row.sha256=hash.digest('hex');rows.push(row);decisions+=row.decisions;allPairs+=row.allPairs;distanceChecks+=row.distanceChecks;originalWork+=row.originalWork;filterWork+=row.filterWork;
}
const result={schema:1,kind:'offline-reused-axis-filter-census',sourceSha256:createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  syntheticCases:cases.length,decisions,allPairs,distanceChecks,originalWork,filterWork,rows,
  caveat:'Filter retains original loop order, reuses the absolute x difference in Math.hypot, and adds subtraction, absolute value and comparison charges per pair. Empirical bitwise equivalence is specific to this runtime. The cutoff 32 leaves a two-unit floating-point margin above radius 30. Offline tape costs only, no physical replay or complete campaign pricing.'};
writeFileSync(join(root,'evidence/guarded-overlap/20261026-v2/pair-filter-reuse-census.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
