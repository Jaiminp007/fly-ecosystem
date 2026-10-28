import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OverlapTransfer} from '../learning/overlap-harvest.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/overlap-harvest/20261026-v1'),output=join(root,'evidence/overlap-diagnosis/20261026-v1');
assert.ok(!existsSync(output));const read=path=>JSON.parse(readFileSync(path,'utf8'));
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const original=read(join(base,'protocol.json')),inputs=[],cases=[];
for(const input of original.inputs){
  const finals=Object.fromEntries(['overlap','native'].map(arm=>[arm,read(join(base,'finals',input.history.seed+'-'+arm+'.json'))]));
  const living=Object.fromEntries(Object.entries(finals).map(([arm,value])=>[arm,new Set(value.world.world.flies.map(fly=>fly.id))]));
  for(const id of finals.native.state.founderIds)if(living.native.has(id)!==living.overlap.has(id))cases.push({seed:input.history.seed,id,classification:living.native.has(id)?'lost':'saved'});
  inputs.push({...input,rowSha256:digest(readFileSync(join(base,'rows',input.history.seed+'.json'))),finalSha256:Object.fromEntries(['overlap','native'].map(arm=>[arm,digest(readFileSync(join(base,'finals',input.history.seed+'-'+arm+'.json')))]))});
}
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');if(Object.hasOwn(sources,name))return;assert.ok(!name.startsWith('../'));
  const bytes=readFileSync(path);sources[name]=digest(bytes);
  if(/\.m?js$/.test(path))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/diagnose-overlap.mjs','docs/OVERLAP_CAUSAL_DIAGNOSIS.md'])visit(join(root,name));
for(const [name,expected]of Object.entries(original.sourceSha256))if(Object.hasOwn(sources,name))assert.equal(sources[name],expected);
const protocol={schema:1,kind:'outcome-selected-overlap-focal-steering-diagnosis',createdAt:new Date().toISOString(),inputs,cases,backgrounds:['overlap','native'],sourceSha256:sources,
  scope:'Post-outcome-selected causal diagnosis, not a fresh performance test. No counterfactual labels may enter acquisition.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const factual={};
for(const source of inputs){
  const seed=source.history.seed,anchor=read(join(root,source.anchor));factual[seed]={};
  for(const arm of ['overlap','native']){
    const final=read(join(base,'finals',seed+'-'+arm+'.json')),survivors=new Map(final.world.world.flies.map(fly=>[fly.id,fly])),bodies={};
    for(const fly of anchor.world.world.flies)bodies[fly.id]={id:fly.id,initialEnergy:fly.energy,initialAge:fly.age,lifespan:fly.genome.traits.lifespan,alive:survivors.has(fly.id),finalEnergy:survivors.get(fly.id)?.energy??0,decisions:0,midpoints:0,intake:0,cost:0,lastTick:null,lastDecisions:[]};
    const hasher=createHash('sha256'),stream=createReadStream(join(base,'traces',seed+'-'+arm+'.jsonl'));stream.on('data',chunk=>hasher.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line),body=bodies[event.type==='decision'?event.id:event.agentId];
      if(event.type==='decision'){
        let score=0,point=[0,0];for(const candidate of event.points){const value=candidate[2]/(Math.hypot(candidate[0],candidate[1])+20);if(value>score){score=value;point=candidate;}}
        body.decisions++;body.midpoints+=Number(event.midpoint);body.lastTick=event.tick;
        body.lastDecisions.push({tick:event.tick,midpoint:event.midpoint,nativeDistance:Math.hypot(point[0],point[1]),recommendedDistance:Math.hypot(...event.point),nativeBearing:Math.atan2(event.raw[2]-event.raw[1],event.raw[0]),recommendedBearing:Math.atan2(event.point[1],event.point[0]),wall:[event.raw[10],event.raw[11]]});
        if(body.lastDecisions.length>12)body.lastDecisions.shift();
      }else{body.intake+=event.beneficialEaten;body.cost+=event.cost;body.lastDecisions.at(-1).receipt={initialEnergy:event.initialEnergy,finalEnergy:event.finalEnergy,intake:event.beneficialEaten,cost:event.cost};}
    }
    assert.equal(hasher.digest('hex'),read(join(base,'rows',seed+'.json')).traceHashes[arm]);factual[seed][arm]=bodies;
  }
}
write(join(output,'factual.json'),factual);
const start=performance.now(),outcomes=[];
for(const selected of cases){
  const source=inputs.find(input=>input.history.seed===selected.seed),anchor=read(join(root,source.anchor));
  for(const background of ['overlap','native']){
    const label=selected.seed+'-'+selected.id+'-background-'+background,path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});
    const fd=openSync(path,'wx'),hasher=createHash('sha256');
    const run=new OverlapTransfer(anchor,source.history.probeSeeds.transfer,background==='overlap'?1:0,{observer:event=>{const text=JSON.stringify(event)+'\n';writeSync(fd,text);hasher.update(text);}});
    run.controllers[selected.id].mode=background==='overlap'?0:1;
    assert.equal(run.startWorldSha256,read(join(base,'finals',selected.seed+'-'+background+'.json')).state.startWorldSha256);
    let endpoint;try{endpoint=run.advance();}finally{closeSync(fd);}
    const focal=run.world.flies.find(fly=>fly.id===selected.id),result={...selected,background,focalMode:background==='overlap'?'native':'overlap',focalAlive:!!focal,focalEnergy:focal?.energy??0,endpoint,traceSha256:hasher.digest('hex')};
    write(join(output,'finals',label+'.json'),run.checkpoint());write(join(output,'rows',label+'.json'),result);outcomes.push(result);console.log(JSON.stringify(result));
  }
}
for(const [name,expected]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),expected);
const summary={schema:1,kind:protocol.kind,cases:cases.map(selected=>({...selected,factual:{overlap:factual[selected.seed].overlap[selected.id],native:factual[selected.seed].native[selected.id]},interventions:outcomes.filter(row=>row.seed===selected.seed&&row.id===selected.id).map(row=>({background:row.background,focalMode:row.focalMode,alive:row.focalAlive,energy:row.focalEnergy,totalSurvivors:row.endpoint.survivors,totalEnergyPerFounder:row.endpoint.budgetAdjustedEnergyPerFounder}))})),wallSeconds:(performance.now()-start)/1000,qualified:false};
write(join(output,'results.json'),summary);console.log(JSON.stringify(summary));
