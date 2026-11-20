// ODOR DEV ROUND 4 runner (PLAN V1 FROZEN): guarded distillation.
// Teacher pairs (features+action per decision) extracted READ-ONLY from
// the archived round-1 guarded acquisition traces. Fresh 8-dim student
// steering bodies per fly, supervised perceptron training in curriculum
// order (A512/B512/C512/D256 slices), slot checkpoints grafted onto
// COPIES of the round-1 slot anchors (R1 bodies held constant — taste
// identical, steering differs ONLY by training signal). Full A/B/transfer
// probe suite (same seeds, same scorer). Single execution. Caps 40e9/1h.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {createOwnSteering,superviseOwnSteering} from '../learning/own-steering.mjs';
import {ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r4');
const bank=join(root,'evidence/odor-routed-development-r4/bank-protocol.json');
{ // Single-execution guard: output absent, or holding only triage inputs.
  const pre=existsSync(output)?readdirSync(output):[];
  const ok=pre.length===0||(pre.length===2&&pre.includes('bank-protocol.json')&&pre.includes('teacher-src'));
  assert.ok(ok,'R4 output already exists; preserve it: '+output);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-r4.mjs','learning/own-steering.mjs','learning/odor-routed-experiment.mjs','docs/ODOR_DEV_ROUND4_PLAN_V1.md'])visit(join(root,name));
assert.ok(existsSync(bank),'R4 bank-protocol copy missing: extract + verify per triage before running');
const histories=JSON.parse(readFileSync(bank,'utf8')).histories;assert.equal(histories.length,8);
const protocol={schema:1,kind:'odor-routed-development-r4',createdAt:new Date().toISOString(),histories,sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),
  acquisitionGeometry:'continual',acquisitionArms:['learned-distilled'],acquisitionTicks:1792,probeTicks:256,
  teacher:'round-1 guarded acquisition traces (read-only, archived tar), (features,action) per decision, curriculum slices A512/B512/C512/D256',
  rule:'GO iff transfer gate (6/8 vs reset AND vs cheap native-full, nonnegative survivor diffs) AND A>=95% AND B>=95%. PARTIAL if transfer passes but a retention fails. Else NO-GO.',
  scope:'Reused exploratory development histories + reused round-1 anchors/traces; single-variable isolation vs R1-learned (training signal only); no fresh qualification, functional-pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});};
// Teacher-pair extraction (triage-extracted read-only copies; zero new rollouts).
// Triage: extract the 8 guarded traces + 32 slot anchors from the R1 tar
// into <output>/teacher-src/ and verify the 40 files before running.
const TEACHER_SRC=join(output,'teacher-src');
const R1SLOT_EDGES=[512,1024,1536,1792];
function teacherPairs(history){
  const out=readFileSync(join(TEACHER_SRC,`${history.seed}-acquire-guarded.jsonl`),'utf8');
  const pairs=[];
  for(const line of out.split('\n')){
    if(!line.trim())continue;
    let e;try{e=JSON.parse(line);}catch{continue;}
    if(e.type!=='decision'||e.id===undefined||!e.steering||!Array.isArray(e.features))continue;
    pairs.push({agentId:e.id,tick:e.tick,features:e.features,action:e.steering.action});
  }
  assert.ok(pairs.length>0,'no guarded teacher pairs for '+history.seed);
  return pairs;
}
function slotOf(tick){for(let i=0;i<R1SLOT_EDGES.length;i++)if(tick<R1SLOT_EDGES[i])return i;return 3;}
function tape(label,create,ticks){
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={},emit=event=>{counts[event.type]=(counts[event.type]||0)+1;const line=JSON.stringify(event)+'\n';digest.update(line);writeSync(fd,line);events++;};
  const run=create(emit);let tick=0;while(tick<ticks&&run.advance(1))tick++;
  closeSync(fd);return {run,endpoint:run.endpoint(),counts,trace:{sha256:digest.digest('hex'),events},finalSha256:hash(JSON.stringify(run.checkpoint()))};
}
const start=performance.now();let rows=[];let scalarOps=0;
const noteOps=o=>{scalarOps+=o;assert.ok(scalarOps<=ODOR_R2_OP_CAP,'R4 aggregate op cap breached');};
const SLOT_NAMES=['A','B','C','D'];
for(const history of histories){
  const pairs=teacherPairs(history);
  const bodies={};
  const seedOf=id=>((history.seed^Math.imul(id,2654435761))>>>0)||1;
  let bcOps=0;
  const slotCheckpoints=[];
  const bySlot=[[],[],[],[]];
  for(const p of pairs)bySlot[slotOf(p.tick)].push(p);
  for(let s=0;s<4;s++){
    for(const p of bySlot[s]){
      if(!bodies[p.agentId])bodies[p.agentId]=createOwnSteering(p.agentId,seedOf(p.agentId),8);
      const r=superviseOwnSteering(bodies[p.agentId],p.features,p.action);
      bcOps+=r.ops;
    }
    const snap={};
    for(const [id,b]of Object.entries(bodies))snap[id]={weights:structuredClone(b.weights)};
    slotCheckpoints.push(snap);
  }
  noteOps(bcOps);
  // Anchor surgery: round-1 slot anchors (extracted read-only) + BC steering graft.
  const anchors={};
  for(let s=0;s<4;s++){
    const raw=readFileSync(join(TEACHER_SRC,`${history.seed}-${SLOT_NAMES[s]}.json`),'utf8');
    const grafted=JSON.parse(raw);
    const learners=grafted.state?grafted.state.learners:grafted.learners;
    assert.ok(learners,'anchor has no learners: '+history.seed+'-'+SLOT_NAMES[s]);
    for(const [id,st]of Object.entries(learners)){
      if(slotCheckpoints[s][id])st.steering.weights=structuredClone(slotCheckpoints[s][id].weights);
    }
    const key=SLOT_NAMES[s];
    anchors[key]=grafted;write(join(output,'anchors',history.seed+'-'+key+'.json'),grafted);
  }
  // R1 table has a single A slot: no alias needed, key 'A' is final.
  const row={history,acquisition:{'learned-distilled':{teacherPairs:pairs.length,bcOps,flies:Object.keys(bodies).length}},anchorPhases:Object.keys(anchors),probes:{},traces:{},effects:{}};
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
      probes[key]={endpoint:presult.endpoint,counts:presult.counts,startWorldSha256:null,finalSha256:presult.finalSha256};row.traces[plabel]=presult.trace;
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
  row.probes=probes;
  const effects={};
  for(const mode of ['reset','native','guarded','native-full']){
    const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
    effects[mode]=candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null;
  }
  row.effects=effects;
  write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,teacherPairs:pairs.length,bcOps,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
assert.ok((performance.now()-start)/1000<=ODOR_R2_WALL_CAP_SECONDS,'R4 wall cap breached');
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
const verdict=!transferGO?'R4-NO-GO':!aOK?'R4-NO-GO':!bOK?'R4-PARTIAL':'R4-GO';
write(join(output,'verdict.json'),{verdict,comparisons,retention,scalarOperations:scalarOps,scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,comparisons,retention,scalarOps}));
