// TURN-GATED Phase-N dev instrument (FROZEN under docs/TURN_GATE_PLAN_V1N.md).
// Dose-peak mapping in (0, 0.25] on a fresh bank (453001-453054):
// train + lossy-{0.05,0.10,0.15,0.20,0.25} + unlearned = 21 mains, ZERO probes.
// V1m-verbatim machinery: transplant helpers + flip-split imported from the
// FROZEN V1m module (no duplication); single alpha-parameterized transplant
// loop (V1l lesson); lossy-once seg chain (V1l design); contact-weighted
// flip-split + BH/HB/same partitions (Amendment A1); E1/D0 +0.1 band fixed.
// G1 join+integrity; G0 train >=0.5; G2a-PRIMARY best-alpha pooled HB-seg1 >=
// pooled train - 0.1 (MET-bar verbatim); G2b unlearned flat; G2c BH floor;
// G2d same floor. Verdict GO-V1N/NOGO-V1N/INCOMPLETE-UNTRAINED/INVALID
// (PHASE-N-*). Peak location (argmax) descriptive either way.
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
import {snapshotWeights,digestWeights,copyWeights,scaleSnapshot,checkScaledIntegrity,
  assertFreshTarget,checkTransplantIntegrity,scoreFlipSplitV1m,mechanismConfirmed} from './turn-gated-dev-v1m.mjs';

export const TN_EXPERIMENT='turn-gated-dev-v1n';
export const TN_HISTORIES=6;
export const TN_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const TN_ALPHAS=Object.freeze([0.05,0.10,0.15,0.20,0.25]);
export const TN_ARMS=Object.freeze(['train',...TN_ALPHAS.map(a=>`transferred-lossy-${a}`),'unlearned']);
export const TN_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>453001+j));
const TN_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[451001,451054],[452001,452054],[453001,453054]];
export const TN_SPENT_SEEDS=Object.freeze([381001,...TN_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const TN_EXPECT_MAINS=21, TN_EXPECT_PROBES=0;
export const TN_OP_CAP=4_000_000_000, TN_WALL_CAP_SECONDS=10800;
export const TN_JOIN_MIN=0.99, TN_TRAIN_GAP=0.5, TN_MET_TOL=0.1, TN_FLAT_TOL=0.1;
export const TN_BH_FLOOR=0.7, TN_SAME_FLOOR=0.5;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function turnGateV1nExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/turn-gated-dev-v1n.mjs','scripts/turn-gated-dev-v1m.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md','docs/TURN_GATE_PLAN_V1J.md','docs/TURN_GATE_PLAN_V1K.md','docs/TURN_GATE_PLAN_V1L.md','docs/TURN_GATE_PLAN_V1M.md','docs/TURN_GATE_PLAN_V1N.md','docs/TURN_GATE_RESULTS_V1K.md','docs/TURN_GATE_RESULTS_V1L.md','docs/TURN_GATE_RESULTS_V1M.md','docs/LOSSY_DIRECTION_MEASUREMENT_V1.md','tests/turn-gated-dev-v1n.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDevV1nSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/turn-gated-dev-v1n.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/turn-gated-dev-v1n.test.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md','docs/TURN_GATE_PLAN_V1J.md','docs/TURN_GATE_PLAN_V1K.md','docs/TURN_GATE_PLAN_V1L.md','docs/TURN_GATE_PLAN_V1M.md','docs/TURN_GATE_PLAN_V1N.md','docs/TURN_GATE_RESULTS_V1K.md','docs/TURN_GATE_RESULTS_V1L.md','docs/TURN_GATE_RESULTS_V1M.md','docs/LOSSY_DIRECTION_MEASUREMENT_V1.md'])visit(resolve(root,name));
  return found;
}
export function turnGateDevV1nBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TN_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateV1nExtraTokens())excluded.add(t);
  for(const s of TN_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TN_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TN_FIXTURE_SEEDS.length/TN_HISTORIES===9?Array.from({length:TN_HISTORIES},(_,h)=>{
    const s=TN_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TN_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:TN_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'TURN-GATED Phase-N dev bank (deterministic fresh 453001-453054, 9/history, 6 histories). First use is the single V1N run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
export function scoreTurnGateV1n(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.train&&byTag.unlearned&&TN_ALPHAS.every(a=>byTag[`transferred-lossy-${a}`]),'scorer needs train + lossy-alpha + unlearned rows');
  const gCounts=['train','unlearned',...TN_ALPHAS.map(a=>`transferred-lossy-${a}`)].every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=TN_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=TN_TRAIN_GAP);
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=TN_FLAT_TOL);
  const flips=((pairs||[]).map(([trSeed,teSeed])=>{
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag==='train');
    if(!tr)return null;
    const arms={};
    for(const a of TN_ALPHAS){
      const lo=rows.find(r=>r.history.seed===teSeed&&r.tag===`transferred-lossy-${a}`);
      if(!lo)return null;
      const fl=scoreFlipSplitV1m(tr,lo);
      if(fl.flippedHB.correctness===null||fl.flippedBH.correctness===null||fl.same.correctness===null)return null;
      arms[a]={hb:fl.flippedHB.correctness,bh:fl.flippedBH.correctness,same:fl.same.correctness};
    }
    return arms;
  }));
  const okFlips=flips.length===3&&flips.every(x=>x!==null);
  const hbByAlpha={},bhByAlpha={},sameByAlpha={};
  for(const a of TN_ALPHAS){
    const vals=flips.filter(x=>x!==null).map(x=>x[a]);
    hbByAlpha[a]=vals.length===3?+(vals.reduce((s,v)=>s+v.hb,0)/3).toFixed(4):null;
    bhByAlpha[a]=vals.length===3?+(vals.reduce((s,v)=>s+v.bh,0)/3).toFixed(4):null;
    sameByAlpha[a]=vals.length===3?+(vals.reduce((s,v)=>s+v.same,0)/3).toFixed(4):null;
  }
  const trainMean=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null)?+(trainGaps.reduce((a,g)=>a+g.gap,0)/3).toFixed(4):null;
  const scoredAlphas=TN_ALPHAS.filter(a=>hbByAlpha[a]!==null);
  const bestAlpha=scoredAlphas.length===TN_ALPHAS.length?scoredAlphas.reduce((b,a)=>hbByAlpha[a]>hbByAlpha[b]?a:b):null;
  const bestHb=bestAlpha!==null?hbByAlpha[bestAlpha]:null;
  const g2a=trainMean!==null&&bestHb!==null&&bestHb>=trainMean-TN_MET_TOL;
  const gBhFloor=TN_ALPHAS.every(a=>bhByAlpha[a]!==null&&bhByAlpha[a]>=TN_BH_FLOOR);
  const gSameFloor=TN_ALPHAS.every(a=>sameByAlpha[a]!==null&&sameByAlpha[a]>=TN_SAME_FLOOR);
  const go=g1&&g0&&g2a&&g2b&&gBhFloor&&gSameFloor;
  const verdict=!g1?'PHASE-N-INVALID':!g0?'PHASE-N-INCOMPLETE-UNTRAINED':go?'PHASE-N-GO':'PHASE-N-NOGO';
  return {g1,g0,g2a,g2b,gBhFloor,gSameFloor,trainMean,trainGaps,unlearnGaps,hbByAlpha,bhByAlpha,sameByAlpha,bestAlpha,bestHb,verdict};
}
export function runTurnGatedDevV1n({bankPath,output,resume=false}={}){
  const sources=turnGateDevV1nSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDevV1nBank(bankPathAbs);
  assert.equal(p.histories.length,TN_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TN_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'turn-gated-v1n-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...TN_ARMS],pairs:TN_PAIRS,
      caps:{mains:TN_EXPECT_MAINS,probes:TN_EXPECT_PROBES,aggregateScalarOperations:TN_OP_CAP,wallSeconds:TN_WALL_CAP_SECONDS},
      scope:'TURN-GATED Phase-N single run (dose-peak mapping 0.05-0.25). Train + 5 lossy-alpha arms + unlearned; alpha-parameterized transplant loop.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TN_OP_CAP,'Dev aggregate op cap breached');};
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
      if(tag==='train')row.weights=snapshotWeights(run.learners);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const pairWall={};
  for(let pi=0;pi<TN_PAIRS.length;pi++){
    const [hiTr,hiTe]=TN_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    // 1. train on H_tr (weights snapshot saved on the row)
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    // 2. dose arms on H_te: ONE alpha-parameterized transplant loop.
    for(const alpha of TN_ALPHAS){
      const tag=`transferred-lossy-${alpha}`;
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:${tag}`);
        const collector=collectTurnChoice();
        const {wall:w2,cpuS:c2}=timed(`${tag}/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const scaled=scaleSnapshot(trainRow.weights,alpha);
          const scp=copyWeights(scaled,run.learners);
          const chk=checkScaledIntegrity(trainRow.weights,run.learners,alpha);
          assert.ok(chk.ok,'lossy transplant integrity failed: '+chk.violations.join(';'));
          let scaleOps=0;for(const id of Object.keys(scaled))for(const k of Object.keys(scaled[id]))scaleOps+=scaled[id][k].length;
          const row={history:{seed:hTe.seed},tag,endpoint:null,summary:null,
            transfer:{transplanted:scp.transferred,total:Object.keys(trainRow.weights).length,alpha,scaleOperations:scaleOps,
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
        wall+=w2;cpuS=c2;
      }
    }
    // 3. unlearned control on H_te
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDevV1nSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TN_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedPairs=TN_PAIRS.map(([hiTr,hiTe])=>[p.histories[hiTr].seed,p.histories[hiTe].seed]);
  const decision=scoreTurnGateV1n(rows,seedPairs);
  assert.equal(ledger.mains,TN_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,TN_EXPECT_PROBES,'Dev probes count mismatch');
  const flipDose=TN_PAIRS.map(([hiTr,hiTe])=>{
    const tr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='train');
    const per={};
    for(const a of TN_ALPHAS){
      const te=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag===`transferred-lossy-${a}`);
      per[a]=scoreFlipSplitV1m(tr,te);
    }
    return per;
  });
  const mechDose=(flipDose.every(x=>x!==null)?flipDose.flatMap(d=>TN_ALPHAS.map(a=>d[a])):[]).map(mechanismConfirmed);
  writeOver(join(outputAbs,'dev-results.json'),{...decision,flipDose,mechanismConfirmedDose:mechDose,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...decision,flipDose,mechanismConfirmedDose:mechDose};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label} physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label} main op cap breached`);
}
