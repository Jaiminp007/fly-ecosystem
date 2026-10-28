import assert from 'node:assert/strict';
import {createReadStream,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {overlapRecommendation} from '../learning/overlap-harvest.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const directory=join(root,'evidence/guarded-overlap/20261026-v2/traces');
function indexed(points,radius){
  const cells=new Map(),coordinates=[];
  for(let index=0;index<points.length;index++){
    const column=Math.floor(points[index][0]/30),row=Math.floor(points[index][1]/30),key=column+','+row;
    coordinates.push([column,row]);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(index);
  }
  let score=0,point=[0,0],pair=[-1,-1],candidates=0;
  for(const [forward,lateral,amount]of points){
    const value=amount/(Math.hypot(forward,lateral)+20);
    if(value>score){score=value;point=[forward,lateral];}
  }
  for(let first=0;first<points.length;first++){
    const [column,row]=coordinates[first],neighbors=[];
    for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++){
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
const witness=[[-1e-15,0,10],[30,0,10]],work={scalarOperations:0};
const exhaustive=overlapRecommendation(witness,work),old=indexed(witness,1).recommendation;
assert.notDeepEqual(old,exhaustive);
assert.deepEqual(indexed(witness,2).recommendation,exhaustive);
const cases=[witness,[[0,-1e-15,10],[0,30,10]],[[1e-15,0,10],[-30,0,10]],
  [[-30-Number.EPSILON*16,0,10],[0,0,10]],[[0,0,1],[0,0,1],[30,0,1]]];
for(const points of cases)assert.deepEqual(indexed(points,2).recommendation,overlapRecommendation(points,{scalarOperations:0}));
let decisions=0,allPairs=0,candidatePairs=0;const rows=[];
for(const name of readdirSync(directory).filter(name=>name.endsWith('-guarded.jsonl')).sort()){
  const source=createReadStream(join(directory,name)),hash=createHash('sha256');source.on('data',block=>hash.update(block));
  const row={path:'evidence/guarded-overlap/20261026-v2/traces/'+name,decisions:0,allPairs:0,candidatePairs:0};
  for await(const line of createInterface({input:source,crlfDelay:Infinity})){
    const event=JSON.parse(line);if(event.type!=='decision')continue;
    const actual=indexed(event.points,2);assert.deepEqual(actual.recommendation,overlapRecommendation(event.points,{scalarOperations:0}));
    row.decisions++;row.allPairs+=event.points.length*(event.points.length-1)/2;row.candidatePairs+=actual.candidates;
  }
  row.sha256=hash.digest('hex');rows.push(row);decisions+=row.decisions;allPairs+=row.allPairs;candidatePairs+=row.candidatePairs;
}
const result={schema:1,kind:'index-boundary-counterexample-and-wide-neighborhood',sourceSha256:createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  witness,exhaustive,originalThreeByThree:old,syntheticCases:cases.length,decisions,allPairs,candidatePairs,rows,
  caveat:'Five-by-five is checked empirically on these cases and tapes, not proven exact for arbitrary floating-point inputs. No index overhead or memory pricing, paid replay, or learned ability is claimed.'};
const output=join(root,'evidence/guarded-overlap/20261026-v2/index-boundary-check.json');
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
