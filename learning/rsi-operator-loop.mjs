// RSI C1: agent-internal operator loop (B-design). FROZEN under
// docs/RSI_C1_PLAN_V1.md. The controller proposes operator revisions from
// a pre-registered menu, evaluates each by sandbox replay on its OWN
// retained experiences (fit/test split, clone math), and adopts into a
// candidate log iff sandboxed improvement >= 5%. NO live adoption here
// (weights/config untouched outside sandbox; live validation is C2).
// Billing mirrors V1c (flat fee per proposal); checkpoint byte-identity
// verified (live never touched — sandbox clones). Zero worlds.
import assert from 'node:assert/strict';
import {tasteUpdate,tastePrediction} from './taste-energy.mjs';

export const OL_MENU=Object.freeze([
  {kind:'replayGain',gain:0.5},{kind:'replayGain',gain:1.0},{kind:'replayGain',gain:2.0},
  {kind:'replaySkip',skip:0.05},{kind:'replaySkip',skip:0.1},
  {kind:'shrinkOnce',alpha:0.25},
  // C6 addition (append-only; indices 0-5 untouched, prior lines bit-identical):
  // surprise-gated gain = V1h's deployed operator (live surpriseGain + replay
  // replaySurpriseGain), proposable internally. Fired only when proposed+adopted.
  {kind:'replaySurprise',gain:3.0,live:1.0},
  // C12 addition (append-only; indices 0-6 untouched, prior lines bit-identical):
  // learning-rate revision = the update rule itself (VISION hook). Fired only
  // when proposed+adopted. No state init (rate is read per-update); adoption
  // is config-only like gain/skip (no extra billing beyond the flat eval fee).
  {kind:'tasteRate',rate:2.0},
  // C14 addition (append-only; indices 0-7 untouched, prior lines bit-identical):
  // sparse update = input-conditioned target selection (TFGN/Panetta/Tiwari).
  // Top-fraction weights by |phi*w| stay plastic per tick; rest frozen.
  // Mask recomputed per tick from current phi; adoption config-only.
  {kind:'sparseUpdate',fraction:0.5,rule:'activation'},
]);
export const OL_LIFETIME_MAX=4;
export const OL_PROPOSAL_TICK=1024;
export const OL_PROPOSAL_TICK_EARLY=512; // C13: double-fire early tick (single authorized addition; all other arms 1024-only)
export const OL_MIN_RECORDS=4;
export const OL_ADOPT_FACTOR=0.95; // candErr < incErr x 0.95 (5% bar)
export function attachOperatorLoop(tasteState){
  assert.ok(tasteState&&typeof tasteState==='object'&&!tasteState.rsiLoop);
  tasteState.rsiLoop={proposals:[],evaluations:0};
  return tasteState;
}
export function proposeOperator(tasteState,index){
  assert.ok(tasteState&&tasteState.rsiLoop,'operator loop not attached');
  assert.ok(Number.isInteger(index)&&index>=0&&index<OL_MENU.length,'menu-closed: unknown operator index');
  assert.ok(tasteState.rsiLoop.proposals.length<OL_LIFETIME_MAX,'lifetime proposal budget spent');
  return structuredClone(OL_MENU[index]);
}
function sandboxDims(fit,test){
  const dims=new Set([...fit,...test].map(r=>r.phi.length));
  assert.equal(dims.size,1,'sandbox records must share one phi dimension');
  const [D]=[...dims];
  assert.ok(Number.isInteger(D)&&D>=1&&D<=128,'sandbox phi dimension out of bounds');
  return D;
}
function splitById(records,fitIds,testIds){
  const fit=new Set(fitIds),test=new Set(testIds);
  for(const id of fit)assert.ok(!test.has(id),'fit/test experience ids must be disjoint (anti-sandbagging)');
  const fitRecs=[],testRecs=[];
  for(const r of records){
    assert.ok(Number.isInteger(r.experience),'retained records need experience ids');
    if(fit.has(r.experience))fitRecs.push(r);
    else if(test.has(r.experience))testRecs.push(r);
  }
  assert.ok(fitRecs.length>0&&testRecs.length>0,'sandbox needs non-empty fit and test sets');
  return {fitRecs,testRecs};
}
function heldOutError(weights,tasteScale,priorLogit,testRecs){
  let s=0;
  for(const r of testRecs){
    const dot=w=>r.phi.reduce((a,v,j)=>a+v*w[j],0);
    const p=1/(1+Math.exp(-(priorLogit+dot(weights))));
    const e=r.target-p;s+=e*e;
  }
  return s/testRecs.length;
}
export function sandboxEvaluate(tasteState,operator,fitIds,testIds,tick=null){
  const fireTick=Number.isInteger(tick)?tick:(Number.isInteger(tasteState.lastDecisionTick)?tasteState.lastDecisionTick:null); // C14: tick-per-vote (null-default; multi-fire lines split first/second)
  assert.ok(tasteState&&tasteState.rsiLoop,'operator loop not attached');
  assert.ok(operator&&typeof operator.kind==='string','bad operator spec');
  assert.ok(tasteState.rsiLoop.proposals.length<OL_LIFETIME_MAX,'lifetime proposal budget spent');
  assert.ok(tasteState.config.phaseSlots===1&&tasteState.config.streams===1,'sandbox mirrors the single-phase single-stream path (BT scope; other configs fail closed)');
  const records=[...tasteState.recent,...tasteState.older];
  assert.ok(records.length>0,'sandbox needs retained experiences (migration rule)');
  const {fitRecs,testRecs}=splitById(records,fitIds,testIds);
  const D=sandboxDims(fitRecs,testRecs);
  // Checkpoint: canonical live snapshot (digest-verified untouched after).
  const before=canonicalSnapshot(tasteState);
  // Clone math: full-state clone, operator applied, fit records replayed.
  const clone=structuredClone(tasteState);
  delete clone.rsiLoop;
  // clone keeps its full work ledger (discarded after); the live state pays the V1c flat fee only.
  const noop=()=>{};
  if(operator.kind==='shrinkOnce'){
    assert.ok(Number.isFinite(operator.alpha)&&operator.alpha>0&&operator.alpha<1,'shrink alpha must be in (0,1)');
    for(const k of Object.keys(clone.weights))clone.weights[k]=clone.weights[k].map(v=>v*operator.alpha);
  }else if(operator.kind==='replayGain'){
    assert.ok(Number.isFinite(operator.gain)&&operator.gain>=0,'replay gain must be non-negative');
    clone.config.replayGain=operator.gain; // same path live adoption takes (config, not boost)
    for(const r of fitRecs)tasteUpdate(clone,r,'replay',noop,1);
  }else if(operator.kind==='replaySkip'){
    assert.ok(Number.isFinite(operator.skip)&&operator.skip>=0,'replay skip must be non-negative');
    for(const r of fitRecs){
      const p=tastePrediction(clone,r.phi),e=r.target-p;
      if(e*e<operator.skip*operator.skip)continue;
      tasteUpdate(clone,r,'replay',noop,1);
    }
  }else if(operator.kind==='replaySurprise'){
    assert.ok(Number.isFinite(operator.gain)&&operator.gain>=0,'replay surprise gain must be non-negative');
    assert.ok(Number.isFinite(operator.live)&&operator.live>=0,'replay surprise live gain must be non-negative');
    clone.config.surpriseGain=operator.live;clone.config.replaySurpriseGain=operator.gain;
    clone.surpriseEma=0;clone.surpriseTimer=0; // adoption-time init (construction creates these when surpriseGain>0)
    // Live-mode fit: emulates acquisition under the operator (the gate needs live surprise history).
    for(const r of fitRecs)tasteUpdate(clone,r,'live',noop,1);
  }else if(operator.kind==='tasteRate'){
    assert.ok(Number.isFinite(operator.rate)&&operator.rate>0,'taste rate must be positive');
    clone.config.tasteRate=operator.rate; // the update rule itself (read per-update in both modes)
    for(const r of fitRecs)tasteUpdate(clone,r,'replay',noop,1);
  }else if(operator.kind==='sparseUpdate'){
    assert.ok(Number.isFinite(operator.fraction)&&operator.fraction>0&&operator.fraction<1,'sparse fraction must be in (0,1)');
    assert.equal(operator.rule,'activation','sparse rule must be activation (rule (b) is a future line)');
    clone.config.sparseUpdate={fraction:operator.fraction,rule:operator.rule}; // same path live adoption takes
    for(const r of fitRecs)tasteUpdate(clone,r,'replay',noop,1);
  }else throw Error('menu-closed: unknown operator kind');
  const incErr=heldOutError(tasteState.weights.taste,tasteState.tasteScale,tasteState.priorLogit,testRecs);
  const candErr=heldOutError(clone.weights.taste,clone.tasteScale,clone.priorLogit,testRecs);
  // Billing (V1c form): flat fee covers the evaluation.
  const fee=2*(fitRecs.length+testRecs.length)*(D+1);
  tasteState.work.scalarOperations+=fee;
  // Checkpoint verify: live untouched (sandbox cloned).
  assert.equal(digestSnapshot(tasteState),digestSnapshot(before.state),'live state touched by sandbox (byte-identity violated)');
  const adopted=candErr<incErr*OL_ADOPT_FACTOR;
  const evalRec={operator:structuredClone(operator),fitN:fitRecs.length,testN:testRecs.length,
    incErr:+incErr.toFixed(6),candErr:+candErr.toFixed(6),adopted,fee,tick:fireTick};
  tasteState.rsiLoop.proposals.push(evalRec);
  tasteState.rsiLoop.evaluations++;
  return evalRec;
}
function canonicalSnapshot(t){
  return {state:{weights:structuredClone(t.weights),recent:structuredClone(t.recent),older:structuredClone(t.older),
    feedRngState:t.feedRngState,motorRngState:t.motorRngState,retentionRngState:t.retentionRngState,replayRngState:t.replayRngState,
    tasteExamples:t.tasteExamples,acquiredTasteExamples:t.acquiredTasteExamples,decisions:t.decisions,
    lastDecisionTick:t.lastDecisionTick,lastObservedTick:t.lastObservedTick,config:structuredClone(t.config)}};
}
function digestSnapshot(t){
  const c=t.weights?t:{weights:t.weights,recent:t.recent,older:t.older};
  return JSON.stringify({weights:c.weights,recent:c.recent,older:c.older,
    feedRngState:c.feedRngState,motorRngState:c.motorRngState,retentionRngState:c.retentionRngState,replayRngState:c.replayRngState,
    tasteExamples:c.tasteExamples,decisions:c.decisions,lastDecisionTick:c.lastDecisionTick,lastObservedTick:c.lastObservedTick});
}
export function adoptOperatorLive(t,operator){
  assert.ok(t&&typeof t==='object','live adoption needs a taste state');
  if(operator.kind==='replayGain'){assert.ok(Number.isFinite(operator.gain)&&operator.gain>=0,'bad gain');t.config.replayGain=operator.gain;}
  else if(operator.kind==='replaySkip'){assert.ok(Number.isFinite(operator.skip)&&operator.skip>=0,'bad skip');t.config.replaySkip=operator.skip;}
  else if(operator.kind==='tasteRate'){assert.ok(Number.isFinite(operator.rate)&&operator.rate>0,'bad rate');t.config.tasteRate=operator.rate;}
  else if(operator.kind==='sparseUpdate'){assert.ok(Number.isFinite(operator.fraction)&&operator.fraction>0&&operator.fraction<1,'bad sparse fraction');assert.equal(operator.rule,'activation','bad sparse rule');t.config.sparseUpdate={fraction:operator.fraction,rule:operator.rule};}
  else if(operator.kind==='replaySurprise'){assert.ok(Number.isFinite(operator.gain)&&operator.gain>=0,'bad surprise gain');assert.ok(Number.isFinite(operator.live)&&operator.live>=0,'bad surprise live gain');
    t.config.surpriseGain=operator.live;t.config.replaySurpriseGain=operator.gain;
    t.surpriseEma=0;t.surpriseTimer=0; // adoption-time init (see sandbox branch)
    t.work.scalarOperations+=2;}
  else if(operator.kind==='shrinkOnce'){assert.ok(Number.isFinite(operator.alpha)&&operator.alpha>0&&operator.alpha<1,'bad alpha');
    let n=0;for(const k of Object.keys(t.weights)){t.weights[k]=t.weights[k].map(v=>v*operator.alpha);n+=t.weights[k].length;}
    t.work.scalarOperations+=n;
  }
  else throw Error('menu-closed: unknown operator kind');
  return {kind:operator.kind};
}
// Fire-once proposal at the pre-registered tick (experiment wire calls this
// per agent after observation). Temporal fit/test split (older/newer halves).
// Skips (no-op record) when retained experience is insufficient — fail-closed
// safety net, not a verdict path (G2a fails if no adoption).
export function fireLooperProposal(t,menuIndex,tick=null){
  assert.ok(t&&t.rsiLoop,'operator loop not attached');
  const records=[...t.recent,...t.older].sort((a,b)=>a.experience-b.experience);
  if(records.length<OL_MIN_RECORDS||t.rsiLoop.proposals.length>=OL_LIFETIME_MAX)return {skipped:true};
  const op=proposeOperator(t,menuIndex);
  const half=Math.floor(records.length/2);
  const fitIds=records.slice(0,half).map(r=>r.experience),testIds=records.slice(half).map(r=>r.experience);
  const ev=sandboxEvaluate(t,op,fitIds,testIds,tick);
  if(ev.adopted)adoptOperatorLive(t,op);
  return {skipped:false,eval:ev};
}
export function fireLooperChoice(t,indices,tick=null){
  assert.ok(t&&t.rsiLoop,'operator loop not attached');
  assert.ok(Array.isArray(indices)&&indices.length>0,'choice needs a non-empty index list');
  const records=[...t.recent,...t.older].sort((a,b)=>a.experience-b.experience);
  if(records.length<OL_MIN_RECORDS||t.rsiLoop.proposals.length>=OL_LIFETIME_MAX)return {skipped:true};
  const half=Math.floor(records.length/2);
  const fitIds=records.slice(0,half).map(r=>r.experience),testIds=records.slice(half).map(r=>r.experience);
  let best=null;
  for(const i of indices){
    if(t.rsiLoop.proposals.length>=OL_LIFETIME_MAX)break;
    const op=proposeOperator(t,i); // menu-closed fail-closed per index
    const ev=sandboxEvaluate(t,op,fitIds,testIds,tick);
    if(ev.adopted&&(best==null||ev.candErr<best.eval.candErr))best={op,eval:ev};
  }
  if(best)adoptOperatorLive(t,best.op);
  return {skipped:false,best:best?best.op.kind:null,n:indices.length};
}
export function fireLooperFlipChoice(t,indices,tick=null){
  assert.ok(t&&t.rsiLoop,'operator loop not attached');
  assert.ok(Array.isArray(indices)&&indices.length>0,'choice needs a non-empty index list');
  const records=[...t.recent,...t.older].sort((a,b)=>a.experience-b.experience);
  if(records.length<OL_MIN_RECORDS||t.rsiLoop.proposals.length>=OL_LIFETIME_MAX)return {skipped:true};
  const half=Math.floor(records.length/2);
  const fitIds=records.slice(0,half).map(r=>r.experience),testIds=records.slice(half).map(r=>r.experience);
  // Flip-eval: fit on TRUE labels, test on FLIPPED labels (extinction-readiness without transfer history).
  const flippedTest=testIds.map(id=>1-records.find(r=>r.experience===id).target);
  let best=null;
  for(const i of indices){
    if(t.rsiLoop.proposals.length>=OL_LIFETIME_MAX)break;
    const op=proposeOperator(t,i); // menu-closed fail-closed per index
    const ev=sandboxEvaluateFlipped(t,op,fitIds,testIds,flippedTest,tick);
    if(ev.adopted&&(best==null||ev.candErr<best.eval.candErr))best={op,eval:ev};
  }
  if(best)adoptOperatorLive(t,best.op);
  return {skipped:false,best:best?best.op.kind:null,n:indices.length};
}
function sandboxEvaluateFlipped(tasteState,operator,fitIds,testIds,flippedTargets,tick=null){
  const fireTick=Number.isInteger(tick)?tick:(Number.isInteger(tasteState.lastDecisionTick)?tasteState.lastDecisionTick:null); // C14: tick-per-vote
  // Clone of sandboxEvaluate with flipped test targets (pure: retained records untouched).
  const fit=new Set(fitIds),test=new Set(testIds);
  const records=[...tasteState.recent,...tasteState.older];
  const fitRecs=records.filter(r=>fit.has(r.experience));
  let testRecs=records.filter(r=>test.has(r.experience));
  assert.ok(fitRecs.length>0&&testRecs.length>0,'sandbox needs non-empty fit and test sets');
  testRecs=testRecs.map((r,j)=>({...r,target:flippedTargets[j]})); // flipped copies; originals untouched
  const D=sandboxDims(fitRecs,testRecs);
  const before=canonicalSnapshot(tasteState);
  const clone=structuredClone(tasteState);
  delete clone.rsiLoop;
  const noop=()=>{};
  if(operator.kind==='shrinkOnce'){
    assert.ok(Number.isFinite(operator.alpha)&&operator.alpha>0&&operator.alpha<1,'shrink alpha must be in (0,1)');
    for(const k of Object.keys(clone.weights))clone.weights[k]=clone.weights[k].map(v=>v*operator.alpha);
  }else if(operator.kind==='replayGain'){
    assert.ok(Number.isFinite(operator.gain)&&operator.gain>=0,'replay gain must be non-negative');
    clone.config.replayGain=operator.gain;
    for(const r of fitRecs)tasteUpdate(clone,r,'replay',noop,1);
  }else if(operator.kind==='replaySkip'){
    assert.ok(Number.isFinite(operator.skip)&&operator.skip>=0,'replay skip must be non-negative');
    for(const r of fitRecs){
      const p=tastePrediction(clone,r.phi),e=r.target-p;
      if(e*e<operator.skip*operator.skip)continue;
      tasteUpdate(clone,r,'replay',noop,1);
    }
  }else if(operator.kind==='replaySurprise'){
    assert.ok(Number.isFinite(operator.gain)&&operator.gain>=0,'replay surprise gain must be non-negative');
    assert.ok(Number.isFinite(operator.live)&&operator.live>=0,'replay surprise live gain must be non-negative');
    clone.config.surpriseGain=operator.live;clone.config.replaySurpriseGain=operator.gain;
    clone.surpriseEma=0;clone.surpriseTimer=0;
    for(const r of fitRecs)tasteUpdate(clone,r,'live',noop,1);
  }else if(operator.kind==='tasteRate'){
    assert.ok(Number.isFinite(operator.rate)&&operator.rate>0,'taste rate must be positive');
    clone.config.tasteRate=operator.rate;
    for(const r of fitRecs)tasteUpdate(clone,r,'replay',noop,1);
  }else throw Error('menu-closed: unknown operator kind');
  const incErr=heldOutError(tasteState.weights.taste,tasteState.tasteScale,tasteState.priorLogit,testRecs);
  const candErr=heldOutError(clone.weights.taste,clone.tasteScale,clone.priorLogit,testRecs);
  const fee=2*(fitRecs.length+testRecs.length)*(D+1);
  tasteState.work.scalarOperations+=fee;
  assert.equal(digestSnapshot(tasteState),digestSnapshot(before.state),'live state touched by sandbox (byte-identity violated)');
  const adopted=candErr<incErr*OL_ADOPT_FACTOR;
  const evalRec={operator:structuredClone(operator),fitN:fitRecs.length,testN:testRecs.length,
    incErr:+incErr.toFixed(6),candErr:+candErr.toFixed(6),adopted,fee,flipped:true,tick:fireTick};
  tasteState.rsiLoop.proposals.push(evalRec);
  tasteState.rsiLoop.evaluations++;
  return evalRec;
}
export function loopDigest(tasteState){
  assert.ok(tasteState&&tasteState.rsiLoop,'operator loop not attached');
  return JSON.stringify(tasteState.rsiLoop);
}
