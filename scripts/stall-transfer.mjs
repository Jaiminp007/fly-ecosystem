import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {StallTransfer} from '../learning/stall-transfer.mjs';
import {digest} from '../learning/intervention-study.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),input=resolve(root,'evidence/taste-development/attempt-15-progress'),output=resolve(root,'evidence/stall-transfer/20261025-v1');
assert.ok(!existsSync(output));const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=digest(bytes);if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));};
for(const name of ['scripts/stall-transfer.mjs','docs/STALL_TRANSFER_DESIGN.md','tests/stall-transfer.test.mjs'])visit(resolve(root,name));
const bank=read(join(input,'protocol.json')),inputs=bank.histories.map(history=>{
  const anchor=join(input,'anchors',`${history.seed}-C.json`);return {history,anchor:relative(root,anchor).split(sep).join('/'),sha256:digest(readFileSync(anchor))};
});
const protocol={schema:1,kind:'frozen-stall-and-escape-diagnostic',createdAt:new Date().toISOString(),inputs,sourceSha256:sources,
  windows:[[17,112],[129,224]],noIntakeDecisions:16,wallWindow:4,pulseTicks:16,horizons:[16,64,'endpoint'],
  scope:'Reusable development diagnosis. Observer-only target geometry never selects events. Single-body C/P/D assignment, no learning, duration sweep, hindsight controller, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];let restoreCheck=false;
const contrast=(a,b,id)=>{
  const cohort=a.endpoint.budgetAdjustedEnergyPerFounder-b.endpoint.budgetAdjustedEnergyPerFounder,focal=a.bodyBudgets[id].budget-b.bodyBudgets[id].budget;
  return {cohortPerFounder:cohort,focalBudget:focal,otherBodiesBudget:cohort*24-focal,survivors:a.endpoint.survivors-b.endpoint.survivors,
    debt:a.endpoint.outstandingEnergy-b.endpoint.outstandingEnergy,intake:a.statistics.intake-b.statistics.intake,chargedPhysicalCosts:a.statistics.chargedPhysicalCosts-b.statistics.chargedPhysicalCosts};
};
for(const source of inputs){
  const history=source.history,trace=[],past={},events=[],snapshots={},selected=new Set();
  const reference=new StallTransfer(read(join(root,source.anchor)),history.probeSeeds.transfer,{observer:record=>{
    trace.push(record);const h=past[record.id]??={noIntake:0,walls:[]};
    h.noIntake=record.raw[3]>0&&record.raw[13]<=0?h.noIntake+1:0;h.walls.push(record.raw[10]>0||record.raw[11]>0);if(h.walls.length>4)h.walls.shift();
  }});
  snapshots[0]=reference.snapshot();
  while(reference.elapsed<256&&reference.run.world.flies.length){
    const decision=reference.elapsed+1;
    for(const[window,[lo,hi]]of protocol.windows.entries())if(!selected.has(window)&&decision>=lo&&decision<=hi){
      const eligible=reference.run.world.flies.map(f=>f.id).filter(id=>past[id]?.noIntake>=16&&past[id].walls.some(Boolean)).sort((a,b)=>a-b);
      if(eligible.length){
        const event={window,decision,id:eligible[0],checkpoint:reference.checkpoint()};events.push(event);selected.add(window);
        write(join(output,'checkpoints',`${history.seed}-${window}.json`),event);
      }
    }
    reference.step();snapshots[reference.elapsed]=reference.snapshot();
  }
  const final=reference.snapshot(),finalCheckpoint=reference.checkpoint();
  write(join(output,'reference-traces',`${history.seed}.json`),trace);
  const pairs=[];
  for(const event of events){
    if(!restoreCheck){const copy=StallTransfer.restore(event.checkpoint);copy.advanceTo(256);assert.deepEqual(copy.checkpoint(),finalCheckpoint);restoreCheck=true;}
    const endpoints={},effects={},startElapsed=event.checkpoint.elapsed;
    for(const[label,action]of [['P',2],['D',1]]){
      const branchTrace=[],branch=StallTransfer.restore(event.checkpoint,{observer:r=>{if(r.id===event.id)branchTrace.push(r);}});branch.pulse(event.id,action);
      const byHorizon={};
      for(const[horizon,target]of [['pulse',Math.min(256,startElapsed+16)],['later',Math.min(256,startElapsed+64)],['endpoint',256]]){
        const snap=branch.advanceTo(target),control=snapshots[target]??final;byHorizon[horizon]=snap;
        (effects[label]??={})[horizon]=contrast(snap,control,event.id);
      }
      endpoints[label]={snapshots:byHorizon,focalTrace:branchTrace};
    }
    pairs.push({window:event.window,decision:event.decision,id:event.id,checkpointSha256:digest(event.checkpoint),effects,branches:endpoints});
  }
  const deep=trace.filter(r=>r.target?.deepInterior),collisions=trace.filter(r=>r.collision),longest={};let persistent=0;
  for(const r of trace){const p=longest[r.id]??={id:null,count:0,max:0};p.count=r.target&&r.target.index===p.id?p.count+1:r.target?1:0;p.id=r.target?.index??null;p.max=Math.max(p.max,p.count);if(p.count>=16)persistent++;}
  const row={history,reference:final,referenceFinalSha256:digest(finalCheckpoint),events:pairs,missingWindows:protocol.windows.map((_,i)=>i).filter(i=>!selected.has(i)),
    exposure:{decisions:trace.length,deepInteriorTargetDecisions:deep.length,collisionDecisions:collisions.length,persistentTargetDecisions:persistent,
      longestTargetRunByFounder:Object.fromEntries(Object.entries(longest).map(([id,p])=>[id,p.max]))}};
  write(join(output,'rows',`${history.seed}.json`),row);rows.push(row);console.log(JSON.stringify({seed:history.seed,events:pairs.length,exposure:row.exposure}));
}
assert.ok(restoreCheck,'No eligible continuation check was available');
for(const[name,hash]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),hash);
for(const source of inputs)assert.equal(digest(readFileSync(join(root,source.anchor))),source.sha256);
const used=process.cpuUsage(cpu),summary={};
for(const branch of ['P','D'])summary[branch]=Object.fromEntries(['pulse','later','endpoint'].map(horizon=>{
  const perHistory=rows.map(r=>r.events.map(e=>e.effects[branch][horizon])),available=perHistory.filter(x=>x.length),means=available.map(es=>es.reduce((n,e)=>n+e.cohortPerFounder,0)/es.length);
  return [horizon,{histories:available.length,events:perHistory.reduce((n,v)=>n+v.length,0),meanHistoryEffect:means.reduce((n,v)=>n+v,0)/means.length,
    positiveHistories:means.filter(v=>v>0).length,perHistoryEffects:perHistory.map(es=>es.length?es.reduce((n,e)=>n+e.cohortPerFounder,0)/es.length:null),
    perHistorySurvivorDifferences:perHistory.map(es=>es.length?es.reduce((n,e)=>n+e.survivors,0)/es.length:null)}];
}));
const result={schema:1,kind:protocol.kind,histories:8,events:rows.reduce((n,r)=>n+r.events.length,0),exactContinuation:true,qualified:false,summary,
  exposure:Object.fromEntries(['decisions','deepInteriorTargetDecisions','collisionDecisions','persistentTargetDecisions'].map(key=>[key,rows.reduce((n,r)=>n+r.exposure[key],0)])),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},sourceSha256:sources,scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
