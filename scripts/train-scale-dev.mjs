// TRAIN-SCALE dev instrument (FROZEN under docs/TRAIN_SCALE_PLAN_V1.md).
// Perturbation-vs-time at matched 3584 ticks on a fresh bank (455001-455054):
// 6 histories x {short (1792), long (3584 continuous), restart (1792 train +
// lossy transplant a=0.25 + 1792 continue, same history)} = 18 mains, ZERO
// probes, no transfer pairs. Transplant machinery imported from the FROZEN
// V1m module (scaleSnapshot/copyWeights/checkScaledIntegrity/assertFreshTarget;
// no duplication). Metric: pooled train correctness (contact-weighted
// own-label, T1-style) + survival per tag. ProbeSeeds present-but-unused in
// the bank schema (no transfer; documented).
// G1 join+integrity; G0 short >=0.5; G2a-PRIMARY restart minus long >= +0.1
// (matched 3584 ticks); G2b no-collapse (both survivals >=30%, else
// INCOMPLETE-HARSH). Verdict TRS-GO/TRS-NOGO/TRS-INVALID/
// TRS-INCOMPLETE-HARSH. Time effect (long minus short) descriptive.
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
import {correctnessOf} from './taste-kernel-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,scaleSnapshot,
  assertFreshTarget,checkScaledIntegrity} from './turn-gated-dev-v1m.mjs';

export const TRS_EXPERIMENT='train-scale-dev-v1';
export const TRS_HISTORIES=6;
export const TRS_TAGS=Object.freeze(['short','long','restart']);
export const TRS_ALPHA=0.25;
export const TRS_LONG_MULT=2;
export const TRS_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>455001+j));
const TRS_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[451001,451054],[452001,452054],[453001,453054],[454001,454054],[455001,455054]];
export const TRS_SPENT_SEEDS=Object.freeze([381001,...TRS_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const TRS_EXPECT_MAINS=18, TRS_EXPECT_PROBES=0;
export const TRS_OP_CAP=6_000_000_000, TRS_WALL_CAP_SECONDS=10800;
export const TRS_JOIN_MIN=0.99, TRS_TRAIN_FLOOR=0.5, TRS_LIFT=0.1, TRS_SURV_FLOOR=0.3;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function trainScaleExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/train-scale-dev.mjs','scripts/turn-gated-dev-v1m.mjs','scripts/taste-kernel-dev.mjs','learning/taste-energy.mjs','learning/taste-experiment.mjs','docs/TRAIN_SCALE_PLAN_V1.md','docs/DOSE_RESPONSE_SYNTHESIS_V1.md','tests/train-scale-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function trainScaleDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/train-scale-dev.mjs','scripts/turn-gated-dev-v1m.mjs','scripts/taste-kernel-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/train-scale-dev.test.mjs','docs/TRAIN_SCALE_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
export function trainScaleDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TRS_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of trainScaleExtraTokens())excluded.add(t);
  for(const s of TRS_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TRS_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TRS_FIXTURE_SEEDS.length/TRS_HISTORIES===9?Array.from({length:TRS_HISTORIES},(_,h)=>{
    const s=TRS_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TRS_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:TRS_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'TRAIN-SCALE dev bank (deterministic fresh 455001-455054, 9/history, 6 histories). probeSeeds present but UNUSED (no transfer in this line). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
export function scoreTrainScale(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.short&&byTag.long&&byTag.restart,'scorer needs short + long + restart rows');
  const gCounts=TRS_TAGS.every(t=>(byTag[t]||[]).length===TRS_HISTORIES);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=TRS_JOIN_MIN));
  const corr=r=>r.summary?correctnessOf(r.summary):null;
  const surv=r=>r.endpoint?r.endpoint.survivors/r.endpoint.founders:null;
  const pooled=tag=>{const vs=(byTag[tag]||[]).map(corr);
    return vs.length===TRS_HISTORIES&&vs.every(x=>x!==null)?+(vs.reduce((a,c)=>a+c,0)/vs.length).toFixed(4):null;};
  const survMean=tag=>{const vs=(byTag[tag]||[]).map(surv);
    return vs.length===TRS_HISTORIES&&vs.every(x=>x!==null)?vs.reduce((a,c)=>a+c,0)/vs.length:null;};
  const shortMean=pooled('short'),longMean=pooled('long'),restartMean=pooled('restart');
  const longSurv=survMean('long'),restartSurv=survMean('restart');
  const g0=shortMean!==null&&shortMean>=TRS_TRAIN_FLOOR;
  const g2a=longMean!==null&&restartMean!==null&&restartMean-longMean>=TRS_LIFT;
  const g2b=longSurv!==null&&restartSurv!==null&&longSurv>=TRS_SURV_FLOOR&&restartSurv>=TRS_SURV_FLOOR;
  const go=g1&&g0&&g2a&&g2b;
  const verdict=!g1?'TRS-INVALID':!g0?'TRS-INCOMPLETE-UNTRAINED':(!g2b?'TRS-INCOMPLETE-HARSH':go?'TRS-GO':'TRS-NOGO');
  return {g1,g0,g2a,g2b,shortMean,longMean,restartMean,timeEffect:longMean!==null&&shortMean!==null?+(longMean-shortMean).toFixed(4):null,
    restartMinusLong:restartMean!==null&&longMean!==null?+(restartMean-longMean).toFixed(4):null,
    longSurv:longSurv===null?null:+longSurv.toFixed(4),restartSurv:restartSurv===null?null:+restartSurv.toFixed(4),verdict};
}
export function runTrainScaleDev({bankPath,output,resume=false}={}){
  assert.ok(bankPath&&output,'bankPath and output required');
  const sources=trainScaleDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=trainScaleDevBank(bankPathAbs);
  assert.equal(p.histories.length,TRS_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TRS_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'train-scale-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,longTicks:BT_TICKS*TRS_LONG_MULT,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},tags:[...TRS_TAGS],restartAlpha:TRS_ALPHA,
      caps:{mains:TRS_EXPECT_MAINS,probes:TRS_EXPECT_PROBES,aggregateScalarOperations:TRS_OP_CAP,wallSeconds:TRS_WALL_CAP_SECONDS},
      scope:'TRAIN-SCALE single run (perturbation-vs-time at matched 3584 ticks). 6 histories x short/long/restart.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TRS_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn,mult=1)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS*mult,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS*mult,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runFresh=(tag,history,ticks,learnerOptions)=>{
    const mult=ticks/BT_TICKS;
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(ticks);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary,ticks};
      note(1,0,ticks,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    },mult);
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const tagWall={};
  for(const tag of ['short','long']){
    let wall=0,cpuS=0;
    for(const h of p.histories){
      const r=runFresh(tag,h,tag==='long'?BT_TICKS*TRS_LONG_MULT:BT_TICKS,BT_LEARNER_OPTIONS);
      wall+=r.wall;cpuS+=r.cpuS;
    }
    tagWall[tag]={wall,cpuS};
  }
  // restart: 1792 train + lossy transplant a=0.25 onto fresh learners + 1792 continue (same history).
  {
    let wall=0,cpuS=0;
    for(const h of p.histories){
      const tag='restart';
      const found=rows.find(r=>r.history.seed===h.seed&&r.tag===tag&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag,seed:h.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${h.seed}:${tag}`);
        // Phase 1: train 1792 (fresh run, weights snapshotted, row not kept).
        const c1=collectTurnChoice();
        const run1=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:c1.emit});
        const {wall:w1,cpuS:c1s}=timed(`restart-train/${h.seed}`,()=>{run1.advance(BT_TICKS);checkMainIntegrity(run1.endpoint(),`restart-train/${h.seed}`);});
        wall+=w1;cpuS+=c1s;
        const wSnap=snapshotWeights(run1.learners);
        // Phase 2: transplant scaled + continue 1792.
        const c2=collectTurnChoice();
        const {wall:w2,cpuS:c2s}=timed(`${tag}/${h.seed}`,()=>{
          const run2=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:c2.emit});
          for(const id of Object.keys(wSnap))assertFreshTarget(run2.learners[id],id);
          const scaled=scaleSnapshot(wSnap,TRS_ALPHA);
          const scp=copyWeights(scaled,run2.learners);
          const chk=checkScaledIntegrity(wSnap,run2.learners,TRS_ALPHA);
          assert.ok(chk.ok,'restart transplant integrity failed: '+chk.violations.join(';'));
          let scaleOps=0;for(const id of Object.keys(scaled))for(const k of Object.keys(scaled[id]))scaleOps+=scaled[id][k].length;
          const preAdvance={scaledDigest:digestWeights(scaled),appliedDigest:digestWeights(snapshotWeights(run2.learners))};
          assert.equal(preAdvance.scaledDigest,preAdvance.appliedDigest,'restart transplant digest mismatch');
          run2.advance(BT_TICKS);
          const endpoint=run2.endpoint();checkMainIntegrity(endpoint,`${tag}/${h.seed}`);
          const summary=c2.summarize();
          const row={history:{seed:h.seed},tag,endpoint,summary,ticks:BT_TICKS*TRS_LONG_MULT,
            transfer:{transplanted:scp.transferred,total:Object.keys(wSnap).length,alpha:TRS_ALPHA,scaleOperations:scaleOps,
              sourceDigest:digestWeights(wSnap),...preAdvance}};
          note(1,0,BT_TICKS*TRS_LONG_MULT,run1.endpoint().scalarOperations+endpoint.scalarOperations+scaleOps);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${h.seed}-${tag}.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:tag,seed:h.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w2;cpuS+=c2s;
      }
    }
    tagWall.restart={wall,cpuS};
  }
  runtimes.tags=tagWall;checkpointLedger();
  assert.deepEqual(trainScaleDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TRS_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreTrainScale(rows);
  assert.equal(ledger.mains,TRS_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,TRS_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label} physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label} main op cap breached`);
}
