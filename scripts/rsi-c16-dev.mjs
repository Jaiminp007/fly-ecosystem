// RSI C16 dev instrument (FROZEN under docs/RSI_C16_PLAN_V1.md +
// docs/RSI_C16_AMENDMENT_A1.md). Cause-gated transfer on a fresh bank
// (471001-471054): train + switch/static x T1/T2 + copied-T1 (flag
// isolation) + exact-switch-T1 (wound-depth probe) + unlearned = 16 mains,
// ZERO probes. Tests whether explicit new-cause inference with a single
// discrete switch lifts HB transfer over TRUE dose-matched static lossy.
// Transplant + flip-split machinery imported from the frozen V1m
// instrument; V1m sources pinned via sources(). Switch evaluated once at
// tick 1024 on accumulated log-odds L (+1 confirm / -2 surprise, K=8);
// switch = fresh run on negated codebook + exact transplant of seg-1
// weights (integrity-checked both branches). G0/G1/G2a-PRIMARY/G2b/G2c.
// Verdicts C16-*.
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

export const C16_EXPERIMENT='rsi-c16-dev';
export const C16_HISTORIES=6;
export const C16_PAIRS=Object.freeze([[0,1,2],[3,4,5]]);
export const C16_ARMS=Object.freeze(['train','switch-T1','static-T1','switch-T2','static-T2','copied-T1','exact-switch-T1','unlearned']);
export const C16_SEGS=Object.freeze([1024,768]);
export const C16_VOTE_TICK=1024;
export const C16_K=8, C16_CONFIRM=1, C16_SURPRISE=2;
export const C16_LOSSY_ALPHA=0.25;
export const C16_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>471001+j));
const C16_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054]];
export const C16_SPENT_SEEDS=Object.freeze([381001,...C16_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+b*0+j))]);
export const C16_EXPECT_MAINS=16, C16_EXPECT_PROBES=0;
export const C16_GAP_LIFT=0.1, C16_NONDEGRADE_TOL=0.05, C16_BH_FLOOR=0.7, C16_SAME_FLOOR=0.5;
export const C16_OP_CAP=3_400_000_000, C16_WALL_CAP_SECONDS=10800;
export const C16_JOIN_MIN=0.99, C16_TRAIN_GAP=0.5, C16_FLAT_TOL=0.1, C16_COPIED_TOL=0;
export const C16_SAME_MIN=0.85, C16_FLIP_LO=0.4, C16_FLIP_HI=0.7;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function turnGateC16ExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-c16-dev.mjs','docs/RSI_C16_PLAN_V1.md','docs/RSI_C16_AMENDMENT_A1.md','docs/RSI_C15_PLAN_V1.md','docs/TURN_GATE_PLAN_V1O.md','docs/TURN_GATE_RESULTS_V1O.md','docs/LOSSY_DIRECTION_MEASUREMENT_V1.md','tests/rsi-c16-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDevC16Sources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-c16-dev.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/rsi-c16-dev.test.mjs','docs/RSI_C16_PLAN_V1.md','docs/RSI_C16_AMENDMENT_A1.md','docs/RSI_C15_PLAN_V1.md','docs/TURN_GATE_PLAN_V1O.md','docs/TURN_GATE_RESULTS_V1O.md','docs/LOSSY_DIRECTION_MEASUREMENT_V1.md'])visit(resolve(root,name));
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
export function turnGateDevC16Bank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,C16_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateC16ExtraTokens())excluded.add(t);
  for(const s of C16_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of C16_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=C16_FIXTURE_SEEDS.length/C16_HISTORIES===9?Array.from({length:C16_HISTORIES},(_,h)=>{
    const s=C16_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,C16_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:C16_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI C16 dev bank (deterministic fresh 471001-471054, 9/history, 6 histories). First use is the single C16 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Cause vote (pure, frozen §Mechanism): log-odds L over seg-1 contacts.
// Confirming (+1): turn on test-harmful (pain avoided), cruise (contact-turn)
// on test-beneficial (safe where cruised). Surprising (-2): turn on
// test-beneficial (safe where avoided = HB residue), cruise on test-harmful
// (pain where cruised = BH risk). Switch iff L <= -K (one discrete decision).
export function computeCauseVote(segSummary){
  let L=0,confirming=0,surprising=0;
  for(const cue of Object.keys(segSummary.cues||{})){
    const s=segSummary.cues[cue],label=s.label;
    if(label!=='harmful'&&label!=='beneficial')continue;
    const turn=s.turn||0,contact=s.contact||0,cruise=contact-turn;
    if(label==='harmful'){confirming+=turn;surprising+=cruise;}
    else{confirming+=cruise;surprising+=turn;}
  }
  L=C16_CONFIRM*confirming-C16_SURPRISE*surprising;
  return {L,confirming,surprising,switch:L<=-C16_K};
}
export function negateHistory(history){
  return {...history,interpretFlip:true};
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
// G1: every row joinRate >= C16_JOIN_MIN, else INVALID.
// G0: train gaps >=0.5 on both chains, else INCOMPLETE-UNTRAINED.
// G2a-PRIMARY: (switch-static) >= +0.1 on T1 AND T2 + T2>=T1 (pooled/chain).
// G2b: switch-copied pooled > 0 (T1 legs; flag-isolation).
// G2c direction: switch HB >= static HB - 0.05 per leg; BH not degraded.
// GO iff G1 && G0 && G2a && G2b && G2c.
export function scoreRsiC16(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  const need=['train','switch-T1','static-T1','switch-T2','static-T2','copied-T1','exact-switch-T1','unlearned'];
  assert.ok(need.every(t=>byTag[t]),'scorer needs all 8 C16 tags');
  const gCounts=need.every(t=>(byTag[t]||[]).length===2);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=C16_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===2&&trainGaps.every(g=>g.gap!==null&&g.gap>=C16_TRAIN_GAP);
  const g2bFlat=unGaps.length===2&&unGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=C16_FLAT_TOL);
  const legs=((pairs||[]).map(([trSeed,teASeed,teBSeed])=>{
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag==='train');
    const get=(tag,seed)=>rows.find(r=>r.history.seed===seed&&r.tag===tag);
    const parts={};
    for(const [leg,teSeed] of [['T1',teASeed],['T2',teBSeed]]){
      const sw=get(leg==='T1'?'switch-T1':'switch-T2',teSeed),st=get(leg==='T1'?'static-T1':'static-T2',teSeed);
      if(!tr||!sw||!st)return null;
      const fsw=scoreFlipSplitV1m(tr,sw),fst=scoreFlipSplitV1m(tr,st);
      if(fsw.flippedHB.correctness===null||fst.flippedHB.correctness===null)return null;
      parts[leg]={swHB:fsw.flippedHB.correctness,stHB:fst.flippedHB.correctness,
        swBH:fsw.flippedBH.correctness,stBH:fst.flippedBH.correctness,
        swSame:fsw.same.correctness,stSame:fst.same.correctness};
    }
    const cp=get('copied-T1',teASeed);
    if(!tr||!cp)return null;
    const fcp=scoreFlipSplitV1m(tr,cp);
    if(fcp.flippedHB.correctness===null)return null;
    parts.copiedHB=fcp.flippedHB.correctness;
    return parts;
  }));
  const okLegs=legs.length===2&&legs.every(x=>x!==null);
  const legLift=leg=>okLegs?+((legs[0][leg].swHB+legs[1][leg].swHB)/2-(legs[0][leg].stHB+legs[1][leg].stHB)/2).toFixed(4):null;
  const liftT1=legLift('T1'),liftT2=legLift('T2');
  const nonDegraded=okLegs?['T1','T2'].map(leg=>Math.min(legs[0][leg].swHB-legs[0][leg].stHB,legs[1][leg].swHB-legs[1][leg].stHB)>= -C16_NONDEGRADE_TOL).filter(Boolean).length:null;
  const g2a=liftT1!==null&&liftT2!==null&&liftT1>=C16_GAP_LIFT&&liftT2>=C16_GAP_LIFT&&liftT2>=liftT1;
  const copiedGap=okLegs?+(((legs[0].T1.swHB+legs[1].T1.swHB)/2)-((legs[0].copiedHB+legs[1].copiedHB)/2)).toFixed(4):null;
  const g2b=copiedGap!==null&&copiedGap>C16_COPIED_TOL;
  const bhOk=okLegs?['T1','T2'].every(leg=>legs.every(x=>x[leg].swBH>=x[leg].stBH-C16_NONDEGRADE_TOL)):false;
  const g2c=nonDegraded!==null&&nonDegraded===2&&bhOk;
  const go=g1&&g0&&g2a&&g2b&&g2c;
  const verdict=!g1?'INVALID':!g0?'INCOMPLETE-UNTRAINED':go?'C16-GO':'C16-NOGO';
  return {g1,g0,g2a,g2b,g2c,g2bFlat,liftT1,liftT2,nonDegraded,copiedGap,legs,go,verdict};
}
export function runRsiC16Dev({bankPath,output,resume=false}){
  const sources=turnGateDevC16Sources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDevC16Bank(bankPathAbs);
  assert.equal(p.histories.length,C16_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...C16_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-c16-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...C16_ARMS],pairs:C16_PAIRS,segs:[...C16_SEGS],
      vote:{tick:C16_VOTE_TICK,K:C16_K,confirm:C16_CONFIRM,surprise:C16_SURPRISE},lossyAlpha:C16_LOSSY_ALPHA,
      caps:{executions:300,aggregateScalarOperations:C16_OP_CAP,wallSeconds:C16_WALL_CAP_SECONDS},
      scope:'RSI C16 single run (cause-gated transfer). train + switch/static x T1/T2 + copied-T1 + exact-switch-T1 + unlearned; two-segment transfers (1024 vote + 768 carry) with exact inter-segment transplant; conjunctive G1/G0/G2a/G2b/G2c decide; Amendment A1 governs tags.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=C16_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runOne=(tag,history,withWeights)=>{
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
      if(withWeights)row.weights=snapshotWeights(run.learners);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  // Two-segment transfer: seg-1 (1024 ticks, vote L) + seg-2 (768 ticks on
  // same or negated history + exact transplant of seg-1 weights). Both
  // branches share one code path (uniformity); copied forces no-switch.
  const runTransfer=(tag,trainRow,hTe,transplant,gate)=>{
    const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));return {wall:0,cpuS:0};}
    if(resume)redone.push(`${hTe.seed}:${tag}`);
    const collector=collectTurnChoice();
    let wall=0,cpuS=0,totalOps=0,seg1Weights=null,vote=null,switched=false,row=null;
    const {wall:w1,cpuS:c1}=timed(`${tag}/${hTe.seed}/seg0`,()=>{
      const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
      const base=transplant==='lossy'?scaleSnapshot(trainRow.weights,C16_LOSSY_ALPHA):trainRow.weights;
      copyWeights(base,run.learners);
      const chk=transplant==='lossy'?checkScaledIntegrity(trainRow.weights,run.learners,C16_LOSSY_ALPHA):checkTransplantIntegrity(trainRow.weights,run.learners);
      assert.ok(chk.ok,'initial transplant integrity failed: '+chk.violations.join(';'));
      if(transplant==='lossy'){for(const id of Object.keys(base))for(const k of Object.keys(base[id]))totalOps+=base[id][k].length;}
      run.advance(C16_SEGS[0]);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${hTe.seed}/seg0`);
      totalOps+=endpoint.scalarOperations;
      seg1Weights=snapshotWeights(run.learners);
      vote=computeCauseVote(collector.summarize());
      switched=gate==='on'&&vote.switch;
      if(gate==='copied')switched=false;
    });
    wall+=w1;cpuS+=c1;
    const {wall:w2,cpuS:c2}=timed(`${tag}/${hTe.seed}/seg1`,()=>{
      const h2=switched?negateHistory(hTe):hTe;
      const run=new TasteExperiment({history:h2,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      for(const id of Object.keys(seg1Weights))assertFreshTarget(run.learners[id],id);
      copyWeights(seg1Weights,run.learners);
      const chk=checkTransplantIntegrity(seg1Weights,run.learners);
      assert.ok(chk.ok,'inter-segment transplant failed: '+chk.violations.join(';'));
      const appliedPre=digestWeights(snapshotWeights(run.learners));
      assert.equal(digestWeights(seg1Weights),appliedPre,'inter-segment digest mismatch');
      run.advance(C16_SEGS[1]);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${hTe.seed}/seg1`);
      totalOps+=endpoint.scalarOperations;
      row={history:{seed:hTe.seed},tag,endpoint,summary:collector.summarize(),
        transfer:{transplant,gate,switched,voteL:vote.L,voteConfirming:vote.confirming,voteSurprising:vote.surprising,
          sourceDigest:digestWeights(trainRow.weights),carriedDigest:digestWeights(seg1Weights),appliedDigest:appliedPre}};
      note(1,0,BT_TICKS,totalOps);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${hTe.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:hTe.seed,switched,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    wall+=w2;cpuS+=c2;
    return {wall,cpuS};
  };
  const pairWall={};
  for(let ci=0;ci<2;ci++){
    const hTr=p.histories[C16_PAIRS[ci][0]],hTeA=p.histories[C16_PAIRS[ci][1]],hTeB=p.histories[C16_PAIRS[ci][2]];
    let wall=0,cpuS=0;
    const t0r=runOne('train',hTr,true);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    const legs=[[hTeA,'T1'],[hTeB,'T2']];
    for(const [hTe,suf] of legs){
      const a=runTransfer(`switch-${suf}`,trainRow,hTe,'lossy','on');wall+=a.wall;cpuS+=a.cpuS;
      const b=runTransfer(`static-${suf}`,trainRow,hTe,'lossy','off');wall+=b.wall;cpuS+=b.cpuS;
    }
    const c=runTransfer('copied-T1',trainRow,hTeA,'lossy','copied');wall+=c.wall;cpuS+=c.cpuS;
    const e=runTransfer('exact-switch-T1',trainRow,hTeA,'exact','on');wall+=e.wall;cpuS+=e.cpuS;
    const u=runOne('unlearned',hTeA,false);wall+=u.wall;cpuS+=u.cpuS;
    pairWall[`chain${ci}`]={wall,cpuS};
  }
  runtimes.chains=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDevC16Sources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=C16_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedPairs=C16_PAIRS.map(([hiTr,hiA,hiB])=>[p.histories[hiTr].seed,p.histories[hiA].seed,p.histories[hiB].seed]);
  const decision=scoreRsiC16(rows,seedPairs);
  assert.equal(ledger.mains,C16_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,C16_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...decision};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap cap breached`);
}
