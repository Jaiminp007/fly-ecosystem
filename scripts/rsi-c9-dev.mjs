// RSI C3 dev instrument (FROZEN under docs/RSI_C9_PLAN_V1.md).
// Seg-chain successive execution on a fresh bank (463001-463054): per chain
// (H0/H1/H2) looper/static/copier x (train/T1/T2) + unlearned (H2) = 10 runs;
// 2 chains = 20 mains, ZERO probes. Fresh learners every run (zero weights);
// only OPERATOR configs carry over (majority vote of per-agent sandbox
// adoptions; ties -> lowest menu index; all-reject -> baseline). No weight
// transplant in this line (operator effect isolated). Proposal ticks {1024}
// (train: menu 3 = skip 0.05; T1: menu 4 = skip 0.1; T2: no fire); lifetime
// structurally 1 per run. Flip-split imported frozen from V1m (no dup).
// G1 join+integrity; G0 looper-train >=0.5; G2a-PRIMARY successive
// (looperT1-staticT1 >= +0.1 AND looperT2-staticT2 >= +0.1 AND looperT2 >=
// looperT1); G2b looper-copier > 0 pooled; G2c unlearned flat; G2d same
// floor. Verdict C9-GO/C9-NOGO/C9-INVALID/C9-INCOMPLETE-UNTRAINED.
// GO-C2 licenses the RSI claim (>=2 successive live accepts + productivity).
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {collectTurnChoice} from './turn-gated-dev.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS,BT_OUTPUT_BYTES} from './body-transfer.mjs';
import {scoreFlipSplitV1m,snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {OL_MENU} from '../learning/rsi-operator-loop.mjs';

export const C9_EXPERIMENT='rsi-c9-dev-v1';
export const C9_HISTORIES=6;
export const C9_CHAINS=Object.freeze([[0,1,2],[3,4,5]]);
export const C9_CHOICE=Object.freeze([1,4,6]); // C8: per-agent choice (gain 1.0, skip 0.1, surprise); asserted in fixtures
export const C9_TAGS=Object.freeze(['looper-train','looper-T1','looper-T2','static-train','static-T1','static-T2','copier-train','copier-T1','copier-T2','unlearned']);
export const C9_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>463001+j));
const C9_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[451001,451054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[463001,463054]];
export const C9_SPENT_SEEDS=Object.freeze([381001,...C9_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const C9_EXPECT_MAINS=20, C9_EXPECT_PROBES=0;
export const C9_OP_CAP=4_000_000_000, C9_WALL_CAP_SECONDS=10800;
export const C9_JOIN_MIN=0.99, C9_TRAIN_GAP=0.5, C9_LIFT=0.1, C9_FLAT_TOL=0.1;
export const C9_SAME_FLOOR=0.5;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rsiC9ExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-c9-dev.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-energy.mjs','learning/taste-experiment.mjs','learning/rsi-operator-loop.mjs','docs/RSI_C9_PLAN_V1.md','docs/RSI_C1_PLAN_V1.md','docs/RSI_C2_SKETCH_V1.md','tests/rsi-c3-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rsiC9DevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-c9-dev.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/rsi-operator-loop.mjs',
    'tests/rsi-c3-dev.test.mjs','docs/RSI_C9_PLAN_V1.md','docs/RSI_C1_PLAN_V1.md','docs/RSI_C2_SKETCH_V1.md'])visit(resolve(root,name));
  return found;
}
export function rsiC9DevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,C9_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rsiC9ExtraTokens())excluded.add(t);
  for(const s of C9_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of C9_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=C9_FIXTURE_SEEDS.length/C9_HISTORIES===9?Array.from({length:C9_HISTORIES},(_,h)=>{
    const s=C9_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,C9_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:C9_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI-C3 dev bank (deterministic fresh 463001-463054, 9/history, 6 histories). probeSeeds present but UNUSED (fresh runs each; operator config carries over). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function priorEvidenceSeeds(){
  const into=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)into.add(v);};
  const walk=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walk(p);else if(p.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walk(join(root,'evidence'));return into;
}
// Majority vote over per-agent adopted menu indices (ties -> lowest index;
// all-reject/empty -> null = baseline). Cultivated adoption from individual
// sandbox evaluations (documented; VOTE_TALLY precedent).
export function majorityIndex(votes){
  const counts={};
  for(const v of votes){if(v.adopted)counts[v.menuIndex]=(counts[v.menuIndex]||0)+1;}
  const ids=Object.keys(counts).map(Number);
  if(ids.length===0)return null;
  let best=ids[0];
  for(const id of ids)if(counts[id]>counts[best]||(counts[id]===counts[best]&&id<best))best=id;
  return best;
}
export function majorityOperator(votes){
  const counts={};
  for(const v of votes){if(v.adopted)counts[v.menuIndex]=(counts[v.menuIndex]||0)+1;}
  const ids=Object.keys(counts).map(Number);
  if(ids.length===0)return null;
  let best=ids[0];
  for(const id of ids)if(counts[id]>counts[best]||(counts[id]===counts[best]&&id<best))best=id;
  return structuredClone(OL_MENU[best]);
}
// Verbatim V1m aggregate-gap primitive (V1m-local, not exported; replicated, not redefined).
function pooledTurnGap(cues,labelOf,filter){
  let hT=0,hN=0,bT=0,bN=0;
  for(const cue of Object.keys(cues)){
    if(filter&&!filter(cue))continue;
    const s=cues[cue],L=labelOf(cue);
    if(L==='harmful'){hT+=s.turn||0;hN+=s.contact;}
    else if(L==='beneficial'){bT+=s.turn||0;bN+=s.contact;}
  }
  if(!hN||!bN)return null;
  return {h:hT/hN,b:bT/bN};
}
const gapOfStats=g=>g===null?null:+(g.h-g.b).toFixed(4);
export function scoreRsiC9(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag['looper-train']&&byTag['looper-T1']&&byTag['looper-T2']&&byTag['static-T1']&&byTag['static-T2']&&byTag['copier-T1']&&byTag['copier-T2']&&byTag.unlearned,
    'scorer needs looper/static/copier trains+transfers + unlearned rows');
  const need=['looper-train','looper-T1','looper-T2','static-train','static-T1','static-T2','copier-train','copier-T1','copier-T2'];
  const gCounts=need.every(t=>(byTag[t]||[]).length===2)&&(byTag.unlearned||[]).length===2;
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=C9_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag['looper-train']||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===2&&trainGaps.every(g=>g.gap!==null&&g.gap>=C9_TRAIN_GAP);
  const g2c=unlearnGaps.length===2&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=C9_FLAT_TOL);
  assert.ok(Array.isArray(pairs)&&pairs.length>0&&pairs.every(p=>p.length===3),'scorer needs history triples [Htr,Ht1,Ht2] per chain');
  const hb=(tag,trTag,which)=>((pairs||[]).map(([hTr,hT1,hT2])=>{
    const trSeed=hTr,teSeed=which==='T1'?hT1:hT2;
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag===trTag);
    const te=rows.find(r=>r.history.seed===teSeed&&r.tag===tag);
    if(!tr||!te)return null;
    const fl=scoreFlipSplitV1m(tr,te);
    if(fl.flippedHB.correctness===null||fl.flippedBH.correctness===null||fl.same.correctness===null)return null;
    return {hb:fl.flippedHB.correctness,bh:fl.flippedBH.correctness,same:fl.same.correctness};
  }));
  const L1=hb('looper-T1','looper-train','T1'),L2=hb('looper-T2','looper-train','T2');
  const S1=hb('static-T1','static-train','T1'),S2=hb('static-T2','static-train','T2');
  const C1=hb('copier-T1','copier-train','T1'),C2=hb('copier-T2','copier-train','T2');
  const mean=xs=>xs.length>0&&xs.every(x=>x!==null)?+(xs.reduce((a,c)=>a+c,0)/xs.length).toFixed(4):null;
  const mL1=mean(L1.map(x=>x&&x.hb)),mL2=mean(L2.map(x=>x&&x.hb));
  const mS1=mean(S1.map(x=>x&&x.hb)),mS2=mean(S2.map(x=>x&&x.hb));
  const mC=mean([...C1,...C2].filter(x=>x!==null).map(x=>x.hb));
  const mL=mean([...L1,...L2].filter(x=>x!==null).map(x=>x.hb));
  const sameL=mean([...L1,...L2].filter(x=>x!==null).map(x=>x.same));
  const g2a=mL1!==null&&mS1!==null&&mL2!==null&&mS2!==null&&mL1-mS1>=C9_LIFT&&mL2-mS2>=C9_LIFT&&mL2>=mL1;
  const g2b=mL!==null&&mC!==null&&mL-mC>0;
  const g2d=sameL!==null&&sameL>=C9_SAME_FLOOR;
  const go=g1&&g0&&g2a&&g2b&&g2c&&g2d;
  const verdict=!g1?'C9-INVALID':!g0?'C9-INCOMPLETE-UNTRAINED':go?'C9-GO':'C9-NOGO';
  return {g1,g0,g2a,g2b,g2c,g2d,mL1,mS1,mL2,mS2,mC,mL,sameL,
    lift1:mL1!==null&&mS1!==null?+(mL1-mS1).toFixed(4):null,
    lift2:mL2!==null&&mS2!==null?+(mL2-mS2).toFixed(4):null,
    looperMinusCopied:mL!==null&&mC!==null?+(mL-mC).toFixed(4):null,verdict};
}
export function runRsiC9Dev({bankPath,output,resume=false}={}){
  const sources=rsiC9DevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rsiC9DevBank(bankPathAbs);
  assert.equal(p.histories.length,C9_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...C9_FIXTURE_SEEDS]};
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
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)));}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-c3-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      tags:[...C9_TAGS],chains:C9_CHAINS,menuChoice:[...C9_CHOICE],
      caps:{mains:C9_EXPECT_MAINS,probes:C9_EXPECT_PROBES,aggregateScalarOperations:C9_OP_CAP,wallSeconds:C9_WALL_CAP_SECONDS},
      scope:'RSI-C2 single run (internal-loop successive execution). 2 chains x 10 runs; operators carry over by majority vote.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=C9_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  // C8: construction is ALWAYS baseline (dose-matched). The vote directs the copier's
  // mid-run blind adoption only (copierMenuIndex); the looper re-chooses each link.
  const collectVotes=learners=>{
    const votes=[];
    for(const id of Object.keys(learners)){
      const log=learners[id].rsiLoop;
      if(!log)continue;
      for(const e of log.proposals)votes.push({menuIndex:OL_MENU.findIndex(m=>m.kind===e.operator.kind&&JSON.stringify(m)===JSON.stringify(e.operator)),adopted:e.adopted});
    }
    return votes;
  };
  const runOne=(tag,history,learnerOptions,menuIndex,transplant=null)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const run=new TasteExperiment({history,arm:tag.startsWith('looper')?'looper':tag.startsWith('copier')?'copier':tag==='unlearned'?'unlearned':'candidate',learnerOptions:{...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      if(tag.startsWith('looper')){run.looperMenuIndices=[...C9_CHOICE];run.looperFlipEval=true;} // C9: flip-eval choice each link
      if(tag.startsWith('copier'))run.copierMenuIndex=menuIndex; // voted index (or null/undefined = no fire)
      let transfer=null;
      if(transplant){
        for(const id of Object.keys(transplant.weights))assertFreshTarget(run.learners[id],id);
        copyWeights(transplant.weights,run.learners);
        checkTransplantIntegrity(`${tag}/${history.seed}`,run.learners,transplant.weights);
        const applied=digestWeights(snapshotWeights(run.learners));
        assert.equal(applied,transplant.digest,`${tag}/${history.seed} transplant digest mismatch`);
        transfer={transplanted:true,total:Object.keys(transplant.weights).length,sourceDigest:transplant.digest,appliedDigest:applied};
      }
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      const votes=tag.startsWith('looper')?collectVotes(run.learners):[];
      const snap=snapshotWeights(run.learners);
      row={history:{seed:history.seed},tag,endpoint,summary,votes,weights:snap,digest:digestWeights(snap),transfer};
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const chainWall={};
  for(let ci=0;ci<C9_CHAINS.length;ci++){
    const [hiTr,hiT1,hiT2]=C9_CHAINS[ci];
    const hTr=p.histories[hiTr],hT1=p.histories[hiT1],hT2=p.histories[hiT2];
    let wall=0,cpuS=0;
    const step=(tag,h,opts,mi,txp=null)=>{const r=runOne(tag,h,opts,mi,txp);wall+=r.wall;cpuS+=r.cpuS;return r.row;};
    // 1. trains (looper chooses @1024 among C9_CHOICE; static/copier baseline, no fire).
    step('looper-train',hTr,BT_LEARNER_OPTIONS,undefined);
    step('static-train',hTr,BT_LEARNER_OPTIONS,undefined);
    step('copier-train',hTr,BT_LEARNER_OPTIONS,undefined);
    const tRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='looper-train');
    const op1=majorityOperator(tRow?tRow.votes:[]);
    const idx1=tRow?majorityIndex(tRow.votes):null;
    // 2. T1 transfers (SAME-ARM exact transplant; looper re-chooses @1024; copier blind-applies idx1 @1024).
    const trL=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='looper-train');
    const trS=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='static-train');
    const trC=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='copier-train');
    const tx=h=>({weights:h.weights,digest:h.digest});
    step('looper-T1',hT1,BT_LEARNER_OPTIONS,undefined,tx(trL));
    step('static-T1',hT1,BT_LEARNER_OPTIONS,undefined,tx(trS));
    step('copier-T1',hT1,BT_LEARNER_OPTIONS,idx1,tx(trC));
    const t1Row=rows.find(r=>r.history.seed===hT1.seed&&r.tag==='looper-T1');
    const op2=majorityOperator(t1Row?t1Row.votes:[]);
    const idx2=t1Row?majorityIndex(t1Row.votes):null;
    // 3. T2 transfers (SAME-ARM exact transplant of T1; looper re-chooses @1024; copier blind-applies idx2 @1024).
    const t1L=rows.find(r=>r.history.seed===hT1.seed&&r.tag==='looper-T1');
    const t1S=rows.find(r=>r.history.seed===hT1.seed&&r.tag==='static-T1');
    const t1C=rows.find(r=>r.history.seed===hT1.seed&&r.tag==='copier-T1');
    step('looper-T2',hT2,BT_LEARNER_OPTIONS,undefined,tx(t1L));
    step('static-T2',hT2,BT_LEARNER_OPTIONS,undefined,tx(t1S));
    step('copier-T2',hT2,BT_LEARNER_OPTIONS,idx2,tx(t1C));
    step('unlearned',hT2,BT_LEARNER_OPTIONS,undefined);
    chainWall[`chain${ci}`]={wall,cpuS,op1:op1?op1.kind:null,op2:op2?op2.kind:null};
  }
  runtimes.chains=chainWall;checkpointLedger();
  assert.deepEqual(rsiC9DevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=C9_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedTriples=C9_CHAINS.map(([a,b,c])=>[p.histories[a].seed,p.histories[b].seed,p.histories[c].seed]);
  const decision=scoreRsiC9(rows,seedTriples);
  assert.equal(ledger.mains,C9_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,C9_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label} physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label} main op cap breached`);
}
