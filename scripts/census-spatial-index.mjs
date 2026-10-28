import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1'),output=join(root,'evidence/spatial-index-census/20261026-v1');
assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(previous.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
const inputs=[];for(const history of previous.histories)for(const family of ['C','transfer']){
  const label=history.seed+'-replay-'+(family==='C'?'acquire-C':'probe-transfer-current'),start=join(base,'starts',label+'.json'),final=join(base,'finals',label+'.json');
  inputs.push({seed:history.seed,family,label,startSha256:hash(readFileSync(start)),finalSha256:hash(readFileSync(final)),ticks:family==='C'?512:256});
}
const names=['scripts/census-spatial-index.mjs','docs/SPATIAL_INDEX_CENSUS_DESIGN.md'],sources=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
write(join(output,'protocol.json'),{schema:1,inputs,sourceSha256:sources,capturedProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),cellWidth:32,
  scope:'Captured-source exact replay and observer-only pair census, not net cost, performance or qualification.'});
for(const name of names){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const startPath=join(base,'starts',input.label+'.json'),finalPath=join(base,'finals',input.label+'.json');
  assert.equal(hash(readFileSync(startPath)),input.startSha256);assert.equal(hash(readFileSync(finalPath)),input.finalSha256);
  const run=OdorRoutedExperiment.restore(read(startPath)),counts={decisions:0,points:0,allPairs:0,neighborPairs:0,filteredPairs:0,withinRadiusPairs:0,grossSkippedChecks:0,maxPoints:0,histogram:{}};
  run.attach(event=>{
    if(event.type!=='decision')return;
    const points=run.learners[event.id].spatialPoints,n=points.length;counts.decisions++;counts.points+=n;counts.maxPoints=Math.max(counts.maxPoints,n);counts.histogram[n]=(counts.histogram[n]??0)+1;
    let score=0,point=[0,0],pair=[-1,-1];
    for(const [forward,lateral,amount]of points){const value=amount/(Math.hypot(forward,lateral)+20);if(value>score){score=value;point=[forward,lateral];}}
    for(let first=0;first<n;first++)for(let second=first+1;second<n;second++){
      const left=points[first],right=points[second],dx=Math.abs(left[0]-right[0]),neighbor=Math.abs(Math.floor(left[0]/32)-Math.floor(right[0]/32))<=1;
      counts.allPairs++;counts.neighborPairs+=Number(neighbor);
      if(dx>32)continue;assert.ok(neighbor);counts.filteredPairs++;
      if(Math.hypot(dx,left[1]-right[1])>30)continue;counts.withinRadiusPairs++;
      const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);
      if(value>score){score=value;point=midpoint;pair=[first,second];}
    }
    assert.deepEqual({point,pair,score},event.recommendation);
  });
  run.advance(input.ticks);run.attach(null);assert.deepEqual(run.checkpoint(false),read(finalPath));
  counts.grossSkippedChecks=counts.allPairs-counts.neighborPairs;
  const row={...input,counts};write(join(output,'rows',input.seed+'-'+input.family+'.json'),row);rows.push(row);console.log(JSON.stringify(row));
}
const totals={};for(const family of ['C','transfer']){
  const group=rows.filter(row=>row.family===family),sum={decisions:0,points:0,allPairs:0,neighborPairs:0,filteredPairs:0,withinRadiusPairs:0,grossSkippedChecks:0,maxPoints:0,histogram:{}};
  for(const row of group){for(const key of ['decisions','points','allPairs','neighborPairs','filteredPairs','withinRadiusPairs','grossSkippedChecks'])sum[key]+=row.counts[key];sum.maxPoints=Math.max(sum.maxPoints,row.counts.maxPoints);
    for(const [n,count]of Object.entries(row.counts.histogram))sum.histogram[n]=(sum.histogram[n]??0)+count;}
  totals[family]=sum;
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const result={schema:1,passed:true,totals,scope:'Captured-source exact final-checkpoint replay, strict-tie recommendation and 32-unit cell containment census; no index cost or physical performance claim.'};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
