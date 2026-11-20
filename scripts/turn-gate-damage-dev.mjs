// TURN-GATE Damage-Gate dev instrument (FROZEN under docs/DAMAGE_GATE_PLAN_V1.md).
// Damage-gated (replayDamageGain:3.0/1.0, binary-matched to tournament-1) vs
// surprise-gated (HELD V1g/V1h/V1i 1.0/3.0) vs uniform in the harm->ben seg1
// extinction window. Per pair: train (1792, base; transplant source) +
// transferred = uniform-seg1 (1792, base) + transferred-damage = damage-seg1
// (1792, base + surpriseGain:1.0 + replayDamageGain:3.0; live path shared with
// gain, replay trigger damage-only) + transferred-gain = gain-seg1 (1792,
// HELD gain opts) + unlearned (1792, frozen flat control) = 15 mains,
// ZERO probes. Seg1 only (seg2 compounding closed in V1h/V1i). Transplant
// machinery IMPORTED from the V1i instrument (single source of truth; the
// two added `export` keywords there are behavior-neutral).
// G0 train >=0.5 all 3; G2a uniform-seg1 mean >=0.3; G2b unlearned flat
// <=0.1 all 3; verdict PHASE-D1-GO/NOGO (+INVALID/INCOMPLETE-UNTRAINED/
// INCOMPLETE-NODAMAGE). D1: damage-uniform HB flippedHB, +0.1 band (GO gate
// on usable-pair mean with fired manipulation). D2 damage-gain descriptive
// with deployment mapping. Per-pair damage-presence VOID (no damage: the
// pair's D1 unanswered, excluded; <2 usable pairs -> INCOMPLETE-NODAMAGE).
// Null-hygiene extended: neutral arms all-zero (surprise AND damage);
// gain arm damage-zero; damage arm surprise-replay-zero (live surprise
// shared by design, not gated).
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
import {snapshotWeights,copyWeights,assertFreshTarget,digestWeights,checkTransplantIntegrity,
  scoreFlipSplit,subsetGap,mechanismConfirmed,pooledTurnGap,gapOfStats} from './turn-gated-dev-v1i.mjs';

export const DG_EXPERIMENT='turn-gate-damage-dev';
export const DG_HISTORIES=6;
export const DG_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const DG_ARMS=Object.freeze(['train','transferred','transferred-damage','transferred-gain','unlearned']);
export const DG_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>444001+j));
const DG_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054]];
export const DG_SPENT_SEEDS=Object.freeze([381001,...DG_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const DG_EXPECT_MAINS=15, DG_EXPECT_PROBES=0;
// Intervention options. Gain: HELD V1g/V1h/V1i-identical (1.0/3.0, not tuned).
// Damage: binary-matched (live surpriseGain 1.0 SHARED with gain — the live
// path is identical; replayDamageGain 3.0/1.0 mirrors the tournament scale).
// The ONLY difference between the arms is the replay trigger.
export const DG_GAIN_OPTS=Object.freeze({...BT_LEARNER_OPTIONS,surpriseGain:1.0,replaySurpriseGain:3});
export const DG_DAMAGE_OPTS=Object.freeze({...BT_LEARNER_OPTIONS,surpriseGain:1.0,replayDamageGain:3.0});
export const DG_OP_CAP=20_000_000_000, DG_WALL_CAP_SECONDS=3600;
export const DG_JOIN_MIN=0.99, DG_TRAIN_GAP=0.5, DG_TRANSFER_GAP=0.3, DG_FLAT_TOL=0.1;
export const DG_D1_BAND=0.1;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function turnGateDamageExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/turn-gate-damage-dev.mjs','docs/DAMAGE_GATE_PLAN_V1.md','tests/turn-gate-damage-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDamageDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/turn-gate-damage-dev.mjs','scripts/turn-gated-dev-v1i.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/turn-gate-damage-dev.test.mjs','docs/DAMAGE_GATE_PLAN_V1.md'])visit(resolve(root,name));
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
export function turnGateDamageDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,DG_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateDamageExtraTokens())excluded.add(t);
  for(const s of DG_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of DG_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=DG_FIXTURE_SEEDS.length/DG_HISTORIES===9?Array.from({length:DG_HISTORIES},(_,h)=>{
    const s=DG_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,DG_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:DG_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'DAMAGE-GATE dev bank (deterministic fresh 444001-444054, 9/history, 6 histories). First use is the single damage-gate run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Damage-presence helper (exported for fixtures): per-row damage occurred.
// Reads endpoint totals (engine ledger, always present); missing -> 0.
export function rowDamage(row){
  return ((row&&row.endpoint&&row.endpoint.totals&&row.endpoint.totals.toxinDamage)??0)>0;
}
// Pure scorer (exported for fixtures). rows: [{tag,history:{seed},summary}].
// G1: every row (all 5 tags x 3) joinRate >= DG_JOIN_MIN, else INVALID.
// G0: train gaps >=0.5 on all 3, else INCOMPLETE-UNTRAINED.
// G2a: transferred-uniform mean gap >=0.3. G2b: unlearned |gap| <=0.1 all 3.
// GO iff G1 && G0 && G2a && G2b (D1 evaluated in the runner: needs flips +
// damage presence, which live outside row summaries).
export function scoreTurnGateDamage(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.train&&byTag.transferred&&byTag.unlearned,'scorer needs train + transferred + unlearned rows');
  assert.equal((byTag['transferred-damage']||[]).length,3,'scorer needs 3 transferred-damage rows');
  assert.equal((byTag['transferred-gain']||[]).length,3,'scorer needs 3 transferred-gain rows');
  const gCounts=['train','transferred','transferred-damage','transferred-gain','unlearned'].every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=DG_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const transGaps=(byTag.transferred||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=DG_TRAIN_GAP);
  const tv=transGaps.map(g=>g.gap);
  const transMean=tv.length===3&&tv.every(x=>x!==null)?tv.reduce((a,c)=>a+c,0)/tv.length:null;
  const g2a=transMean!==null&&transMean>=DG_TRANSFER_GAP;
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=DG_FLAT_TOL);
  const go=g1&&g0&&g2a&&g2b;
  const verdict=!g1?'INVALID':!g0?'INCOMPLETE-UNTRAINED':go?'PHASE-D1-GO':'PHASE-D1-NOGO';
  return {g1,g0,g2a,g2b,transMean,trainGaps,transGaps,unlearnGaps,go,verdict};
}
// Per-agent work-counter harvest (exported for fixtures): summed
// surprise/replay/damage tallies. Null-default arms must read all-zero.
export function agentWorkDamage(learners){
  const out={surpriseBoosts:0,replaySurpriseBoosts:0,replayDamageBoosts:0,replaySkips:0};
  for(const id of Object.keys(learners)){const w=learners[id].work||{};
    out.surpriseBoosts+=(w.surpriseBoosts??0);out.replaySurpriseBoosts+=(w.replaySurpriseBoosts??0);
    out.replayDamageBoosts+=(w.replayDamageBoosts??0);out.replaySkips+=(w.replaySkips??0);}
  return out;
}
// Manipulation counters (descriptive): summed agent work tallies per row set.
// Damage arm valid iff replayDamageBoosts > 0 (damage path fired); gain arm
// valid iff replaySurpriseBoosts > 0 (surprise path fired). Neutral arms
// must read all-zero (null-arm hygiene, fail-closed in runner).
export function sumManipulationDamage(rows){
  const out={surpriseBoosts:0,replaySurpriseBoosts:0,replayDamageBoosts:0,replaySkips:0};
  for(const r of rows){const m=r.manipulation||{};
    out.surpriseBoosts+=(m.surpriseBoosts??0);out.replaySurpriseBoosts+=(m.replaySurpriseBoosts??0);
    out.replayDamageBoosts+=(m.replayDamageBoosts??0);out.replaySkips+=(m.replaySkips??0);}
  return out;
}
export function runTurnGateDamageDev({bankPath,output,resume=false}){
  const sources=turnGateDamageDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDamageDevBank(bankPathAbs);
  assert.equal(p.histories.length,DG_HISTORIES);
  // Fixture AFTER bank build (standing order since V1b).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...DG_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'turn-gate-damage-dev-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...DG_ARMS],pairs:DG_PAIRS,
      caps:{executions:300,aggregateScalarOperations:DG_OP_CAP,wallSeconds:DG_WALL_CAP_SECONDS},
      scope:'DAMAGE-GATE single run (damage-gated 3.0/1.0 vs surprise-gated HELD 1.0/3.0 vs uniform in harm->ben seg1 window; single knob binary-matched, per-transition damage schema null-default; 5 arms x 3 pairs seg1-only; conjunctive G1/G0/G2 on train/uniform/unlearned decide; D1 damage-uniform headline + D2 damage-gain descriptive; per-pair damage-presence VOID; extended null-arm hygiene fail-closed. No seg2 (compounding closed in V1h/V1i). Closes either way.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=DG_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runOne=(tag,history,options)=>runTransplant(tag,history,options,null);
  const runTransplant=(tag,history,options,srcWeights)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...(options??BT_LEARNER_OPTIONS)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      let transfer=null;
      if(srcWeights){
        for(const id of Object.keys(srcWeights))assertFreshTarget(run.learners[id],id);
        const cp=copyWeights(srcWeights,run.learners);
        const chk=checkTransplantIntegrity(srcWeights,run.learners);
        assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
        transfer={transferred:cp.transferred,total:Object.keys(srcWeights).length,
          sourceDigest:digestWeights(srcWeights),appliedDigest:digestWeights(snapshotWeights(run.learners))};
        assert.equal(transfer.sourceDigest,transfer.appliedDigest,'transplant digest mismatch');
      }
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary,manipulation:agentWorkDamage(run.learners)};
      if(transfer)row.transfer=transfer;
      if(tag!=='unlearned')row.weights=snapshotWeights(run.learners);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const pairWall={};
  for(let pi=0;pi<DG_PAIRS.length;pi++){
    const [hiTr,hiTe]=DG_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    for(const [tag,opts] of [['transferred',undefined],['transferred-damage',DG_DAMAGE_OPTS],['transferred-gain',DG_GAIN_OPTS]]){
      const r=runTransplant(tag,hTe,opts,trainRow.weights);wall+=r.wall;cpuS+=r.cpuS;
    }
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDamageDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=DG_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreTurnGateDamage(rows);
  assert.equal(ledger.mains,DG_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,DG_EXPECT_PROBES,'Dev probes count mismatch');
  const flipOf=(hiTr,hiTe,tag)=>{
    const tr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='train');
    const te=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag===tag);
    return scoreFlipSplit(tr,te);
  };
  const flipSplitUniform=DG_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred'));
  const flipSplitDamage=DG_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred-damage'));
  const flipSplitGain=DG_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred-gain'));
  const mechU=flipSplitUniform.every(mechanismConfirmed);
  // D1: damage-uniform HB on the extinction subset; D2: damage-gain HB.
  const hbD1=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitDamage[i],'flippedHB'));
  const hbD2=flipSplitGain.map((f,i)=>subsetGap(f,flipSplitDamage[i],'flippedHB'));
  const sameD1=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitDamage[i],'same'));
  const sameD2=flipSplitGain.map((f,i)=>subsetGap(f,flipSplitDamage[i],'same'));
  // Damage-presence per pair (fail-informative VOID): the damage-seg1 row
  // must show damage occurred (endpoint totals), else that pair's D1/D2
  // are unanswered (a damage gate untestable without damage).
  const damagePresent=DG_PAIRS.map(([,hiTe])=>
    rowDamage(rows.find(x=>x.history.seed===p.histories[hiTe].seed&&x.tag==='transferred-damage')));
  const usable=hbD1.map((d,i)=>d!==null&&damagePresent[i]);
  const usableD1=hbD1.filter((_,i)=>usable[i]);
  const d1Mean=usableD1.length?usableD1.reduce((a,c)=>a+c,0)/usableD1.length:null;
  const d2Vals=hbD2.filter((_,i)=>usable[i]);
  const d2Mean=d2Vals.length?d2Vals.reduce((a,c)=>a+c,0)/d2Vals.length:null;
  const manipulation={};
  for(const tag of DG_ARMS)manipulation[tag]=sumManipulationDamage(rows.filter(r=>r.tag===tag));
  const nullClean=['train','transferred','unlearned'].every(t=>
    (manipulation[t].surpriseBoosts??0)===0&&(manipulation[t].replaySurpriseBoosts??0)===0&&(manipulation[t].replayDamageBoosts??0)===0);
  const gainClean=(manipulation['transferred-gain'].replayDamageBoosts??0)===0;
  const damageClean=(manipulation['transferred-damage'].replaySurpriseBoosts??0)===0;
  const damageFired=(manipulation['transferred-damage'].replayDamageBoosts??0)>0;
  const gainFired=(manipulation['transferred-gain'].replaySurpriseBoosts??0)>0;
  let verdict=decision;
  if(!nullClean||!gainClean||!damageClean)verdict={...decision,go:false,verdict:'INVALID',nullHygieneViolated:true};
  else if(usableD1.length<2)verdict={...decision,go:false,verdict:'INCOMPLETE-NODAMAGE'};
  else{
    const go=decision.go&&d1Mean!==null&&d1Mean>DG_D1_BAND&&damageFired;
    verdict={...decision,go,verdict:go?'PHASE-D1-GO':'PHASE-D1-NOGO'};
  }
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,flipSplitUniform,flipSplitDamage,flipSplitGain,
    mechanismConfirmedUniform:mechU,hbD1,hbD2,d1Mean,d2Mean,sameD1,sameD2,damagePresent,
    usablePairs:usableD1.length,manipulation,nullClean,gainClean,damageClean,damageFired,gainFired,
    ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,flipSplitUniform,flipSplitDamage,flipSplitGain,
    mechanismConfirmedUniform:mechU,hbD1,hbD2,d1Mean,d2Mean,sameD1,sameD2,damagePresent,
    usablePairs:usableD1.length,manipulation,nullClean,gainClean,damageClean,damageFired,gainFired};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
