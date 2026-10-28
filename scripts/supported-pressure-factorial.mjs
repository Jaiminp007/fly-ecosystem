import {gzipSync,gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync,statfsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installTasteSteeringCrossover} from '../learning/taste-steering-crossover.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),development=join(root,'evidence/supported-steering-development/20261026-v1'),output=join(root,'evidence/supported-pressure-factorial/20261026-v1');assert.ok(!existsSync(output));const free=statfsSync(root);assert.ok(Number(free.bavail)*Number(free.bsize)>=1024**3,'At least 1 GiB free required; collection not started');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});const packed=path.includes(sep+'starts'+sep)||path.includes(sep+'finals'+sep),data=JSON.stringify(value,null,2)+'\n';writeFileSync(path+(packed?'.gz':''),packed?gzipSync(data):data,{flag:'wx'});};
const previous=read(join(development,'protocol.json')),inputs=previous.histories.map(history=>({history,anchors:Object.fromEntries(['A','B','D'].map(phase=>{const path='evidence/supported-steering-development/20261026-v1/anchors/'+history.seed+'-protect-'+phase+'.json.gz';return [phase,{path,sha256:hash(readFileSync(join(root,path)))}];}))})),sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);
  if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/supported-pressure-factorial.mjs','scripts/check-supported-pressure-factorial.mjs','docs/SUPPORTED_PRESSURE_FACTORIAL_PLAN.md','tests/supported-pressure-crossover.test.mjs','tests/supported-pressure-factorial-smoke.test.mjs'])visit(join(root,name));
const protocol={schema:1,inputs,sourceSha256:sources,arms:['AA','AB','BA','BB'],ticks:256,scope:'Outcome-informed factorial frozen-model diagnostic on reused supported protect D worlds; not qualification or training.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const anchors={};for(const phase of ['A','B','D']){const data=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(data),input.anchors[phase].sha256);anchors[phase]=JSON.parse(gunzipSync(data).toString());}
  for(const fly of anchors.D.world.world.flies)for(const route of ['present','absent'])assert.deepEqual(anchors.A.state.learners[fly.id].banks[route].weights,anchors.B.state.learners[fly.id].banks[route].weights);
  const row={history:input.history,phases:{}};
  for(const phase of ['A','B']){const arms={};let common=null;
    for(const arm of protocol.arms){
      const space=statfsSync(root);assert.ok(Number(space.bavail)*Number(space.bsize)>=100*1024*1024,'Free-space floor reached; collection incomplete');
      const label=input.history.seed+'-'+phase+'-'+arm,run=OdorRoutedExperiment.fork(anchors.D,{phase,seed:input.history.probeSeeds[phase],mode:'current',modelAnchor:anchors.A,steeringMode:'learned',compactFrozen:true});
      installTasteSteeringCrossover(run,anchors[arm[0]],anchors[arm[1]]);const initial=run.checkpoint(false),worldHash=hash(JSON.stringify(initial.world));if(common===null)common=worldHash;else assert.equal(worldHash,common);
      write(join(output,'starts',label+'.json'),initial);const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path+'.gz','wx'),digest=createHash('sha256');let events=0,buffered=0,lines=[];const flush=()=>{if(lines.length){writeSync(fd,gzipSync(lines.join('')));lines=[];buffered=0;}};
      run.attach(event=>{const line=JSON.stringify(event)+'\n';lines.push(line);buffered+=Buffer.byteLength(line);if(buffered>=131072)flush();digest.update(line);events++;});let endpoint;
      try{endpoint=run.advance(protocol.ticks);flush();}finally{run.attach(null);closeSync(fd);}
      write(join(output,'finals',label+'.json'),run.checkpoint(false));arms[arm]={endpoint,trace:{sha256:digest.digest('hex'),events}};
    }
    const energy=arm=>arms[arm].endpoint.budgetAdjustedEnergyPerFounder,net=arm=>{const endpoint=arms[arm].endpoint,stats=endpoint.statistics[phase]??{intake:0,toxin:0};return (stats.intake-stats.toxin)/endpoint.founders;};
    const contrast=measure=>({tasteAtA:measure('BA')-measure('AA'),tasteAtB:measure('BB')-measure('AB'),steeringAtA:measure('AB')-measure('AA'),steeringAtB:measure('BB')-measure('BA'),interaction:measure('BB')-measure('AB')-measure('BA')+measure('AA')});
    row.phases[phase]={arms,energy:contrast(energy),netIntake:contrast(net),survivors:contrast(arm=>arms[arm].endpoint.survivors)};
  }
  write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:input.history.seed,A:row.phases.A.energy,B:row.phases.B.energy}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),digest);
const phases=Object.fromEntries(['A','B'].map(phase=>[phase,Object.fromEntries(['energy','netIntake','survivors'].map(metric=>[metric,Object.fromEntries(['tasteAtA','tasteAtB','steeringAtA','steeringAtB','interaction'].map(key=>[key,{mean:rows.reduce((sum,row)=>sum+row.phases[phase][metric][key],0)/rows.length,positiveHistories:rows.filter(row=>row.phases[phase][metric][key]>0).length}]))]))]));
write(join(output,'results.json'),{schema:1,qualified:false,phases,scope:protocol.scope});console.log(JSON.stringify({phases}));


