// RSI C17 dev runner: non-oracle input reassignment (PLAN V1 + A1 FROZEN).
// Per pair: train (H_tr, transplant source) + transferred-exact (H_te,
// wound baseline) + transferred-indexed (H_te, min-turn surrogate on own
// beneficial evidence) + transferred-shuffled (H_te, seeded-random
// surrogate, dose-matched) + unlearned (H_te, validity). 15 mains max.
// probeOps billed inline (executed-only, live per-op rate). Attempt-01.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync,readdirSync} from 'node:fs';
import {join,dirname as pathDirname,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {tasteEnergyFeatures} from '../learning/taste-energy.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {collectTurnChoice} from './turn-gated-dev.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';
import {snapshotWeights,copyWeights,checkTransplantIntegrity,digestWeights,
  assertFreshTarget,scoreFlipSplitV1m} from './turn-gated-dev-v1m.mjs';
export {snapshotWeights,copyWeights,checkTransplantIntegrity,digestWeights,
  assertFreshTarget,scoreFlipSplitV1m};

export const C17_EXPERIMENT='rsi-c17-dev';
export const C17_HISTORIES=6;
export const C17_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const C17_TAGS=Object.freeze(['train','transferred-exact','transferred-indexed','transferred-shuffled','unlearned']);
export const C17_K=16, C17_S=32, C17_EV=2;
export const C17_BANK_START=472001;
export const C17_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>C17_BANK_START+j));
const C17_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054]];
export const C17_SPENT_SEEDS=Object.freeze([381001,...C17_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+b*0+j))]);
export const C17_EXPECT_MAINS=15, C17_EXPECT_PROBES=0;
export const C17_G1_LIFT=0.1, C17_G2_TOL=0.07, C17_G3_NULL=0.03, C17_BH_FLOOR=0.7;
export const C17_OP_CAP=5_000_000_000, C17_WALL_CAP_SECONDS=10800;
export const C17_JOIN_MIN=0.99, C17_TRAIN_GAP=0.5, C17_FLAT_TOL=0.1;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');
const PATTERNS=Array.from({length:16},(_,i)=>[0,1,2,3].map(j=>(i>>j&1)?1:-1));
export const C17_SURROGATE_BANK=Object.freeze(PATTERNS.map(p=>Object.freeze([...p])));
const str=v=>v.join(',');
export function argminIndex(means){let bi=0;for(let i=1;i<means.length;i++)if(means[i]<means[bi])bi=i;return bi;}
export function makeSeededRand(seed){let s=(seed>>>0)||1;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

function turnGateC17ExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-c17-dev.mjs','docs/RSI_C17_PLAN_V1.md','docs/RSI_C17_AMENDMENT_A1.md','docs/RSI_C17_SCOPING_V1.md','scripts/turn-gated-dev-v1m.mjs','docs/TURN_GATE_PLAN_V1M.md','tests/rsi-c17-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDevC17Sources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-c17-dev.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/cue-foraging.mjs','learning/continual-regimes.mjs','tests/rsi-c17-dev.test.mjs','docs/RSI_C17_PLAN_V1.md','docs/RSI_C17_AMENDMENT_A1.md','docs/RSI_C17_SCOPING_V1.md'])visit(resolve(root,name));
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
export function turnGateDevC17Bank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,C17_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateC17ExtraTokens())excluded.add(t);
  for(const s of C17_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of C17_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=C17_FIXTURE_SEEDS.length/C17_HISTORIES===9?Array.from({length:C17_HISTORIES},(_,h)=>{
    const s=C17_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,C17_HISTORIES*9,'C17 bank draws must be 54 unique seeds');
  const p={schema:1,experiment:C17_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI C17 single attempt-01 (non-oracle input reassignment): 15 mains max (3px5). First use spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  writeOver(path,p);return p;
}

// ---- Intervention driver (plan §3 + A1) ----
const FAMS=Object.freeze(['A','B','C']);
export function cueIdMaps(transferCodebook,trainCodebook){
  const valOf=(cb,fam,id)=>{const c=(cb[fam]||[]).find(c=>c.id===id);return c?c.valence:null;};
  const ids=new Set();for(const f of FAMS)for(const c of (transferCodebook[f]||[]))ids.add(c.id);
  const info={};
  for(const id of ids){
    const trV={},tnV={};for(const f of FAMS){trV[f]=valOf(transferCodebook,f,id);tnV[f]=valOf(trainCodebook,f,id);}
    info[id]={transfer:trV,train:tnV,eligible:fam=>trV[fam]===1&&FAMS.every(f=>tnV[f]===-1||tnV[f]===null)};
  }
  return info;
}
export function makeInterventionDriver({mode,legSeed,transferCodebook,trainCodebook}){
  assert.ok(mode==='indexed'||mode==='shuffled');
  const maps=cueIdMaps(transferCodebook,trainCodebook);
  const nextRand=makeSeededRand(legSeed);
  const st={intakes:{},fired:0,reassignments:[],ownBuf:[],probeOps:0,pending:new Map()};
  const key=(tick,agentId)=>`${tick}:${agentId}`;
  const famNow=phaseId=>phaseId==='return-A'?'A':phaseId;
  function patchCueId(run,agentId){
    const fly=(run.world.flies||[]).find(f=>f.id===agentId);
    if(!fly)return null;
    let best=null,bestD=225;
    for(const p of run.world.food){
      const dx=p.x-fly.x,dy=p.y-fly.y,sq=dx*dx+dy*dy;
      if(sq<=225&&sq<bestD){bestD=sq;best=p.cueId;}
    }
    return best;
  }
  function probeTurnBit(snapW,probeCtx,sample,vec){
    // Minimal probe state: config + trigger-time weights + balance + fresh
    // work counter. No compact/restore: the feedforward path
    // (tasteEnergyFeatures + actor head) never reads cycle bookkeeping
    // (ticks/credit/awaiting/hold/motorPending), so cycle-transient live
    // state cannot contaminate or invalidate the probe. Billed honestly
    // (features via the real path + mirrored head at live per-op rate).
    // Deterministic. Excludes motorPending/hold timing by construction.
    const cs={config:probeCtx.config,weights:{taste:[...snapW.taste],actor:[...snapW.actor]},
      priorLogit:probeCtx.priorLogit,tasteScale:probeCtx.tasteScale,balance:probeCtx.balance,
      work:{scalarOperations:0}};
    cs.work.scalarOperations=0;
    const {motor}=tasteEnergyFeatures(cs,sample.raw,vec,sample.contactPresent,sample.odorPresent);
    let ops=cs.work.scalarOperations;
    const wA=cs.weights.actor;
    let acc=0;
    for(let j=0;j<wA.length&&j<motor.length;j++){ops+=2;acc+=wA[j]*motor[j];}
    ops+=1;acc+=cs.priorLogit;
    ops+=4;const base=1/(1+Math.exp(0-acc));
    ops+=1;const scaled=0.9*base;
    ops+=1;const prob=0.05+scaled;
    return {bit:prob>0.5?1:0,ops};
  }
  function fire(runRef,id){
    const run=runRef.current;
    const phaseId=CONTINUAL_PHASES[run.phaseIndex].id;
    if(!maps[id]||!maps[id].eligible(famNow(phaseId)))return null;
    const sample=st.ownBuf.slice(-C17_S);
    if(sample.length<C17_S)return null;
    const firstId=Object.keys(run.learners)[0];
    const snapW=snapshotWeights({[firstId]:run.learners[firstId]})[firstId];
    const lv=run.learners[firstId];
    const probeCtx={config:lv.config,priorLogit:lv.priorLogit,tasteScale:lv.tasteScale,balance:lv.balance};
    const scored=C17_SURROGATE_BANK.map(vec=>{
      let t=0,ops=0;
      for(const s of sample){const r=probeTurnBit(snapW,probeCtx,s,vec);t+=r.bit;ops+=r.ops;}
      return {vec,mean:t/sample.length,ops};
    });
    let target;
    if(mode==='indexed'){
      const bi=argminIndex(scored.map(s=>s.mean));
      target={index:bi,vec:scored[bi].vec};
    }else{
      const bi=Math.floor(nextRand()*scored.length);
      target={index:bi,vec:scored[bi].vec};
    }
    const opsSum=scored.reduce((s,r)=>s+r.ops,0);
    st.probeOps+=opsSum;
    const liveBits={};for(const f of FAMS)for(const c of (run.codebook[f]||[]))liveBits[str(c.bits)]=true;
    const firstPatch=(run.world.food||[]).find(p=>p.cueId===id);
    assert.ok(firstPatch,'no patch carries cue id '+id);
    const orig=[...firstPatch.cue];
    const coincide=!!liveBits[str(target.vec)]&&str(target.vec)!==str(orig);
    for(const p of run.world.food)if(p.cueId===id)p.cue=[...target.vec];
    st.fired++;
    const rec={cueId:id,phase:phaseId,tick:run.world.tick,mode,targetIndex:target.index,
      means:scored.map(s=>+s.mean.toFixed(6)),target:[...target.vec],orig,origSha:digest(JSON.stringify(orig)),coincide,
      probeOps:opsSum,preIntakes:st.intakes[id]||0,agentId:firstId,reverted:false};
    st.reassignments.push(rec);
    return rec;
  }
  function observe(e,runRef){
    const run=runRef.current;
    if(!run)return;
    if(e.type==='decision'&&e.own){
      st.ownBuf.push({raw:[...e.own.raw],contactPresent:!!e.own.contactPresent,odorPresent:!!e.own.odorPresent});
      if(st.ownBuf.length>64)st.ownBuf.shift();
      const id=patchCueId(run,e.own.agentId);
      if(id!==null)st.pending.set(key(e.own.tick,e.own.agentId),id);
      return;
    }
    if(e.type==='physical'&&e.agentId!==undefined&&e.tick!==undefined){
      const b=Number(e.beneficialEaten)||0;
      const id=st.pending.get(key(e.tick,e.agentId));
      st.pending.delete(key(e.tick,e.agentId));
      if(b>0&&id!==undefined&&id!==null){
        st.intakes[id]=(st.intakes[id]||0)+b;
        if(st.intakes[id]>=C17_EV&&!st.reassignments.some(r=>r.cueId===id&&!r.reverted))fire(runRef,id);
      }
    }
  }
  function closeOut(run){
    for(const r of st.reassignments){
      const post=st.intakes[r.cueId]||0;
      r.postIntakes=post;
      if(post>r.preIntakes){r.reverted=false;continue;}
      for(const p of run.world.food)if(p.cueId===r.cueId)p.cue=[...r.orig];
      const check=(run.world.food.find(p=>p.cueId===r.cueId)||{}).cue||null;
      assert.ok(check&&digest(JSON.stringify([...check]))===r.origSha,'revert digest mismatch');
      r.reverted=true;st.probeOps+=run.world.food.filter(p=>p.cueId===r.cueId).length;
    }
    return st;
  }
  return {state:st,observe,fire,closeOut,maps};
}

// ---- Scorer (plan §7) ----
function pooledTurnGap(cues,labelOf,filter){
  let hT=0,hN=0,bT=0,bN=0;
  for(const k of Object.keys(cues||{})){
    const c=cues[k];if(filter&&!filter(k,c))continue;
    if(c.contact===0)continue;
    const t=c.turn/Math.max(1,c.contact);
    if(labelOf(k,c)==='harmful'){hT+=t;hN++;}else if(labelOf(k,c)==='beneficial'){bT+=t;bN++;}
  }
  if(!hN||!bN)return null;
  return {h:hT/hN,b:bT/bN};
}
const gapOfStats=g=>g===null?null:+(g.h-g.b).toFixed(4);
function scoreRsiC17Rows(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  const need=['train','transferred-exact','transferred-indexed','transferred-shuffled','unlearned'];
  const gCounts=need.every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=C17_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=C17_TRAIN_GAP);
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=C17_FLAT_TOL);
  const flips=(pairs||[]).map(([trSeed,teSeed])=>{
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag==='train');
    const arms={};
    for(const tag of ['transferred-exact','transferred-indexed','transferred-shuffled']){
      const row=rows.find(r=>r.history.seed===teSeed&&r.tag===tag);
      if(!tr||!row)return null;
      const fl=scoreFlipSplitV1m(tr,row);
      if(fl.flippedHB.correctness===null||fl.flippedBH.correctness===null||fl.same.correctness===null)return null;
      arms[tag]={hb:fl.flippedHB.correctness,bh:fl.flippedBH.correctness,same:fl.same.correctness};
    }
    return {trSeed,teSeed,arms};
  });
  const okFlips=flips.length===3&&flips.every(x=>x!==null);
  const pool=(tag,k)=>{const v=flips.filter(x=>x!==null).map(x=>x.arms[tag][k]);return v.length===3?+(v.reduce((s,x)=>s+x,0)/3).toFixed(4):null;};
  const hbExact=pool('transferred-exact','hb'),hbIndexed=pool('transferred-indexed','hb'),hbShuffled=pool('transferred-shuffled','hb');
  const bhExact=pool('transferred-exact','bh'),bhIndexed=pool('transferred-indexed','bh');
  const fired=rows.filter(r=>(r.intervention||{}).fired>0).length;
  const g0app=fired>=1;
  const g1dir=hbIndexed!==null&&hbExact!==null&&(hbIndexed-hbExact)>C17_G1_LIFT;
  const g2exc=bhIndexed!==null&&bhExact!==null&&Math.abs(bhIndexed-bhExact)<=C17_G2_TOL;
  const g3ctl=hbShuffled!==null&&hbExact!==null&&(hbShuffled-hbExact)<=C17_G3_NULL;
  const gBhFloor=bhIndexed!==null&&bhIndexed>=C17_BH_FLOOR;
  const doseOk=rows.filter(r=>r.tag==='transferred-indexed'||r.tag==='transferred-shuffled')
    .every(r=>r.intervention&&r.intervention.K===C17_K&&r.intervention.S===C17_S&&r.intervention.EV===C17_EV);
  const valid=g1&&g0&&g2b;
  const measurable=okFlips&&hbExact!==null&&hbIndexed!==null&&hbShuffled!==null&&bhExact!==null&&bhIndexed!==null;
  let verdict;
  if(!valid)verdict='INVALID';
  else if(!measurable||!g0app)verdict='INCOMPLETE';
  else if(!doseOk)verdict='INVALID';
  else if(!g3ctl)verdict='INVALID';
  else if(!g2exc||!gBhFloor)verdict='C17-NOGO';
  else if(!g1dir)verdict='C17-NOGO';
  else verdict='C17-GO';
  return {g1,g0,g2b,gCounts,okFlips,fired,g0app,hbExact,hbIndexed,hbShuffled,bhExact,bhIndexed,
    g1dir,g2exc,g3ctl,gBhFloor,doseOk,valid,measurable,flips,verdict,
    go:verdict==='C17-GO'};
}
export {scoreRsiC17Rows as scoreRsiC17};

// ---- Runner ----
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
export function runRsiC17Dev({bankPath,output,resume=false}){
  const sources=turnGateDevC17Sources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDevC17Bank(bankPathAbs);
  assert.equal(p.histories.length,C17_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...C17_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else writeOver(fixturePath,fixture);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  const t0=Date.now();
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    writeOver(join(outputAbs,'protocol.json'),p);
    writeOver(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-c17-dev-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:['train',...C17_TAGS.slice(1)],pairs:C17_PAIRS,
      intervention:{mode:'non-oracle-cue-reassignment',K:C17_K,S:C17_S,EV:C17_EV},
      caps:{executions:300,aggregateScalarOperations:C17_OP_CAP,wallSeconds:C17_WALL_CAP_SECONDS},
      scope:'RSI C17 single attempt-01 (PLAN V1 + A1). Per pair train + exact + indexed + shuffled + unlearned; continuous-trigger reassignment with retain-or-revert; G0/G1/G2/G3 TRUE gates decide.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=C17_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runOne=(tag,history)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};}
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary};
      if(tag==='train')row.weights=snapshotWeights(run.learners);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const runTransfer=(tag,hTe,trainRow,mode)=>{
    const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));return {wall:0,cpuS:0};}
    if(resume)redone.push(`${hTe.seed}:${tag}`);
    const collector=collectTurnChoice();
    const {wall:w2,cpuS:c2}=timed(`${tag}/${hTe.seed}`,()=>{
      const transferCodebook=makeCueCodebook(hTe.cueSeed);
      const trainCodebook=makeCueCodebook(trainRow.historySeed);
      const driver=mode?makeInterventionDriver({mode,legSeed:hTe.seed,transferCodebook,trainCodebook}):null;
      const runRef={current:null};
      const emit=e=>{collector.emit(e);if(driver)driver.observe(e,runRef);};
      const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit});
      runRef.current=run;
      for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
      const cp=copyWeights(trainRow.weights,run.learners);
      const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
      assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
      const row={history:{seed:hTe.seed},tag,endpoint:null,summary:null,
        transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
          sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
      assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'transplant digest mismatch');
      run.advance(BT_TICKS);
      row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`${tag}/${hTe.seed}`);
      row.summary=collector.summarize();
      let probeOps=0,intervention=null;
      if(driver){
        const dst=driver.closeOut(run);
        probeOps=dst.probeOps;
        intervention={mode,K:C17_K,S:C17_S,EV:C17_EV,fired:dst.fired,
          reassignments:dst.reassignments.map(r=>({...r})),probeOps};
        row.intervention=intervention;
      }
      note(1,0,BT_TICKS,row.endpoint.scalarOperations+probeOps);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${hTe.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',arm:tag,seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {wall:w2,cpuS:c2};
  };
  const pairWall={};
  for(let pi=0;pi<C17_PAIRS.length;pi++){
    const [hiTr,hiTe]=C17_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    trainRow.historySeed=hTr.cueSeed;
    const e1=runTransfer('transferred-exact',hTe,trainRow,null);wall+=e1.wall;cpuS+=e1.cpuS;
    const e2=runTransfer('transferred-indexed',hTe,trainRow,'indexed');wall+=e2.wall;cpuS+=e2.cpuS;
    const e3=runTransfer('transferred-shuffled',hTe,trainRow,'shuffled');wall+=e3.wall;cpuS+=e3.cpuS;
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDevC17Sources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=C17_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedPairs=C17_PAIRS.map(([hiTr,hiTe])=>[p.histories[hiTr].seed,p.histories[hiTe].seed]);
  const decision=scoreRsiC17Rows(rows,seedPairs);
  assert.equal(ledger.mains,C17_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,C17_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...decision};
}
