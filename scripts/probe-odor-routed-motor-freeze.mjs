import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-motor-freeze/20261026-v1'),development=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-motor-freeze-probes/20261026-v1');
assert.ok(!existsSync(output));const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(base,'protocol.json')),inputs=[],sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/probe-odor-routed-motor-freeze.mjs','scripts/check-odor-routed-motor-freeze-probes.mjs','docs/ODOR_ROUTED_MOTOR_FREEZE_RESULTS.md'])visit(join(root,name));
for(const [name,value]of Object.entries(sources))if(Object.hasOwn(previous.sourceSha256,name))assert.equal(value,previous.sourceSha256[name]);
for(const item of previous.inputs){
  const seed=item.history.seed,paths={A:join(development,'anchors',seed+'-A.json'),start:join(base,'starts',seed+'.json'),D:join(base,'finals',seed+'.json')};
  inputs.push({history:item.history,sha256:Object.fromEntries(Object.entries(paths).map(([name,path])=>[name,hash(readFileSync(path))]))});
}
const protocol={schema:1,kind:'motor-freeze-retention-transfer-diagnosis',inputs,sourceSha256:sources,priorProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),
  priorResultsSha256:hash(readFileSync(join(base,'results.json'))),probeTicks:256,scope:'Outcome-informed reused development histories; not fresh qualification, pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const history=input.history,seed=history.seed,paths={A:join(development,'anchors',seed+'-A.json'),start:join(base,'starts',seed+'.json'),D:join(base,'finals',seed+'.json')};
  for(const [name,path]of Object.entries(paths))assert.equal(hash(readFileSync(path)),input.sha256[name]);
  const anchors={A:read(paths.A),D:read(paths.D)},replay=OdorRoutedExperiment.restore(read(paths.start));
  replay.advance(512);if(replay.world.tick===1024){anchors.B=replay.checkpoint(false);write(join(output,'anchors',seed+'-B.json'),anchors.B);}
  replay.advance(512);if(replay.world.tick===1536){anchors.C=replay.checkpoint(false);write(join(output,'anchors',seed+'-C.json'),anchors.C);}
  replay.advance(256);assert.deepEqual(replay.checkpoint(false),anchors.D);
  const probes={},traces={};
  if(anchors.D.world.world.tick===1792){
    const specs=[...['A','B'].flatMap(phase=>['current','earlier','reset'].map(mode=>({phase,mode,seed:history.probeSeeds[phase]}))),
      ...['current','reset','native','guarded','native-full'].map(mode=>({phase:'transfer',mode,seed:history.probeSeeds.transfer}))];
    for(const spec of specs){
      const key=spec.phase+'-'+spec.mode;if(spec.mode==='earlier'&&!anchors[spec.phase]){probes[key]=null;continue;}
      const label=seed+'-'+key,path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
      const emit=event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;};
      let run,endpoint;
      try{
        if(spec.mode==='native-full')run=CoverageExperiment.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase:spec.phase,seed:spec.seed,mode:'native-full',emit});
        else run=OdorRoutedExperiment.fork(anchors.D,{phase:spec.phase,seed:spec.seed,mode:spec.mode==='reset'?'reset':'current',modelAnchor:spec.mode==='earlier'?anchors[spec.phase]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned',emit});
        const startWorldSha256=hash(JSON.stringify(run.world.checkpoint()));write(join(output,'starts',label+'.json'),run.checkpoint(false));
        endpoint=run.advance(protocol.probeTicks);const final=run.checkpoint(false);write(join(output,'finals',label+'.json'),final);
        probes[key]={endpoint,startWorldSha256,finalSha256:hash(JSON.stringify(final))};
      }finally{closeSync(fd);}
      traces[label]={sha256:digest.digest('hex'),events};
    }
    for(const phase of ['A','B','transfer']){
      const hashes=Object.entries(probes).filter(([key,value])=>key.startsWith(phase+'-')&&value).map(([,value])=>value.startWorldSha256);assert.ok(hashes.every(value=>value===hashes[0]));
    }
  }
  const effects=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{
    const current=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
    return [mode,current&&control?{energy:current.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:current.survivors-control.survivors}:null];
  }));
  const row={history,anchorPhases:Object.keys(anchors),probes,effects,traces};write(join(output,'rows',seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed,anchors:row.anchorPhases,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{
  const values=rows.map(row=>row.effects[mode]),complete=values.every(Boolean);
  return [mode,{complete,meanEnergy:complete?values.reduce((sum,value)=>sum+value.energy,0)/8:null,positiveHistories:values.filter(value=>value&&value.energy>0).length,survivorDifference:complete?values.reduce((sum,value)=>sum+value.survivors,0):null}];
}));
const retention=Object.fromEntries(['A','B'].map(phase=>{
  const values=rows.map(row=>[row.probes[phase+'-earlier']?.endpoint,row.probes[phase+'-current']?.endpoint,row.probes[phase+'-reset']?.endpoint]);
  if(!values.every(row=>row.every(Boolean)))return [phase,{complete:false,ratio:null}];
  const saved=values.reduce((sum,row)=>sum+row[0].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8,current=values.reduce((sum,row)=>sum+row[1].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8;
  return [phase,{complete:true,savedAdvantage:saved,currentAdvantage:current,ratio:saved>0?current/saved:null}];
}));
const result={schema:1,qualified:false,comparisons,retention,promisingTransfer:['reset','native-full'].every(mode=>{const value=comparisons[mode];return value.complete&&value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;}),scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
