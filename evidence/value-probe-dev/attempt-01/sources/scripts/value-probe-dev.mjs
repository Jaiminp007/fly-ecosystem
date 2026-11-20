// VALUE-PROBE Phase-A dev instrument (FROZEN under docs/VALUE_PROBE_PLAN_V1.md).
// Critic-vs-actor localization: V1 reference triple (train +
// uniform-transferred + unlearned) x 3 pairs = 9 mains (BT_TICKS=1792
// every arm), end-of-seg per-cue value probes on every row (exact: taste
// phi is context-free, same tasteFeatures path as live decisions),
// per-cue per-third behavior counters (time-matched late-third cut).
// Probes billed exactly like live predictions (math-op wrapper, symmetric
// all arms). G1 integrity + G0 train-learned + G-validity (probes read
// out known train knowledge, unlearned d'~0) + G-gap on BH cues
// (late-third behavior vs end-values): ACTOR-SIDE / LEARNER-SIDE /
// INDETERMINATE / INVALID / INCOMPLETE-UNTRAINED. Single attempt.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {probeCueValues} from '../learning/taste-energy.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_PROBE_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const VP_EXPERIMENT='value-probe-dev';
export const VP_HISTORIES=6;
export const VP_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const VP_ARMS=Object.freeze(['train','transferred','unlearned']);
export const VP_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>421001+j));
const VP_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054]];
export const VP_SPENT_SEEDS=Object.freeze([381001,...VP_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const VP_EXPECT_MAINS=9, VP_EXPECT_PROBES=0;
export const VP_OP_CAP=3_000_000_000, VP_WALL_CAP_SECONDS=3600, VP_PROBE_CAP=500;
export const VP_JOIN_MIN=0.99, VP_TRAIN_GAP=0.5;
export const VP_VALID_TRAIN_VALUE=0.75, VP_VALID_UNLEARN_DPRIME=0.3;
export const VP_ACTOR_VALUE_MIN=0.6, VP_ACTOR_GAP=0.2, VP_LEARNER_VALUE_MAX=0.5;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function valueProbeExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/value-probe-dev.mjs','docs/VALUE_PROBE_PLAN_V1.md','tests/value-probe-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function valueProbeDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/value-probe-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/value-probe-dev.test.mjs','docs/VALUE_PROBE_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
function priorEvidenceSeeds(){
  const into=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)into.add(v);};
  const walkFs=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walkFs(p);else if(p.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walkFs(join(root,'evidence'));return into;
}
export function valueProbeDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,VP_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of valueProbeExtraTokens())excluded.add(t);
  for(const s of VP_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of VP_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=VP_FIXTURE_SEEDS.length/VP_HISTORIES===9?Array.from({length:VP_HISTORIES},(_,h)=>{
    const s=VP_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,VP_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:VP_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'VALUE-PROBE Phase-A dev bank (deterministic fresh 421001-421054, 9/history, 6 histories). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Weight snapshot / transplant / integrity: V1i-identical machinery.
export function snapshotWeights(learners){
  const out={};
  for(const id of Object.keys(learners)){
    const w=learners[id].weights;
    assert.ok(w&&typeof w==='object','missing weights for agent '+id);
    out[id]={};
    for(const k of Object.keys(w)){
      assert.ok(Array.isArray(w[k]),'non-array weights '+id+'/'+k);
      out[id][k]=[...w[k]];
    }
  }
  return out;
}
export function digestWeights(snapshot){
  const flat=Object.keys(snapshot).sort().map(id=>[id,...Object.keys(snapshot[id]).sort().map(k=>snapshot[id][k])]);
  return digest(JSON.stringify(flat));
}
export function copyWeights(srcSnapshot,dstLearners){
  const ids=Object.keys(srcSnapshot).sort();
  assert.deepEqual(Object.keys(dstLearners).sort(),ids,'founder id mismatch');
  for(const id of ids){
    const dst=dstLearners[id],w=srcSnapshot[id];
    assert.ok(dst&&w&&typeof w==='object','missing agent snapshot '+id);
    for(const k of Object.keys(w)){
      assert.ok(Array.isArray(dst.weights?.[k])&&dst.weights[k].length===w[k].length,'weights shape mismatch '+id+'/'+k);
      dst.weights[k]=[...w[k]];
    }
  }
  return {transferred:ids.length};
}
export function assertFreshTarget(agent,id){
  assert.equal(agent.lastObservedTick,0,'target not fresh (lastObservedTick) '+id);
  assert.equal(agent.lastDecisionTick,0,'target not fresh (lastDecisionTick) '+id);
  assert.ok(Array.isArray(agent.recent)&&agent.recent.length===0&&Array.isArray(agent.older)&&agent.older.length===0,'target not fresh (buffers) '+id);
  assert.ok(agent.motorPending===null,'target not fresh (motorPending) '+id);
}
export function checkTransplantIntegrity(srcSnapshot,dstLearners){
  const violations=[];
  const a=Object.keys(srcSnapshot).sort(),b=Object.keys(dstLearners).sort();
  if(JSON.stringify(a)!==JSON.stringify(b))violations.push('agent-id-set mismatch');
  for(const id of a){
    const s=srcSnapshot[id],d=dstLearners[id];
    if(!d){violations.push('missing agent '+id);continue;}
    if(!s||typeof s!=='object'){violations.push('missing source snapshot '+id);continue;}
    for(const k of Object.keys(s)){
      if(!Array.isArray(d.weights?.[k])||d.weights[k].length!==s[k].length){violations.push('shape mismatch '+id+'/'+k);continue;}
      if(JSON.stringify(d.weights[k])!==JSON.stringify(s[k]))violations.push('value mismatch '+id+'/'+k);
    }
  }
  return {ok:violations.length===0,violations};
}
// Collector: turn-choice pattern + per-cue per-third turn/contact (thirds of
// BT_TICKS by decision tick). Late third = time-matched behavior for probes.
export function collectValueProbe(){
  const pending=new Map(),perCue={};
  let decisions=0,joined=0;
  const third=t=>t<BT_TICKS/3?0:t<2*BT_TICKS/3?1:2;
  const emit=e=>{
    if(e.type==='decision'&&e.own){
      decisions++;
      pending.set(`${e.own.tick}:${e.own.agentId}`,{cue:(e.own.cue??[]).join(','),action:e.action,contact:!!e.own.contactPresent,tick:e.own.tick});
    }else if(e.type==='physical'&&e.agentId!==undefined&&e.tick!==undefined){
      const d=pending.get(`${e.tick}:${e.agentId}`);
      if(!d)return;
      pending.delete(`${e.tick}:${e.agentId}`);joined++;
      const b=Number(e.beneficialEaten)||0,h=Number(e.harmfulEaten)||0;
      if(d.contact){
        const s=perCue[d.cue]??={contact:0,pause:0,turn:0,beneficial:0,harmful:0,thirds:[{turn:0,contact:0},{turn:0,contact:0},{turn:0,contact:0}]};
        s.contact++;if(d.action>=2)s.pause++;if(d.action%2===1)s.turn++;
        s.beneficial+=b;s.harmful+=h;
        const th=s.thirds[third(d.tick)];th.contact++;if(d.action%2===1)th.turn++;
      }
    }
  };
  return {emit,
    summarize:()=>{
      const cues={};
      for(const [cue,s] of Object.entries(perCue))
        cues[cue]={contact:s.contact,pause:s.pause,turn:s.turn,beneficial:s.beneficial,harmful:s.harmful,thirds:s.thirds,
          label:s.harmful>s.beneficial?'harmful':(s.beneficial>s.harmful?'beneficial':'tied')};
      return {decisions,joined,joinRate:decisions?joined/decisions:0,cues};
    }};
}
// Per-agent work harvest (null-probe arms read zero probe deltas; the runner
// records probeOps separately and symmetrically on every row).
export function agentWork(learners){
  const out={surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0};
  for(const id of Object.keys(learners)){const w=learners[id].work||{};
    out.surpriseBoosts+=(w.surpriseBoosts??0);out.replaySurpriseBoosts+=(w.replaySurpriseBoosts??0);out.replaySkips+=(w.replaySkips??0);}
  return out;
}
// Inverse normal CDF (Acklam approximation) for d'.
function zInv(p){
  const a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00];
  const b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01];
  const c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00];
  const d=[7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00];
  const pl=0.02425,pu=1-pl;
  let q,x;
  if(p<pl){q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  else if(p<=pu){q=p-0.5;const r=q*q;x=(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);x*=q;}
  else{q=Math.sqrt(-2*Math.log(1-p));const an=((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5];const ad=(((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1;x=-(an/ad);}
  return x;
}
// SDT d' + criterion from probe values vs intake labels (log-linear
// correction; tied labels excluded; null when a class is empty).
export function dPrime(probes){
  let h=0,nh=0,f=0,nf=0;
  for(const p of Object.values(probes)){
    if(p.label==='beneficial'){nh++;if(p.valueMean>=0.5)h++;}
    else if(p.label==='harmful'){nf++;if(p.valueMean>=0.5)f++;}
  }
  if(!nh||!nf)return null;
  const H=(h+0.5)/(nh+1),F=(f+0.5)/(nf+1);
  return {d:+(zInv(H)-zInv(F)).toFixed(4),c:+(-(zInv(H)+zInv(F))/2).toFixed(4)};
}
// Pure scorer (exported for fixtures). rows carry summary + probes.
// G1 join; G0 train behavior gap (INCOMPLETE-UNTRAINED); G-validity
// (train value readout + unlearned d'~0, else INVALID); G-gap on BH
// (late-third behavior vs end-values): ACTOR-SIDE / LEARNER-SIDE /
// INDETERMINATE. HB descriptive.
export function scoreValueProbe(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.train&&byTag.transferred&&byTag.unlearned,'scorer needs train + transferred + unlearned rows');
  const gCounts=['train','transferred','unlearned'].every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=VP_JOIN_MIN&&r.probes));
  const gapOf=r=>{let hT=0,hN=0,bT=0,bN=0;for(const s of Object.values(r.summary.cues)){if(s.label==='harmful'){hT+=s.turn||0;hN+=s.contact;}else if(s.label==='beneficial'){bT+=s.turn||0;bN+=s.contact;}}if(!hN||!bN)return null;return +((hT/hN)-(bT/bN)).toFixed(4);};
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=VP_TRAIN_GAP);
  // Value-correctness per row (probe mean on correct side of intake label).
  const valueCorr=r=>{let ok=0,n=0;for(const [cue,p] of Object.entries(r.probes||{})){if(p.label!=='beneficial'&&p.label!=='harmful')continue;n++;if((p.valueMean>=0.5)===(p.label==='beneficial'))ok++;}return n?ok/n:null;};
  const trainValues=(byTag.train||[]).map(r=>({seed:r.history.seed,v:valueCorr(r)}));
  const meanTrainValue=trainValues.every(t=>t.v!==null)?trainValues.reduce((a,t)=>a+t.v,0)/trainValues.length:null;
  const unD=(byTag.unlearned||[]).map(r=>dPrime(r.probes||{}));
  const meanAbsUnD=unD.every(x=>x!==null)?unD.reduce((a,x)=>a+Math.abs(x.d),0)/unD.length:null;
  const gValid=meanTrainValue!==null&&meanTrainValue>=VP_VALID_TRAIN_VALUE&&meanAbsUnD!==null&&meanAbsUnD<=VP_VALID_UNLEARN_DPRIME;
  // BH split (train-harmful -> test-benign is HB; train-benign ->
  // test-harmful is BH). Late-third contact-weighted behavior.
  const splitOf=(trRow,teRow,dir)=>{
    const trC=trRow.summary.cues;let vOk=0,vN=0,bT=0,bN=0;
    for(const [cue,p] of Object.entries(teRow.probes||{})){
      const trL=trC[cue]?.label;
      if(dir==='BH'&&!(trL==='beneficial'&&p.label==='harmful'))continue;
      if(dir==='HB'&&!(trL==='harmful'&&p.label==='beneficial'))continue;
      if(p.label!=='beneficial'&&p.label!=='harmful')continue;
      vN++;if((p.valueMean>=0.5)===(p.label==='beneficial'))vOk++;
      const th=teRow.summary.cues[cue]?.thirds?.[2];
      if(th&&th.contact){bN+=th.contact;bT+=th.turn;}
    }
    return {value:vN?vOk/vN:null,behavior:bN?1-bT/bN:null};
  };
  // Pairing is positional: bank histories order defines pairs; rows carry
  // seeds so pair mates by seed-order within tag lists.
  const trSeeds=(byTag.train||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
  const teSeeds=(byTag.transferred||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
  const pairOf=i=>({tr:(byTag.train||[]).find(r=>r.history.seed===trSeeds[i]),te:(byTag.transferred||[]).find(r=>r.history.seed===teSeeds[i])});
  const bhSplits=[0,1,2].map(i=>{const {tr,te}=pairOf(i);return splitOf(tr,te,'BH');});
  const hbSplits=[0,1,2].map(i=>{const {tr,te}=pairOf(i);return splitOf(tr,te,'HB');});
  const pool=s=>{const vs=s.filter(x=>x.value!==null).map(x=>x.value),bs=s.filter(x=>x.behavior!==null).map(x=>x.behavior);
    return {value:vs.length?vs.reduce((a,b)=>a+b,0)/vs.length:null,behavior:bs.length?bs.reduce((a,b)=>a+b,0)/bs.length:null};};
  const BH=pool(bhSplits),HB=pool(hbSplits);
  // NOTE: BH correctness here = 1 - turn|harmful (avoidance). HB = 1-turn|benign (cruising).
  const gap=(BH.value!==null&&BH.behavior!==null)?BH.value-BH.behavior:null;
  let verdict,go=false;
  if(!g1)verdict='INVALID';
  else if(!g0)verdict='INCOMPLETE-UNTRAINED';
  else if(!gValid)verdict='INVALID';
  else if(gap===null||BH.value===null)verdict='INVALID';
  else if(BH.value>=VP_ACTOR_VALUE_MIN&&gap>VP_ACTOR_GAP){verdict='VALUE-PROBE-ACTOR-SIDE';go=true;}
  else if(BH.value<=VP_LEARNER_VALUE_MAX)verdict='VALUE-PROBE-LEARNER-SIDE';
  else verdict='VALUE-PROBE-INDETERMINATE';
  return {g1,g0,gValid,trainGaps,trainValues,meanTrainValue,unDPrime:unD,meanAbsUnD,
    bhSplits,hbSplits,BH,HB,gap,go,verdict};
}
export function runValueProbeDev({bankPath,output,resume=false}){
  const sources=valueProbeDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=valueProbeDevBank(bankPathAbs);
  assert.equal(p.histories.length,VP_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...VP_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else write(fixturePath,fixture);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  const t0=Date.now();
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'value-probe-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...VP_ARMS],pairs:VP_PAIRS,
      caps:{executions:300,aggregateScalarOperations:VP_OP_CAP,wallSeconds:VP_WALL_CAP_SECONDS},
      scope:'VALUE-PROBE Phase-A single run (critic-vs-actor localization: V1 reference triple train + uniform-transferred + unlearned x 3 pairs = 9 mains; end-of-seg per-cue value probes exact via context-free phi; per-cue per-third behavior; SDT d-prime/criterion; BH gap primary with validity gate; HB descriptive).'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=VP_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const checkMainIntegrity=(endpoint,label)=>{
    assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
    assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
  };
  // Probe every observed cue on every agent; store per-cue mean/sd.
  // Probe ops measured from learner work-counter deltas (billed exactly
  // like live predictions), added to the ledger symmetrically all arms.
  const probeRow=(run,summary)=>{
    const cues=Object.keys(summary.cues);
    assert.ok(cues.length>0&&cues.length<=24,'unexpected cue count for probing: '+cues.length);
    const perCue={};let ops=0;
    for(const cue of cues){
      const arr=cue.split(',').map(Number);
      const vals=[];
      for(const id of Object.keys(run.learners)){
        const before=run.learners[id].work.scalarOperations;
        const v=probeCueValues(run.learners[id],[arr])[0];
        ops+=run.learners[id].work.scalarOperations-before;
        vals.push(v);
      }
      const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
      const sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/vals.length);
      perCue[cue]={valueMean:+mean.toFixed(6),valueSd:+sd.toFixed(6),nAgents:vals.length,label:summary.cues[cue].label};
    }
    assert.ok(ops<BT_PROBE_OP_CAP,'per-row probe budget sanity');
    assert.ok(cues.length<=VP_PROBE_CAP/24,'per-row probe count sanity');
    return {perCue,ops};
  };
  const runOne=(tag,history,options)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectValueProbe();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...(options??BT_LEARNER_OPTIONS)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      const {perCue,ops}=probeRow(run,summary);
      row={history:{seed:history.seed},tag,endpoint,summary,probes:perCue,probeOps:ops,
        weights:snapshotWeights(run.learners),manipulation:agentWork(run.learners)};
      note(1,0,BT_TICKS,endpoint.scalarOperations+ops);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall:0,cpuS:0};
  };
  const pairWall={};
  for(let pi=0;pi<VP_PAIRS.length;pi++){
    const [hiTr,hiTe]=VP_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0;
    const t0r=runOne('train',hTr);
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    {
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag==='transferred'&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag:'transferred',seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:transferred`);
        const collector=collectValueProbe();
        const {wall:w2}=timed(`transferred/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const cp=copyWeights(trainRow.weights,run.learners);
          const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
          assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
          const row={history:{seed:hTe.seed},tag:'transferred',endpoint:null,summary:null,probes:null,
            transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
              sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`transferred/${hTe.seed}`);
          row.summary=collector.summarize();
          const {perCue,ops}=probeRow(run,row.summary);
          row.probes=perCue;row.probeOps=ops;
          row.weights=snapshotWeights(run.learners);
          row.manipulation=agentWork(run.learners);
          note(1,0,BT_TICKS,row.endpoint.scalarOperations+ops);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        void w2;
      }
    }
    const uRes=runOne('unlearned',hTe);void uRes;
    pairWall[`pair${pi}`]={};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(valueProbeDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=VP_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreValueProbe(rows);
  assert.equal(ledger.mains,VP_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,VP_EXPECT_PROBES,'Dev probes count mismatch');
  const manipulation={};
  for(const tag of VP_ARMS){const m={surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0};
    for(const r of rows.filter(x=>x.tag===tag)){const w=r.manipulation||{};
      m.surpriseBoosts+=(w.surpriseBoosts??0);m.replaySurpriseBoosts+=(w.replaySurpriseBoosts??0);m.replaySkips+=(w.replaySkips??0);}
    manipulation[tag]=m;}
  const nullClean=VP_ARMS.every(t=>(manipulation[t].surpriseBoosts??0)===0&&(manipulation[t].replaySurpriseBoosts??0)===0);
  let verdict=decision;
  if(!nullClean)verdict={...decision,go:false,verdict:'INVALID',nullHygieneViolated:true};
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,manipulation,nullClean,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,manipulation,nullClean};
}
