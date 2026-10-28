import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),development=join(root,'evidence/extended-b-development/20261026-v1'),output=join(root,'evidence/deterministic-taste-continuation/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(development,'protocol.json')),inputs=previous.histories.map(history=>{const start='evidence/extended-b-development/20261026-v1/starts/'+history.seed+'-observe-acquire-B.json';return {history,start,startSha256:hash(readFileSync(join(root,start)))};}),sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/deterministic-taste-continuation.mjs','scripts/check-deterministic-taste-continuation.mjs','docs/DETERMINISTIC_TASTE_PLAN.md','tests/deterministic-taste.test.mjs'])visit(join(root,name));
const protocol={schema:1,inputs,sourceSha256:sources,arms:['sample','threshold'],ticks:[1024,512,256],scope:'Fixed outcome-informed own-taste continuation on reused extended-B A checkpoints; not a qualification or newly acquired skill.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){const saved=read(join(root,input.start));assert.equal(hash(readFileSync(join(root,input.start))),input.startSha256);const row={history:input.history,arms:{}};let commonWorld=null;
  for(const arm of protocol.arms){const run=OdorRoutedExperiment.restore(saved);run.tasteDecisionMode=arm;const worldHash=hash(JSON.stringify(run.world.checkpoint()));if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);const phases={};
    for(const [index,phase]of ['B','C','D'].entries()){
      if(!run.world.flies.length)break;const label=input.history.seed+'-'+arm+'-'+phase,initial=run.checkpoint(false);write(join(output,'starts',label+'.json'),initial);
      const lines=[],digest=createHash('sha256');let events=0,accepts=0,decisions=0;
      run.attach(event=>{if(event.type==='decision'){decisions++;accepts+=Number(event.choice.accept);}const line=JSON.stringify(event)+'\n';lines.push(line);digest.update(line);events++;});let endpoint;
      try{endpoint=run.advance(protocol.ticks[index]);}finally{run.attach(null);}
      const tape=join(output,'traces',label+'.jsonl.gz');mkdirSync(dirname(tape),{recursive:true});writeFileSync(tape,gzipSync(lines.join('')),{flag:'wx'});write(join(output,'finals',label+'.json'),run.checkpoint(false));
      phases[phase]={endpoint,decisions,accepts,trace:{sha256:digest.digest('hex'),events}};
      if(!run.world.flies.length||run.world.tick!==512+protocol.ticks.slice(0,index+1).reduce((sum,value)=>sum+value,0))break;
    }
    row.arms[arm]={phases};
  }
  const first=row.arms.sample.phases.B.endpoint,second=row.arms.threshold.phases.B.endpoint,complete=first.tick===1536&&second.tick===1536;
  row.bEffect=complete?{energy:second.budgetAdjustedEnergyPerFounder-first.budgetAdjustedEnergyPerFounder,survivors:second.survivors-first.survivors,netIntake:(second.statistics.B.intake-second.statistics.B.toxin-first.statistics.B.intake+first.statistics.B.toxin)/second.founders}:null;
  write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:input.history.seed,bEffect:row.bEffect,dSurvivors:Object.fromEntries(protocol.arms.map(arm=>[arm,row.arms[arm].phases.D?.endpoint.survivors??null]))}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),digest);
const values=rows.map(row=>row.bEffect),complete=values.every(Boolean),summary={complete,meanEnergy:complete?values.reduce((sum,value)=>sum+value.energy,0)/values.length:null,positiveHistories:values.filter(value=>value&&value.energy>0).length,survivorDifference:complete?values.reduce((sum,value)=>sum+value.survivors,0):null,meanNetIntake:complete?values.reduce((sum,value)=>sum+value.netIntake,0)/values.length:null,
  dHistories:Object.fromEntries(protocol.arms.map(arm=>[arm,rows.filter(row=>row.arms[arm].phases.D?.endpoint.tick===2304).length])),dSurvivors:Object.fromEntries(protocol.arms.map(arm=>[arm,rows.reduce((sum,row)=>sum+(row.arms[arm].phases.D?.endpoint.survivors??0),0)]))};
write(join(output,'results.json'),{schema:1,qualified:false,summary,scope:protocol.scope});console.log(JSON.stringify(summary));
