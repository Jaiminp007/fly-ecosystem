// TURN-GATED Phase-J dev instrument (FROZEN under docs/TURN_GATE_PLAN_V1J.md
// + docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md). Replication of the V1b
// lossy-tutoring transplant on a fresh bank (418001-418054), with the
// flip-split pre-registered as DESCRIPTIVE (non-gating): contact-weighted
// per-cue correctness per cue-subset (same-valence vs flipped, split by
// train-row vs test-row labels) + replayed-vs-train-labels lens.
// 3 pairs x (train + transferred-exact + transferred-lossy + unlearned) = 12 mains
// (BT_TICKS=1792), ZERO probes. Transplant machinery (snapshot/copy/scale/
// fresh-target asserts/integrity/scaled-integrity) is V1b-identical. G0 training gate
// (>=0.5 all 3); G2a transferred-exact mean gap >=0.3; G2b unlearned flat (<=0.1)
// all 3; verdict GO/NOGO/INCOMPLETE-UNTRAINED/INVALID (PHASE-J-*). G-lift:
// GO-V1j iff mean flipped(lossy)-flipped(exact) >= +0.1 AND same-val(lossy) >= 0.5.
// Mechanism criterion (descriptive, recorded separately): same-val
// correctness >=0.85 AND flipped correctness in [0.4,0.7].
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

export const TJ_EXPERIMENT='turn-gated-dev-v1j';
export const TJ_HISTORIES=6;
export const TJ_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const TJ_ARMS=Object.freeze(['train','transferred','transferred-lossy','unlearned']);
export const TJ_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>418001+j));
const TJ_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054]];
export const TJ_SPENT_SEEDS=Object.freeze([381001,...TJ_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const TJ_EXPECT_MAINS=12, TJ_EXPECT_PROBES=0;
export const TJ_LIFT_MIN=0.1, TJ_SAME_FLOOR=0.5, TJ_LOSSY_ALPHA=0.5;
export const TJ_OP_CAP=20_000_000_000, TJ_WALL_CAP_SECONDS=3600;
export const TJ_JOIN_MIN=0.99, TJ_TRAIN_GAP=0.5, TJ_TRANSFER_GAP=0.3, TJ_FLAT_TOL=0.1;
export const TJ_SAME_MIN=0.85, TJ_FLIP_LO=0.4, TJ_FLIP_HI=0.7;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function turnGateV1cExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/turn-gated-dev-v1j.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md','tests/turn-gated-dev-v1j.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function turnGateDevV1jSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/turn-gated-dev-v1j.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/turn-gated-dev-v1j.test.mjs','docs/TURN_GATE_PLAN_V1.md','docs/TURN_GATE_PLAN_V1C.md','docs/TURN_GATE_PLAN_V1C_AMENDMENT_A1.md'])visit(resolve(root,name));
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
export function turnGateDevV1jBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TJ_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of turnGateV1cExtraTokens())excluded.add(t);
  for(const s of TJ_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TJ_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TJ_FIXTURE_SEEDS.length/TJ_HISTORIES===9?Array.from({length:TJ_HISTORIES},(_,h)=>{
    const s=TJ_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TJ_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:TJ_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'TURN-GATED Phase-C dev bank (deterministic fresh 418001-418054, 9/history, 6 histories). First use is the single V1j run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
export function scaleSnapshot(srcSnapshot,alpha){
  assert.ok(Number.isFinite(alpha)&&alpha>=0,'lossy alpha must be a finite non-negative number');
  const out={};
  for(const id of Object.keys(srcSnapshot)){
    const w=srcSnapshot[id];
    assert.ok(w&&typeof w==='object','missing weights for agent '+id);
    out[id]={};
    for(const k of Object.keys(w)){
      assert.ok(Array.isArray(w[k]),'non-array weights '+id+'/'+k);
      out[id][k]=w[k].map(x=>x*alpha);
    }
  }
  return out;
}
export function checkScaledIntegrity(srcSnapshot,dstLearners,alpha){
  // Lossy-tutoring integrity: applied weights must equal src x alpha EXACTLY
  // (deterministic IEEE mult; same strictness as the exact checker).
  const violations=[];
  const a=Object.keys(srcSnapshot).sort(),b=Object.keys(dstLearners||{}).sort();
  if(JSON.stringify(a)!==JSON.stringify(b))violations.push('agent-id-set mismatch');
  for(const id of a){
    const w=srcSnapshot[id],d=(dstLearners||{})[id];
    if(!d){violations.push('missing agent '+id);continue;}
    if(!w||typeof w!=='object'){violations.push('missing source snapshot '+id);continue;}
    for(const k of Object.keys(w)){
      if(!Array.isArray(d.weights?.[k])||d.weights[k].length!==w[k].length){violations.push('shape mismatch '+id+'/'+k);continue;}
      for(let i=0;i<w[k].length;i++)if(d.weights[k][i]!==w[k][i]*alpha){violations.push('value mismatch '+id+'/'+k+'['+i+']');break;}
    }
  }
  return {ok:violations.length===0,violations};
}
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
// G1: every row joinRate >= TJ_JOIN_MIN, else INVALID.
// G0: train gaps >=0.5 on all 3 train histories, else INCOMPLETE-UNTRAINED.
// G2a: transferred mean gap >=0.3. G2b: unlearned |gap| <=0.1 on all 3.
// GO iff G1 && G0 && G2a && G2b.
export function scoreTurnGateV1j(rows,pairs){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.train&&byTag.transferred&&byTag['transferred-lossy']&&byTag.unlearned,'scorer needs train + transferred + transferred-lossy + unlearned rows');
  const gCounts=['train','transferred','transferred-lossy','unlearned'].every(t=>(byTag[t]||[]).length===3);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=TJ_JOIN_MIN));
  const gapOf=r=>gapOfStats(pooledTurnGap(r.summary.cues,c=>r.summary.cues[c].label));
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const transGaps=(byTag.transferred||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=TJ_TRAIN_GAP);
  const tv=transGaps.map(g=>g.gap);
  const transMean=tv.length===3&&tv.every(x=>x!==null)?tv.reduce((a,c)=>a+c,0)/tv.length:null;
  const g2a=transMean!==null&&transMean>=TJ_TRANSFER_GAP;
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=TJ_FLAT_TOL);
  const flips=((pairs||[]).map(([trSeed,teSeed])=>{
    const tr=rows.find(r=>r.history.seed===trSeed&&r.tag==='train');
    const ex=rows.find(r=>r.history.seed===teSeed&&r.tag==='transferred');
    const lo=rows.find(r=>r.history.seed===teSeed&&r.tag==='transferred-lossy');
    if(!tr||!ex||!lo)return null;
    const fe=scoreFlipSplit(tr,ex), fl=scoreFlipSplit(tr,lo);
    if(fe.flipped.correctness===null||fl.flipped.correctness===null||fl.same.correctness===null)return null;
    return {lift:+(fl.flipped.correctness-fe.flipped.correctness).toFixed(4),sameLossy:fl.same.correctness};
  }));
  const okFlips=flips.length===3&&flips.every(x=>x!==null);
  const liftMean=okFlips?+(flips.reduce((a,x)=>a+x.lift,0)/flips.length).toFixed(4):null;
  const sameLossyMean=okFlips?+(flips.reduce((a,x)=>a+x.sameLossy,0)/flips.length).toFixed(4):null;
  const gLift=liftMean!==null&&liftMean>=TJ_LIFT_MIN;
  const gFloor=sameLossyMean!==null&&sameLossyMean>=TJ_SAME_FLOOR;
  const go=g1&&g0&&g2a&&g2b&&gLift&&gFloor;
  const verdict=!g1?'INVALID':!g0?'INCOMPLETE-UNTRAINED':go?'PHASE-J-GO':'PHASE-J-NOGO';
  return {g1,g0,g2a,g2b,gLift,gFloor,transMean,trainGaps,transGaps,unlearnGaps,liftMean,sameLossyMean,flips,go,verdict};
}
// Descriptive (non-gating) flip-split (Amendment A1): contact-weighted
// per-cue correctness per subset. Split defined by train-row vs test-row
// labels; cues observed in only one row are excluded (counts reported);
// empty subset -> null correctness (never imputed).
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
  const sameCues=Object.keys(teCues).filter(c=>inBoth(c)&&isSame(c));
  const flipCues=Object.keys(teCues).filter(c=>inBoth(c)&&!isSame(c));
  const contact=cs=>cs.reduce((a,c)=>a+(teCues[c].contact||0),0);
  return {
    trainSeed:trainRow.history.seed,testSeed:transferredRow.history.seed,
    same:{cues:sameCues.length,contact:contact(sameCues),
      correctness:wcorr(c=>teCues[c].label,c=>inBoth(c)&&isSame(c))},
    flipped:{cues:flipCues.length,contact:contact(flipCues),
      correctness:wcorr(c=>teCues[c].label,c=>inBoth(c)&&!isSame(c))},
    replayed:{cues:sameCues.length+flipCues.length,contact:contact([...sameCues,...flipCues]),
      correctness:wcorr(c=>trCues[c]?.label,inBoth)}
  };
}
// Mechanism criterion (descriptive): same-val retained (>=0.85) AND flipped
// near-chance partial-correction band ([0.4,0.7]).
export function mechanismConfirmed(flip){
  return flip.same.correctness!==null&&flip.same.correctness>=TJ_SAME_MIN&&
    flip.flipped.correctness!==null&&flip.flipped.correctness>=TJ_FLIP_LO&&
    flip.flipped.correctness<=TJ_FLIP_HI;
}
export function runTurnGatedDevV1j({bankPath,output,resume=false}){
  const sources=turnGateDevV1jSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=turnGateDevV1jBank(bankPathAbs);
  assert.equal(p.histories.length,TJ_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson; V1 pre-built its file).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TJ_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'turn-gated-v1j-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...TJ_ARMS],pairs:TJ_PAIRS,
      caps:{executions:300,aggregateScalarOperations:TJ_OP_CAP,wallSeconds:TJ_WALL_CAP_SECONDS},
      scope:'TURN-GATED Phase-J single run (V1d-mirror + lossy-tutoring transplant x0.5). Train full runs, checkpoint-carryover transplant (exact + lossy), test full runs; conjunctive G1/G0/G2 decide lift; Amendment A1 governs the flip-split metric.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TJ_OP_CAP,'Dev aggregate op cap breached');};
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
  for(let pi=0;pi<TJ_PAIRS.length;pi++){
    const [hiTr,hiTe]=TJ_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    // 1. train on H_tr (weights snapshot saved on the row)
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    // 2. transferred test on H_te: fresh run + transplant, then advance
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
          note(1,0,BT_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w2;cpuS+=c2;
      }
    }
    // 2b. transferred-lossy test on H_te: fresh run + transplant of
    // train-end weights x TJ_LOSSY_ALPHA, then advance. Same machinery as
    // the exact arm; integrity is scaled (applied == src x alpha); the
    // scale bills +1 mul/element (treatment asymmetry, noise precedent).
    {
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag==='transferred-lossy'&&r.summary);
      if(found)console.log(JSON.stringify({stage:'skip',tag:'transferred-lossy',seed:hTe.seed,reason:'complete on disk'}));
      else{
        if(resume)redone.push(`${hTe.seed}:transferred-lossy`);
        const collector=collectTurnChoice();
        const {wall:w2,cpuS:c2}=timed(`transferred-lossy/${hTe.seed}`,()=>{
          const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
          for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
          const scaled=scaleSnapshot(trainRow.weights,TJ_LOSSY_ALPHA);
          const scp=copyWeights(scaled,run.learners);
          const chk=checkScaledIntegrity(trainRow.weights,run.learners,TJ_LOSSY_ALPHA);
          assert.ok(chk.ok,'lossy transplant integrity failed: '+chk.violations.join(';'));
          let scaleOps=0;for(const id of Object.keys(scaled))for(const k of Object.keys(scaled[id]))scaleOps+=scaled[id][k].length;
          const row={history:{seed:hTe.seed},tag:'transferred-lossy',endpoint:null,summary:null,
            transfer:{transplanted:scp.transferred,total:Object.keys(trainRow.weights).length,alpha:TJ_LOSSY_ALPHA,scaleOperations:scaleOps,
              sourceDigest:digestWeights(trainRow.weights),scaledDigest:digestWeights(scaled),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
          assert.equal(row.transfer.scaledDigest,row.transfer.appliedDigest,'lossy transplant digest mismatch');
          run.advance(BT_TICKS);
          row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`transferred-lossy/${hTe.seed}`);
          row.summary=collector.summarize();
          note(1,0,BT_TICKS,row.endpoint.scalarOperations+scaleOps);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${hTe.seed}-transferred-lossy.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm:'transferred-lossy',seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
        });
        wall+=w2;cpuS+=c2;
      }
    }
    // 4. unlearned control on H_te
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(turnGateDevV1jSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TJ_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const seedPairs=TJ_PAIRS.map(([hiTr,hiTe])=>[p.histories[hiTr].seed,p.histories[hiTe].seed]);
  const decision=scoreTurnGateV1j(rows,seedPairs);
  assert.equal(ledger.mains,TJ_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,TJ_EXPECT_PROBES,'Dev probes count mismatch');
  const flipExact=TJ_PAIRS.map(([hiTr,hiTe])=>{
    const tr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='train');
    const te=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag==='transferred');
    return scoreFlipSplit(tr,te);
  });
  const flipLossy=TJ_PAIRS.map(([hiTr,hiTe])=>{
    const tr=rows.find(r=>r.history.seed===p.histories[hiTr].seed&&r.tag==='train');
    const te=rows.find(r=>r.history.seed===p.histories[hiTe].seed&&r.tag==='transferred-lossy');
    return scoreFlipSplit(tr,te);
  });
  const mechExact=flipExact.every(mechanismConfirmed);
  const mechLossy=flipLossy.every(mechanismConfirmed);
  writeOver(join(outputAbs,'dev-results.json'),{...decision,flipExact,flipLossy,mechanismConfirmedExact:mechExact,mechanismConfirmedLossy:mechLossy,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...decision,flipExact,flipLossy,mechanismConfirmedExact:mechExact,mechanismConfirmedLossy:mechLossy};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
