import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),development=join(root,'evidence/cue-shared-development/20261026-v1'),output=join(root,'evidence/frozen-wall-transfer/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(development,'protocol.json')),inputs=previous.histories.map(history=>{const anchor='evidence/cue-shared-development/20261026-v1/anchors/'+history.seed+'-cue-shared-D.json';return {history,anchor,anchorSha256:hash(readFileSync(join(root,anchor)))};}),sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/frozen-wall-transfer.mjs','scripts/check-frozen-wall-transfer.mjs','docs/FROZEN_WALL_SHORTCUT_DESIGN.md','tests/frozen-wall-shortcut.test.mjs'])visit(join(root,name));
const protocol={schema:1,kind:'frozen-wall-transfer',inputs,sourceSha256:sources,arms:['baseline','shortcut','reset','native','native-full'],ticks:256,
  scope:'Outcome-informed exact frozen execution on reused D checkpoints; not acquired skill, functional pressure, fresh qualification or RSI.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const anchor=read(join(root,input.anchor));assert.equal(hash(readFileSync(join(root,input.anchor))),input.anchorSha256);const arms={};let commonWorld=null;
  for(const arm of protocol.arms){
    const label=input.history.seed+'-'+arm,seed=input.history.probeSeeds.transfer;let run;
    if(arm==='native-full')run=CoverageExperiment.fork({...structuredClone(anchor),kind:'coverage-world'},{phase:'transfer',seed,mode:'native-full'});
    else run=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed,mode:arm==='reset'?'reset':'current',steeringMode:arm==='native'?'native':'learned',compactFrozen:true,wallShortcut:arm!=='baseline'});
    const initial=run.checkpoint(false),startWorldSha256=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=startWorldSha256;else assert.equal(startWorldSha256,commonWorld);
    write(join(output,'starts',label+'.json'),initial);const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0,shortcuts=0;
    run.attach(event=>{if(event.type==='decision'&&event.wallShortcut)shortcuts++;const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;});let endpoint;
    try{endpoint=run.advance(protocol.ticks);}finally{run.attach(null);closeSync(fd);}
    write(join(output,'finals',label+'.json'),run.checkpoint(false));arms[arm]={endpoint,startWorldSha256,shortcuts,trace:{sha256:digest.digest('hex'),events}};
  }
  const effects=Object.fromEntries(['baseline','reset','native','native-full'].map(arm=>[arm,{energy:arms.shortcut.endpoint.budgetAdjustedEnergyPerFounder-arms[arm].endpoint.budgetAdjustedEnergyPerFounder,survivors:arms.shortcut.endpoint.survivors-arms[arm].endpoint.survivors}]));
  const row={history:input.history,arms,effects};write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:input.history.seed,effects,shortcuts:arms.shortcut.shortcuts}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['baseline','reset','native','native-full'].map(arm=>{const values=rows.map(row=>row.effects[arm]);return [arm,{meanEnergy:values.reduce((sum,value)=>sum+value.energy,0)/8,positiveHistories:values.filter(value=>value.energy>0).length,survivorDifference:values.reduce((sum,value)=>sum+value.survivors,0)}];}));
const result={schema:1,qualified:false,comparisons,promisingTransfer:['reset','native-full'].every(arm=>{const value=comparisons[arm];return value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;}),scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
