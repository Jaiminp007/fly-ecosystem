// THREAT-SIM dev instrument (FROZEN under docs/THREAT_SIM_PLAN_V1.md + pre-code
// CORRECTION: 5 runs/pair, 15 mains). Valence-prioritized replay for BH acquisition
// on a fresh bank (454001-454054): baseline-train + threat-train (gain 1.0) +
// baseline-transferred + threat-transferred (gain 0, threat-trained weights) +
// unlearned = 15 mains, ZERO probes. V1m-verbatim machinery: transplant helpers +
// flip-split imported from the FROZEN V1m module; single transplant loop;
// contact-weighted flip-split + BH/HB/same partitions (Amendment A1).
// G1 join+integrity; G0 train >=0.5; G2a-PRIMARY threat BH minus baseline BH >=
// +0.1; G2b HB no-impairment (threat HB >= baseline HB - 0.1); G2c unlearned
// flat; G2d same floor. Verdict TS-GO/TS-NOGO/TS-INVALID/
// TS-INCOMPLETE-UNTRAINED (tradeoff split reported on NOGO).
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
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,
  checkTransplantIntegrity,scoreFlipSplitV1m,mechanismConfirmed} from './turn-gated-dev-v1m.mjs';

export const TS_EXPERIMENT='threat-sim-dev-v1';
export const TS_HISTORIES=6;
export const TS_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const TS_THREAT_GAIN=1.0;
export const TS_TAGS=Object.freeze(['train','threat-train','transferred','threat-transferred','unlearned']);
export const TS_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>454001+j));
const TS_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[451001,451054],[452001,452054],[453001,453054],[454001,454054]];
export const TS_SPENT_SEEDS=Object.freeze([381001,...TS_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const TS_EXPECT_MAINS=15, TS_EXPECT_PROBES=0;
export const TS_OP_CAP=3_000_000_000, TS_WALL_CAP_SECONDS=9000;
export const TS_JOIN_MIN=0.99, TS_TRAIN_GAP=0.5, TS_LIFT=0.1, TS_NOIMPAIR=0.1, TS_FLAT_TOL=0.1;
export const TS_SAME_FLOOR=0.5;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function threatSimExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/threat-sim-dev.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-energy.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md','docs/THREAT_SIM_PLAN_V1.md','docs/TURN_GATE_RESULTS_V1N.md','tests/threat-sim-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function threatSimDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/threat-sim-dev.mjs','scripts/turn-gated-dev-v1m.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/threat-sim-dev.test.mjs','docs/THREAT_SIM_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
export function threatSimDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TS_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of threatSimExtraTokens())excluded.add(t);
  for(const s of TS_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TS_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TS_FIXTURE_SEEDS.length/TS_HISTORIES===9?Array.from({length:TS_HISTORIES},(_,h)=>{
    const s=TS_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TS_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:TS_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'THREAT-SIM dev bank (deterministic fresh 454001-454054, 9/history, 6 histories). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
export function scoreThreatSim(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.train&&byTag['threat-train']&&byTag.transferred&&byTag['threat-transferred']&&byTag.unlearned,
    'scorer needs train + threat-train + transferred + threat-transferred + unlearned rows');
  const gCounts=TS_TAGS.every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=TS_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=TS_TRAIN_GAP);
  const g2c=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=TS_FLAT_TOL);
  const flips=((pairs||[]).map(([trSeed,teSeed])=>{
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag==='train');
    const ttr=rows.find(r=>r.history.seed===trSeed&&r.tag==='threat-train');
    const ex=rows.find(r=>r.history.seed===teSeed&&r.tag==='transferred');
    const tex=rows.find(r=>r.history.seed===teSeed&&r.tag==='threat-transferred');
    if(!tr||!ttr||!ex||!tex)return null;
    const fBase=scoreFlipSplitV1m(tr,ex),fThreat=scoreFlipSplitV1m(ttr,tex);
    for(const f of [fBase,fThreat]){
      if(f.flippedHB.correctness===null||f.flippedBH.correctness===null||f.same.correctness===null)return null;
    }
    return {base:{bh:fBase.flippedBH.correctness,hb:fBase.flippedHB.correctness,same:fBase.same.correctness},
      threat:{bh:fThreat.flippedBH.correctness,hb:fThreat.flippedHB.correctness,same:fThreat.same.correctness}};
  }));
  const okFlips=flips.length===3&&flips.every(x=>x!==null);
  const mean=xs=>xs.length===3&&xs.every(x=>x!==null)?+(xs.reduce((a,c)=>a+c,0)/3).toFixed(4):null;
  const baseBH=mean(flips.filter(x=>x!==null).map(x=>x.base.bh));
  const threatBH=mean(flips.filter(x=>x!==null).map(x=>x.threat.bh));
  const baseHB=mean(flips.filter(x=>x!==null).map(x=>x.base.hb));
  const threatHB=mean(flips.filter(x=>x!==null).map(x=>x.threat.hb));
  const baseSame=mean(flips.filter(x=>x!==null).map(x=>x.base.same));
  const threatSame=mean(flips.filter(x=>x!==null).map(x=>x.threat.same));
  const trainMean=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null)?+(trainGaps.reduce((a,g)=>a+g.gap,0)/3).toFixed(4):null;
  const g2a=okFlips&&baseBH!==null&&threatBH!==null&&threatBH-baseBH>=TS_LIFT;
  const g2b=okFlips&&baseHB!==null&&threatHB!==null&&threatHB>=baseHB-TS_NOIMPAIR;
  const g2d=okFlips&&baseSame!==null&&threatSame!==null&&baseSame>=TS_SAME_FLOOR&&threatSame>=TS_SAME_FLOOR;
  const go=g1&&g0&&g2a&&g2b&&g2c&&g2d;
  const verdict=!g1?'TS-INVALID':!g0?'TS-INCOMPLETE-UNTRAINED':go?'TS-GO':'TS-NOGO';
  return {g1,g0,g2a,g2b,g2c,g2d,trainMean,baseBH,threatBH,baseHB,threatHB,baseSame,threatSame,
    bhLift:baseBH!==null&&threatBH!==null?+(threatBH-baseBH).toFixed(4):null,
    hbDelta:baseHB!==null&&threatHB!==null?+(threatHB-baseHB).toFixed(4):null,verdict};
}
export function runThreatSimDev({bankPath,output,resume=false}={}){
  const sources=threatSimDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=threatSimDevBank(bankPathAbs);
  assert.equal(p.histories.length,TS_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TS_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'threat-sim-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...TS_TAGS],pairs:TS_PAIRS,threatGain:TS_THREAT_GAIN,
      caps:{mains:TS_EXPECT_MAINS,probes:TS_EXPECT_PROBES,aggregateScalarOperations:TS_OP_CAP,wallSeconds:TS_WALL_CAP_SECONDS},
      scope:'THREAT-SIM single run (valence-prioritized replay for BH acquisition). 5 runs/pair; threat gain 1.0 in threat-train only.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TS_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runOne=(tag,history,learnerOptions)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary};
      if(tag==='train'||tag==='threat-train')row.weights=snapshotWeights(run.learners);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const threatOptions={...BT_LEARNER_OPTIONS,replayThreatGain:TS_THREAT_GAIN};
  const pairWall={};
  for(let pi=0;pi<TS_PAIRS.length;pi++){
    const [hiTr,hiTe]=TS_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    // 1. train runs on H_tr (baseline gain 0; threat gain 1.0)
    const t0r=runOne('train',hTr,BT_LEARNER_OPTIONS);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const tt0r=runOne('threat-train',hTr,threatOptions);wall+=tt0r.wall;cpuS+=tt0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    const threatTrainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='threat-train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    assert.ok(threatTrainRow&&threatTrainRow.summary&&threatTrainRow.weights,'threat-train row missing weights for transplant');
    // 2. transfer runs on H_te (BOTH gain 0; weights differ): exact transplant loop.
    for(const [tag,srcRow] of [['transferred',trainRow],['threat-transferred',threatTrainRow]]){
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:${tag}`);
        const collector=collectTurnChoice();
        const {wall:w2,cpuS:c2}=timed(`${tag}/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(srcRow.weights))assertFreshTarget(run.learners[id],id);
          const scp=copyWeights(srcRow.weights,run.learners);
          const chk=checkTransplantIntegrity(srcRow.weights,run.learners);
          assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
          const row={history:{seed:hTe.seed},tag,endpoint:null,summary:null,
            transfer:{transplanted:scp.transferred,total:Object.keys(srcRow.weights).length,
              sourceDigest:digestWeights(srcRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`${tag}/${hTe.seed}`);
          row.summary=collector.summarize();
          note(1,0,BT_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-${tag}.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:tag,seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w2;cpuS=c2;
      }
    }
    // 3. unlearned control on H_te
    const uRes=runOne('unlearned',hTe,BT_LEARNER_OPTIONS);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(threatSimDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TS_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedPairs=TS_PAIRS.map(([hiTr,hiTe])=>[p.histories[hiTr].seed,p.histories[hiTe].seed]);
  const decision=scoreThreatSim(rows,seedPairs);
  assert.equal(ledger.mains,TS_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,TS_EXPECT_PROBES,'Dev probes count mismatch');
  const flipDose=TS_PAIRS.map(([hiTr,hiTe])=>{
    const tr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='train');
    const ttr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='threat-train');
    const te=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag==='transferred');
    const tte=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag==='threat-transferred');
    return {base:scoreFlipSplitV1m(tr,te),threat:scoreFlipSplitV1m(ttr,tte)};
  });
  const mechDose=(flipDose.every(x=>x!==null)?flipDose.flatMap(d=>[d.base,d.threat]):[]).map(mechanismConfirmed);
  writeOver(join(outputAbs,'dev-results.json'),{...decision,flipDose,mechanismConfirmedDose:mechDose,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...decision,flipDose,mechanismConfirmedDose:mechDose};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label} physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label} main op cap breached`);
}
