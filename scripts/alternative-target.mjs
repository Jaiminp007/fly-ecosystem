import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {dirname,join,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {AlternativeTargetTransfer} from '../learning/alternative-target.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/taste-development/attempt-15-progress'),output=join(root,'evidence/alternative-target/20261026-v1');
assert.ok(!existsSync(output));
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const write=(name,value)=>{mkdirSync(dirname(name),{recursive:true});writeFileSync(name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=name=>{
  const key=relative(root,name).split(sep).join('/');assert.ok(!key.startsWith('../'));if(Object.hasOwn(sources,key))return;
  const bytes=readFileSync(name);sources[key]=digest(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(name),match[1]));
};
for(const name of ['scripts/alternative-target.mjs','tests/alternative-target.test.mjs','docs/ALTERNATIVE_TARGET_DESIGN.md'])visit(join(root,name));
const bank=read(join(input,'protocol.json')),inputs=bank.histories.map(history=>{
  const anchor=join(input,'anchors',history.seed+'-C.json'),bare=join(root,'evidence/escape-commitment/20261025-v1/rows',history.seed+'.json');
  return {history,anchor:relative(root,anchor).split(sep).join('/'),anchorSha256:digest(readFileSync(anchor)),bare:relative(root,bare).split(sep).join('/'),bareSha256:digest(readFileSync(bare))};
});
const protocol={schema:1,kind:'alternative-target-paid-headroom-witness',createdAt:new Date().toISOString(),inputs,sourceSha256:sources,
  arms:['rate','native','bare-full'],ticks:256,rule:'Positive mean energy and >=6/8 positive histories against each full-speed control; nonnegative summed survivor differences against each.',
  scope:'Explicit richer local sensing/target action. Fixed source-calibrated nonlearning witness, not acquired transfer, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const source of inputs){
  const anchor=read(join(root,source.anchor)),bare=read(join(root,source.bare)).arms['bare-full'],arms={},traceHashes={};
  for(const [name,mode]of [['rate',1],['native',0]]){
    const trace=join(output,'traces',source.history.seed+'-'+name+'.jsonl');mkdirSync(dirname(trace),{recursive:true});const fd=openSync(trace,'wx'),hash=createHash('sha256');
    const run=new AlternativeTargetTransfer(anchor,source.history.probeSeeds.transfer,mode,{observer:event=>{
      const text=JSON.stringify(event)+'\n';writeSync(fd,text);hash.update(text);
      const expected=event.selected===0?Math.tanh(2*(event.raw[2]-event.raw[1])+1.8*(event.raw[10]-event.raw[11])):Math.tanh(2*event.targets[1][3]+1.8*(event.raw[10]-event.raw[11]));
      assert.equal(event.outputs[0],expected);assert.equal(event.outputs[1],1);assert.equal(event.outputs[2],1);
    }});
    assert.equal(run.startWorldSha256,bare.startWorldSha256);
    try{arms[name]=run.advance();}finally{closeSync(fd);}
    traceHashes[name]=hash.digest('hex');
    write(join(output,'finals',source.history.seed+'-'+name+'.json'),run.checkpoint());
  }
  arms['bare-full']=bare.endpoint;
  const effects=Object.fromEntries(['native','bare-full'].map(name=>[name,{energy:arms.rate.budgetAdjustedEnergyPerFounder-arms[name].budgetAdjustedEnergyPerFounder,survivors:arms.rate.survivors-arms[name].survivors}]));
  const row={history:source.history,arms,effects,traceHashes};write(join(output,'rows',source.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:source.history.seed,effects,statistics:arms.rate.statistics}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),expected);
for(const source of inputs){assert.equal(digest(readFileSync(join(root,source.anchor))),source.anchorSha256);assert.equal(digest(readFileSync(join(root,source.bare))),source.bareSha256);}
const comparisons=Object.fromEntries(['native','bare-full'].map(name=>{
  const effects=rows.map(row=>row.effects[name]);return [name,{effects,meanEnergy:effects.reduce((sum,effect)=>sum+effect.energy,0)/8,positiveHistories:effects.filter(effect=>effect.energy>0).length,survivorDifference:effects.reduce((sum,effect)=>sum+effect.survivors,0)}];
}));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,histories:8,qualified:false,comparisons,
  promisingHeadroom:Object.values(comparisons).every(comparison=>comparison.meanEnergy>0&&comparison.positiveHistories>=6&&comparison.survivorDifference>=0),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
