import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),development=join(root,'evidence/taste-cue-filter-development/20261026-v1'),output=join(root,'evidence/target-taste-headroom/20261026-v2');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(development,'protocol.json')),inputs=previous.histories.map(history=>({history,anchors:Object.fromEntries(['A','B','D'].map(phase=>{const path='evidence/taste-cue-filter-development/20261026-v1/anchors/'+history.seed+'-filter-'+phase+'.json';return [phase,{path,sha256:hash(readFileSync(join(root,path)))}];}))})),sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/target-taste-headroom-v2.mjs','scripts/check-target-taste-headroom-v2.mjs','docs/TARGET_TASTE_INTERFACE_PLAN.md','docs/TARGET_TASTE_V1_ACCOUNTING_NOTE.md','tests/target-taste-interface.test.mjs'])visit(join(root,name));
const protocol={schema:1,inputs,sourceSha256:sources,phases:['A','B','transfer'],arms:['filter','observe','reset','native-full'],ticks:256,scope:'Outcome-informed frozen target-cue intervention on reused D worlds; not acquisition, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){const anchors={};for(const phase of ['A','B','D']){const data=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(data),input.anchors[phase].sha256);anchors[phase]=JSON.parse(data);}const row={history:input.history,phases:{}};
  for(const phase of protocol.phases){let common=null;const arms={};
    for(const arm of protocol.arms){const label=input.history.seed+'-'+phase+'-'+arm;let run;
      if(arm==='native-full')run=CoverageExperiment.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase,seed:input.history.probeSeeds[phase],mode:'native-full'});
      else run=OdorRoutedExperiment.fork(anchors.D,{phase,seed:input.history.probeSeeds[phase],mode:arm==='reset'?'reset':'current',modelAnchor:arm==='reset'||phase==='transfer'?null:anchors[phase],steeringMode:'learned',compactFrozen:true,targetCueMode:arm==='observe'?'observe':'filter'});
      const initial=run.checkpoint(false),worldHash=hash(JSON.stringify(initial.world));if(common===null)common=worldHash;else assert.equal(worldHash,common);write(join(output,'starts',label+'.json'),initial);
      const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0,rejects=0,vetoes=0;
      run.attach(event=>{if(event.type==='decision'&&event.targetEvaluation?.reject){rejects++;if(event.steering.proposed===1&&event.steering.action===0)vetoes++;}const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;});let endpoint;
      try{endpoint=run.advance(protocol.ticks);}finally{run.attach(null);closeSync(fd);}write(join(output,'finals',label+'.json'),run.checkpoint(false));arms[arm]={endpoint,rejects,vetoes,trace:{sha256:digest.digest('hex'),events}};
    }
    const effects=Object.fromEntries(['observe','reset','native-full'].map(arm=>[arm,{energy:arms.filter.endpoint.budgetAdjustedEnergyPerFounder-arms[arm].endpoint.budgetAdjustedEnergyPerFounder,survivors:arms.filter.endpoint.survivors-arms[arm].endpoint.survivors}]));
    row.phases[phase]={arms,effects};
  }
  write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:input.history.seed,effects:Object.fromEntries(protocol.phases.map(phase=>[phase,row.phases[phase].effects]))}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),digest);
const phases=Object.fromEntries(protocol.phases.map(phase=>[phase,Object.fromEntries(['observe','reset','native-full'].map(control=>{const values=rows.map(row=>row.phases[phase].effects[control]);return [control,{meanEnergy:values.reduce((sum,value)=>sum+value.energy,0)/values.length,positiveHistories:values.filter(value=>value.energy>0).length,survivorDifference:values.reduce((sum,value)=>sum+value.survivors,0)}];}))]));
const promisingTransfer=['reset','native-full'].every(control=>{const value=phases.transfer[control];return value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;});
write(join(output,'results.json'),{schema:1,qualified:false,promisingTransfer,phases,scope:protocol.scope});console.log(JSON.stringify({promisingTransfer,phases}));
