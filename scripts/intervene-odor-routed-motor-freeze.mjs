import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {freezeCoverageBody} from '../learning/coverage-sarsa.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-development/20261026-v1'),census=join(root,'evidence/odor-routed-survival-census/20261026-v1'),output=join(root,'evidence/odor-routed-motor-freeze/20261026-v1');
assert.ok(!existsSync(output));const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const development=read(join(base,'protocol.json')),inputs=[],sources={};
function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/intervene-odor-routed-motor-freeze.mjs','docs/ODOR_ROUTED_SURVIVAL_RESULTS.md'])visit(join(root,name));
for(const [name,value]of Object.entries(sources))if(Object.hasOwn(development.sourceSha256,name))assert.equal(value,development.sourceSha256[name]);
for(const history of development.histories){
  const anchor=join(base,'anchors',history.seed+'-A.json'),row=join(base,'rows',history.seed+'.json'),observed=read(join(census,history.seed+'.json'));
  assert.equal(observed.arms.learned.prefixSha256,observed.arms.frozen.prefixSha256);
  inputs.push({history,anchorSha256:hash(readFileSync(anchor)),rowSha256:hash(readFileSync(row)),matchedPrefixSha256:observed.arms.learned.prefixSha256});
}
const protocol={schema:1,kind:'outcome-selected-routed-motor-freeze',inputs,sourceSha256:sources,
  developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),censusSha256:hash(readFileSync(join(census,'results.json'))),continuationTicks:1280,
  scope:'Post-outcome total-world component intervention, no fresh qualification or counterfactual learner labels.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const seed=input.history.seed,anchorPath=join(base,'anchors',seed+'-A.json'),rowPath=join(base,'rows',seed+'.json');
  assert.equal(hash(readFileSync(anchorPath)),input.anchorSha256);assert.equal(hash(readFileSync(rowPath)),input.rowSha256);
  const anchor=read(anchorPath),baseline=read(rowPath),tracePath=join(output,'traces',seed+'.jsonl');mkdirSync(dirname(tracePath),{recursive:true});
  const fd=openSync(tracePath,'wx'),digest=createHash('sha256');let events=0;
  const run=OdorRoutedExperiment.restore(anchor,event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;});
  assert.equal(hash(JSON.stringify(run.world.checkpoint())),hash(JSON.stringify(anchor.world)));
  for(const fly of run.world.flies){
    const state=run.learners[fly.id];assert.ok(state.acquisition&&state.steering.acquisition);
    for(const bank of Object.values(state.banks)){const before=bank.work.scalarOperations;freezeCoverageBody(bank);state.work.scalarOperations+=bank.work.scalarOperations-before;}
    state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
  }
  const initial=run.checkpoint(false);write(join(output,'starts',seed+'.json'),initial);let endpoint;
  try{endpoint=run.advance(protocol.continuationTicks);}finally{closeSync(fd);}
  const final=run.checkpoint(false);write(join(output,'finals',seed+'.json'),final);
  const effects=Object.fromEntries(['learned','frozen'].map(arm=>{
    const reference=baseline.acquisition[arm].endpoint;
    return [arm,{energy:endpoint.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder,survivors:endpoint.survivors-reference.survivors}];
  }));
  const row={seed,endpoint,effects,traceSha256:digest.digest('hex'),events};write(join(output,'rows',seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed,survivors:endpoint.survivors,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['learned','frozen'].map(arm=>[arm,{meanEnergy:rows.reduce((sum,row)=>sum+row.effects[arm].energy,0)/8,
  positiveHistories:rows.filter(row=>row.effects[arm].energy>0).length,survivorDifference:rows.reduce((sum,row)=>sum+row.effects[arm].survivors,0)}]));
const result={schema:1,qualified:false,comparisons,survivors:rows.reduce((sum,row)=>sum+row.endpoint.survivors,0),scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
