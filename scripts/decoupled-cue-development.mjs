import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {freezeCoverageBody} from '../learning/coverage-sarsa.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/decoupled-cue-development/20261026-v1'),bank=join(root,'evidence/taste-development/attempt-15-progress/protocol.json');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={};function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/decoupled-cue-development.mjs','scripts/check-decoupled-cue-development.mjs','tests/target-taste-interface.test.mjs','tests/decoupled-cue-physical.test.mjs','tests/decoupled-cue-taste.test.mjs','scripts/check-decoupled-physical-acquisition.mjs','scripts/check-decoupled-cue-outcomes.mjs','tests/odor-routed-cue-shared.test.mjs','docs/DECOUPLED_CUE_PHYSICAL_PLAN.md'])visit(join(root,name));
const histories=read(bank).histories;assert.equal(histories.length,8);for(const history of histories)assert.notEqual(history.resourceSeeds[3],history.probeSeeds.transfer);
const protocol={schema:1,kind:'decoupled-cue-development',histories,arms:['shared','shared-plus-cue'],sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),phaseTicks:[512,512,512,256],probeTicks:256,
  scope:'Outcome-informed decoupled cue learner, motor freeze and reused development histories; not fresh qualification, functional-pressure proof or RSI.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,run,ticks){
  const start=run.checkpoint(false);write(join(output,'starts',label+'.json'),start);const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});
  let lines=[],buffered=0;const fd=openSync(path+'.gz','wx'),digest=createHash('sha256');let events=0;const counts={};const flush=()=>{if(lines.length){writeSync(fd,gzipSync(lines.join('')));lines=[];buffered=0;}};
  run.attach(event=>{
    if(event.type==='decision'&&event.steering){const count=counts[event.id]??={decisions:0,available:0,native:0,midpoint:0,present:[0,0,0],absent:[0,0,0]};count.decisions++;count.available+=Number(event.available);count[event.steering.action?'midpoint':'native']++;count[event.choice.route][event.choice.action]++;}
    const line=JSON.stringify(event)+'\n';lines.push(line);buffered+=Buffer.byteLength(line);if(buffered>=131072)flush();digest.update(line);events++;
  });
  let endpoint;try{endpoint=run.advance(ticks);flush();}finally{run.attach(null);closeSync(fd);}
  write(join(output,'finals',label+'.json'),run.checkpoint(false));return {endpoint,worldSha256:hash(JSON.stringify(start.world)),trace:{sha256:digest.digest('hex'),events,counts}};
}
const rows=[];
for(const history of histories){
  const row={history,arms:{},traces:{}},worlds=[];
  for(const arm of protocol.arms){
    const run=new OdorRoutedExperiment({history,acquisitionGeometry:'continual',spatialSelector:'incremental',steeringLearner:'cue-shared',contactCueMode:'filter',targetCueMode:'observe',cueTastePolicy:arm,phaseDurations:protocol.phaseTicks}),anchors={},acquisition={};worlds.push(hash(JSON.stringify(run.world.checkpoint())));
    for(const [index,phase]of ['A','B','C','D'].entries()){
      if(!run.world.flies.length)break;const label=history.seed+'-'+arm+'-acquire-'+phase,result=tape(label,run,protocol.phaseTicks[index]);row.traces[label]=result.trace;acquisition[phase]=result.endpoint;
      if(!run.world.flies.length||run.world.tick!==protocol.phaseTicks.slice(0,index+1).reduce((sum,value)=>sum+value,0))break;
      anchors[phase]=run.checkpoint(false);write(join(output,'anchors',history.seed+'-'+arm+'-'+phase+'.json'),anchors[phase]);
      if(phase==='A')for(const fly of run.world.flies){const state=run.learners[fly.id];for(const motor of Object.values(state.banks)){const before=motor.work.scalarOperations;freezeCoverageBody(motor);state.work.scalarOperations+=motor.work.scalarOperations-before;}state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
    }
    const probes={};
    if(anchors.D){
      const specs=[...['A','B'].flatMap(phase=>['A','B','current','reset'].map(mode=>({phase,mode}))),...['current','reset','native','guarded','native-full'].map(mode=>({phase:'transfer',mode}))];
      for(const spec of specs){
        const key=spec.phase+'-'+spec.mode;if(['A','B'].includes(spec.mode)&&!anchors[spec.mode]){probes[key]=null;continue;}
        const label=history.seed+'-'+arm+'-probe-'+key,seed=history.probeSeeds[spec.phase];let probe;
        if(spec.mode==='native-full')probe=CoverageExperiment.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase:spec.phase,seed,mode:'native-full'});
        else probe=OdorRoutedExperiment.fork(anchors.D,{phase:spec.phase,seed,mode:spec.mode==='reset'?'reset':'current',modelAnchor:['A','B'].includes(spec.mode)?anchors[spec.mode]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned',compactFrozen:true});
        const result=tape(label,probe,protocol.probeTicks);row.traces[label]=result.trace;probes[key]={endpoint:result.endpoint,startWorldSha256:result.worldSha256};
      }
      for(const phase of ['A','B','transfer']){const values=Object.entries(probes).filter(([key,value])=>key.startsWith(phase+'-')&&value).map(([,value])=>value.startWorldSha256);assert.ok(values.every(value=>value===values[0]));}
    }
    const effects=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
      return [mode,candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null];}));
    row.arms[arm]={acquisition,anchorPhases:Object.keys(anchors),probes,effects};
  }
  assert.equal(worlds[0],worlds[1]);write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:Object.fromEntries(protocol.arms.map(arm=>[arm,row.arms[arm].acquisition.D?.survivors??null])),candidateEffects:row.arms['shared-plus-cue'].effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
const arms=Object.fromEntries(protocol.arms.map(arm=>{
  const comparisons=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{const values=rows.map(row=>row.arms[arm].effects[mode]),complete=values.every(Boolean);
    return [mode,{complete,meanEnergy:complete?values.reduce((sum,value)=>sum+value.energy,0)/8:null,positiveHistories:values.filter(value=>value&&value.energy>0).length,survivorDifference:complete?values.reduce((sum,value)=>sum+value.survivors,0):null}];}));
  const retention=Object.fromEntries(['A','B'].map(phase=>{const values=rows.map(row=>[phase,'current','reset'].map(mode=>row.arms[arm].probes[phase+'-'+mode]?.endpoint));
    if(!values.every(row=>row.every(Boolean)))return [phase,{complete:false,ratio:null}];
    const saved=values.reduce((sum,row)=>sum+row[0].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8,current=values.reduce((sum,row)=>sum+row[1].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8;
    return [phase,{complete:true,savedAdvantage:saved,currentAdvantage:current,ratio:saved>0?current/saved:null}];}));
  const pressureRows=rows.map(row=>{const probes=row.arms[arm].probes,aa=probes['A-A']?.endpoint,ab=probes['A-B']?.endpoint,ar=probes['A-reset']?.endpoint,ba=probes['B-A']?.endpoint,bb=probes['B-B']?.endpoint;
    if(![aa,ab,ar,ba,bb].every(Boolean))return null;
    const net=endpoint=>{const stats=endpoint.statistics.A??{intake:0,toxin:0};return (stats.intake-stats.toxin)/endpoint.founders;};
    return {aAdvantage:aa.budgetAdjustedEnergyPerFounder-ar.budgetAdjustedEnergyPerFounder,aInterference:aa.budgetAdjustedEnergyPerFounder-ab.budgetAdjustedEnergyPerFounder,bAcquisition:bb.budgetAdjustedEnergyPerFounder-ba.budgetAdjustedEnergyPerFounder,aNetIntakeDifference:net(aa)-net(ab)};
  });
  const pressure=pressureRows.every(Boolean)?Object.fromEntries(['aAdvantage','aInterference','bAcquisition','aNetIntakeDifference'].map(key=>[key,pressureRows.reduce((sum,row)=>sum+row[key],0)/8])):null;
  if(pressure)pressure.excessOverFivePercent=pressure.aInterference-.05*pressure.aAdvantage;
  return [arm,{comparisons,retention,pressure,pressureRows,promisingTransfer:['reset','native-full'].every(mode=>{const value=comparisons[mode];return value.complete&&value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;})}];
}));
write(join(output,'results.json'),{schema:1,qualified:false,arms,scope:protocol.scope});console.log(JSON.stringify({arms}));
