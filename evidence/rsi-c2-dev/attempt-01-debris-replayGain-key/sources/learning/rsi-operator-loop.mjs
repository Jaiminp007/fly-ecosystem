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
]);
export const OL_LIFETIME_MAX=4;
export const OL_PROPOSAL_TICK=1024;
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
export function sandboxEvaluate(tasteState,operator,fitIds,testIds){
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
    for(const r of fitRecs)tasteUpdate(clone,r,'replay',noop,1+operator.gain);
  }else if(operator.kind==='replaySkip'){
    assert.ok(Number.isFinite(operator.skip)&&operator.skip>=0,'replay skip must be non-negative');
    for(const r of fitRecs){
      const p=tastePrediction(clone,r.phi),e=r.target-p;
      if(e*e<operator.skip*operator.skip)continue;
      tasteUpdate(clone,r,'replay',noop,1);
    }
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
    incErr:+incErr.toFixed(6),candErr:+candErr.toFixed(6),adopted,fee};
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
export function fireLooperProposal(t,menuIndex){
  assert.ok(t&&t.rsiLoop,'operator loop not attached');
  const records=[...t.recent,...t.older].sort((a,b)=>a.experience-b.experience);
  if(records.length<OL_MIN_RECORDS||t.rsiLoop.proposals.length>=OL_LIFETIME_MAX)return {skipped:true};
  const op=proposeOperator(t,menuIndex);
  const half=Math.floor(records.length/2);
  const fitIds=records.slice(0,half).map(r=>r.experience),testIds=records.slice(half).map(r=>r.experience);
  const ev=sandboxEvaluate(t,op,fitIds,testIds);
  if(ev.adopted)adoptOperatorLive(t,op);
  return {skipped:false,eval:ev};
}
export function loopDigest(tasteState){
  assert.ok(tasteState&&tasteState.rsiLoop,'operator loop not attached');
  return JSON.stringify(tasteState.rsiLoop);
}
