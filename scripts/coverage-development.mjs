import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CoverageExperiment,COVERAGE_ARMS} from '../learning/coverage-experiment.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/coverage-development/20261026-v1'),bankPath=join(root,'evidence/taste-development/attempt-15-progress/protocol.json');
assert.ok(!existsSync(output));
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=digest(bytes);
  if(/\.m?js$/.test(path))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/coverage-development.mjs','tests/coverage-sarsa.test.mjs','tests/coverage-experiment.test.mjs','docs/FULL_SPEED_ACQUISITION_DESIGN.md'])visit(join(root,name));
const histories=JSON.parse(readFileSync(bankPath,'utf8')).histories;
const protocol={schema:1,kind:'three-speed-acquisition-development',createdAt:new Date().toISOString(),histories,sourceSha256:sources,
  bankPath:relative(root,bankPath).split(sep).join('/'),bankSha256:digest(readFileSync(bankPath)),arms:COVERAGE_ARMS,acquisitionTicks:1536,probeTicks:256,
  rule:'Transfer versus both matched reset and cheap native-full: mean energy >0, at least6/8 positive histories, total survivor difference >=0.',
  scope:'One fixed exploratory design on reused development histories. Not fresh qualification, functional-pressure retention or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const tape=(label,create,ticks)=>{
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),hash=createHash('sha256');let events=0;
  const emit=event=>{const text=JSON.stringify(event)+'\n';writeSync(fd,text);hash.update(text);events++;};
  const run=create(emit);let endpoint;
  try{endpoint=run.advance(ticks);}finally{closeSync(fd);}
  write(join(output,'finals',label+'.json'),run.checkpoint(false));
  return {run,endpoint,traceSha256:hash.digest('hex'),events};
};
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const history of histories){
  const acquisition={},probes={},traces={};let anchors;
  for(const arm of COVERAGE_ARMS){
    const label=history.seed+'-'+arm,result=tape(label,emit=>new CoverageExperiment({history,arm,emit}),1536);
    acquisition[arm]=result.endpoint;traces[label]={sha256:result.traceSha256,events:result.events};
    if(arm==='candidate'){
      anchors=result.run.anchors;
      for(const phase of ['A','B','C']){
        if(!anchors[phase])anchors[phase]=result.run.checkpoint(false);
        write(join(output,'anchors',history.seed+'-'+phase+'.json'),anchors[phase]);
      }
    }
  }
  for(const [label,anchor,phase,seed]of [['afterA-returnA',anchors.A,'A',history.probeSeeds.A],['afterC-returnA',anchors.C,'A',history.probeSeeds.A],['transfer',anchors.C,'transfer',history.probeSeeds.transfer]]){
    probes[label]={};let startHash=null;
    for(const mode of ['current','reset','native-full']){
      const name=history.seed+'-'+label+'-'+mode,result=tape(name,emit=>{
        const run=CoverageExperiment.fork(anchor,{phase,seed,mode,emit}),hash=digest(run.world.checkpoint());
        if(startHash===null)startHash=hash;else assert.equal(hash,startHash);return run;
      },256);
      probes[label][mode]=result.endpoint;traces[name]={sha256:result.traceSha256,events:result.events};
    }
    probes[label].startWorldSha256=startHash;
  }
  const effects=Object.fromEntries(['reset','native-full'].map(mode=>[mode,{energy:probes.transfer.current.budgetAdjustedEnergyPerFounder-probes.transfer[mode].budgetAdjustedEnergyPerFounder,survivors:probes.transfer.current.survivors-probes.transfer[mode].survivors}]));
  const row={history,acquisition,probes,effects,traces};write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:Object.fromEntries(Object.entries(acquisition).map(([name,endpoint])=>[name,endpoint.survivors])),effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),expected);
assert.equal(digest(readFileSync(bankPath)),protocol.bankSha256);
const comparisons=Object.fromEntries(['reset','native-full'].map(mode=>[mode,{meanEnergy:rows.reduce((sum,row)=>sum+row.effects[mode].energy,0)/8,positiveHistories:rows.filter(row=>row.effects[mode].energy>0).length,survivorDifference:rows.reduce((sum,row)=>sum+row.effects[mode].survivors,0)}]));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,histories:8,qualified:false,promisingTransfer:Object.values(comparisons).every(row=>row.meanEnergy>0&&row.positiveHistories>=6&&row.survivorDifference>=0),comparisons,
  acquisition:Object.fromEntries(COVERAGE_ARMS.map(arm=>[arm,{survivors:rows.reduce((sum,row)=>sum+row.acquisition[arm].survivors,0),meanEnergy:rows.reduce((sum,row)=>sum+row.acquisition[arm].budgetAdjustedEnergyPerFounder,0)/8}])),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
