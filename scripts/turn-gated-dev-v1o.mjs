// TURN-GATED Phase-O dev instrument (FROZEN under docs/TURN_GATE_PLAN_V1O.md
// + docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md). Multi-codebook training on a
// fresh bank (470001-470054): train-single + train-multi (3 exact-transplant
// thirds on A/pseudo-A2/pseudo-A3) + transferred-single + transferred-multi
// (lossy-0.25 deployed transplant) + unlearned = 15 mains, ZERO probes.
// Tests whether multi-context training lifts HB transfer over TRUE
// dose-matched single training. Transplant machinery imported from the
// frozen V1m instrument (no duplication); V1m sources pinned via sources().
// G1 join+integrity; G0 both trains >=0.5; G2a-MULTI PRIMARY (pooled
// multi-minus-single HB >= +0.1 with 2/3 non-degradation); G2b unlearned
// flat; G2c BH floor; G2d same floor. Verdicts PHASE-O-*.
// Empty direction subset -> null -> gate fails (NOGO).
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {collectTurnChoice} from './turn-gated-dev.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';
import {snapshotWeights,copyWeights,checkTransplantIntegrity,scaleSnapshot,checkScaledIntegrity,
  digestWeights,assertFreshTarget,scoreFlipSplit,scoreFlipSplitV1m,mechanismConfirmed} from './turn-gated-dev-v1m.mjs';
export {snapshotWeights,copyWeights,checkTransplantIntegrity,scaleSnapshot,checkScaledIntegrity,
  digestWeights,assertFreshTarget,scoreFlipSplit,scoreFlipSplitV1m,mechanismConfirmed};

export const TO_EXPERIMENT='turn-gated-dev-v1o';
export const TO_HISTORIES=6;
export const TO_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const TO_ARMS=Object.freeze(['train-single','train-multi','transferred-single','transferred-multi','unlearned']);
export const TO_THIRDS=Object.freeze([597,597,598]);
export const TO_LOSSY_ALPHA=0.25;
export const TO_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>470001+j));
const TO_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054]];
export const TO_SPENT_SEEDS=Object.freeze([381001,...TO_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const TO_EXPECT_MAINS=15, TO_EXPECT_PROBES=0;
export const TO_GAP_LIFT=0.1, TO_NONDEGRADE_TOL=0.05, TO_BH_FLOOR=0.7, TO_SAME_FLOOR=0.5;
export const TO_OP_CAP=4_200_000_000, TO_WALL_CAP_SECONDS=10800;
export const TO_JOIN_MIN=0.99, TO_TRAIN_GAP=0.5, TO_FLAT_TOL=0.1;
export const TO_SAME_MIN=0.85, TO_FLIP_LO=0.4, TO_FLIP_HI=0.7;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function turnGateV1oExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/turn-gated-dev-v1o.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md','docs/TURN_GATE_PLAN_V1J.md','docs/TURN_GATE_PLAN_V1K.md','docs/TURN_GATE_PLAN_V1L.md','docs/TURN_GATE_PLAN_V1M.md','docs/TURN_GATE_PLAN_V1O.md','docs/TURN_GATE_RESULTS_V1K.md','docs/TURN_GATE_RESULTS_V1L.md','docs/LOSSY_DIRECTION_MEASUREMENT_V1.md','tests/turn-gated-dev-v1o.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDevV1oSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/turn-gated-dev-v1o.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/turn-gated-dev-v1o.test.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md','docs/TURN_GATE_PLAN_V1J.md','docs/TURN_GATE_PLAN_V1K.md','docs/TURN_GATE_PLAN_V1L.md','docs/TURN_GATE_PLAN_V1M.md','docs/TURN_GATE_PLAN_V1O.md','docs/TURN_GATE_RESULTS_V1K.md','docs/TURN_GATE_RESULTS_V1L.md','docs/LOSSY_DIRECTION_MEASUREMENT_V1.md'])visit(resolve(root,name));
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
export function turnGateDevV1oBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TO_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateV1oExtraTokens())excluded.add(t);
  for(const s of TO_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TO_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TO_FIXTURE_SEEDS.length/TO_HISTORIES===9?Array.from({length:TO_HISTORIES},(_,h)=>{
    const s=TO_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TO_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:TO_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'TURN-GATED Phase-O dev bank (deterministic fresh 470001-470054, 9/history, 6 histories). First use is the single V1O run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Pseudo-codebook histories (frozen §Design): A2 = A cue-labels REVERSED,
// A3 = A cue-labels ROTATED by one. Deterministic derivation (same seeds;
// the cuePermute flag differentiates). Counts preserved by construction
// (permutation — verified by the pseudo-validation fixture on live rows).
export function pseudoHistory(history,mode){
  assert.ok(mode==='reverse'||mode==='rotate','unknown pseudo mode '+mode);
  return {...history,cuePermute:mode};
}
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
// Pure scorer (exported for fixtures). rows: [{tag,history:{seed},summary}].
// G1: every row joinRate >= TO_JOIN_MIN, else INVALID.
// G0: train-single AND train-multi gaps >=0.5 on all 3, else INCOMPLETE.
// G2a-MULTI PRIMARY: pooled transferred-multi HB minus pooled
// transferred-single HB >= +0.1 AND >=2/3 pairs non-degraded (-0.05).
// Pairing reference: train-single (base codebook A; B flipped vs A).
// G2b: unlearned |gap| <=0.1. G2c/G2d: BH>=0.7 / same>=0.5 pooled per arm.
// GO iff G1 && G0 && G2a && G2b && G2c && G2d.
export function scoreTurnGateV1o(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag['train-single']&&byTag['train-multi']&&byTag['transferred-single']&&byTag['transferred-multi']&&byTag.unlearned,'scorer needs train-single + train-multi + transferred-single + transferred-multi + unlearned rows');
  const need=['train-single','train-multi','transferred-single','transferred-multi','unlearned'];
  const gCounts=need.every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=TO_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const sGaps=(byTag['train-single']||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const mGaps=(byTag['train-multi']||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=sGaps.length===3&&mGaps.length===3&&sGaps.every(g=>g.gap!==null&&g.gap>=TO_TRAIN_GAP)&&mGaps.every(g=>g.gap!==null&&g.gap>=TO_TRAIN_GAP);
  const g2b=unGaps.length===3&&unGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=TO_FLAT_TOL);
  const flips=((pairs||[]).map(([trSeed,teSeed])=>{
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag==='train-single');
    const s=rows.find(r=>r.history.seed===teSeed&&r.tag==='transferred-single');
    const m=rows.find(r=>r.history.seed===teSeed&&r.tag==='transferred-multi');
    if(!tr||!s||!m)return null;
    const fs=scoreFlipSplitV1m(tr,s),fm=scoreFlipSplitV1m(tr,m);
    if(fs.flippedHB.correctness===null||fs.flippedBH.correctness===null||fm.flippedHB.correctness===null||fm.flippedBH.correctness===null)return null;
    return {hbSingle:fs.flippedHB.correctness,bhSingle:fs.flippedBH.correctness,sameSingle:fs.same.correctness,
      hbMulti:fm.flippedHB.correctness,bhMulti:fm.flippedBH.correctness,sameMulti:fm.same.correctness};
  }));
  const okFlips=flips.length===3&&flips.every(x=>x!==null);
  const mean=xs=>xs.length===3?+(xs.reduce((a,c)=>a+c,0)/3).toFixed(4):null;
  const hbSingle=okFlips?mean(flips.map(x=>x.hbSingle)):null;
  const hbMulti=okFlips?mean(flips.map(x=>x.hbMulti)):null;
  const bhSingle=okFlips?mean(flips.map(x=>x.bhSingle)):null;
  const bhMulti=okFlips?mean(flips.map(x=>x.bhMulti)):null;
  const sameSingle=okFlips?mean(flips.map(x=>x.sameSingle)):null;
  const sameMulti=okFlips?mean(flips.map(x=>x.sameMulti)):null;
  const lift=hbSingle!==null&&hbMulti!==null?+(hbMulti-hbSingle).toFixed(4):null;
  const nonDegraded=okFlips?flips.filter(x=>x.hbMulti>=x.hbSingle-TO_NONDEGRADE_TOL).length:null;
  const g2a=lift!==null&&lift>=TO_GAP_LIFT&&nonDegraded!==null&&nonDegraded>=2;
  const gBhFloor=bhSingle!==null&&bhMulti!==null&&bhSingle>=TO_BH_FLOOR&&bhMulti>=TO_BH_FLOOR;
  const gSameFloor=sameSingle!==null&&sameMulti!==null&&sameSingle>=TO_SAME_FLOOR&&sameMulti>=TO_SAME_FLOOR;
  const go=g1&&g0&&g2a&&g2b&&gBhFloor&&gSameFloor;
  const verdict=!g1?'INVALID':!g0?'INCOMPLETE-UNTRAINED':go?'PHASE-O-GO':'PHASE-O-NOGO';
  return {g1,g0,g2a,g2b,gBhFloor,gSameFloor,hbSingle,hbMulti,lift,nonDegraded,
    bhSingle,bhMulti,sameSingle,sameMulti,singleGaps:sGaps,multiGaps:mGaps,unlearnGaps:unGaps,flips,go,verdict};
}
export function runTurnGatedDevV1o({bankPath,output,resume=false}){
  const sources=turnGateDevV1oSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDevV1oBank(bankPathAbs);
  assert.equal(p.histories.length,TO_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TO_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'turn-gated-v1o-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...TO_ARMS],pairs:TO_PAIRS,thirds:[...TO_THIRDS],
      pseudoScheme:{A2:'reverse',A3:'rotate'},lossyAlpha:TO_LOSSY_ALPHA,
      caps:{executions:300,aggregateScalarOperations:TO_OP_CAP,wallSeconds:TO_WALL_CAP_SECONDS},
      scope:'TURN-GATED Phase-O single run (multi-codebook training). train-single + train-multi (3 exact-transplant thirds A/A2/A3) + transferred-single/multi (lossy-0.25) + unlearned; conjunctive G1/G0/G2a-MULTI/G2b/G2c/G2d decide; Amendment A1 governs the flip-split metric, V1O plan governs gates.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TO_OP_CAP,'Dev aggregate op cap breached');};
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
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary};
      if(tag==='train-single')row.weights=snapshotWeights(run.learners);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  // train-multi: ONE main = 3-segment exact-transplant chain (597/597/598)
  // on A / pseudo-A2 (reverse) / pseudo-A3 (rotate). Weights carry forward;
  // single note() with summed ops; sub-segments internal (digests recorded).
  const runTrainMulti=(history)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag==='train-multi'&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag:'train-multi',seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};}
    if(resume)redone.push(`${history.seed}:train-multi`);
    let wall=0,cpuS=0,totalOps=0,carried=null,segDigests=[],row=null;
    const segs=[{h:history,label:'A'},{h:pseudoHistory(history,'reverse'),label:'A2'},{h:pseudoHistory(history,'rotate'),label:'A3'}];
    for(let si=0;si<3;si++){
      const collector=collectTurnChoice();
      const {wall:w,cpuS:c}=timed(`train-multi/${history.seed}/seg${si}-${segs[si].label}`,()=>{
        const run=new TasteExperiment({history:segs[si].h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
        if(carried!==null){
          for(const id of Object.keys(carried))assertFreshTarget(run.learners[id],id);
          copyWeights(carried,run.learners);
          const chk=checkTransplantIntegrity(carried,run.learners);
          assert.ok(chk.ok,'train-multi inter-third transplant failed: '+chk.violations.join(';'));
        }
        run.advance(TO_THIRDS[si]);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`train-multi/${history.seed}/seg${si}`);
        totalOps+=endpoint.scalarOperations;
        carried=snapshotWeights(run.learners);
        segDigests.push(digestWeights(carried));
        if(si===2){
          row={history:{seed:history.seed},tag:'train-multi',endpoint,summary:collector.summarize(),
            weights:carried,pseudo:{scheme:['A','reverse','A3-rotate'],thirds:[...TO_THIRDS],segDigests}};
          note(1,0,BT_TICKS,totalOps);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${history.seed}-train-multi.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',tag:'train-multi',seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
        }
      });
      wall+=w;cpuS+=c;
    }
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag==='train-multi'),wall,cpuS};
  };
  // Lossy transfer of a chosen train row onto H_te (fixed alpha 0.25).
  const runTransferred=(tag,trainRow,hTe,srcLabel)=>{
    const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));return {wall:0,cpuS:0};}
    if(resume)redone.push(`${hTe.seed}:${tag}`);
    const collector=collectTurnChoice();
    const {wall,cpuS}=timed(`${tag}/${hTe.seed}`,()=>{
      const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
      const scaled=scaleSnapshot(trainRow.weights,TO_LOSSY_ALPHA);
      const scp=copyWeights(scaled,run.learners);
      const chk=checkScaledIntegrity(trainRow.weights,run.learners,TO_LOSSY_ALPHA);
      assert.ok(chk.ok,'lossy transplant integrity failed: '+chk.violations.join(';'));
      let scaleOps=0;for(const id of Object.keys(scaled))for(const k of Object.keys(scaled[id]))scaleOps+=scaled[id][k].length;
      const row={history:{seed:hTe.seed},tag,endpoint:null,summary:null,
        transfer:{transplanted:scp.transferred,total:Object.keys(trainRow.weights).length,alpha:TO_LOSSY_ALPHA,source:srcLabel,scaleOperations:scaleOps,
          sourceDigest:digestWeights(trainRow.weights),scaledDigest:digestWeights(scaled),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
      assert.equal(row.transfer.scaledDigest,row.transfer.appliedDigest,'lossy transplant digest mismatch');
      run.advance(BT_TICKS);
      row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`${tag}/${hTe.seed}`);
      row.summary=collector.summarize();
      note(1,0,BT_TICKS,row.endpoint.scalarOperations+scaleOps);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${hTe.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',arm:tag,seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {wall,cpuS};
  };
  const pairWall={};
  for(let pi=0;pi<TO_PAIRS.length;pi++){
    const [hiTr,hiTe]=TO_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    const s0=runOne('train-single',hTr);wall+=s0.wall;cpuS+=s0.cpuS;
    const trainSingle=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train-single');
    assert.ok(trainSingle&&trainSingle.summary&&trainSingle.weights,'train-single row missing weights for transplant');
    const m0=runTrainMulti(hTr);wall+=m0.wall;cpuS+=m0.cpuS;
    const trainMulti=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train-multi');
    assert.ok(trainMulti&&trainMulti.summary&&trainMulti.weights,'train-multi row missing weights for transplant');
    const t1=runTransferred('transferred-single',trainSingle,hTe,'train-single');wall+=t1.wall;cpuS+=t1.cpuS;
    const t2=runTransferred('transferred-multi',trainMulti,hTe,'train-multi');wall+=t2.wall;cpuS+=t2.cpuS;
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDevV1oSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TO_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedPairs=TO_PAIRS.map(([hiTr,hiTe])=>[p.histories[hiTr].seed,p.histories[hiTe].seed]);
  const decision=scoreTurnGateV1o(rows,seedPairs);
  assert.equal(ledger.mains,TO_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,TO_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...decision};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
