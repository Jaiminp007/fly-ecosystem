import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,openSync,writeSync,closeSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OwnSteeringExperiment} from '../learning/own-steering-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1');
const output=join(root,'evidence/own-steering-speed-intervention/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const development=read(join(base,'protocol.json')),inputs=[],sources={};
function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/intervene-own-steering-speed.mjs','tests/own-steering-experiment.test.mjs','docs/OWN_STEERING_ENERGY_DIAGNOSIS.md'])visit(join(root,name));
for(const history of development.histories){
  const rowPath=join(base,'rows',history.seed+'.json'),row=read(rowPath),anchor=join(base,'anchors',history.seed+'-C.json');
  inputs.push({history,rowSha256:hash(readFileSync(rowPath)),available:row.anchorPhases.includes('C'),anchorSha256:row.anchorPhases.includes('C')?hash(readFileSync(anchor)):null});
}
const protocol={schema:1,kind:'outcome-selected-fixed-full-speed-diagnosis',inputs,sourceSha256:sources,
  developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),developmentResultsSha256:hash(readFileSync(join(base,'results.json'))),ticks:256,
  scope:'Fixed outcome-informed development intervention; no qualification, counterfactual learner labels or fresh reserve.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  if(!input.available){rows.push({seed:input.history.seed,missingAnchor:true});continue;}
  const seed=input.history.seed,anchorPath=join(base,'anchors',seed+'-C.json'),anchor=read(anchorPath),baseline=read(join(base,'rows',seed+'.json'));
  assert.equal(hash(readFileSync(anchorPath)),input.anchorSha256);
  const path=join(output,'traces',seed+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const run=OwnSteeringExperiment.fork(anchor,{phase:'transfer',seed:input.history.probeSeeds.transfer,fixedMove:1,emit:event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;}});
  assert.equal(hash(JSON.stringify(run.world.checkpoint())),baseline.probes['transfer-current'].startWorldSha256);
  let endpoint;try{endpoint=run.advance(protocol.ticks);}finally{closeSync(fd);}
  write(join(output,'finals',seed+'.json'),run.checkpoint(false));
  const effects=Object.fromEntries(['current','reset','native-full'].map(mode=>{
    const reference=baseline.probes['transfer-'+mode].endpoint;
    return [mode,{energy:endpoint.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder,survivors:endpoint.survivors-reference.survivors}];
  }));
  const row={seed,missingAnchor:false,endpoint,effects,traceSha256:digest.digest('hex'),events};write(join(output,'rows',seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const observed=rows.filter(row=>!row.missingAnchor),comparisons=Object.fromEntries(['current','reset','native-full'].map(mode=>[mode,{histories:observed.length,
  meanEnergy:observed.reduce((sum,row)=>sum+row.effects[mode].energy,0)/observed.length,positiveHistories:observed.filter(row=>row.effects[mode].energy>0).length,
  survivorDifference:observed.reduce((sum,row)=>sum+row.effects[mode].survivors,0)}]));
const result={schema:1,qualified:false,missingHistories:rows.filter(row=>row.missingAnchor).map(row=>row.seed),comparisons,scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
