import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {freezeCoverageBody} from '../learning/coverage-sarsa.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/steering-replay-development/20261026-v1');
const bank=join(root,'evidence/taste-development/attempt-15-progress/protocol.json');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={};
function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const data=readFileSync(path);sources[name]=hash(data);
  if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/steering-replay-development.mjs','scripts/check-steering-replay-development.mjs','scripts/check-replay-steering-fixture.mjs','docs/STEERING_REPLAY_DEVELOPMENT_PLAN.md'])visit(join(root,name));
const histories=read(bank).histories;assert.equal(histories.length,8);
for(const history of histories)assert.notEqual(history.resourceSeeds[3],history.probeSeeds.transfer);
const protocol={schema:1,kind:'steering-replay-development',histories,arms:['original','replay'],sourceSha256:sources,
  bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),phaseTicks:[512,512,512,256],probeTicks:256,
  scope:'Outcome-informed motor freeze and reused development histories; not fresh qualification, functional-pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,run,ticks){
  const start=run.checkpoint(false);write(join(output,'starts',label+'.json'),start);
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={};run.attach(event=>{
    if(event.type==='decision'&&event.steering){const count=counts[event.id]??={decisions:0,available:0,native:0,midpoint:0,present:[0,0,0],absent:[0,0,0]};count.decisions++;count.available+=Number(event.available);count[event.steering.action?'midpoint':'native']++;count[event.choice.route][event.choice.action]++;}
    const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;
  });
  let endpoint;try{endpoint=run.advance(ticks);}finally{run.attach(null);closeSync(fd);}
  write(join(output,'finals',label+'.json'),run.checkpoint(false));
  return {endpoint,worldSha256:hash(JSON.stringify(start.world)),trace:{sha256:digest.digest('hex'),events,counts}};
}
const rows=[];
for(const history of histories){
  const row={history,arms:{},traces:{}},starts=[];
  for(const arm of protocol.arms){
    const run=new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringLearner:arm}),anchors={},acquisition={};
    starts.push(hash(JSON.stringify(run.world.checkpoint())));
    for(const [index,phase]of ['A','B','C','D'].entries()){
      if(!run.world.flies.length)break;
      const label=history.seed+'-'+arm+'-acquire-'+phase,result=tape(label,run,protocol.phaseTicks[index]);
      row.traces[label]=result.trace;acquisition[phase]=result.endpoint;
      if(!run.world.flies.length||run.world.tick!==protocol.phaseTicks.slice(0,index+1).reduce((sum,value)=>sum+value,0))break;
      anchors[phase]=run.checkpoint(false);write(join(output,'anchors',history.seed+'-'+arm+'-'+phase+'.json'),anchors[phase]);
      if(phase==='A')for(const fly of run.world.flies){
        const state=run.learners[fly.id];for(const motor of Object.values(state.banks)){const before=motor.work.scalarOperations;freezeCoverageBody(motor);state.work.scalarOperations+=motor.work.scalarOperations-before;}
        state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
      }
    }
    const probes={};
    if(anchors.D){
      const specifications=[...['A','B'].flatMap(phase=>['current','earlier','reset'].map(mode=>({phase,mode}))),...['current','reset','native','guarded','native-full'].map(mode=>({phase:'transfer',mode}))];
      for(const spec of specifications){
        const key=spec.phase+'-'+spec.mode;if(spec.mode==='earlier'&&!anchors[spec.phase]){probes[key]=null;continue;}
        const label=history.seed+'-'+arm+'-probe-'+key,seed=history.probeSeeds[spec.phase];let probe;
        if(spec.mode==='native-full')probe=CoverageExperiment.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase:spec.phase,seed,mode:'native-full'});
        else probe=OdorRoutedExperiment.fork(anchors.D,{phase:spec.phase,seed,mode:spec.mode==='reset'?'reset':'current',modelAnchor:spec.mode==='earlier'?anchors[spec.phase]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned'});
        const result=tape(label,probe,protocol.probeTicks);row.traces[label]=result.trace;probes[key]={endpoint:result.endpoint,startWorldSha256:result.worldSha256};
      }
      for(const phase of ['A','B','transfer']){const worlds=Object.entries(probes).filter(([key,value])=>key.startsWith(phase+'-')&&value).map(([,value])=>value.startWorldSha256);assert.ok(worlds.every(value=>value===worlds[0]));}
    }
    const effects=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
      return [mode,candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null];}));
    row.arms[arm]={acquisition,anchorPhases:Object.keys(anchors),probes,effects};
  }
  assert.equal(starts[0],starts[1]);write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:Object.fromEntries(protocol.arms.map(arm=>[arm,row.arms[arm].acquisition.D?.survivors??null])),replayEffects:row.arms.replay.effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
const arms=Object.fromEntries(protocol.arms.map(arm=>{
  const comparisons=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{const values=rows.map(row=>row.arms[arm].effects[mode]),complete=values.every(Boolean);
    return [mode,{complete,meanEnergy:complete?values.reduce((sum,value)=>sum+value.energy,0)/8:null,positiveHistories:values.filter(value=>value&&value.energy>0).length,survivorDifference:complete?values.reduce((sum,value)=>sum+value.survivors,0):null}];}));
  const retention=Object.fromEntries(['A','B'].map(phase=>{const values=rows.map(row=>['earlier','current','reset'].map(mode=>row.arms[arm].probes[phase+'-'+mode]?.endpoint));
    if(!values.every(row=>row.every(Boolean)))return [phase,{complete:false,ratio:null}];
    const saved=values.reduce((sum,row)=>sum+row[0].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8,current=values.reduce((sum,row)=>sum+row[1].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8;
    return [phase,{complete:true,savedAdvantage:saved,currentAdvantage:current,ratio:saved>0?current/saved:null}];}));
  return [arm,{comparisons,retention,promisingTransfer:['reset','native-full'].every(mode=>{const value=comparisons[mode];return value.complete&&value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;})}];
}));
const result={schema:1,qualified:false,arms,scope:protocol.scope};write(join(output,'results.json'),result);console.log(JSON.stringify(result));
