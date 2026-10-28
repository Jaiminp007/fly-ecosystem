import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync,renameSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {GuardedOverlapTransfer} from '../learning/guarded-overlap.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/guarded-overlap/20261026-v2');
const read=path=>JSON.parse(readFileSync(path,'utf8')),protocol=read(join(output,'protocol.json'));
assert.ok(!existsSync(join(output,'results.json')));
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(digest(readFileSync(join(root,name))),expected);
for(const source of protocol.inputs){assert.equal(digest(readFileSync(join(root,source.anchor))),source.anchorSha256);assert.equal(digest(readFileSync(join(root,source.bare))),source.bareSha256);}
const recovery={schema:1,reason:'Provided JavaScript runtime timed out and reset its kernel after five completed histories. No child process was launched. Preserve completed rows; retain incomplete trace before rerunning only that deterministic arm.',createdAt:new Date().toISOString(),helperSha256:digest(readFileSync(fileURLToPath(import.meta.url))),interrupted:[],reused:[]};
const start=performance.now(),rows=[];
for(const source of protocol.inputs){
  const seed=source.history.seed,rowPath=join(output,'rows',seed+'.json');
  if(existsSync(rowPath)){
    const row=read(rowPath);for(const arm of ['guarded','unguarded','native']){assert.equal(digest(readFileSync(join(output,'traces',seed+'-'+arm+'.jsonl'))),row.traceHashes[arm]);assert.ok(existsSync(join(output,'finals',seed+'-'+arm+'.json')));}
    recovery.reused.push(seed);rows.push(row);continue;
  }
  const anchor=read(join(root,source.anchor)),bare=read(join(root,source.bare)).arms['bare-full'],arms={},traceHashes={};
  for(const [arm,mode]of [['guarded',1],['unguarded',2],['native',0]]){
    const trace=join(output,'traces',seed+'-'+arm+'.jsonl'),final=join(output,'finals',seed+'-'+arm+'.json');
    if(existsSync(final)){
      const checkpoint=read(final),run=GuardedOverlapTransfer.restore(checkpoint);assert.ok(run.world.tick>=run.endTick||!run.world.flies.length);
      arms[arm]=run.endpoint();traceHashes[arm]=digest(readFileSync(trace));continue;
    }
    if(existsSync(trace)){
      const interrupted=trace+'.interrupted-1';assert.ok(!existsSync(interrupted));const record={path:trace.slice(root.length).replaceAll('\\','/'),bytes:readFileSync(trace).length,sha256:digest(readFileSync(trace))};renameSync(trace,interrupted);recovery.interrupted.push(record);
    }
    mkdirSync(dirname(trace),{recursive:true});const fd=openSync(trace,'wx'),hash=createHash('sha256');
    const run=new GuardedOverlapTransfer(anchor,source.history.probeSeeds.transfer,mode,{observer:event=>{const text=JSON.stringify(event)+'\n';writeSync(fd,text);hash.update(text);}});assert.equal(run.startWorldSha256,bare.startWorldSha256);
    try{arms[arm]=run.advance();}finally{closeSync(fd);}
    traceHashes[arm]=hash.digest('hex');write(final,run.checkpoint());
  }
  arms['bare-full']=bare.endpoint;
  const effects=Object.fromEntries(['native','bare-full'].map(name=>[name,{energy:arms.guarded.budgetAdjustedEnergyPerFounder-arms[name].budgetAdjustedEnergyPerFounder,survivors:arms.guarded.survivors-arms[name].survivors}]));
  const row={history:source.history,arms,effects,traceHashes};write(rowPath,row);rows.push(row);console.log(JSON.stringify({seed,effects,statistics:arms.guarded.statistics}));
}
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(digest(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['native','bare-full'].map(name=>[name,{meanEnergy:rows.reduce((sum,row)=>sum+row.effects[name].energy,0)/8,positiveHistories:rows.filter(row=>row.effects[name].energy>0).length,survivorDifference:rows.reduce((sum,row)=>sum+row.effects[name].survivors,0)}]));
const result={schema:1,kind:protocol.kind,comparisons,promisingHeadroom:Object.values(comparisons).every(row=>row.meanEnergy>0&&row.positiveHistories>=6&&row.survivorDifference>=0),qualified:false,runtime:{wallSeconds:null,resumeWallSeconds:(performance.now()-start)/1000,cpuSeconds:null,note:'Original capture interrupted; no complete wall/CPU runtime is claimed.'},recovery:'recovery.json'};
write(join(output,'recovery.json'),recovery);write(join(output,'results.json'),result);console.log(JSON.stringify(result));
