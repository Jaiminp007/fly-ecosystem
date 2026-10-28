import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1'),output=join(root,'evidence/incremental-overlap-measurement/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(output,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(output,'sources',name))),expected);
const previous=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(previous.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
function bytes(value){
  if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);
  return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);
}
let decisions=0;
for(const input of protocol.inputs){
  const startPath=join(base,'starts',input.label+'.json'),finalPath=join(base,'finals',input.label+'.json');assert.equal(hash(readFileSync(startPath)),input.startSha256);assert.equal(hash(readFileSync(finalPath)),input.finalSha256);
  const start=read(startPath),run=OdorRoutedExperiment.restore(start),row=read(join(output,'rows',input.seed+'-'+input.family+'.json'));
  const counts={decisions:0,oldOperations:0,indexedOperations:0,oldScratchByteTicks:0,indexedScratchByteTicks:0,cheaperDecisions:0};
  run.attach(event=>{
    if(event.type!=='decision')return;const points=run.learners[event.id].spatialPoints,n=points.length,bins={},scratch=run.learners[event.id].scratch;
    for(let index=0;index<n;index++){const cell=Math.floor(points[index][0]/32);assert.ok(Number.isSafeInteger(cell)&&Math.abs(cell)<Number.MAX_SAFE_INTEGER);(bins[String(cell)]??=[]).push(index);}
    let pairs=0,neighbors=0,filtered=0,within=0;
    for(let first=0;first<n;first++)for(let second=first+1;second<n;second++){
      const left=points[first],right=points[second],dx=Math.abs(left[0]-right[0]);pairs++;
      const neighbor=Math.abs(Math.floor(left[0]/32)-Math.floor(right[0]/32))<=1;neighbors+=Number(neighbor);
      if(dx<=32){assert.ok(neighbor);filtered++;if(Math.hypot(dx,left[1]-right[1])<=30)within++;}
    }
    const oldOps=4*n+3*pairs+3*filtered+9*within,indexedOps=1+21*n+2*Object.keys(bins).length+4*neighbors+3*filtered+11*within+(n>=2?3:0);
    const oldBytes=bytes(scratch),newBytes=bytes({...scratch,bins});
    counts.decisions++;counts.oldOperations+=oldOps;counts.indexedOperations+=indexedOps;counts.oldScratchByteTicks+=oldBytes;counts.indexedScratchByteTicks+=newBytes;
    const pricing=start.state.pricing;counts.cheaperDecisions+=Number(indexedOps*pricing.operationEnergy+newBytes*pricing.byteEnergyPerSecond*.1<oldOps*pricing.operationEnergy+oldBytes*pricing.byteEnergyPerSecond*.1);
  });
  run.advance(input.ticks);run.attach(null);assert.deepEqual(run.checkpoint(false),read(finalPath));assert.deepEqual(counts,row.counts);
  const operationDelta=counts.indexedOperations-counts.oldOperations,byteTickDelta=counts.indexedScratchByteTicks-counts.oldScratchByteTicks;
  assert.equal(operationDelta,row.operationDelta);assert.equal(byteTickDelta,row.byteTickDelta);
  assert.equal(operationDelta*start.state.pricing.operationEnergy+byteTickDelta*start.state.pricing.byteEnergyPerSecond*.1,row.declaredEnergyDelta);
  decisions+=counts.decisions;console.log(JSON.stringify({seed:input.seed,family:input.family,decisions:counts.decisions}));
}
const report={schema:1,passed:true,decisions,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  scope:'Post-outcome independent combinatorial reconstruction of declared work and encoded scratch byte-time on captured-source physical replay; not independent physics or complete low-level cost adequacy.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
