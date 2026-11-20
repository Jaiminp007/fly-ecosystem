// ODOR DEV ROUND 8 runner (AMENDMENT A2 FROZEN): one centered arm
// (adaptive EMA baseline, baselineRate 0.05, R1-plain 1792t curriculum)
// on the SAME 8 reused histories + spent-R1 comparator (read-only).
// Single authorized attempt. 3600s wall.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r8');
const bank=join(root,'evidence/odor-routed-development-r8/bank-protocol.json');
{ // Single-execution guard: output absent, or holding only the triage bank copy + r1plain R1 rows.
  const pre=existsSync(output)?readdirSync(output):[];
  assert.ok(pre.length===0||(pre.length===2&&pre.includes('bank-protocol.json')&&pre.includes('r1plain')),'R8 output already exists; preserve it: '+output);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-r8.mjs','learning/odor-routed-experiment.mjs','learning/odor-routed-taste.mjs','learning/own-steering-experiment.mjs','learning/continual-regimes.mjs','docs/ODOR_DEV_ROUND8_PLAN_V1.md','docs/ODOR_DEV_ROUND8_AMENDMENT_A2.md'])visit(join(root,name));
assert.ok(existsSync(bank),'R8 bank-protocol copy missing: assemble + verify per triage before running');
const bankDoc=JSON.parse(readFileSync(bank,'utf8'));
const histories=bankDoc.histories;assert.equal(histories.length,8);
assert.equal(bankDoc.baselineRate,0.05);assert.equal(bankDoc.baselineC0,0);
const protocol={schema:1,kind:'odor-routed-development-r8',createdAt:new Date().toISOString(),histories,sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),
  baselineRate:bankDoc.baselineRate,baselineC0:bankDoc.baselineC0,
  acquisitionGeometry:'continual',acquisitionArms:['centered'],acquisitionTicks:1792,probeTicks:256,
  retention:'End-D frozen current; A separately compares current/earlier/reset frozen models. Missing checkpoints remain missing.',
  transfer:'End-D frozen current, reset, matched native, guarded and cheap native-full; compare centered transfer-current vs spent R1 transfer-current (same histories, read-only).',
  rule:'GO iff transfer-centered>R1 on >=5/8 AND pooled taste posfrac>=0.4 on >=6/8 AND centered A-current>=0.8xR1 A-current on >=6/8; PARTIAL iff transfer lifts but acquisition fails; else NO-GO. Sign audit: pooled mean/posfrac of D-anchor taste weights (R11 method).',
  scope:'Reused exploratory development histories only; single-variable vs R1-plain is the adaptive baseline (alpha=0.05, c0=0); no fresh qualification, functional-pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,create,ticks){
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={},emit=event=>{counts[event.type]=(counts[event.type]||0)+1;const line=JSON.stringify(event)+'\n';digest.update(line);writeSync(fd,line);events++;};
  const run=create(emit);let tick=0;while(tick<ticks&&run.advance(1))tick++;
  closeSync(fd);return {run,endpoint:run.endpoint(),counts,trace:{sha256:digest.digest('hex'),events},finalSha256:hash(JSON.stringify(run.checkpoint()))};
}
const start=performance.now();let rows=[];let scalarOps=0;
const noteOps=o=>{scalarOps+=o;assert.ok(scalarOps<=ODOR_R2_OP_CAP,'R8 aggregate op cap breached');};
for(const history of histories){
  const acquisition={},traces={},anchors={};
  const label=history.seed+'-acquire-centered';
  const result=tape(label,emit=>new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'original',baselineRate:protocol.baselineRate,emit}),protocol.acquisitionTicks);
  acquisition['centered']={endpoint:result.endpoint,counts:result.counts};traces[label]=result.trace;
  noteOps(result.endpoint.scalarOperations);
  for(const phase of ['A','B','C','D'])if(result.run.anchors[phase]){anchors[phase]=result.run.anchors[phase];write(join(output,'anchors',history.seed+'-'+phase+'.json'),anchors[phase]);}
  assert.ok(anchors.A&&anchors.D,'R8 run missing A or D anchor for '+history.seed);
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
  // Sign audit (R11 method, pooled over D-anchor learners).
  let signAudit=null;
  {
    const learners=Object.values(anchors.D.state.learners);
    let n=0,pos=0,sum=0;
    for(const s of learners){
      const w=s.taste&&s.taste.weights;if(!Array.isArray(w))continue;
      const flat=Array.isArray(w[0])?w.flat():w;
      for(const x of flat){if(typeof x!=='number')continue;n++;sum+=x;if(x>0)pos++;}
    }
    assert.ok(n>0,'R8 D anchor has no taste weights for '+history.seed);
    signAudit={n,mean:sum/n,posfrac:pos/n};
  }
  const effects={};
  for(const mode of ['reset','native','guarded','native-full']){
    const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
    effects[mode]=candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null;
  }
  const row={history,acquisition,anchorPhases:Object.keys(anchors),probes,effects,signAudit,traces};write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:row.acquisition['centered'].endpoint.survivors,signAudit,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
assert.ok((performance.now()-start)/1000<=ODOR_R2_WALL_CAP_SECONDS,'R8 wall cap breached');
// Spent-R1 comparator: read-only triage copies.
const r1Dir=join(root,'evidence/odor-routed-development-r8/r1plain');
assert.ok(existsSync(r1Dir),'R8 r1plain R1 rows missing: extract + verify per triage before running');
const r1Rows=histories.map(history=>{
  const row=JSON.parse(readFileSync(join(r1Dir,history.seed+'.json'),'utf8'));
  assert.equal(row.history.seed,history.seed);return row;
});
const r1Sha=Object.fromEntries(r1Rows.map(row=>[row.history.seed,hash(JSON.stringify(row))]));
write(join(output,'r1plain-sha256.json'),r1Sha);
for(const [seed,expected]of Object.entries(r1Sha))assert.equal(hash(JSON.stringify(JSON.parse(readFileSync(join(r1Dir,seed+'.json'),'utf8')))),expected);
// Gated comparisons (fail-closed: missing comparator data throws, no verdict shopping).
const transferLift=rows.map((row,i)=>{
  const candidate=row.probes['transfer-current']?.endpoint,b= r1Rows[i].probes['transfer-current']?.endpoint;
  assert.ok(candidate&&b,'R8 missing transfer-current for '+row.history.seed);
  return {seed:row.history.seed,energy:candidate.budgetAdjustedEnergyPerFounder-b.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-b.survivors};
});
const transferWins=transferLift.filter(v=>v.energy>0).length;
const acquireOK=rows.map((row,i)=>{
  const candidate=row.probes['A-current']?.endpoint,b=r1Rows[i].probes['A-current']?.endpoint;
  assert.ok(candidate&&b,'R8 missing A-current for '+row.history.seed);
  return {seed:row.history.seed,ratio:b.budgetAdjustedEnergyPerFounder>0?candidate.budgetAdjustedEnergyPerFounder/b.budgetAdjustedEnergyPerFounder:null};
});
const acquirePass=acquireOK.filter(v=>v.ratio!==null&&v.ratio>=0.8).length;
const signPass=rows.map(row=>({seed:row.history.seed,posfrac:row.signAudit.posfrac,pass:row.signAudit.posfrac>=0.4}));
const signWins=signPass.filter(v=>v.pass).length;
const verdict=transferWins>=5&&signWins>=6&&acquirePass>=6?'R8-GO':transferWins>=5?'R8-PARTIAL':'R8-NO-GO';
write(join(output,'verdict.json'),{verdict,transferLift,transferWins,acquireOK,acquirePass,signPass,signWins,scalarOperations:scalarOps,scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,transferWins,acquirePass,signWins,scalarOps}));
