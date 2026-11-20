// ODOR DEV ROUND 7 runner (PLAN V1 FROZEN): one new acquisition arm
// (learned-extended: R1-plain 8-dim head, proportionally doubled
// A1024/B1024/C1024/D512 curriculum = 3584 ticks, TIME only) + full
// A/B/transfer probe suite on the SAME 8 reused histories EXTENDED.
// Single-variable vs R1-learned (same head, same seeds, longer runs).
// 3600s wall.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r7');
const bank=join(root,'evidence/odor-routed-development-r7/bank-protocol.json');
{ // Single-execution guard: output absent, or holding only the triage bank copy + short-self R1 rows.
  const pre=existsSync(output)?readdirSync(output):[];
  assert.ok(pre.length===0||(pre.length===2&&pre.includes('bank-protocol.json')&&pre.includes('short-self')),'R7 output already exists; preserve it: '+output);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-r7.mjs','learning/odor-routed-experiment.mjs','learning/own-steering.mjs','learning/continual-regimes.mjs','docs/ODOR_DEV_ROUND7_PLAN_V1.md'])visit(join(root,name));
assert.ok(existsSync(bank),'R7 bank-protocol copy missing: extract + verify per triage before running');
const histories=JSON.parse(readFileSync(bank,'utf8')).histories;assert.equal(histories.length,8);
const protocol={schema:1,kind:'odor-routed-development-r7',createdAt:new Date().toISOString(),histories,sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),
  acquisitionGeometry:'continual',acquisitionArms:['learned-extended'],acquisitionTicks:3584,probeTicks:256,
  phaseDurations:[1024,1024,1024,512],
  retention:'End-D frozen current; A and B separately compare earlier, current and reset frozen models. Missing checkpoints remain missing.',
  transfer:'End-D frozen current, reset, matched native, matched guarded and cheap native-full; compare current against SHORT-SELF (R1 1792t rows, same histories) and cheap native-full.',
  rule:'GO iff transfer gate (6/8 + mean>0 vs SHORT-SELF (3584t rows vs 1792t R1 rows, same histories) AND vs cheap native-full, nonnegative survivor diffs) AND A>=95% AND B>=95%; PARTIAL if native-full+A+B pass but short-self fails (works, time-neutral); else NO-GO. Short-self lift/plateau decides the calendar proviso (survives-or-voided).',
  scope:'Reused exploratory development histories only, EXTENDED (same seeds, longer runs — bank unchanged, execution new); single-variable vs R1-learned is TIME only; no fresh qualification, functional-pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,create,ticks){
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={},emit=event=>{counts[event.type]=(counts[event.type]||0)+1;const line=JSON.stringify(event)+'\n';digest.update(line);writeSync(fd,line);events++;};
  const run=create(emit);let tick=0;while(tick<ticks&&run.advance(1))tick++;
  closeSync(fd);return {run,endpoint:run.endpoint(),counts,trace:{sha256:digest.digest('hex'),events},finalSha256:hash(JSON.stringify(run.checkpoint()))};
}
const start=performance.now();let rows=[];let scalarOps=0;
const noteOps=o=>{scalarOps+=o;assert.ok(scalarOps<=ODOR_R2_OP_CAP,'R5 aggregate op cap breached');};
for(const history of histories){
  const acquisition={},traces={},anchors={};
  const label=history.seed+'-acquire-learned-extended';
  const result=tape(label,emit=>new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'original',phaseDurations:[1024,1024,1024,512],emit}),protocol.acquisitionTicks);
  acquisition['learned-extended']={endpoint:result.endpoint,counts:result.counts};traces[label]=result.trace;
  noteOps(result.endpoint.scalarOperations);
  for(const phase of ['A','B','C','D'])if(result.run.anchors[phase]){anchors[phase]=result.run.anchors[phase];write(join(output,'anchors',history.seed+'-'+phase+'.json'),anchors[phase]);}
  assert.ok(anchors.A&&anchors.D,'R7 run missing A or D anchor for '+history.seed);
  const probes={};
  if(anchors.D){
    const specifications=[
      ...['A','B'].flatMap(phase=>['current','earlier','reset'].map(mode=>({phase,mode,seed:history.probeSeeds[phase]}))),
      ...['current','reset','native','guarded','native-full'].map(mode=>({phase:'transfer',mode,seed:history.probeSeeds.transfer}))
    ];
    for(const spec of specifications){
      if(spec.mode==='earlier'&&!anchors[spec.phase]){probes[spec.phase+'-'+spec.mode]=null;continue;}
      const key=spec.phase+'-'+spec.mode,plabel=history.seed+'-probe-'+key;
      const presult=tape(plabel,emit=>{
        if(spec.mode==='native-full'){
          const anchor=structuredClone(anchors.D);anchor.kind='coverage-world';
          return CoverageExperiment.fork(anchor,{phase:spec.phase,seed:spec.seed,mode:'native-full',emit});
        }
        return OdorRoutedExperiment.fork(anchors.D,{phase:spec.phase,seed:spec.seed,mode:spec.mode==='reset'?'reset':'current',
          modelAnchor:spec.mode==='earlier'?anchors[spec.phase]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned',emit});
      },protocol.probeTicks);
      probes[key]={endpoint:presult.endpoint,counts:presult.counts,startWorldSha256:null,finalSha256:presult.finalSha256};traces[plabel]=presult.trace;
      noteOps(presult.endpoint.scalarOperations);
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
  console.log(JSON.stringify({seed:history.seed,survivors:row.acquisition['learned-extended'].endpoint.survivors,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
assert.ok((performance.now()-start)/1000<=ODOR_R2_WALL_CAP_SECONDS,'R7 wall cap breached');
// Short-self comparator: spent R1 1792t rows, read-only triage copies.
const shortDir=join(root,'evidence/odor-routed-development-r7/short-self');
assert.ok(existsSync(shortDir),'R7 short-self R1 rows missing: extract + verify per triage before running');
const shortRows=histories.map(history=>{
  const row=JSON.parse(readFileSync(join(shortDir,history.seed+'.json'),'utf8'));
  assert.equal(row.history.seed,history.seed);return row;
});
const shortSha=Object.fromEntries(shortRows.map(row=>[row.history.seed,hash(JSON.stringify(row))]));
write(join(output,'short-self-sha256.json'),shortSha);
const shortSelf={complete:true,values:rows.map((row,i)=>{
  const candidate=row.probes['transfer-current']?.endpoint,control=shortRows[i].probes['transfer-current']?.endpoint;
  return candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null;
})};
shortSelf.complete=shortSelf.values.every(Boolean);
shortSelf.meanEnergy=shortSelf.complete?shortSelf.values.reduce((sum,value)=>sum+value.energy,0)/8:null;
shortSelf.positiveHistories=shortSelf.values.filter(value=>value&&value.energy>0).length;
shortSelf.survivorDifference=shortSelf.complete?shortSelf.values.reduce((sum,value)=>sum+value.survivors,0):null;
for(const [seed,expected]of Object.entries(shortSha))assert.equal(hash(readFileSync(join(shortDir,seed+'.json'))),expected);
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
const gateFor=m=>comparisons[m].complete&&comparisons[m].meanEnergy>0&&comparisons[m].positiveHistories>=6&&comparisons[m].survivorDifference>=0;
const shortGO=shortSelf.complete&&shortSelf.meanEnergy>0&&shortSelf.positiveHistories>=6&&shortSelf.survivorDifference>=0;
const aOK=retention.A.complete&&retention.A.ratio!==null&&retention.A.ratio>=0.95;
const bOK=retention.B.complete&&retention.B.ratio!==null&&retention.B.ratio>=0.95;
const verdict=!gateFor('native-full')?'R7-NO-GO':!aOK?'R7-NO-GO':!bOK?'R7-NO-GO':!shortGO?'R7-PARTIAL':'R7-GO';
// Late-half plateau: mean alive-fly energy, second vs first half of acquisition.
const slope=(()=>{
  const halves=[[],[]];
  for(const history of histories){
    const lines=readFileSync(join(output,'traces',history.seed+'-acquire-learned-extended.jsonl'),'utf8').split('\n');
    for(const line of lines){
      if(!line.startsWith('{"type":"decision"'))continue;
      const e=JSON.parse(line);halves[e.tick>=1792?1:0].push(e.own.energy);
    }
  }
  const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
  return {first:mean(halves[0]),second:mean(halves[1]),slope:mean(halves[1])-mean(halves[0])};
})();
write(join(output,'verdict.json'),{verdict,comparisons,shortSelf,slope,retention,scalarOperations:scalarOps,scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,comparisons,shortSelf,slope,retention,scalarOps}));
