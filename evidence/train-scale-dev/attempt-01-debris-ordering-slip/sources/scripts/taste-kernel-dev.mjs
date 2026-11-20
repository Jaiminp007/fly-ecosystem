// Track-T1 dev instrument (FROZEN under docs/TASTE_KERNEL_PLAN_V1.md).
// Kernel-taste vs linear-taste on fresh matched histories (452001-452054):
// 6 histories x {candidate, tasteKernel} = 12 mains, ZERO probes.
// probeSeeds are present in the bank schema (V1k-family 9-seed shape) but
// UNUSED (no transfer pairs in this line; documented in place).
// G1 join+integrity; G0 baseline correctness >=0.5; G2a-PRIMARY pooled
// kernel - pooled baseline >= +0.1; G2b no-collapse (kernel survival >=50%
// AND kernel pause <= baseline+0.2). Verdict TK-GO/TK-NOGO/
// TK-INCOMPLETE-BASELINE/TK-INVALID. Asymmetry disclosed: kernel runs
// online-only (no replay; no kernel analogue specified) vs baseline
// linear+replay (4 passes). A GO wins without replay's help; a NOGO is
// caveated (may be replay's contribution, not the predictor).
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

export const TK_EXPERIMENT='taste-kernel-dev-v1';
export const TK_HISTORIES=6;
export const TK_ARMS=Object.freeze(['candidate','tasteKernel']);
export const TK_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>452001+j));
const TK_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[451001,451054],[452001,452054]];
export const TK_SPENT_SEEDS=Object.freeze([381001,...TK_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const TK_EXPECT_MAINS=12, TK_EXPECT_PROBES=0;
export const TK_OP_CAP=10_000_000_000, TK_WALL_CAP_SECONDS=10800;
export const TK_JOIN_MIN=0.99, TK_BASE_FLOOR=0.5, TK_LIFT=0.1;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function tasteKernelExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/taste-kernel-dev.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TASTE_KERNEL_PLAN_V1.md',
    'learning/taste-kernel.mjs','learning/taste-energy.mjs','learning/taste-experiment.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
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
export function tasteKernelDevSources(){
  const files=['learning/taste-kernel.mjs','learning/kernel-learner.mjs','learning/taste-energy.mjs',
    'learning/taste-experiment.mjs','learning/stationary-taste-credit.mjs','learning/intervention-study.mjs',
    'scripts/taste-kernel-dev.mjs','scripts/turn-gated-dev.mjs','scripts/body-transfer.mjs','engine.mjs'];
  const out={};
  for(const f of files)out[f]=digest(readFileSync(join(root,f)));
  return out;
}
export function tasteKernelDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TK_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of tasteKernelExtraTokens())excluded.add(t);
  for(const s of TK_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TK_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TK_FIXTURE_SEEDS.length/TK_HISTORIES===9?Array.from({length:TK_HISTORIES},(_,h)=>{
    const s=TK_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TK_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:TK_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'Track-T1 dev bank (deterministic fresh 452001-452054, 9/history, 6 histories). probeSeeds present but UNUSED (no transfer pairs in this line). First use is the single V1 run; any exposure spends it. Union-excluded: all spent banks through 451xxx + own 452001-452054.'};
  write(path,p);return p;
}
// Contact-weighted correctness on own cue labels (single-phase; no transfer).
export function correctnessOf(summary){
  let s=0,n=0;
  for(const cue of Object.keys(summary.cues)){
    const rec=summary.cues[cue],c=rec.contact;
    if(!c)continue;
    if(rec.label==='tied')continue;
    n+=c;s+=c*(rec.label==='harmful'?rec.turn/c:1-rec.turn/c);
  }
  return n===0?null:+(s/n).toFixed(4);
}
export function pauseOf(summary){
  let p=0,n=0;
  for(const cue of Object.keys(summary.cues)){p+=summary.cues[cue].pause;n+=summary.cues[cue].contact;}
  return n===0?null:+(p/n).toFixed(4);
}
export function scoreTasteKernel(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.candidate&&byTag.tasteKernel,'scorer needs candidate + tasteKernel rows');
  const counts=TK_ARMS.every(t=>(byTag[t]||[]).length===TK_HISTORIES);
  const g1=counts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=TK_JOIN_MIN));
  const corr=r=>r.summary?correctnessOf(r.summary):null;
  const baseGaps=(byTag.candidate||[]).map(r=>({seed:r.history.seed,correctness:corr(r)}));
  const kernGaps=(byTag.tasteKernel||[]).map(r=>({seed:r.history.seed,correctness:corr(r)}));
  const g0=baseGaps.length===TK_HISTORIES&&baseGaps.every(g=>g.correctness!==null&&g.correctness>=TK_BASE_FLOOR);
  const baseVals=baseGaps.map(g=>g.correctness),kernVals=kernGaps.map(g=>g.correctness);
  const baseMean=baseVals.length===TK_HISTORIES&&baseVals.every(x=>x!==null)?+(baseVals.reduce((a,c)=>a+c,0)/baseVals.length).toFixed(4):null;
  const kernMean=kernVals.length===TK_HISTORIES&&kernVals.every(x=>x!==null)?+(kernVals.reduce((a,c)=>a+c,0)/kernVals.length).toFixed(4):null;
  const g2a=baseMean!==null&&kernMean!==null&&kernMean-baseMean>=TK_LIFT;
  const surv=r=>r.endpoint?r.endpoint.survivors/r.endpoint.founders:null;
  const kernSurv=(byTag.tasteKernel||[]).map(surv);
  const survMean=kernSurv.length===TK_HISTORIES&&kernSurv.every(x=>x!==null)?kernSurv.reduce((a,c)=>a+c,0)/kernSurv.length:null;
  const basePause=(byTag.candidate||[]).map(r=>r.summary?pauseOf(r.summary):null);
  const kernPause=(byTag.tasteKernel||[]).map(r=>r.summary?pauseOf(r.summary):null);
  const basePauseMean=basePause.every(x=>x!==null)?+(basePause.reduce((a,c)=>a+c,0)/basePause.length).toFixed(4):null;
  const kernPauseMean=kernPause.every(x=>x!==null)?+(kernPause.reduce((a,c)=>a+c,0)/kernPause.length).toFixed(4):null;
  const g2b=survMean!==null&&survMean>=0.5&&basePauseMean!==null&&kernPauseMean!==null&&kernPauseMean<=basePauseMean+0.2;
  const go=g1&&g0&&g2a&&g2b;
  const verdict=!g1?'TK-INVALID':!g0?'TK-INCOMPLETE-BASELINE':go?'TK-GO':'TK-NOGO';
  return {g1,g0,g2a,g2b,baseMean,kernMean,lift:kernMean!==null&&baseMean!==null?+(kernMean-baseMean).toFixed(4):null,
    survMean:survMean===null?null:+survMean.toFixed(4),basePauseMean,kernPauseMean,baseGaps,kernGaps,verdict};
}
export function runTasteKernelDev({bankPath,output,resume=false}={}){
  assert.ok(bankPath&&output,'bankPath and output required');
  const bankPathAbs=resolve(root,bankPath),outputAbs=resolve(root,output);
  const p=tasteKernelDevBank(bankPathAbs);
  assert.equal(p.histories.length,TK_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TK_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else write(fixturePath,fixture);
  const sources=tasteKernelDevSources();
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'taste-kernel-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...TK_ARMS],
      caps:{mains:TK_EXPECT_MAINS,probes:TK_EXPECT_PROBES,aggregateScalarOperations:TK_OP_CAP,wallSeconds:TK_WALL_CAP_SECONDS},
      scope:'Track-T1 single run (kernel-taste vs linear-taste, 6 matched histories, 12 mains, 0 probes).'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TK_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runOne=(tag,history)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const run=new TasteExperiment({history,arm:tag,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary};
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const armWall={};
  for(const tag of TK_ARMS){
    let wall=0,cpuS=0;
    for(const h of p.histories){const r=runOne(tag,h);wall+=r.wall;cpuS+=r.cpuS;}
    armWall[tag]={wall,cpuS};
  }
  runtimes.arms=armWall;checkpointLedger();
  assert.deepEqual(tasteKernelDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TK_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreTasteKernel(rows);
  assert.equal(ledger.mains,TK_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,TK_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
