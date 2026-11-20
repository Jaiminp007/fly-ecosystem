// TURN-GATED Phase-G dev instrument (FROZEN under docs/TURN_GATE_PLAN_V1G.md).
// Dose escalation + selection-vs-boost decomposition: per pair, train
// (1792, base options; transplant source) + transferred-uniform (1792,
// base; gated V1c-replication) + transferred-tournament (1792, base +
// replayTournament:3; escalated pure selection) + transferred-gain (1792,
// base + surpriseGain:1.0/replaySurpriseGain:3; boost-only, completes the
// decomposition) + transferred-bundle (1792, base + T3 + gain 1.0 + replay
// gain 3; full escalation) + unlearned (1792, frozen flat control) =
// 18 mains (BT_TICKS=1792 every arm), ZERO probes. All test arms
// transplant the SAME train-end weights (uniform training isolates the
// extinction window). The identical transplant machinery (snapshot/copy/
// assertFreshTarget/integrity) is applied four times per pair.
// G0 training gate (>=0.5 all 3); G2a uniform mean gap >=0.3; G2b unlearned
// flat (<=0.1) all 3; verdict GO/NOGO/INCOMPLETE-UNTRAINED/INVALID
// (PHASE-G-*). Uniform mechanism replication (6th check) +
// direction-aware intervention gaps (HB extinction subset pre-registered;
// BH ceiling no-claim; +0.1 band grounded in V1d increment) +
// manipulation counters (bundle VOID-condition; null-arm hygiene
// fail-closed) recorded separately. No convergence gate (V1e reasoning).
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

export const T7_EXPERIMENT='turn-gated-dev-v1g';
export const T7_HISTORIES=6;
export const T7_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const T7_ARMS=Object.freeze(['train','transferred','transferred-tournament','transferred-gain','transferred-bundle','unlearned']);
export const T7_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>412001+j));
const T7_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054]];
export const T7_SPENT_SEEDS=Object.freeze([381001,...T7_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const T7_EXPECT_MAINS=18, T7_EXPECT_PROBES=0;
// Intervention options (fixture-guarded contrast): tournament = base + 1
// key @3 (escalated pure selection); gain = base + 2 keys @1.0/3
// (boost-only, completes the decomposition); bundle = base + 3 keys
// @3/1.0/3 (full escalation). One rung up each ladder from V1f.
export const T7_TOURNAMENT_OPTS=Object.freeze({...BT_LEARNER_OPTIONS,replayTournament:3});
export const T7_GAIN_OPTS=Object.freeze({...BT_LEARNER_OPTIONS,surpriseGain:1.0,replaySurpriseGain:3});
export const T7_BUNDLE_OPTS=Object.freeze({...BT_LEARNER_OPTIONS,replayTournament:3,surpriseGain:1.0,replaySurpriseGain:3});
export const T7_OP_CAP=20_000_000_000, T7_WALL_CAP_SECONDS=3600;
export const T7_JOIN_MIN=0.99, T7_TRAIN_GAP=0.5, T7_TRANSFER_GAP=0.3, T7_FLAT_TOL=0.1;
export const T7_SAME_MIN=0.85, T7_FLIP_LO=0.4, T7_FLIP_HI=0.7;
export const T7_CONVERGE_MIN=0.85, T7_RIGID_LO=0.4, T7_RIGID_HI=0.7;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function turnGateV1gExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/turn-gated-dev-v1g.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1G.md','tests/turn-gated-dev-v1g.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDevV1gSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/turn-gated-dev-v1g.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/turn-gated-dev-v1g.test.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1G.md'])visit(resolve(root,name));
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
export function turnGateDevV1gBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,T7_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateV1gExtraTokens())excluded.add(t);
  for(const s of T7_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of T7_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=T7_FIXTURE_SEEDS.length/T7_HISTORIES===9?Array.from({length:T7_HISTORIES},(_,h)=>{
    const s=T7_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,T7_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:T7_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'TURN-GATED Phase-G dev bank (deterministic fresh 412001-412054, 9/history, 6 histories). First use is the single V1g run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Weight snapshot: plain {id:{weightKey:[...]}} map (no behavior, no RNG).
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
// Transplant: copy ONLY weight arrays from a snapshot into target agents.
// The caller guarantees fresh targets (see assertFreshTarget); copyWeights
// itself checks ids + shapes so a partial/wrong transplant fails loudly.
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
// Fresh-target contract (all non-weights state that a transplant must not
// inherit): tick bookkeeping zeroed, buffers empty, no pending motor state.
export function assertFreshTarget(agent,id){
  assert.equal(agent.lastObservedTick,0,'target not fresh (lastObservedTick) '+id);
  assert.equal(agent.lastDecisionTick,0,'target not fresh (lastDecisionTick) '+id);
  assert.ok(Array.isArray(agent.recent)&&agent.recent.length===0&&Array.isArray(agent.older)&&agent.older.length===0,'target not fresh (buffers) '+id);
  assert.ok(agent.motorPending===null,'target not fresh (motorPending) '+id);
}
// Integrity verifier (pure): carried set (weights.*) must match exactly.
// Everything else is EXPECTED to differ (fresh downstream state).
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
// Shared pooled-gap helper (V1b-identical formula): pooled turn|harm minus
// turn|ben over a cue set, with per-cue labels from labelOf and optional
// cue filter. Used by the scorer (no filter) and the flip-split (subset
// filters on the transferred row).
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
// G1: every row (all 6 tags x 3) joinRate >= T7_JOIN_MIN, else INVALID.
// G0: train gaps >=0.5 on all 3 train histories, else INCOMPLETE-UNTRAINED.
// G2a: transferred-uniform mean gap >=0.3. G2b: unlearned |gap| <=0.1 on
// all 3. Tournament/gain/bundle rows are REQUIRED present (fail-closed
// completeness) but never gate. GO iff G1 && G0 && G2a && G2b.
export function scoreTurnGateV1g(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.train&&byTag.transferred&&byTag.unlearned,'scorer needs train + transferred + unlearned rows');
  assert.equal((byTag['transferred-tournament']||[]).length,3,'scorer needs 3 transferred-tournament rows');
  assert.equal((byTag['transferred-gain']||[]).length,3,'scorer needs 3 transferred-gain rows');
  assert.equal((byTag['transferred-bundle']||[]).length,3,'scorer needs 3 transferred-bundle rows');
  const gCounts=['train','transferred','unlearned'].every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=T7_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const transGaps=(byTag.transferred||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=T7_TRAIN_GAP);
  const tv=transGaps.map(g=>g.gap);
  const transMean=tv.length===3&&tv.every(x=>x!==null)?tv.reduce((a,c)=>a+c,0)/tv.length:null;
  const g2a=transMean!==null&&transMean>=T7_TRANSFER_GAP;
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=T7_FLAT_TOL);
  const go=g1&&g0&&g2a&&g2b;
  const verdict=!g1?'INVALID':!g0?'INCOMPLETE-UNTRAINED':go?'PHASE-G-GO':'PHASE-G-NOGO';
  return {g1,g0,g2a,g2b,transMean,trainGaps,transGaps,unlearnGaps,go,verdict};
}
// Descriptive (non-gating) flip-split (V1c Amendment A1 metric, frozen): contact-weighted
// per-cue correctness per subset. Split defined by train-row vs test-row
// labels; cues observed in only one row are excluded (counts reported);
// empty subset -> null correctness (never imputed). V1f adds direction
// subsets: flippedBH (train-benign->test-harmful; learn to turn; ceiling,
// no claim) and flippedHB (train-harmful->test-benign; unlearn turning;
// THE extinction subset, pre-registered). flipped = union (continuity).
export function scoreFlipSplit(trainRow,transferredRow){
  const trCues=trainRow.summary.cues, teCues=transferredRow.summary.cues;
  const wcorr=(labelOf,filter)=>{
    let s=0,n=0;
    for(const cue of Object.keys(teCues)){
      if(filter&&!filter(cue))continue;
      const t=teCues[cue].turn,c=teCues[cue].contact;
      if(!c)continue;
      const L=labelOf(cue);if(!L)continue;
      n+=c;s+=c*(L==='harmful'?t/c:1-t/c);
    }
    return n===0?null:+(s/n).toFixed(4);
  };
  const inBoth=cue=>cue in trCues;
  const isSame=cue=>inBoth(cue)&&trCues[cue].label===teCues[cue].label;
  const isFlipBH=cue=>inBoth(cue)&&!isSame(cue)&&trCues[cue].label==='beneficial';
  const isFlipHB=cue=>inBoth(cue)&&!isSame(cue)&&trCues[cue].label==='harmful';
  const sameCues=Object.keys(teCues).filter(c=>inBoth(c)&&isSame(c));
  const flipCues=Object.keys(teCues).filter(c=>inBoth(c)&&!isSame(c));
  const bhCues=Object.keys(teCues).filter(isFlipBH);
  const hbCues=Object.keys(teCues).filter(isFlipHB);
  const contact=cs=>cs.reduce((a,c)=>a+(teCues[c].contact||0),0);
  return {
    trainSeed:trainRow.history.seed,testSeed:transferredRow.history.seed,
    same:{cues:sameCues.length,contact:contact(sameCues),
      correctness:wcorr(c=>teCues[c].label,c=>inBoth(c)&&isSame(c))},
    flipped:{cues:flipCues.length,contact:contact(flipCues),
      correctness:wcorr(c=>teCues[c].label,c=>inBoth(c)&&!isSame(c))},
    flippedBH:{cues:bhCues.length,contact:contact(bhCues),
      correctness:wcorr(c=>teCues[c].label,isFlipBH)},
    flippedHB:{cues:hbCues.length,contact:contact(hbCues),
      correctness:wcorr(c=>teCues[c].label,isFlipHB)},
    replayed:{cues:sameCues.length+flipCues.length,contact:contact([...sameCues,...flipCues]),
      correctness:wcorr(c=>trCues[c]?.label,inBoth)}
  };
}
// Direction-aware subset gap (descriptive, pre-registered): intervention
// minus base on a named subset ('flippedHB' = extinction subset; 'same' =
// retention guardrail; 'flippedBH' = ceiling, reported not interpreted).
// Null-aware: null in, null out (never impute, never compare to null).
export function subsetGap(baseFlip,intFlip,key){
  const a=baseFlip[key]?.correctness,b=intFlip[key]?.correctness;
  return (a===null||a===undefined||b===null||b===undefined)?null:+((b-a).toFixed(4));
}
// Per-agent work-counter harvest (exported for fixtures): summed
// surprise/replay tallies. Null-default arms must read all-zero.
export function agentWork(learners){
  const out={surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0};
  for(const id of Object.keys(learners)){const w=learners[id].work||{};
    out.surpriseBoosts+=(w.surpriseBoosts??0);out.replaySurpriseBoosts+=(w.replaySurpriseBoosts??0);out.replaySkips+=(w.replaySkips??0);}
  return out;
}
// Manipulation counters (descriptive): summed agent work tallies per row
// set. Bundle arm valid iff replaySurpriseBoosts > 0 (gain path fired);
// tournament needs none (structural selection). Uniform/train/unlearned
// must read all-zero (null-arm hygiene, fail-closed in runner).
export function sumManipulation(rows){
  const out={surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0};
  for(const r of rows){const m=r.manipulation||{};
    out.surpriseBoosts+=(m.surpriseBoosts??0);out.replaySurpriseBoosts+=(m.replaySurpriseBoosts??0);out.replaySkips+=(m.replaySkips??0);}
  return out;
}
// Mechanism criterion (descriptive): same-val retained (>=0.85) AND flipped
// near-chance partial-correction band ([0.4,0.7]).
export function mechanismConfirmed(flip){
  return flip.same.correctness!==null&&flip.same.correctness>=T7_SAME_MIN&&
    flip.flipped.correctness!==null&&flip.flipped.correctness>=T7_FLIP_LO&&
    flip.flipped.correctness<=T7_FLIP_HI;
}
// (V1f has no multi-segment chain: all test arms are seg1-equivalent,
// so no segment classifier is needed here. V1d keeps classifySeg2.)
export function runTurnGatedDevV1g({bankPath,output,resume=false}){
  const sources=turnGateDevV1gSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDevV1gBank(bankPathAbs);
  assert.equal(p.histories.length,T7_HISTORIES);
  // Fixture AFTER bank build (standing order since V1b; V1 pre-built its file).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...T7_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'turn-gated-v1g-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...T7_ARMS],pairs:T7_PAIRS,
      caps:{executions:300,aggregateScalarOperations:T7_OP_CAP,wallSeconds:T7_WALL_CAP_SECONDS},
      scope:'TURN-GATED Phase-G single run (dose escalation + selection-vs-boost decomposition: uniform seg1 gated V1c-replication + tournament-T3 + gain-only + bundle-strong intervention arms, all transplanted from uniform-trained weights; unlearned flat control). Train + uniform + tournament + gain + bundle + unlearned full runs; conjunctive G1/G0/G2 on train/uniform/unlearned decide; direction-aware intervention gaps + manipulation/void-conditions/overdose-reading non-gating; null-arm hygiene fail-closed; +0.1 band fixed; pre-registered stop rule.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=T7_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runOne=(tag,history,options)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectTurnChoice();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...(options??BT_LEARNER_OPTIONS)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary,manipulation:agentWork(run.learners)};
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
  for(let pi=0;pi<T7_PAIRS.length;pi++){
    const [hiTr,hiTe]=T7_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    // 1. train on H_tr (weights snapshot saved on the row)
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    // 2. transferred-uniform on H_te: fresh run + transplant of TRAIN-END weights (gated arm, base options)
    {
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag==='transferred'&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag:'transferred',seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:transferred`);
        const collector=collectTurnChoice();
        const {wall:w2,cpuS:c2}=timed(`transferred/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const cp=copyWeights(trainRow.weights,run.learners);
          const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
          assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
          const row={history:{seed:hTe.seed},tag:'transferred',endpoint:null,summary:null,
            transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
              sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`transferred/${hTe.seed}`);
          row.summary=collector.summarize();
          row.manipulation=agentWork(run.learners);
          note(1,0,BT_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w2;cpuS+=c2;
      }
    }
    // 3. transferred-tournament on H_te: fresh run + transplant of TRAIN-END weights (pure selection arm)
    {
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag==='transferred-tournament'&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag:'transferred-tournament',seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:transferred-tournament`);
        const collector=collectTurnChoice();
        const {wall:w3,cpuS:c3}=timed(`transferred-tournament/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...T7_TOURNAMENT_OPTS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const cp=copyWeights(trainRow.weights,run.learners);
          const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
          assert.ok(chk.ok,'tournament transplant integrity failed: '+chk.violations.join(';'));
          const row={history:{seed:hTe.seed},tag:'transferred-tournament',endpoint:null,summary:null,
            transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
              sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'tournament transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`transferred-tournament/${hTe.seed}`);
          row.summary=collector.summarize();
          row.manipulation=agentWork(run.learners);
          note(1,0,BT_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred-tournament.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred-tournament',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w3;cpuS+=c3;
      }
    }
    // 4. transferred-gain on H_te: fresh run + transplant of TRAIN-END weights (boost-only arm)
    {
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag==='transferred-gain'&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag:'transferred-gain',seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:transferred-gain`);
        const collector=collectTurnChoice();
        const {wall:w4,cpuS:c4}=timed(`transferred-gain/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...T7_GAIN_OPTS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const cp=copyWeights(trainRow.weights,run.learners);
          const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
          assert.ok(chk.ok,'gain transplant integrity failed: '+chk.violations.join(';'));
          const row={history:{seed:hTe.seed},tag:'transferred-gain',endpoint:null,summary:null,
            transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
              sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'gain transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`transferred-gain/${hTe.seed}`);
          row.summary=collector.summarize();
          row.manipulation=agentWork(run.learners);
          note(1,0,BT_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred-gain.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred-gain',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w4;cpuS+=c4;
      }
    }
    // 5. transferred-bundle on H_te: fresh run + transplant of TRAIN-END weights (full escalation arm)
    {
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag==='transferred-bundle'&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag:'transferred-bundle',seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:transferred-bundle`);
        const collector=collectTurnChoice();
        const {wall:w4,cpuS:c4}=timed(`transferred-bundle/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...T7_BUNDLE_OPTS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const cp=copyWeights(trainRow.weights,run.learners);
          const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
          assert.ok(chk.ok,'bundle transplant integrity failed: '+chk.violations.join(';'));
          const row={history:{seed:hTe.seed},tag:'transferred-bundle',endpoint:null,summary:null,
            transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
              sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'bundle transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`transferred-bundle/${hTe.seed}`);
          row.summary=collector.summarize();
          row.manipulation=agentWork(run.learners);
          note(1,0,BT_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred-bundle.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred-bundle',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w4;cpuS+=c4;
      }
    }
    // 6. unlearned control on H_te
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDevV1gSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=T7_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreTurnGateV1g(rows);
  assert.equal(ledger.mains,T7_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,T7_EXPECT_PROBES,'Dev probes count mismatch');
  const flipOf=(hiTr,hiTe,tag)=>{
    const tr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='train');
    const te=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag===tag);
    return scoreFlipSplit(tr,te);
  };
  const flipSplitUniform=T7_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred'));
  const mechU=flipSplitUniform.every(mechanismConfirmed);
  const flipSplitTournament=T7_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred-tournament'));
  const flipSplitGain=T7_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred-gain'));
  const flipSplitBundle=T7_PAIRS.map(([hiTr,hiTe])=>flipOf(hiTr,hiTe,'transferred-bundle'));
  const hbGapTournament=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitTournament[i],'flippedHB'));
  const hbGapGain=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitGain[i],'flippedHB'));
  const hbGapBundle=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitBundle[i],'flippedHB'));
  const sameGapTournament=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitTournament[i],'same'));
  const sameGapGain=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitGain[i],'same'));
  const sameGapBundle=flipSplitUniform.map((f,i)=>subsetGap(f,flipSplitBundle[i],'same'));
  const manipulation={};
  for(const tag of T7_ARMS)manipulation[tag]=sumManipulation(rows.filter(r=>r.tag===tag));
  const nullClean=['train','transferred','unlearned'].every(t=>
    (manipulation[t].surpriseBoosts??0)===0&&(manipulation[t].replaySurpriseBoosts??0)===0);
  const bundleFired=(manipulation['transferred-bundle'].replaySurpriseBoosts??0)>0;
  const gainFired=(manipulation['transferred-gain'].replaySurpriseBoosts??0)>0;
  let verdict=decision;
  if(!nullClean)verdict={...decision,go:false,verdict:'INVALID',nullHygieneViolated:true};
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,flipSplitUniform,mechanismConfirmedUniform:mechU,
    flipSplitTournament,flipSplitGain,flipSplitBundle,hbGapTournament,hbGapGain,hbGapBundle,
    sameGapTournament,sameGapGain,sameGapBundle,
    manipulation,nullClean,bundleFired,gainFired,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,flipSplitUniform,mechanismConfirmedUniform:mechU,
    flipSplitTournament,flipSplitGain,flipSplitBundle,hbGapTournament,hbGapGain,hbGapBundle,
    sameGapTournament,sameGapGain,sameGapBundle,
    manipulation,nullClean,bundleFired,gainFired};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
