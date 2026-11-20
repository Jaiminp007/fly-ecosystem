// ODOR DEV ROUND 10 runner (PLAN V1 FROZEN): one split
// arm (Go/No-Go matrices, R1-plain 1792t curriculum) on the SAME 8 reused
// histories + spent-R1 comparator (read-only). Single authorized attempt.
// 3600s wall.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r10');
const bank=join(root,'evidence/odor-routed-development-r10/bank-protocol.json');
{ // Single-execution guard: output absent, or holding only the triage bank copy + r1plain R1 rows.
  const pre=existsSync(output)?readdirSync(output):[];
  assert.ok(pre.length===0||(pre.length===2&&pre.includes('bank-protocol.json')&&pre.includes('r1plain')),'R9 output already exists; preserve it: '+output);
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-r10.mjs','learning/odor-routed-experiment.mjs','learning/odor-routed-taste.mjs','learning/own-steering-experiment.mjs','learning/continual-regimes.mjs','docs/ODOR_DEV_ROUND10_PLAN_V1.md'])visit(join(root,name));
assert.ok(existsSync(bank),'R10 bank-protocol copy missing: assemble + verify per triage before running');
const bankDoc=JSON.parse(readFileSync(bank,'utf8'));
const histories=bankDoc.histories;assert.equal(histories.length,8);
assert.equal(bankDoc.splitTaste,true);
const protocol={schema:1,kind:'odor-routed-development-r10',createdAt:new Date().toISOString(),histories,sourceSha256:sources,bankPath:relative(root,bank).split(sep).join('/'),bankSha256:hash(readFileSync(bank)),
  splitTaste:bankDoc.splitTaste,
  acquisitionGeometry:'continual',acquisitionArms:['split'],acquisitionTicks:1792,probeTicks:256,
  retention:'End-D frozen current; A separately compares split current/earlier/reset frozen models. Missing checkpoints remain missing.',
  transfer:'End-D frozen current, reset, matched native, guarded and cheap native-full; compare split transfer-current vs spent R1 transfer-current (same histories, read-only).',
  rule:'GO iff transfer-split>R1 on >=5/8 AND Go-mean>0 on >=6/8 AND acquisition diff>=−0.5 on >=6/8; PARTIAL iff transfer lifts but acquisition fails; else NO-GO. Go audit: pooled goW mean per history (frozen).',
  scope:'Reused exploratory development histories only; single-variable vs R1-plain is the split Go/No-Go routing (behavior reads difference); no fresh qualification, functional-pressure success or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,create,ticks){
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={},emit=event=>{counts[event.type]=(counts[event.type]||0)+1;const line=JSON.stringify(event)+'\n';digest.update(line);writeSync(fd,line);events++;};
  const run=create(emit);let tick=0;while(tick<ticks&&run.advance(1))tick++;
  closeSync(fd);return {run,endpoint:run.endpoint(),counts,trace:{sha256:digest.digest('hex'),events},finalSha256:hash(JSON.stringify(run.checkpoint()))};
}
const start=performance.now();let rows=[];let scalarOps=0;
const noteOps=o=>{scalarOps+=o;assert.ok(scalarOps<=ODOR_R2_OP_CAP,'R10 aggregate op cap breached');};
for(const history of histories){
  const acquisition={},traces={},anchors={};
  const label=history.seed+'-acquire-split';
  const result=tape(label,emit=>new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'original',splitTaste:protocol.splitTaste,emit}),protocol.acquisitionTicks);
  acquisition['split']={endpoint:result.endpoint,counts:result.counts};traces[label]=result.trace;
  noteOps(result.endpoint.scalarOperations);
  for(const phase of ['A','B','C','D'])if(result.run.anchors[phase]){anchors[phase]=result.run.anchors[phase];write(join(output,'anchors',history.seed+'-'+phase+'.json'),anchors[phase]);}
  assert.ok(anchors.A&&anchors.D,'R9 run missing A or D anchor for '+history.seed);
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
  // Go audit (frozen): pooled goW mean per history.
  let headAudit=null;
  {
    const learners=Object.values(anchors.D.state.learners);
    let n=0,sum=0;
    for(const s of learners){
      const g=s.taste&&s.taste.goW;if(!Array.isArray(g))continue;
      for(const x of g){if(typeof x!=='number')continue;n++;sum+=x;}
    }
    assert.ok(n>0,'R10 D anchor has no Go weights for '+history.seed);
    headAudit={n,goMean:sum/n};
  }
  const effects={};
  for(const mode of ['reset','native','guarded','native-full']){
    const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
    effects[mode]=candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null;
  }
  const row={history,acquisition,anchorPhases:Object.keys(anchors),probes,effects,headAudit,traces};write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:row.acquisition['split'].endpoint.survivors,headAudit,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
assert.ok((performance.now()-start)/1000<=ODOR_R2_WALL_CAP_SECONDS,'R10 wall cap breached');
const r1Dir=join(root,'evidence/odor-routed-development-r10/r1plain');
assert.ok(existsSync(r1Dir),'R10 r1plain R1 rows missing: extract + verify per triage before running');
const r1Rows=histories.map(history=>{
  const row=JSON.parse(readFileSync(join(r1Dir,history.seed+'.json'),'utf8'));
  assert.equal(row.history.seed,history.seed);return row;
});
const r1Sha=Object.fromEntries(r1Rows.map(row=>[row.history.seed,hash(JSON.stringify(row))]));
write(join(output,'r1plain-sha256.json'),r1Sha);
for(const [seed,expected]of Object.entries(r1Sha)){
  const raw=readFileSync(join(r1Dir,seed+'.json'),'utf8');
  assert.equal(hash(JSON.stringify(JSON.parse(raw))),expected);
}
const transferLift=rows.map((row,i)=>{
  const candidate=row.probes['transfer-current']?.endpoint,b=r1Rows[i].probes['transfer-current']?.endpoint;
  assert.ok(candidate&&b,'R9 missing transfer-current for '+row.history.seed);
  return {seed:row.history.seed,energy:candidate.budgetAdjustedEnergyPerFounder-b.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-b.survivors};
});
const transferWins=transferLift.filter(v=>v.energy>0).length;
const acquireDiff=rows.map((row,i)=>{
  const candidate=row.probes['A-current']?.endpoint,b=r1Rows[i].probes['A-current']?.endpoint;
  assert.ok(candidate&&b,'R9 missing A-current for '+row.history.seed);
  return {seed:row.history.seed,diff:candidate.budgetAdjustedEnergyPerFounder-b.budgetAdjustedEnergyPerFounder};
});
const acquirePass=acquireDiff.filter(v=>v.diff>=-0.5).length;
const upperPass=rows.map(row=>({seed:row.history.seed,goMean:row.headAudit.goMean,pass:row.headAudit.goMean>0}));
const upperWins=upperPass.filter(v=>v.pass).length;
const verdict=transferWins>=5&&upperWins>=6&&acquirePass>=6?'R10-GO':transferWins>=5?'R10-PARTIAL':'R10-NO-GO';
write(join(output,'verdict.json'),{verdict,transferLift,transferWins,acquireDiff,acquirePass,upperPass,upperWins,scalarOperations:scalarOps,scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,transferWins,acquirePass,upperWins,scalarOps}));
