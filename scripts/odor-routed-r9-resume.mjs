// ODOR DEV ROUND 9 crash-resume (ENOSPC abort after 3/8 rows; zero re-execution
// of completed rows). Skips histories with valid complete rows; deletes partial
// artifacts of incomplete ones; runs the remainder; then the frozen post-
// section verbatim. Dual provenance: inputs = launch written rows + bank;
// redone: [] (no completed row re-executed, no world re-run).
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,readdirSync,unlinkSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r9');
const bank=join(root,'evidence/odor-routed-development-r9/bank-protocol.json');
{ // Resume guard: protocol exists (launch wrote it), verdict absent, bank copy intact.
  const pre=existsSync(output)?readdirSync(output):[];
  assert.ok(pre.includes('bank-protocol.json')&&pre.includes('r1plain')&&pre.includes('protocol.json'),'R9 resume needs launch state');
  assert.ok(!existsSync(join(output,'verdict.json')),'R9 resume refuses: verdict already exists');
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
};
for(const name of ['scripts/odor-routed-r9.mjs','learning/odor-routed-experiment.mjs','learning/odor-routed-taste.mjs','learning/own-steering-experiment.mjs','learning/continual-regimes.mjs','docs/ODOR_DEV_ROUND9_PLAN_V1.md','docs/ODOR_DEV_ROUND9_PLAN_V1_AMENDMENT_A1.md'])visit(join(root,name));
assert.ok(existsSync(bank),'R9 bank-protocol copy missing: assemble + verify per triage before running');
const bankDoc=JSON.parse(readFileSync(bank,'utf8'));
const histories=bankDoc.histories;assert.equal(histories.length,8);
assert.equal(bankDoc.quantileHeads,8);
const protocol=JSON.parse(readFileSync(join(output,'protocol.json'),'utf8'));
assert.equal(protocol.kind,'odor-routed-development-r9');
assert.equal(protocol.quantileHeads,bankDoc.quantileHeads);
assert.deepEqual(protocol.histories,histories);
assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
function tape(label,create,ticks){
  const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const counts={},emit=event=>{counts[event.type]=(counts[event.type]||0)+1;const line=JSON.stringify(event)+'\n';digest.update(line);writeSync(fd,line);events++;};
  const run=create(emit);let tick=0;while(tick<ticks&&run.advance(1))tick++;
  closeSync(fd);return {run,endpoint:run.endpoint(),counts,trace:{sha256:digest.digest('hex'),events},finalSha256:hash(JSON.stringify(run.checkpoint()))};
}
const start=performance.now();let rows=[];let scalarOps=0;
const noteOps=o=>{scalarOps+=o;assert.ok(scalarOps<=ODOR_R2_OP_CAP,'R9 aggregate op cap breached');};
for(const history of histories){
  // Resume-or-run: valid complete rows are kept (dual provenance), partials cleared.
  const rowPath=join(output,'rows',history.seed+'.json');
  if(existsSync(rowPath)){
    const prev=JSON.parse(readFileSync(rowPath,'utf8'));
    assert.equal(prev.history.seed,history.seed);
    const pk=Object.entries(prev.probes||{}).filter(([,v])=>v);
    assert.ok(pk.length===11&&prev.headAudit&&prev.headAudit.pairs>0,'R9 resume: incomplete row for '+history.seed+' — delete it and its artifacts, then resume');
    rows.push(prev);
    noteOps(prev.acquisition.distributional.endpoint.scalarOperations);
    for(const [,p]of pk)noteOps(p.endpoint.scalarOperations);
    console.log(JSON.stringify({seed:history.seed,resumed:true}));
    continue;
  }
  for(const f of readdirSync(join(output,'traces')))if(f.startsWith(history.seed+'-'))unlinkSync(join(output,'traces',f));
  if(existsSync(join(output,'anchors')))for(const f of readdirSync(join(output,'anchors')))if(f.startsWith(history.seed+'-'))unlinkSync(join(output,'anchors',f));
  const acquisition={},traces={},anchors={};
  const label=history.seed+'-acquire-distributional';
  const result=tape(label,emit=>new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'original',quantileHeads:protocol.quantileHeads,emit}),protocol.acquisitionTicks);
  acquisition['distributional']={endpoint:result.endpoint,counts:result.counts};traces[label]=result.trace;
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
  // Head audit (frozen): pooled qweights mean/posfrac + upperMass.
  let headAudit=null;
  {
    const learners=Object.values(anchors.D.state.learners);
    let n=0,pos=0,sum=0,pairs=0,pairsPos=0;
    for(const s of learners){
      const q=s.taste&&s.taste.qweights;if(!Array.isArray(q)||q.length!==8)continue;
      for(const w of q){
        let hm=0;for(const x of w){if(typeof x!=='number')continue;n++;sum+=x;hm+=x;if(x>0)pos++;}
        pairs++;if(hm>0)pairsPos++;
      }
    }
    assert.ok(n>0&&pairs>0,'R9 D anchor has no quantile heads for '+history.seed);
    headAudit={n,mean:sum/n,posfrac:pos/n,pairs,upperMass:pairsPos/pairs};
  }
  const effects={};
  for(const mode of ['reset','native','guarded','native-full']){
    const candidate=probes['transfer-current']?.endpoint,control=probes['transfer-'+mode]?.endpoint;
    effects[mode]=candidate&&control?{energy:candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-control.survivors}:null;
  }
  const row={history,acquisition,anchorPhases:Object.keys(anchors),probes,effects,headAudit,traces};write(join(output,'rows',history.seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:history.seed,survivors:row.acquisition['distributional'].endpoint.survivors,headAudit,effects}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
assert.ok((performance.now()-start)/1000<=ODOR_R2_WALL_CAP_SECONDS,'R9 wall cap breached');
const r1Dir=join(root,'evidence/odor-routed-development-r9/r1plain');
assert.ok(existsSync(r1Dir),'R9 r1plain R1 rows missing: extract + verify per triage before running');
const r1Rows=histories.map(history=>{
  const row=JSON.parse(readFileSync(join(r1Dir,history.seed+'.json'),'utf8'));
  assert.equal(row.history.seed,history.seed);return row;
});
const r1Sha=Object.fromEntries(r1Rows.map(row=>[row.history.seed,hash(JSON.stringify(row))]));
const r1ShaPath=join(output,'r1plain-sha256.json');
if(existsSync(r1ShaPath))assert.deepEqual(JSON.parse(readFileSync(r1ShaPath,'utf8')),r1Sha,'launch r1plain-sha256 mismatch');
else write(r1ShaPath,r1Sha);
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
const upperPass=rows.map(row=>({seed:row.history.seed,upperMass:row.headAudit.upperMass,pass:row.headAudit.upperMass>=0.5}));
const upperWins=upperPass.filter(v=>v.pass).length;
const verdict=transferWins>=5&&upperWins>=6&&acquirePass>=6?'R9-GO':transferWins>=5?'R9-PARTIAL':'R9-NO-GO';
write(join(output,'verdict.json'),{verdict,transferLift,transferWins,acquireDiff,acquirePass,upperPass,upperWins,scalarOperations:scalarOps,
  provenance:{resumed:true,reason:'launch aborted on ENOSPC after 3/8 rows (environmental disk-full, not a verdict); histories 4-8 executed fresh, rows 1-3 kept with dual provenance (launch log + files); partial history-4 trace removed pre-resume',redone:[]},
  scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,transferWins,acquirePass,upperWins,scalarOps}));
