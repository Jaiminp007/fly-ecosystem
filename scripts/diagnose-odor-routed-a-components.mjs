import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-motor-freeze/20261026-v1'),development=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-a-components/20261026-v1');
assert.ok(!existsSync(output));const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(base,'protocol.json')),inputs=[],sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);
  if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/diagnose-odor-routed-a-components.mjs','scripts/check-odor-routed-a-components.mjs','docs/ODOR_ROUTED_A_COMPONENT_DESIGN.md'])visit(join(root,name));
for(const [name,value]of Object.entries(sources))if(Object.hasOwn(previous.sourceSha256,name))assert.equal(value,previous.sourceSha256[name]);
for(const item of previous.inputs){
  const seed=item.history.seed,paths={A:join(development,'anchors',seed+'-A.json'),D:join(base,'finals',seed+'.json')};
  inputs.push({history:item.history,sha256:Object.fromEntries(Object.entries(paths).map(([name,path])=>[name,hash(readFileSync(path))]))});
}
const arms=[{name:'AA',taste:'A',steering:'A'},{name:'AD',taste:'A',steering:'D'},{name:'DA',taste:'D',steering:'A'},{name:'DD',taste:'D',steering:'D'},{name:'reset',reset:true}];
const protocol={schema:1,kind:'outcome-selected-A-component-factorial',inputs,sourceSha256:sources,arms,ticks:256,extraCopyOperations:27,
  priorProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),priorResultsSha256:hash(readFileSync(join(base,'results.json'))),scope:'Outcome-informed total-world development diagnosis; not fresh qualification, retention proof or RSI.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const history=input.history,seed=history.seed,paths={A:join(development,'anchors',seed+'-A.json'),D:join(base,'finals',seed+'.json')};
  for(const [name,path]of Object.entries(paths))assert.equal(hash(readFileSync(path)),input.sha256[name]);const anchors={A:read(paths.A),D:read(paths.D)},probes={},traces={};
  for(const fly of anchors.D.world.world.flies){
    assert.ok(anchors.A.world.world.flies.some(earlier=>earlier.id===fly.id));
    for(const route of ['present','absent'])assert.deepEqual(anchors.D.state.learners[fly.id].banks[route].weights,anchors.A.state.learners[fly.id].banks[route].weights);
  }
  let startWorld=null;
  for(const arm of arms){
    const label=seed+'-'+arm.name,path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0,run,endpoint;
    const emit=event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;};
    try{
      run=OdorRoutedExperiment.fork(anchors.D,{phase:'A',seed:history.probeSeeds.A,mode:arm.reset?'reset':'current',emit});
      for(const fly of run.world.flies){
        const state=run.learners[fly.id];
        if(!arm.reset){state.taste.weights=structuredClone(anchors[arm.taste].state.learners[fly.id].taste.weights);state.steering.weights=structuredClone(anchors[arm.steering].state.learners[fly.id].steering.weights);}
        else{state.taste.weights=structuredClone(state.taste.weights);state.steering.weights=structuredClone(state.steering.weights);}
        state.work.scalarOperations+=protocol.extraCopyOperations;state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
      }
      const initial=run.checkpoint(false),worldHash=hash(JSON.stringify(initial.world));if(startWorld===null)startWorld=worldHash;else assert.equal(worldHash,startWorld);
      write(join(output,'starts',label+'.json'),initial);endpoint=run.advance(protocol.ticks);const final=run.checkpoint(false);write(join(output,'finals',label+'.json'),final);
      probes[arm.name]={endpoint,startWorldSha256:worldHash,finalSha256:hash(JSON.stringify(final))};
    }finally{closeSync(fd);}
    traces[label]={sha256:digest.digest('hex'),events};
  }
  const row={history,probes,traces};write(join(output,'rows',seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed,energy:Object.fromEntries(arms.map(arm=>[arm.name,probes[arm.name].endpoint.budgetAdjustedEnergyPerFounder]))}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const summaries=Object.fromEntries(arms.map(arm=>[arm.name,{meanEnergy:rows.reduce((sum,row)=>sum+row.probes[arm.name].endpoint.budgetAdjustedEnergyPerFounder,0)/8,survivors:rows.reduce((sum,row)=>sum+row.probes[arm.name].endpoint.survivors,0)}]));
const saved=summaries.AA.meanEnergy-summaries.reset.meanEnergy,current=summaries.DD.meanEnergy-summaries.reset.meanEnergy;
const contrasts={AAminusDD:summaries.AA.meanEnergy-summaries.DD.meanEnergy,ADminusDD:summaries.AD.meanEnergy-summaries.DD.meanEnergy,DAminusDD:summaries.DA.meanEnergy-summaries.DD.meanEnergy,
  interaction:summaries.AA.meanEnergy-summaries.AD.meanEnergy-summaries.DA.meanEnergy+summaries.DD.meanEnergy};
const result={schema:1,qualified:false,summaries,contrasts,descriptiveRetention:{savedAdvantage:saved,currentAdvantage:current,ratio:saved>0?current/saved:null},scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
