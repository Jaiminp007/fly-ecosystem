import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {createStationaryTasteCredit,beginStationaryTasteAction,finishStationaryTasteAction} from './stationary-taste-credit.mjs';

export const TASTE_ENERGY_DEFAULTS=Object.freeze({mechanism:'stationary-taste-energy-v1',tasteDimensions:11,motorDimensions:16,
  holdTicks:16,capacity:32,recent:8,discount:.95,lambda:.9,epsilon:.1,tasteRate:.1,actorRate:.05,criticRate:.1,
  tdRmsRate:.03125,tdFloor:1e-6,advantageBound:4,weightBound:8,priorOdds:3,feedingRule:'matching',marginReadback:false});
const vector=(a,n,bound=Infinity)=>Array.isArray(a)&&a.length===n&&Array.from(a).every(v=>Number.isFinite(v)&&Math.abs(v)<=bound);
const signs=a=>vector(a,4,1)&&(a.every(v=>v===0)||a.every(v=>v===1||v===-1));
const zeros=n=>Array(n).fill(0),canonical=x=>x===0?0:x;
const keys=(value,names)=>assert.deepEqual(Object.keys(value).sort(),[...names].sort());
function math(state){
  const operation=fn=>(...args)=>{state.work.scalarOperations++;return canonical(fn(...args));};
  return {add:operation((a,b)=>a+b),sub:operation((a,b)=>a-b),mul:operation((a,b)=>a*b),div:operation((a,b)=>a/b),
    exp:operation(Math.exp),sqrt:operation(Math.sqrt),pow:operation(Math.pow),max:operation(Math.max),min:operation(Math.min),less:operation((a,b)=>a<b)};
}
function dot(state,w,x){const m=math(state);return w.reduce((sum,v,j)=>m.add(sum,m.mul(v,x[j])),0);}
function sigmoid(state,value){const m=math(state);return m.div(1,m.add(1,m.exp(m.sub(0,value))));}
function draw(state,key){state[key]=advanceRng(state[key]);state.work.scalarOperations+=6;return math(state).div(state[key],4294967296);}
function indexDraw(state,key,n){const m=math(state);const value=m.mul(draw(state,key),n);state.work.scalarOperations++;return Math.floor(value);}
function clip(state,value,bound=8){const m=math(state);return m.max(-bound,m.min(bound,value));}

export function createTasteEnergyBody(agentId,seed,options={}){
  assert.ok(options&&typeof options==='object'&&!Array.isArray(options));
  keys(options,Object.keys(options).filter(k=>['tasteLearning','normalizeMotor','cueBlind','feedingRule','tasteRepresentation','tasteRate','capacity','recent','replayStrata','replayPasses','consolidationRate','motorConsolidationRate','streams','streamHysteresis','surpriseGain','surpriseWindow','phaseSlots','slotRate','marginWidth','marginBoost','replayTournament','replayRate','replaySkip','replaySurpriseGain','evictBias','motorAnchorRate','motorAnchorStrength','motorRepresentation','holdTicks','criticWarmStart','motorRule','renewalRate','greedyInference','slowAnchorRate','slowAnchorStrength'].includes(k)));
  const {tasteLearning=true,normalizeMotor=true,cueBlind=false,feedingRule='matching',tasteRepresentation='pairwise',tasteRate=.1,capacity=32,recent=8,replayStrata=1,replayPasses=1,consolidationRate=0,motorConsolidationRate=0,streams=1,streamHysteresis=0,surpriseGain=0,surpriseWindow=0,phaseSlots=1,slotRate=.05,marginWidth=0,marginBoost=0,replayTournament=1,replayRate=1,replaySkip=0,replaySurpriseGain=0,evictBias=0,motorAnchorRate=0,motorAnchorStrength=0,motorRepresentation='shared',holdTicks=16,criticWarmStart=false,motorRule='td',renewalRate=.1,greedyInference=false,slowAnchorRate=0,slowAnchorStrength=0}=options;
  assert.ok(Number.isFinite(slowAnchorRate)&&slowAnchorRate>=0&&slowAnchorRate<=1);
  assert.ok(Number.isFinite(slowAnchorStrength)&&slowAnchorStrength>=0&&slowAnchorStrength<=1);
  assert.ok(!(slowAnchorStrength>0&&slowAnchorRate<=0));
  assert.ok(!(slowAnchorStrength>0&&(streams>1||phaseSlots>1)));
  assert.ok(Number.isFinite(motorAnchorRate)&&motorAnchorRate>=0&&motorAnchorRate<=1);
  assert.ok(Number.isFinite(motorAnchorStrength)&&motorAnchorStrength>=0&&motorAnchorStrength<=1);
  assert.ok(!(motorAnchorStrength>0&&motorAnchorRate<=0));
  assert.ok(!(motorAnchorStrength>0&&(streams>1||phaseSlots>1)));
  assert.ok(['matching','greedy'].includes(feedingRule));
  assert.ok(['pairwise','orthogonal'].includes(tasteRepresentation));assert.ok(Number.isFinite(tasteRate)&&tasteRate>0&&tasteRate<=1);
  assert.ok(Number.isInteger(capacity)&&capacity>=1&&capacity<=64&&Number.isInteger(recent)&&recent>=1&&recent<=capacity);
  assert.ok(Number.isInteger(replayStrata)&&replayStrata>=1&&replayStrata<=8);
  assert.ok(Number.isFinite(consolidationRate)&&consolidationRate>=0&&consolidationRate<=1);
  assert.ok(Number.isFinite(motorConsolidationRate)&&motorConsolidationRate>=0&&motorConsolidationRate<=1);
  assert.ok(Number.isInteger(streams)&&(streams===1||streams===2));assert.ok(Number.isInteger(replayPasses)&&replayPasses>=1);
  assert.ok(Number.isFinite(streamHysteresis)&&streamHysteresis>=0&&streamHysteresis<=1);assert.ok(Number.isFinite(surpriseGain)&&surpriseGain>=0);assert.ok(Number.isInteger(surpriseWindow)&&surpriseWindow>=0);assert.ok(phaseSlots===1||phaseSlots===2);assert.ok(Number.isFinite(slotRate)&&slotRate>0);assert.ok(Number.isFinite(marginWidth)&&marginWidth>=0);assert.ok(Number.isFinite(marginBoost)&&marginBoost>=0);assert.ok(Number.isInteger(replayTournament)&&replayTournament>=1&&replayTournament<=3);assert.ok(Number.isFinite(replayRate)&&replayRate>0);assert.ok(Number.isFinite(replaySkip)&&replaySkip>=0);assert.ok(Number.isFinite(replaySurpriseGain)&&replaySurpriseGain>=0);assert.ok(evictBias===-1||evictBias===0||evictBias===1);assert.ok(!(streams>1&&phaseSlots>1));assert.ok(!(consolidationRate>0&&phaseSlots>1));
  const tasteDimensions=tasteRepresentation==='orthogonal'?16:11;
  assert.ok(['shared','appetite','intake','balance','ecology'].includes(motorRepresentation));assert.ok([1,4,16].includes(holdTicks));
  const motorDimensions=motorRepresentation==='shared'?16:motorRepresentation==='appetite'?48:motorRepresentation==='ecology'?96:64;
  assert.ok(['td','renewal','progress'].includes(motorRule));assert.ok(Number.isFinite(renewalRate)&&renewalRate>0&&renewalRate<=1);
  if(motorRule!=='td')assert.ok(holdTicks===1&&!criticWarmStart);
  assert.ok([tasteLearning,normalizeMotor,cueBlind,criticWarmStart,greedyInference].every(v=>typeof v==='boolean'));
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isInteger(seed)&&seed>0&&seed<=0xffffffff);
  return {schema:1,kind:'own-taste-energy',agentId,config:{...TASTE_ENERGY_DEFAULTS,tasteLearning,normalizeMotor,cueBlind,feedingRule,tasteRepresentation,tasteRate,capacity,recent,replayStrata,replayPasses,consolidationRate,motorConsolidationRate,streams,streamHysteresis,surpriseGain,surpriseWindow,phaseSlots,slotRate,marginWidth,marginBoost,replayTournament,replayRate,replaySkip,replaySurpriseGain,evictBias,tasteDimensions,motorRepresentation,motorDimensions,holdTicks,slowAnchorRate,slowAnchorStrength,motorAnchorRate,motorAnchorStrength,...(criticWarmStart?{criticWarmStart:true}:{}),...(motorRule!=='td'?{motorRule,renewalRate}:{}),...(greedyInference?{greedyInference:true}:{})},
    priorLogit:Math.log(3),tasteScale:1/Math.sqrt(tasteDimensions),
    weights:{taste:zeros(tasteDimensions),actor:zeros(motorDimensions),critic:zeros(motorDimensions),...(consolidationRate>0?{slowTaste:zeros(tasteDimensions)}:{}),...(slowAnchorStrength>0?{slowDir:zeros(tasteDimensions)}:{}),...(motorAnchorStrength>0?{slowMotorDir:zeros(motorDimensions)}:{}),...(motorConsolidationRate>0?{slowActor:zeros(motorDimensions),slowCritic:zeros(motorDimensions)}:{}),...(streams>1?{tasteB:zeros(tasteDimensions)}:{})},eligibility:{actor:zeros(motorDimensions),critic:zeros(motorDimensions)},
    credit:createStationaryTasteCredit(agentId,{maskedCue:cueBlind}),hold:{cruise:false,remaining:0},motorPending:null,tdRms:0,
    recent:[],older:[],olderSeen:0,tasteExamples:0,acquiredTasteExamples:0,
    feedRngState:seed,motorRngState:(seed^0x9e3779b9)>>>0||1,retentionRngState:(seed^0xa511e9b3)>>>0||1,replayRngState:(seed^0x63d83595)>>>0||1,
    decisions:0,lastDecisionTick:0,lastObservedTick:0,awaitingObservation:false,acquisition:true,dead:false,
    work:{scalarOperations:6,liveUpdates:0,replayUpdates:0,tasteLiveUpdates:0,motorUpdates:0,surpriseBoosts:0,marginBoosts:0,replaySkips:0,replaySurpriseBoosts:0,evictSwaps:0},
    charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0},
    ...(motorRepresentation==='balance'||motorRepresentation==='ecology'?{balance:{before:null,delta:0}}:{}),...(criticWarmStart?{criticReady:false}:{}),...(greedyInference?{inference:false}:{}),...(streams>1?{streamEma:[0,0],controller:0}:{}),...(surpriseGain>0?{surpriseEma:0}:{}),...(surpriseGain>0?{surpriseTimer:0}:{}),...(phaseSlots>1?{slot:[zeros(tasteDimensions),zeros(tasteDimensions)],gapEma:null,slotC:null,activeSlot:0,slotLastTick:null}:{})};
}

function tasteFeatures(state,cue){
  const m=math(state),taste=[1,...cue];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)taste.push(m.mul(cue[a],cue[b]));
  if(state.config.tasteRepresentation==='orthogonal'){
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++)taste.push(m.mul(m.mul(cue[a],cue[b]),cue[c]));
    taste.push(m.mul(m.mul(cue[0],cue[1]),m.mul(cue[2],cue[3])));
  }
  return taste.map(v=>m.mul(v,state.tasteScale));
}
export function tasteEnergyFeatures(state,raw,cue,contactPresent,odorPresent=cue.some(v=>v!==0)){
  assert.ok(vector(raw,17,1)&&raw[16]===1&&signs(cue)&&typeof contactPresent==='boolean');
  const m=math(state);
  const taste=tasteFeatures(state,cue),base=[1,...raw.slice(0,14).map(v=>m.mul(.25,v)),contactPresent?.25:0];
  if(state.config.motorRepresentation==='shared')return {taste,motor:base};
  const prediction=odorPresent?tastePrediction(state,taste):1;
  // Ecology context is lawful: odor-bearing contact uses the cue-world blocks;
  // the odor-free original ecology uses its own search/no-contact and
  // contact blocks, never the cue-world pause policy.
  if(state.config.motorRepresentation==='ecology'&&!odorPresent){
    const context=!contactPresent?4:5;
    const motor=zeros(state.config.motorDimensions);
    motor.splice(context*16,16,...base);
    return {taste,motor,prediction};
  }
  let context=!contactPresent?0:m.less(prediction,.5)?2:1;
  if(['intake','balance','ecology'].includes(state.config.motorRepresentation)&&context===1&&m.less(0,state.balance?.delta??raw[13]))context=3;
  // The ecology representation keeps the same four cue-world blocks so frozen
  // cue probes still route where training routed; its extra blocks handle only
  // odor-free ecology movement.
  const motor=zeros(state.config.motorDimensions);
  motor.splice(context*16,16,...base);
  return {taste,motor,prediction};
}
function tastePrediction(state,phi,weights){
  const w=weights??(state.config.phaseSlots>1?state.slot[state.activeSlot]:state.config.streams>1?state.weights[state.controller===0?'taste':'tasteB']:state.weights.taste);
  return sigmoid(state,math(state).add(state.priorLogit,dot(state,w,phi)));}
// Phase-indexed taste slots: endogenous online 2-means over the slow cue EMA.
// No labels or phase boundaries; the active slot owns prediction and live
// learning, records carry their slot, replay routes to the tagged slot.
export function slotObserve(state,gap){
  const m=math(state),alpha=.02;
  if(state.gapEma===null||state.gapEma===undefined){state.gapEma=gap;state.slotC=[gap,gap];state.activeSlot=0;return;}
  state.gapEma=m.add(state.gapEma,m.mul(alpha,m.sub(gap,state.gapEma)));
  const dist=s=>{const dev=m.sub(state.gapEma,state.slotC[s]);return m.mul(dev,dev);};
  const idle=1-state.activeSlot;
  if(m.less(dist(idle),dist(state.activeSlot)))state.activeSlot=idle;
  const rho=state.config.slotRate??0.05;
  state.slotC[1-state.activeSlot]=m.add(state.slotC[1-state.activeSlot],m.mul(rho,m.sub(state.gapEma,state.slotC[1-state.activeSlot])));}
// Competitive skill streams: endogenous gating by own prediction error. The
// controller owns behavior; EMAs update on pre-update errors (the quality of
// what actually drove the action), then control reselects and learning +
// replay consolidate the winner. The idle stream freezes weight-intact.
function streamObserve(state,phi,target){
  const m=math(state),alpha=.05;
  for(let i=0;i<2;i++){
    const w=i===0?state.weights.taste:state.weights.tasteB;
    const prediction=sigmoid(state,m.add(state.priorLogit,dot(state,w,phi)));
    const dev=m.sub(target,prediction),error=m.mul(dev,dev);
    state.streamEma[i]=m.add(state.streamEma[i],m.mul(alpha,m.sub(error,state.streamEma[i])));}
  const challenger=1-state.controller;
  if(m.less(state.streamEma[challenger],m.sub(state.streamEma[state.controller],state.config.streamHysteresis)))state.controller=challenger;
}
function remember(state,record){
  const recentLimit=state.config.recent??8,olderLimit=(state.config.capacity??32)-recentLimit;
  state.recent.push(structuredClone(record));
  if(state.recent.length<=recentLimit)return;
  const displaced=state.recent.shift();state.olderSeen++;
  if(state.older.length<olderLimit){state.older.push(displaced);return;}
  const bias=state.config.evictBias??0;
  if(bias===0){const index=indexDraw(state,'retentionRngState',state.olderSeen);if(math(state).less(index,olderLimit))state.older[index]=displaced;return;}
  const m=math(state),score=r=>{const w=state.config.phaseSlots>1?state.slot[r.slot??0]:undefined;const e=m.sub(r.target,tastePrediction(state,r.phi,w));return m.mul(e,e);};
  const dScore=score(displaced);
  let victim=0,vScore=score(state.older[0]);
  for(let i=1;i<state.older.length;i++){const s=score(state.older[i]);
    if(bias>0?m.less(s,vScore):m.less(vScore,s)){victim=i;vScore=s;}}
  if(bias>0?m.less(vScore,dScore):m.less(dScore,vScore)){state.older[victim]=displaced;state.work.evictSwaps++;}
}
export function tasteUpdate(state,record,mode,emit,boost=1){
  const m=math(state),slotW=state.config.phaseSlots>1?state.slot[mode==='replay'?(record.slot??0):state.activeSlot]:undefined,prediction=tastePrediction(state,record.phi,slotW),error=m.sub(record.target,prediction);let rate=state.config.tasteRate;const gain=state.config.surpriseGain??0;
  if(mode==='live'&&gain>0){const err2=m.mul(error,error),warm=m.less(1e-4,state.surpriseEma),surprised=m.less(m.mul(2,state.surpriseEma),err2),W=state.config.surpriseWindow??0;
    let boost=false;if(state.surpriseTimer>0){boost=true;state.surpriseTimer--;}else if(warm&&surprised){boost=true;state.surpriseTimer=W;}
    if(boost){rate=m.mul(rate,m.add(1,gain));state.work.surpriseBoosts++;}
    state.surpriseEma=m.add(state.surpriseEma,m.mul(.05,m.sub(err2,state.surpriseEma)));}
  const mw=state.config.marginWidth??0,mb=state.config.marginBoost??0;
  if(mode==='live'&&mw>0&&mb>0){const dist=m.sub(prediction,.5);if(m.less(m.mul(dist,dist),m.mul(mw,mw))){rate=m.mul(rate,m.add(1,mb));state.work.marginBoosts++;}}
  if(mode==='replay'){const rr=state.config.replayRate??1;if(rr!==1)rate=m.mul(rate,rr);if(boost!==1)rate=m.mul(rate,boost);}
  const step=m.mul(rate,error);
  if(state.config.phaseSlots>1){const w=state.slot[mode==='replay'?(record.slot??0):state.activeSlot];for(let j=0;j<state.config.tasteDimensions;j++)w[j]=clip(state,m.add(w[j],m.mul(step,record.phi[j])));}
  else{const key=state.config.streams>1?(state.controller===0?'taste':'tasteB'):'taste';
  for(let j=0;j<state.config.tasteDimensions;j++)state.weights[key][j]=clip(state,m.add(state.weights[key][j],m.mul(step,record.phi[j])));}
  if(state.config.slowAnchorStrength>0)anchorTasteDirection(state,m);
  if(mode==='replay'&&state.config.consolidationRate>0){const g=state.config.consolidationRate;
    for(let j=0;j<state.config.tasteDimensions;j++){const fast=state.weights.taste[j],slow=state.weights.slowTaste[j];
      state.weights.taste[j]=clip(state,m.add(fast,m.mul(g,m.sub(slow,fast))));
      state.weights.slowTaste[j]=clip(state,m.add(slow,m.mul(g,m.sub(state.weights.taste[j],slow))));}}
  if(mode==='live'){state.work.tasteLiveUpdates++;state.work.liveUpdates++;}else state.work.replayUpdates++;
  emit(structuredClone({type:'taste-update',mode,record,prediction,error,step}));
}
// Slow-direction anchor (V3): slow EMA tracks the fast taste readout; each
// update adds the rotation-only pull -λ∇(1−cos(w,s)) = +λ(s/|w||s| − w·c/|w|²),
// whose dot with w is exactly 0 (magnitudes free, direction damped). Skipped
// while either norm is zero (slow starts at 0, so the anchor phases in).
// Every operation is billed through m like the rest of the update.
function anchorTasteDirection(state,m){
  const n=state.config.tasteDimensions,mu=state.config.slowAnchorRate,lam=state.config.slowAnchorStrength;
  const w=state.weights.taste,s=state.weights.slowDir;
  for(let j=0;j<n;j++)s[j]=m.add(s[j],m.mul(mu,m.sub(w[j],s[j])));
  const wn=m.sqrt(dot(state,w,w)),sn=m.sqrt(dot(state,s,s));
  if(!m.less(0,wn)||!m.less(0,sn))return;
  const denom=m.mul(wn,sn),c=m.div(dot(state,w,s),denom),wn2=m.mul(wn,wn);
  for(let j=0;j<n;j++){
    const pull=m.sub(m.div(s[j],denom),m.div(m.mul(w[j],c),wn2));
    w[j]=clip(state,m.add(w[j],m.mul(lam,pull)));}
}
function anchorActorDirection(state,m){
  const n=state.config.motorDimensions,mu=state.config.motorAnchorRate,lam=state.config.motorAnchorStrength;
  const w=state.weights.actor,s=state.weights.slowMotorDir;
  for(let j=0;j<n;j++)s[j]=m.add(s[j],m.mul(mu,m.sub(w[j],s[j])));
  const wn=m.sqrt(dot(state,w,w)),sn=m.sqrt(dot(state,s,s));
  if(!m.less(0,wn)||!m.less(0,sn))return;
  const denom=m.mul(wn,sn),c=m.div(dot(state,w,s),denom),wn2=m.mul(wn,wn);
  for(let j=0;j<n;j++){
    const pull=m.sub(m.div(s[j],denom),m.div(m.mul(w[j],c),wn2));
    w[j]=clip(state,m.add(w[j],m.mul(lam,pull)));}
}
export function replayScore(state,record){
  const m=math(state),w=state.config.phaseSlots>1?state.slot[record.slot??0]:undefined;
  const e=m.sub(record.target,tastePrediction(state,record.phi,w));return m.mul(e,e);}
function replayDraw(state,records,lo,hi){
  let best=lo+indexDraw(state,'replayRngState',hi-lo);
  const T=Math.max(1,state.config.replayTournament??1);
  if(T>1){const m=math(state);let bestScore=replayScore(state,records[best]);
    for(let k=1;k<T;k++){const i=lo+indexDraw(state,'replayRngState',hi-lo),s=replayScore(state,records[i]);
      if(m.less(bestScore,s)){bestScore=s;best=i;}}}
  return records[best];
}
function replayGated(state,record,emit){
  const cfg=state.config,skip=cfg.replaySkip??0,h=cfg.replaySurpriseGain??0;
  let boost=1;
  if(skip>0||h>0){const m=math(state),w=cfg.phaseSlots>1?state.slot[record.slot??0]:undefined;
    const err=m.sub(record.target,tastePrediction(state,record.phi,w)),err2=m.mul(err,err);
    if(skip>0&&m.less(err2,m.mul(skip,skip))){state.work.replaySkips++;return;}
    const ema=state.surpriseEma??0;
    if(h>0&&ema>1e-4&&m.less(m.mul(2,ema),err2)){boost=1+h;state.work.replaySurpriseBoosts++;}}
  tasteUpdate(state,record,'replay',emit,boost);}
export function replay(state,emit){
  const records=[...state.older,...state.recent];
  if(!records.length)return;
  const passes=Math.max(1,state.config.replayPasses??1);for(let pass=0;pass<passes;pass++){const strata=Math.min(state.config.replayStrata??1,records.length);
  if(strata<=1){replayGated(state,replayDraw(state,records,0,records.length),emit);continue;}
  const size=Math.floor(records.length/strata),extra=records.length%strata,s=indexDraw(state,'replayRngState',strata),start=s*size+Math.min(s,extra),len=size+(s<extra?1:0);
  replayGated(state,replayDraw(state,records,start,start+len),emit);}
}
function motorUpdate(state,energy,nextPhi,terminal,duration,emit){
  const p=state.motorPending,m=math(state);assert.ok(p&&state.acquisition&&duration>=1&&duration<=state.config.holdTicks);
  const reward=m.div(m.sub(energy,p.initialEnergy),120),fraction=m.div(duration,16),discount=m.pow(.95,fraction),decay=m.mul(discount,m.pow(.9,fraction));
  if(state.config.criticWarmStart&&!state.criticReady){
    const baseline=clip(state,m.min(0,m.div(reward,m.sub(1,discount))));
    for(let j=0;j<state.config.motorDimensions;j+=16)state.weights.critic[j]=baseline;
    state.criticReady=true;
  }
  const previousValue=dot(state,state.weights.critic,p.phi),nextValue=terminal?0:dot(state,state.weights.critic,nextPhi);
  const target=terminal?reward:m.add(reward,m.mul(discount,nextValue)),delta=m.sub(target,previousValue);
  let scale=1,advantage=delta;
  if(state.config.normalizeMotor){
    state.tdRms=m.add(m.mul(.96875,state.tdRms),m.mul(.03125,m.mul(delta,delta)));
    scale=m.max(1e-6,m.sqrt(state.tdRms));advantage=clip(state,m.div(delta,scale),4);
  }
  const derivative=m.mul(.9,m.mul(p.baseProbability,m.sub(1,p.baseProbability)));
  const factor=p.cruise?m.div(derivative,p.probability):m.div(m.mul(-1,derivative),m.sub(1,p.probability));
  const actorStep=m.mul(.05,advantage),criticStep=m.mul(.1,delta);
  for(let j=0;j<state.config.motorDimensions;j++){
    state.eligibility.actor[j]=m.add(m.mul(decay,state.eligibility.actor[j]),m.mul(factor,p.phi[j]));
    state.eligibility.critic[j]=m.add(m.mul(decay,state.eligibility.critic[j]),p.phi[j]);
    state.weights.actor[j]=clip(state,m.add(state.weights.actor[j],m.mul(actorStep,state.eligibility.actor[j])));
    state.weights.critic[j]=clip(state,m.add(state.weights.critic[j],m.mul(criticStep,state.eligibility.critic[j])));
  }
  if(state.config.motorAnchorStrength>0)anchorActorDirection(state,m);
  if(state.config.motorConsolidationRate>0)consolidateMotor(state,m,true);
  state.work.motorUpdates++;state.work.liveUpdates++;state.motorPending=null;
  if(terminal){state.eligibility.actor.fill(0);state.eligibility.critic.fill(0);}
  emit(structuredClone({type:'motor-update',record:{...p,duration,finalEnergy:energy,terminal,reward},previousValue,nextValue,discount,decay,target,delta,scale,advantage,factor}));
  if(state.config.tasteLearning)replay(state,emit);
}

function consolidateMotor(state,m,withCritic){
  const g=state.config.motorConsolidationRate;
  for(let j=0;j<state.config.motorDimensions;j++){
    state.weights.actor[j]=clip(state,m.add(state.weights.actor[j],m.mul(g,m.sub(state.weights.slowActor[j],state.weights.actor[j]))));
    state.weights.slowActor[j]=clip(state,m.add(state.weights.slowActor[j],m.mul(g,m.sub(state.weights.actor[j],state.weights.slowActor[j]))));
    if(withCritic){
      state.weights.critic[j]=clip(state,m.add(state.weights.critic[j],m.mul(g,m.sub(state.weights.slowCritic[j],state.weights.critic[j]))));
      state.weights.slowCritic[j]=clip(state,m.add(state.weights.slowCritic[j],m.mul(g,m.sub(state.weights.critic[j],state.weights.slowCritic[j]))));}}}
// Endogenous renewal heuristic, not a counterfactual reward label: learn to
// predict when to search next (nonpositive energy change) versus wait (gain).
// Only the body's own pre-action features and completed energy change are used.
function renewalUpdate(state,energy,terminal,emit){
  const p=state.motorPending,m=math(state);assert.ok(p&&state.config.holdTicks===1);
  const delta=m.sub(energy,p.initialEnergy),target=m.less(0,delta)?0:1;
  const error=m.sub(target,p.baseProbability),step=m.mul(state.config.renewalRate,error);
  for(let j=0;j<state.config.motorDimensions;j++)state.weights.actor[j]=clip(state,m.add(state.weights.actor[j],m.mul(step,p.phi[j])));
  if(state.config.motorConsolidationRate>0)consolidateMotor(state,m,false);
  state.work.motorUpdates++;state.work.liveUpdates++;state.motorPending=null;
  emit(structuredClone({type:'motor-renewal',record:{...p,finalEnergy:energy,terminal},delta,target,error,step}));
}

export function progressUpdate(state,energy,nextRaw,terminal,emit){
  const p=state.motorPending,m=math(state);assert.ok(p&&state.config.holdTicks===1);
  state.work.scalarOperations+=2; // admission checks on own executed movement/contact
  const admitted=p.cruise&&!p.contactPresent;
  let target=null,progress=null;
  if(admitted){
    if(terminal)target=0;
    else if(!m.less(0,p.proximity))target=1; // no sensed target: continue searching
    else{progress=m.sub(nextRaw[3],p.proximity);target=m.less(0,progress)?1:0;}
    const error=m.sub(target,p.baseProbability),step=m.mul(state.config.renewalRate,error);
    for(let j=0;j<state.config.motorDimensions;j++)state.weights.actor[j]=clip(state,m.add(state.weights.actor[j],m.mul(step,p.phi[j])));
    if(state.config.motorAnchorStrength>0)anchorActorDirection(state,m);
    if(state.config.motorConsolidationRate>0)consolidateMotor(state,m,false);
    state.work.motorUpdates++;state.work.liveUpdates++;
  }
  state.motorPending=null;
  emit(structuredClone({type:'motor-progress',record:{...p,finalEnergy:energy,terminal},admitted,target,progress}));
}

export function chooseTasteEnergyAction(state,own,emit=()=>{}){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&!state.awaitingObservation);
  assert.equal(own.tick,state.lastObservedTick+1);assert.ok(Number.isFinite(own.energy));
  assert.equal(typeof own.odorPresent,'boolean');assert.equal(typeof own.contactPresent,'boolean');assert.ok(signs(own.cue));
  assert.ok(state.config.cueBlind?own.cue.every(v=>v===0):own.cue.every(v=>own.odorPresent?v===1||v===-1:v===0));
  const {taste,motor,prediction:contextPrediction}=tasteEnergyFeatures(state,own.raw,own.cue,own.contactPresent,own.odorPresent),m=math(state);
  if(state.hold.remaining===0){
    if(state.motorPending){
      assert.notEqual(state.config.motorRule,'renewal');assert.equal(own.tick-state.motorPending.tick,state.config.holdTicks);
      if(state.config.motorRule==='progress')progressUpdate(state,own.energy,own.raw,false,emit);
      else motorUpdate(state,own.energy,motor,false,state.config.holdTicks,emit);
    }
    const baseProbability=sigmoid(state,m.add(state.priorLogit,dot(state,state.weights.actor,motor))),probability=m.add(.05,m.mul(.9,baseProbability));
    const cruise=state.inference?!m.less(baseProbability,.5):m.less(draw(state,'motorRngState'),probability);
    state.hold={cruise,remaining:state.config.holdTicks};
    state.motorPending=state.acquisition?{tick:own.tick,phi:[...motor],cruise,baseProbability,probability,initialEnergy:own.energy,
      ...(state.config.motorRule==='progress'?{proximity:own.raw[3],contactPresent:own.contactPresent}:{})}:null;
    if(state.config.marginReadback){state.work.scalarOperations+=2+state.config.motorDimensions;
      emit({type:'motor-margin',record:{tick:own.tick,cruise,baseProbability,probability,phi:[...motor]}});}
  }
  const prediction=own.odorPresent?(contextPrediction??tastePrediction(state,taste)):1;
  const probability=!own.odorPresent?1:state.config.feedingRule==='greedy'?(m.less(prediction,.5)?.05:.95):m.add(.05,m.mul(.9,prediction));
  const accept=m.less(draw(state,'feedRngState'),probability),action=m.add(state.hold.cruise?0:2,accept?0:1);
  state.hold.remaining--;
  if(state.balance)state.balance.before=own.energy;
  beginStationaryTasteAction(state.credit,{agentId:own.agentId,tick:own.tick,action,cue:own.cue,contactPresent:own.contactPresent&&own.odorPresent});
  state.decisions++;state.lastDecisionTick=own.tick;state.awaitingObservation=true;
  return action;
}
export function observeTasteEnergyBody(state,own,emit=()=>{}){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&state.awaitingObservation);
  assert.equal(own.tick,state.lastDecisionTick);assert.equal(own.tick,state.lastObservedTick+1);
  assert.ok(Number.isFinite(own.energy)&&typeof own.terminal==='boolean');
  const before=state.credit.scalarOperations,example=finishStationaryTasteAction(state.credit,own);
  state.work.scalarOperations+=state.credit.scalarOperations-before;
  if(state.balance){state.balance.delta=math(state).sub(own.energy,state.balance.before);state.balance.before=null;}
  if(state.acquisition&&state.config.tasteLearning&&example){
    const phi=tasteFeatures(state,example.cue);state.work.scalarOperations++;
    state.tasteExamples++;state.acquiredTasteExamples++;
    if(state.config.phaseSlots>1){if(state.slotLastTick===null||state.slotLastTick===undefined)state.slotLastTick=example.tick;else{slotObserve(state,example.tick-state.slotLastTick);state.slotLastTick=example.tick;}}
    const record={...example,phi,target:example.outcomeSign===1?1:0,experience:state.tasteExamples,...(state.config.phaseSlots>1?{slot:state.activeSlot}:{})};
    remember(state,record);
    if(state.config.streams>1)streamObserve(state,record.phi,record.target);
    tasteUpdate(state,record,'live',emit);replay(state,emit);
  }
  if(state.motorPending&&state.config.motorRule==='renewal')renewalUpdate(state,own.energy,own.terminal,emit);
  else if(own.terminal&&state.motorPending){
    if(state.config.motorRule==='progress')progressUpdate(state,own.energy,null,true,emit);
    else motorUpdate(state,own.energy,null,true,own.tick-state.motorPending.tick+1,emit);
  }
  state.lastObservedTick=own.tick;state.awaitingObservation=false;state.dead=own.terminal;
}
export function freezeTasteEnergyBody(state){
  assert.ok(!state.awaitingObservation);state.acquisition=false;state.motorPending=null;
  state.eligibility.actor.fill(0);state.eligibility.critic.fill(0);
}
export function resetTasteEnergyBody(state){
  assert.ok(!state.awaitingObservation);
  state.weights={taste:zeros(state.config.tasteDimensions),actor:zeros(state.config.motorDimensions),critic:zeros(state.config.motorDimensions),...(state.config.consolidationRate>0?{slowTaste:zeros(state.config.tasteDimensions)}:{}),...(state.config.slowAnchorStrength>0?{slowDir:zeros(state.config.tasteDimensions)}:{})};
  if(state.config.motorAnchorStrength>0)state.weights.slowMotorDir=zeros(state.config.motorDimensions);
  if(state.config.streams>1){state.weights.tasteB=zeros(state.config.tasteDimensions);state.streamEma=[0,0];state.controller=0;}if(state.config.surpriseGain>0){state.surpriseEma=0;state.surpriseTimer=0;}if(state.config.phaseSlots>1){state.slot=[zeros(state.config.tasteDimensions),zeros(state.config.tasteDimensions)];state.gapEma=null;state.slotC=null;state.activeSlot=0;state.slotLastTick=null;}
  if(state.config.motorConsolidationRate>0){state.weights.slowActor=zeros(state.config.motorDimensions);state.weights.slowCritic=zeros(state.config.motorDimensions);}
  state.eligibility={actor:zeros(state.config.motorDimensions),critic:zeros(state.config.motorDimensions)};
  state.motorPending=null;state.hold={cruise:false,remaining:0};state.tdRms=0;state.work.surpriseBoosts=0;state.work.marginBoosts=0;state.work.replaySkips=0;state.work.replaySurpriseBoosts=0;state.work.evictSwaps=0;
  state.recent=[];state.older=[];state.olderSeen=0;state.acquiredTasteExamples=0;
  if(state.balance)state.balance={before:null,delta:0};
  if(state.config.criticWarmStart)state.criticReady=false;
}
export function compactTasteEnergyBody(state){
  freezeTasteEnergyBody(state);
  state.hold={cruise:false,remaining:0};state.tdRms=0;
  state.recent=[];state.older=[];state.olderSeen=0;state.acquiredTasteExamples=0;
  if(state.balance)state.balance={before:null,delta:0};
  if(state.config.criticWarmStart)state.criticReady=false;
  if(state.config.greedyInference)state.inference=true;
}
export function restoreTasteEnergyBody(value){
  assert.equal(value?.schema,1);assert.equal(value.kind,'own-taste-energy');
  if(value.config.capacity===undefined)value.config.capacity=32;if(value.config.recent===undefined)value.config.recent=8;if(value.config.replayStrata===undefined)value.config.replayStrata=1;if(value.config.replayPasses===undefined)value.config.replayPasses=1;if(value.config.consolidationRate===undefined)value.config.consolidationRate=0;if(value.config.motorConsolidationRate===undefined)value.config.motorConsolidationRate=0;if(value.config.streams===undefined)value.config.streams=1;if(value.config.streamHysteresis===undefined)value.config.streamHysteresis=0;if(value.config.surpriseGain===undefined)value.config.surpriseGain=0;if(value.config.surpriseWindow===undefined)value.config.surpriseWindow=0;if(value.config.phaseSlots===undefined)value.config.phaseSlots=1;if(value.config.slotRate===undefined)value.config.slotRate=.05;if(value.config.marginWidth===undefined)value.config.marginWidth=0;if(value.config.marginBoost===undefined)value.config.marginBoost=0;if(value.config.replayTournament===undefined)value.config.replayTournament=1;if(value.config.replayRate===undefined)value.config.replayRate=1;if(value.config.replaySkip===undefined)value.config.replaySkip=0;if(value.config.replaySurpriseGain===undefined)value.config.replaySurpriseGain=0;if(value.config.evictBias===undefined)value.config.evictBias=0;if(value.config.slowAnchorRate===undefined)value.config.slowAnchorRate=0;if(value.config.slowAnchorStrength===undefined)value.config.slowAnchorStrength=0;if(value.config.motorAnchorRate===undefined)value.config.motorAnchorRate=0;if(value.config.motorAnchorStrength===undefined)value.config.motorAnchorStrength=0;if(value.config.marginReadback===undefined)value.config.marginReadback=false;if(value.work.surpriseBoosts===undefined)value.work.surpriseBoosts=0;if(value.work.marginBoosts===undefined)value.work.marginBoosts=0;if(value.work.replaySkips===undefined)value.work.replaySkips=0;if(value.work.replaySurpriseBoosts===undefined)value.work.replaySurpriseBoosts=0;if(value.work.evictSwaps===undefined)value.work.evictSwaps=0;
  const sample=createTasteEnergyBody(value.agentId,value.feedRngState,{tasteLearning:value.config.tasteLearning,normalizeMotor:value.config.normalizeMotor,cueBlind:value.config.cueBlind,feedingRule:value.config.feedingRule,tasteRepresentation:value.config.tasteRepresentation,tasteRate:value.config.tasteRate,capacity:value.config.capacity??32,recent:value.config.recent??8,replayStrata:value.config.replayStrata??1,replayPasses:value.config.replayPasses??1,consolidationRate:value.config.consolidationRate??0,motorConsolidationRate:value.config.motorConsolidationRate??0,streams:value.config.streams??1,streamHysteresis:value.config.streamHysteresis??0,surpriseGain:value.config.surpriseGain??0,surpriseWindow:value.config.surpriseWindow??0,phaseSlots:value.config.phaseSlots??1,slotRate:value.config.slotRate??.05,marginWidth:value.config.marginWidth??0,marginBoost:value.config.marginBoost??0,replayTournament:value.config.replayTournament??1,replayRate:value.config.replayRate??1,replaySkip:value.config.replaySkip??0,replaySurpriseGain:value.config.replaySurpriseGain??0,evictBias:value.config.evictBias??0,slowAnchorRate:value.config.slowAnchorRate??0,slowAnchorStrength:value.config.slowAnchorStrength??0,motorAnchorRate:value.config.motorAnchorRate??0,motorAnchorStrength:value.config.motorAnchorStrength??0,motorRepresentation:value.config.motorRepresentation,holdTicks:value.config.holdTicks,criticWarmStart:value.config.criticWarmStart??false,motorRule:value.config.motorRule??'td',renewalRate:value.config.renewalRate??.1,greedyInference:value.config.greedyInference??false});
  return restoreCheckedTasteEnergyBody(value,sample);
}
function restoreCheckedTasteEnergyBody(value,sample){
  keys(value,Object.keys(sample));assert.deepEqual(value.config,sample.config);assert.equal(value.priorLogit,sample.priorLogit);assert.equal(value.tasteScale,sample.tasteScale);
  keys(value.weights,['taste','actor','critic',...(value.config.consolidationRate>0?['slowTaste']:[]),...(value.config.slowAnchorStrength>0?['slowDir']:[]),...(value.config.motorAnchorStrength>0?['slowMotorDir']:[]),...(value.config.motorConsolidationRate>0?['slowActor','slowCritic']:[]),...(value.config.streams>1?['tasteB']:[])]);keys(value.eligibility,['actor','critic']);
  if(value.balance){keys(value.balance,['before','delta']);assert.ok(Number.isFinite(value.balance.delta));assert.ok(value.awaitingObservation?Number.isFinite(value.balance.before):value.balance.before===null);}
  if(value.config.criticWarmStart)assert.equal(typeof value.criticReady,'boolean');
  assert.equal(typeof value.config.marginReadback,'boolean');
  if(value.config.greedyInference){assert.equal(typeof value.inference,'boolean');if(value.inference)assert.equal(value.acquisition,false);}
  for(const [key,n] of [['taste',value.config.tasteDimensions],['actor',value.config.motorDimensions],['critic',value.config.motorDimensions]])assert.ok(vector(value.weights[key],n,8));
  if(value.config.consolidationRate>0)assert.ok(vector(value.weights.slowTaste,value.config.tasteDimensions,8));else assert.equal(value.weights.slowTaste,undefined);
  if(value.config.slowAnchorStrength>0)assert.ok(vector(value.weights.slowDir,value.config.tasteDimensions,8));else assert.equal(value.weights.slowDir,undefined);
  if(value.config.motorAnchorStrength>0)assert.ok(vector(value.weights.slowMotorDir,value.config.motorDimensions,8));else assert.equal(value.weights.slowMotorDir,undefined);
  if(value.config.motorConsolidationRate>0){assert.ok(vector(value.weights.slowActor,value.config.motorDimensions,8));assert.ok(vector(value.weights.slowCritic,value.config.motorDimensions,8));}else{assert.equal(value.weights.slowActor,undefined);assert.equal(value.weights.slowCritic,undefined);}
  if(value.config.streams>1){assert.ok(vector(value.weights.tasteB,value.config.tasteDimensions,8));assert.ok(vector(value.streamEma,2));assert.ok(value.controller===0||value.controller===1);}else{assert.equal(value.weights.tasteB,undefined);assert.equal(value.streamEma,undefined);assert.equal(value.controller,undefined);if(value.config.surpriseGain>0)assert.ok(Number.isFinite(value.surpriseEma));else assert.equal(value.surpriseEma,undefined);if(value.config.phaseSlots>1){assert.ok(Array.isArray(value.slot)&&value.slot.length===2);for(const v of value.slot)assert.ok(vector(v,value.config.tasteDimensions,8));assert.ok(value.gapEma===null||Number.isFinite(value.gapEma));assert.ok((value.slotC===null)===(value.gapEma===null));if(value.slotC){assert.ok(value.slotC.length===2);for(const c of value.slotC)assert.ok(Number.isFinite(c));}assert.ok(value.activeSlot===0||value.activeSlot===1);assert.ok(value.slotLastTick===null||Number.isSafeInteger(value.slotLastTick));}else{assert.equal(value.slot,undefined);assert.equal(value.gapEma,undefined);assert.equal(value.slotC,undefined);assert.equal(value.activeSlot,undefined);assert.equal(value.slotLastTick,undefined);}}
  for(const key of ['actor','critic'])assert.ok(vector(value.eligibility[key],value.config.motorDimensions));
  for(const key of ['feedRngState','motorRngState','retentionRngState','replayRngState'])assert.ok(Number.isInteger(value[key])&&value[key]>0&&value[key]<=0xffffffff);
  for(const key of ['decisions','lastDecisionTick','lastObservedTick','olderSeen','tasteExamples','acquiredTasteExamples'])assert.ok(Number.isSafeInteger(value[key])&&value[key]>=0);
  for(const key of ['awaitingObservation','acquisition','dead'])assert.equal(typeof value[key],'boolean');
  assert.equal(value.decisions,value.lastDecisionTick);assert.equal(value.lastDecisionTick,value.lastObservedTick+(value.awaitingObservation?1:0));
  assert.ok(!(value.dead&&value.awaitingObservation));assert.ok(Number.isFinite(value.tdRms)&&value.tdRms>=0);if(!value.config.normalizeMotor)assert.equal(value.tdRms,0);
  keys(value.hold,['cruise','remaining']);assert.equal(typeof value.hold.cruise,'boolean');assert.ok(Number.isInteger(value.hold.remaining)&&value.hold.remaining>=0&&value.hold.remaining<value.config.holdTicks);
  keys(value.credit,['schema','agentId','maskedCue','tick','pending','dead','scalarOperations']);assert.equal(value.credit.schema,2);assert.equal(value.credit.agentId,value.agentId);
  assert.equal(value.credit.maskedCue,value.config.cueBlind);assert.equal(value.credit.tick,value.lastObservedTick);assert.equal(value.credit.dead,value.dead);assert.equal(value.credit.scalarOperations,value.lastObservedTick*3);
  if(value.awaitingObservation){
    const p=value.credit.pending;assert.ok(p);keys(p,['tick','action','cue','contactPresent']);assert.equal(p.tick,value.lastDecisionTick);
    assert.ok(Number.isInteger(p.action)&&p.action>=0&&p.action<4&&signs(p.cue)&&typeof p.contactPresent==='boolean');
    assert.ok(!p.contactPresent||value.config.cueBlind||p.cue.every(v=>v===1||v===-1));assert.ok(!value.config.cueBlind||p.cue.every(v=>v===0));
    assert.equal(p.action<2,value.hold.cruise);
  }else assert.equal(value.credit.pending,null);
  if(value.motorPending){
    const p=value.motorPending;keys(p,['tick','phi','cruise','baseProbability','probability','initialEnergy',...(value.config.motorRule==='progress'?['proximity','contactPresent']:[])]);assert.ok(value.acquisition&&!value.dead);
    if(value.config.motorRule==='progress')assert.ok(Number.isFinite(p.proximity)&&p.proximity>=0&&p.proximity<=1&&typeof p.contactPresent==='boolean');
    assert.ok(Number.isSafeInteger(p.tick)&&p.tick>0&&p.tick<=value.lastDecisionTick&&value.lastDecisionTick-p.tick<value.config.holdTicks);
    assert.ok(vector(p.phi,value.config.motorDimensions,1));
    const active=Array.from({length:value.config.motorDimensions/16},(_,j)=>p.phi[j*16]);assert.equal(active.filter(v=>v===1).length,1);assert.ok(active.every(v=>v===0||v===1));
    for(let j=0;j<p.phi.length;j++)if(j%16!==0)assert.ok(Math.abs(p.phi[j])<=.25);
    if(value.config.motorRepresentation!=='shared')for(let block=0;block<active.length;block++)if(active[block]===0)assert.ok(p.phi.slice(block*16,block*16+16).every(v=>v===0));
    assert.equal(p.cruise,value.hold.cruise);assert.ok(Number.isFinite(p.initialEnergy)&&p.baseProbability>=0&&p.baseProbability<=1);
    assert.ok(Math.abs(p.probability-(.05+.9*p.baseProbability))<1e-15);assert.equal(value.hold.remaining,value.config.holdTicks-1-(value.lastDecisionTick-p.tick));
  }
  if(value.acquisition&&!value.dead&&(value.hold.remaining>0||value.awaitingObservation))assert.ok(value.motorPending);
  if(!value.acquisition||value.dead){assert.equal(value.motorPending,null);assert.ok(Object.values(value.eligibility).flat().every(v=>v===0));}
  keys(value.work,['scalarOperations','liveUpdates','replayUpdates','tasteLiveUpdates','motorUpdates','surpriseBoosts','marginBoosts','replaySkips','replaySurpriseBoosts','evictSwaps']);for(const v of Object.values(value.work))assert.ok(Number.isSafeInteger(v)&&v>=0);
  assert.equal(value.work.liveUpdates,value.work.tasteLiveUpdates+value.work.motorUpdates);assert.equal(value.work.tasteLiveUpdates,value.tasteExamples);
  assert.ok(value.acquiredTasteExamples<=value.tasteExamples);assert.equal(value.olderSeen,Math.max(0,value.acquiredTasteExamples-(value.config.recent??8)));
  assert.ok(Array.isArray(value.recent)&&Array.isArray(value.older));assert.equal(value.recent.length,Math.min(value.config.recent??8,value.acquiredTasteExamples));assert.equal(value.older.length,Math.min((value.config.capacity??32)-(value.config.recent??8),value.olderSeen));
  const records=[...value.older,...value.recent];assert.equal(new Set(records.map(r=>r.experience)).size,records.length);
  for(const r of records){
    keys(r,['agentId','tick','cue','signedIntake','outcomeSign','terminal','phi','target','experience',...(value.config.phaseSlots>1?['slot']:[])]);assert.equal(r.agentId,value.agentId);
    assert.ok(Number.isSafeInteger(r.tick)&&r.tick>0&&r.tick<=value.lastObservedTick&&signs(r.cue));
    assert.ok(value.config.cueBlind?r.cue.every(v=>v===0):r.cue.every(v=>v===1||v===-1));
    assert.ok(Number.isFinite(r.signedIntake)&&r.signedIntake!==0&&Math.abs(r.signedIntake)<=1);assert.equal(r.outcomeSign,Math.sign(r.signedIntake));assert.equal(r.target,r.outcomeSign===1?1:0);assert.equal(typeof r.terminal,'boolean');
    const phi=[1,...r.cue];for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)phi.push(r.cue[a]*r.cue[b]);
    if(value.config.tasteRepresentation==='orthogonal'){
      for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++)phi.push(r.cue[a]*r.cue[b]*r.cue[c]);
      phi.push(r.cue.reduce((n,v)=>n*v,1));
    }
    assert.ok(vector(r.phi,value.config.tasteDimensions,1)&&r.phi.every((v,j)=>Math.abs(v-phi[j]*value.tasteScale)<1e-15));
    assert.ok(Number.isSafeInteger(r.experience)&&r.experience>value.tasteExamples-value.acquiredTasteExamples&&r.experience<=value.tasteExamples);
    if(value.config.phaseSlots>1)assert.ok(r.slot===0||r.slot===1);
  }
  value.recent.forEach((r,j)=>assert.equal(r.experience,value.tasteExamples-value.recent.length+j+1));
  if(value.recent.length)assert.ok(value.older.every(r=>r.experience<value.recent[0].experience));
  if(!value.config.tasteLearning)assert.equal(value.tasteExamples,0);
  keys(value.charge,['operationsBilled','outstandingEnergy','incurredEnergy','paidEnergy','storageBytes']);for(const v of Object.values(value.charge))assert.ok(Number.isFinite(v)&&v>=0);
  assert.ok(Number.isSafeInteger(value.charge.operationsBilled)&&Number.isSafeInteger(value.charge.storageBytes)&&value.charge.operationsBilled<=value.work.scalarOperations);
  assert.ok(Math.abs(value.charge.incurredEnergy-value.charge.paidEnergy-value.charge.outstandingEnergy)<1e-8);
  return structuredClone(value);
}
