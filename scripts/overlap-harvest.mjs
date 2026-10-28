import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {dirname,join,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {OverlapTransfer} from '../learning/overlap-harvest.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/taste-development/attempt-15-progress'),output=join(root,'evidence/overlap-harvest/20261026-v1');
assert.ok(!existsSync(output));
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const write=(name,value)=>{mkdirSync(dirname(name),{recursive:true});writeFileSync(name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=name=>{
  const key=relative(root,name).split(sep).join('/');assert.ok(!key.startsWith('../'));if(Object.hasOwn(sources,key))return;
  const bytes=readFileSync(name);sources[key]=digest(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(name),match[1]));
};
for(const name of ['scripts/overlap-harvest.mjs','tests/overlap-harvest.test.mjs','docs/OVERLAP_HARVEST_DESIGN.md'])visit(join(root,name));
const inputs=read(join(input,'protocol.json')).histories.map(history=>{
  const anchor=join(input,'anchors',history.seed+'-C.json'),bare=join(root,'evidence/escape-commitment/20261025-v1/rows',history.seed+'.json');
  return {history,anchor:relative(root,anchor).split(sep).join('/'),anchorSha256:digest(readFileSync(anchor)),bare:relative(root,bare).split(sep).join('/'),bareSha256:digest(readFileSync(bare))};
});
const protocol={schema:1,kind:'overlap-harvest-paid-headroom',createdAt:new Date().toISOString(),inputs,sourceSha256:sources,arms:['overlap','native','bare-full'],ticks:256,
  rule:'Mean energy >0, >=6/8 positive histories, nonnegative aggregate survivor difference versus both native references.',scope:'One source-calibrated richer spatial/action witness, not acquisition, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const source of inputs){
  const anchor=read(join(root,source.anchor)),bare=read(join(root,source.bare)).arms['bare-full'],arms={},traceHashes={};
  for(const [name,mode]of [['overlap',1],['native',0]]){
    const trace=join(output,'traces',source.history.seed+'-'+name+'.jsonl');mkdirSync(dirname(trace),{recursive:true});const fd=openSync(trace,'wx'),hash=createHash('sha256');
    const run=new OverlapTransfer(anchor,source.history.probeSeeds.transfer,mode,{observer:event=>{const text=JSON.stringify(event)+'\n';writeSync(fd,text);hash.update(text);}});
    assert.equal(run.startWorldSha256,bare.startWorldSha256);
    try{arms[name]=run.advance();}finally{closeSync(fd);}
    traceHashes[name]=hash.digest('hex');write(join(output,'finals',source.history.seed+'-'+name+'.json'),run.checkpoint());
  }
  arms['bare-full']=bare.endpoint;
  const effects=Object.fromEntries(['native','bare-full'].map(name=>[name,{energy:arms.overlap.budgetAdjustedEnergyPerFounder-arms[name].budgetAdjustedEnergyPerFounder,survivors:arms.overlap.survivors-arms[name].survivors}]));
  const row={history:source.history,arms,effects,traceHashes};write(join(output,'rows',source.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:source.history.seed,effects,statistics:arms.overlap.statistics}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),expected);
for(const source of inputs){assert.equal(digest(readFileSync(join(root,source.anchor))),source.anchorSha256);assert.equal(digest(readFileSync(join(root,source.bare))),source.bareSha256);}
const comparisons=Object.fromEntries(['native','bare-full'].map(name=>[name,{meanEnergy:rows.reduce((sum,row)=>sum+row.effects[name].energy,0)/8,positiveHistories:rows.filter(row=>row.effects[name].energy>0).length,survivorDifference:rows.reduce((sum,row)=>sum+row.effects[name].survivors,0)}]));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,comparisons,promisingHeadroom:Object.values(comparisons).every(row=>row.meanEnergy>0&&row.positiveHistories>=6&&row.survivorDifference>=0),qualified:false,runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6}};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
