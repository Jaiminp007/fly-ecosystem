import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development/20261026-v1');
const bank=join(root,'evidence/taste-development/attempt-15-progress/protocol.json');assert.ok(!existsSync(output));
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-development.mjs','scripts/check-odor-routed-development.mjs','tests/odor-routed-experiment.test.mjs','tests/odor-routed-motor.test.mjs','tests/odor-routed-taste.test.mjs','docs/ODOR_ROUTED_DEVELOPMENT_PLAN.md','docs/ODOR_ROUTED_MOTOR_DESIGN.md'])visit(join(root,name));
const histories=JSON.parse(readFileSync(bank,'utf8')).histories;assert.equal(histories.length,8);for(const history of histories)assert.notEqual(history.resourceSeeds[3],history.probeSeeds.transfer);
const protocol={schema:1,kind:'odor-routed-development',createdAt:new Date().toISOString(),histories,sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),
  acquisitionGeometry:'continual',acquisitionArms:['learned','native','guarded','frozen','reset'],acquisitionTicks:1792,probeTicks:256,
  retention:'End-D physical world; A and B separately compare earlier, current and reset frozen models. Missing checkpoints remain missing.',
  transfer:'End-D frozen current, reset, matched native, matched guarded and cheap native-full; compare current against reset and cheap native-full.',
  rule:'For each required transfer control: mean energy >0, at least6/8 positive histories, nonnegative aggregate survivor difference; missing histories fail.',
  scope:'Reused exploratory development histories only; no fresh qualification, functional-pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,create,ticks){
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={},emit=event=>{
    if(event.type==='decision'&&event.steering){const row=counts[event.id]??={decisions:0,available:0,native:0,midpoint:0,present:[0,0,0],absent:[0,0,0]};row.decisions++;row.available+=Number(event.available);row[event.steering.action?'midpoint':'native']++;row[event.choice.route][event.choice.action]++;}
    const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;
  };
  let run,endpoint;try{run=create(emit);endpoint=run.advance(ticks);}finally{closeSync(fd);}
  const final=run.checkpoint(false);write(join(output,'finals',label+'.json'),final);
  return {run,endpoint,counts,trace:{sha256:digest.digest('hex'),events},finalSha256:hash(JSON.stringify(final))};
}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const history of histories){
  const acquisition={},traces={},anchors={};
  for(const arm of protocol.acquisitionArms){
    const label=history.seed+'-acquire-'+arm,result=tape(label,emit=>new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:['native','guarded'].includes(arm)?arm:'learned',trainingRegime:arm==='frozen'?'freeze-after-A':arm==='reset'?'reset-each-phase':'continuous',emit}),protocol.acquisitionTicks);
    acquisition[arm]={endpoint:result.endpoint,counts:result.counts};traces[label]=result.trace;
    if(arm==='learned')for(const phase of ['A','B','C','D'])if(result.run.anchors[phase]){
      anchors[phase]=result.run.anchors[phase];write(join(output,'anchors',history.seed+'-'+phase+'.json'),anchors[phase]);
    }
  }
  const probes={};
  if(anchors.D){
    const specifications=[
      ...['A','B'].flatMap(phase=>['current','earlier','reset'].map(mode=>({phase,mode,seed:history.probeSeeds[phase]}))),
      ...['current','reset','native','guarded','native-full'].map(mode=>({phase:'transfer',mode,seed:history.probeSeeds.transfer}))
    ];
    for(const spec of specifications){
      if(spec.mode==='earlier'&&!anchors[spec.phase]){probes[spec.phase+'-'+spec.mode]=null;continue;}
      const key=spec.phase+'-'+spec.mode,label=history.seed+'-probe-'+key;
      const result=tape(label,emit=>{
        if(spec.mode==='native-full'){
          const anchor=structuredClone(anchors.D);anchor.kind='coverage-world';
          return CoverageExperiment.fork(anchor,{phase:spec.phase,seed:spec.seed,mode:'native-full',emit});
        }
        return OdorRoutedExperiment.fork(anchors.D,{phase:spec.phase,seed:spec.seed,mode:spec.mode==='reset'?'reset':'current',
          modelAnchor:spec.mode==='earlier'?anchors[spec.phase]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned',emit});
      },protocol.probeTicks);
      probes[key]={endpoint:result.endpoint,counts:result.counts,startWorldSha256:null,finalSha256:result.finalSha256};traces[label]=result.trace;
      const source=spec.mode==='native-full'?CoverageExperiment:OdorRoutedExperiment;
      const initial=spec.mode==='native-full'?source.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase:spec.phase,seed:spec.seed,mode:'native-full'}):
        source.fork(anchors.D,{phase:spec.phase,seed:spec.seed,mode:spec.mode==='reset'?'reset':'current',modelAnchor:spec.mode==='earlier'?anchors[spec.phase]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned'});
      probes[key].startWorldSha256=hash(JSON.stringify(initial.world.checkpoint()));
    }
    for(const phase of ['A','B','transfer']){
      const hashes=Object.entries(probes).filter(([key,value])=>key.startsWith(phase+'-')&&value).map(([,value])=>value.startWorldSha256);
      assert.ok(hashes.every(value=>value===hashes[0]));
    }
  }
  const effects={};
  for(const mode of ['reset','native','guarded','native-full']){
    const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
    effects[mode]=candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null;
  }
  const row={history,acquisition,anchorPhases:Object.keys(anchors),probes,effects,traces};write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:Object.fromEntries(Object.entries(acquisition).map(([name,value])=>[name,value.endpoint.survivors])),effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
const comparisons=Object.fromEntries(['reset','native','guarded','native-full'].map(mode=>{
  const values=rows.map(row=>row.effects[mode]),complete=values.every(Boolean);
  return [mode,{complete,meanEnergy:complete?values.reduce((sum,value)=>sum+value.energy,0)/8:null,positiveHistories:values.filter(value=>value&&value.energy>0).length,survivorDifference:complete?values.reduce((sum,value)=>sum+value.survivors,0):null}];
}));
const retention=Object.fromEntries(['A','B'].map(phase=>{
  const values=rows.map(row=>[row.probes[phase+'-earlier']?.endpoint,row.probes[phase+'-current']?.endpoint,row.probes[phase+'-reset']?.endpoint]);
  if(!values.every(row=>row.every(Boolean)))return [phase,{complete:false,ratio:null}];
  const saved=values.reduce((sum,row)=>sum+row[0].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8;
  const current=values.reduce((sum,row)=>sum+row[1].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8;
  return [phase,{complete:true,savedAdvantage:saved,currentAdvantage:current,ratio:saved>0?current/saved:null}];
}));
const used=process.cpuUsage(cpu),required=['reset','native-full'];
const result={schema:1,kind:protocol.kind,qualified:false,promisingTransfer:required.every(mode=>{const value=comparisons[mode];return value.complete&&value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;}),
  comparisons,retention,runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
