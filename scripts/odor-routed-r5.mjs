// ODOR DEV ROUND 5 runner (PLAN V1 FROZEN): one new acquisition arm
// (learned-gated: fixed A512/B512/C512/D256 curriculum, B1 gated-pair
// head — hard switch on guard.viable, forced stop + no-update while
// stopped) + full A/B/transfer probe suite on the SAME 8 reused
// histories. Single-variable isolation vs round-3 learned-guard
// (forced-vs-learned stop only). Single execution. Caps: 40e9 ops,
// 3600s wall.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r5');
const bank=join(root,'evidence/odor-routed-development-r5/bank-protocol.json');
{ // Single-execution guard: output absent, or holding only the triage bank copy.
  const pre=existsSync(output)?readdirSync(output):[];
  assert.ok(pre.length===0||(pre.length===1&&pre[0]==='bank-protocol.json'),'R5 output already exists; preserve it: '+output);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-r5.mjs','learning/odor-routed-experiment.mjs','learning/gated-steering.mjs','learning/own-steering.mjs','learning/continual-regimes.mjs','docs/ODOR_DEV_ROUND5_PLAN_V1.md'])visit(join(root,name));
assert.ok(existsSync(bank),'R5 bank-protocol copy missing: extract + verify per triage before running');
const histories=JSON.parse(readFileSync(bank,'utf8')).histories;assert.equal(histories.length,8);
const protocol={schema:1,kind:'odor-routed-development-r5',createdAt:new Date().toISOString(),histories,sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),
  acquisitionGeometry:'continual',acquisitionArms:['learned-gated'],acquisitionTicks:1792,probeTicks:256,
  retention:'End-D frozen current; A and B separately compare earlier, current and reset frozen models. Missing checkpoints remain missing.',
  transfer:'End-D frozen current, reset, matched native, matched guarded and cheap native-full; compare current against reset and cheap native-full.',
  rule:'GO iff transfer gate (6/8 vs reset AND vs cheap native-full, nonnegative survivor diffs) AND A>=95% AND B>=95% AND guarded-comparison >=6/8 positive with mean>=0 (B1 internalizes the guard, so beating it is the bar); PARTIAL if transfer+A+B pass but guarded fails; else NO-GO (B1 closed, B2 next).',
  scope:'Reused exploratory development histories only; single-variable isolation vs round-3 learned-guard (forced-vs-learned stop); no fresh qualification, functional-pressure success or RSI.'};
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
  const label=history.seed+'-acquire-learned-gated';
  const result=tape(label,emit=>new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'gated',emit}),protocol.acquisitionTicks);
  acquisition['learned-gated']={endpoint:result.endpoint,counts:result.counts};traces[label]=result.trace;
  noteOps(result.endpoint.scalarOperations);
  for(const phase of ['A','B','C','D'])if(result.run.anchors[phase]){anchors[phase]=result.run.anchors[phase];write(join(output,'anchors',history.seed+'-'+phase+'.json'),anchors[phase]);}
  assert.ok(anchors.A&&anchors.D,'R5 run missing A or D anchor for '+history.seed);
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
  console.log(JSON.stringify({seed:history.seed,survivors:row.acquisition['learned-gated'].endpoint.survivors,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
assert.ok((performance.now()-start)/1000<=ODOR_R2_WALL_CAP_SECONDS,'R5 wall cap breached');
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
const transferGO=gateFor('reset')&&gateFor('native-full');
const aOK=retention.A.complete&&retention.A.ratio!==null&&retention.A.ratio>=0.95;
const bOK=retention.B.complete&&retention.B.ratio!==null&&retention.B.ratio>=0.95;
const gOK=comparisons.guarded.complete&&comparisons.guarded.positiveHistories>=6&&comparisons.guarded.meanEnergy>=0;
const verdict=!transferGO?'R5-NO-GO':!aOK?'R5-NO-GO':!bOK?'R5-NO-GO':!gOK?'R5-PARTIAL':'R5-GO';
write(join(output,'verdict.json'),{verdict,comparisons,retention,scalarOperations:scalarOps,scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,comparisons,retention,scalarOps}));
