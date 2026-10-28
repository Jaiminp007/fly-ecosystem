import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installTasteSteeringCrossover} from '../learning/taste-steering-crossover.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),development=join(root,'evidence/decoupled-cue-development/20261026-v1'),output=join(root,'evidence/decoupled-pressure-crossover/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(development,'protocol.json')),inputs=previous.histories.map(history=>({history,anchors:Object.fromEntries(['A','B','D'].map(phase=>{const path='evidence/decoupled-cue-development/20261026-v1/anchors/'+history.seed+'-shared-plus-cue-'+phase+'.json';return [phase,{path,sha256:hash(readFileSync(join(root,path)))}];}))})),sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);
  if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/decoupled-pressure-crossover.mjs','scripts/check-decoupled-pressure-crossover.mjs','docs/DECOUPLED_PRESSURE_COMPONENT_PLAN.md','tests/taste-steering-crossover.test.mjs'])visit(join(root,name));
const protocol={schema:1,inputs,sourceSha256:sources,arms:['AA','AB','BA','BB'],ticks:256,scope:'Outcome-informed factorial frozen-model diagnostic on reused shared-plus-cue D worlds; not qualification or training.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const anchors={};for(const phase of ['A','B','D']){const data=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(data),input.anchors[phase].sha256);anchors[phase]=JSON.parse(data);}
  for(const fly of anchors.D.world.world.flies)for(const route of ['present','absent'])assert.deepEqual(anchors.A.state.learners[fly.id].banks[route].weights,anchors.B.state.learners[fly.id].banks[route].weights);
  const row={history:input.history,phases:{}};
  for(const phase of ['A','B']){const arms={};let common=null;
    for(const arm of protocol.arms){
      const label=input.history.seed+'-'+phase+'-'+arm,run=OdorRoutedExperiment.fork(anchors.D,{phase,seed:input.history.probeSeeds[phase],mode:'current',modelAnchor:anchors.A,steeringMode:'learned',compactFrozen:true});
      installTasteSteeringCrossover(run,anchors[arm[0]],anchors[arm[1]]);const initial=run.checkpoint(false),worldHash=hash(JSON.stringify(initial.world));if(common===null)common=worldHash;else assert.equal(worldHash,common);
      write(join(output,'starts',label+'.json'),initial);const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
      run.attach(event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;});let endpoint;
      try{endpoint=run.advance(protocol.ticks);}finally{run.attach(null);closeSync(fd);}
      write(join(output,'finals',label+'.json'),run.checkpoint(false));arms[arm]={endpoint,trace:{sha256:digest.digest('hex'),events}};
    }
    const energy=arm=>arms[arm].endpoint.budgetAdjustedEnergyPerFounder,net=arm=>{const endpoint=arms[arm].endpoint,stats=endpoint.statistics[phase]??{intake:0,toxin:0};return (stats.intake-stats.toxin)/endpoint.founders;};
    const contrast=measure=>({tasteAtA:measure('BA')-measure('AA'),tasteAtB:measure('BB')-measure('AB'),steeringAtA:measure('AB')-measure('AA'),steeringAtB:measure('BB')-measure('BA'),interaction:measure('BB')-measure('AB')-measure('BA')+measure('AA')});
    row.phases[phase]={arms,energy:contrast(energy),netIntake:contrast(net)};
  }
  write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:input.history.seed,A:row.phases.A.energy,B:row.phases.B.energy}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),digest);
const phases=Object.fromEntries(['A','B'].map(phase=>[phase,Object.fromEntries(['energy','netIntake'].map(metric=>[metric,Object.fromEntries(['tasteAtA','tasteAtB','steeringAtA','steeringAtB','interaction'].map(key=>[key,{mean:rows.reduce((sum,row)=>sum+row.phases[phase][metric][key],0)/rows.length,positiveHistories:rows.filter(row=>row.phases[phase][metric][key]>0).length}]))]))]));
write(join(output,'results.json'),{schema:1,qualified:false,phases,scope:protocol.scope});console.log(JSON.stringify({phases}));

