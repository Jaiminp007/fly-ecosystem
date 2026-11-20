// Track-T1: kernel-taste body. A genuine taste-energy state (linear frozen via
// tasteLearning:false, so every experiment access — work/charge/credit/weights/
// config — works unchanged) with an attached bounded RBF-gradient kernel learning
// the SAME (phi,target) record stream. Prediction sites use the kernel (mapped to
// [0,1]); motor/hold/balance/credit flow mirrors taste-energy exactly; replay is
// skipped (no kernel analogue specified — disclosed asymmetry: kernel-online vs
// baseline linear+replay; a GO wins without replay's help).
// taste-energy.mjs is untouched (imports only). Null-default: existing arms take
// the untouched branch in taste-experiment (byte-identical).
import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {createKernelLearner,updateKernel,predictKernel} from './kernel-learner.mjs';
import {createTasteEnergyBody,draw,progressUpdate,freezeTasteEnergyBody,resetTasteEnergyBody,compactTasteEnergyBody,restoreTasteEnergyBody} from './taste-energy.mjs';
import {beginStationaryTasteAction,finishStationaryTasteAction} from './stationary-taste-credit.mjs';

export const TASTE_KERNEL_PROGRAM=Object.freeze({kernel:'rbf',update:'gradient'});
export const TK_CAPACITY=64;
export const TK_PRIOR=0.5; // kernel-empty prediction maps to neutral (linear prior is 0.75; documented)

// Billing mirrors tick-kernel-critic (conservative: pow/exp as 1 op).
export function tasteKernelPredictBill(records){
  assert.ok(Number.isInteger(records)&&records>=0&&records<=TK_CAPACITY,'kernel records out of capacity bounds');
  return 64*records+5;
}
export function tasteKernelUpdateBill(records){
  assert.ok(Number.isInteger(records)&&records>=0&&records<=TK_CAPACITY,'kernel records out of capacity bounds');
  return 64*records+80;
}
export function tasteKernelBill(records){
  assert.ok(Number.isInteger(records)&&records>=0&&records<=TK_CAPACITY,'kernel records out of capacity bounds');
  return 2*tasteKernelPredictBill(records)+tasteKernelUpdateBill(records);
}
export const TK_FUSE_RECORDS=64;
export const TK_FUSE_BILL=tasteKernelBill(TK_FUSE_RECORDS); // 12,378 (V1A math)

// --- tiny math-op wrappers (same billing semantics as taste-energy) ---
function math(t){
  const operation=fn=>(...args)=>{t.work.scalarOperations++;return args.length===1&&args[0]===0?0:fn(...args);};
  return {add:operation((a,b)=>a+b),sub:operation((a,b)=>a-b),mul:operation((a,b)=>a*b),div:operation((a,b)=>a/b),
    exp:operation(Math.exp),sqrt:operation(Math.sqrt),pow:operation(Math.pow),max:operation(Math.max),min:operation(Math.min),less:operation((a,b)=>a<b)};
}
function dot(t,w,x){const m=math(t);return w.reduce((sum,v,j)=>m.add(sum,m.mul(v,x[j])),0);}
function sigmoid(t,value){const m=math(t);return m.div(1,m.add(1,m.exp(m.sub(0,value))));}
function clip(t,value,bound=8){const m=math(t);return m.max(-bound,m.min(bound,value));}
function indexDraw(t,key,n){const m=math(t);const value=m.mul(draw(t,key),n);t.work.scalarOperations++;return Math.floor(value);}
const zeros=n=>Array(n).fill(0);
const vector=(a,n,bound=Infinity)=>Array.isArray(a)&&a.length===n&&Array.from(a).every(v=>Number.isFinite(v)&&Math.abs(v)<=bound);
const signs=a=>vector(a,4,1)&&(a.every(v=>v===0)||a.every(v=>v===1||v===-1));
// Verbatim phi construction (tasteFeatures is private to taste-energy; same math, same billing).
function tasteKernelPhi(t,cue){
  const m=math(t),phi=[1,...cue];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)phi.push(m.mul(cue[a],cue[b]));
  if(t.config.tasteRepresentation==='orthogonal'){
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++)phi.push(m.mul(m.mul(cue[a],cue[b]),cue[c]));
    phi.push(m.mul(m.mul(cue[0],cue[1]),m.mul(cue[2],cue[3])));
  }
  return phi.map(v=>m.mul(v,t.tasteScale));
}

export function createTasteKernelBody(agentId,seed,options={}){
  const t=createTasteEnergyBody(agentId,seed,{...options,tasteLearning:false});
  assert.equal(t.config.tasteLearning,false);
  t.kernel=createKernelLearner(t.config.tasteDimensions,TASTE_KERNEL_PROGRAM,TK_CAPACITY);
  t.kind='taste-kernel-v1';
  return t;
}
// Kernel prediction mapped to [0,1] for the choose flow (kernel range is [-1,1]).
export function tasteKernelPrediction(t,phi){
  const m=math(t);
  const raw=predictKernel(t.kernel,phi);
  t.work.scalarOperations+=tasteKernelPredictBill(t.kernel.records.length);
  return m.max(0,m.min(1,raw));
}
export function carryTasteKernelState(src){
  assert.equal(src.kind,'taste-kernel-v1');
  const kernel=createKernelLearner(src.kernel.dimensions,src.kernel.program,src.kernel.capacity);
  for(const [i,c] of src.kernel.coefficients.entries())kernel.coefficients[i]=c;
  kernel.records=[];kernel.seen=src.kernel.seen;
  kernel.work={kernelCoordinateProducts:0,matrixProducts:0,updates:0};
  return kernel;
}
// --- adapted features (routing uses kernel prediction; structure mirrors tasteEnergyFeatures) ---
function tasteKernelFeatures(t,raw,cue,contactPresent,odorPresent=cue.some(v=>v!==0)){
  assert.ok(vector(raw,17,1)&&raw[16]===1&&signs(cue)&&typeof contactPresent==='boolean');
  const m=math(t);
  const taste=tasteKernelPhi(t,cue),base=[1,...raw.slice(0,14).map(v=>m.mul(.25,v)),contactPresent?.25:0];
  if(t.config.motorRepresentation==='shared')return {taste,motor:base};
  const prediction=odorPresent?tasteKernelPrediction(t,taste):1;
  if(t.config.motorRepresentation==='ecology'&&!odorPresent){
    const context=!contactPresent?4:5;
    const motor=zeros(t.config.motorDimensions);
    motor.splice(context*16,16,...base);
    return {taste,motor,prediction};
  }
  let context=!contactPresent?0:m.less(prediction,.5)?2:1;
  if(['intake','balance','ecology'].includes(t.config.motorRepresentation)&&context===1&&m.less(0,t.balance?.delta??raw[13]))context=3;
  const motor=zeros(t.config.motorDimensions);
  motor.splice(context*16,16,...base);
  return {taste,motor,prediction};
}
// --- adapted motor learning (verbatim math on the state; replay never fires: tasteLearning false) ---
function tasteKernelMotorUpdate(t,energy,nextPhi,terminal,duration,emit){
  const p=t.motorPending,m=math(t);assert.ok(p&&t.acquisition&&duration>=1&&duration<=t.config.holdTicks);
  const reward=m.div(m.sub(energy,p.initialEnergy),120),fraction=m.div(duration,16),discount=m.pow(.95,fraction),decay=m.mul(discount,m.pow(.9,fraction));
  if(t.config.criticWarmStart&&!t.criticReady){
    const baseline=clip(t,m.min(0,m.div(reward,m.sub(1,discount))));
    for(let j=0;j<t.config.motorDimensions;j+=16)t.weights.critic[j]=baseline;
    t.criticReady=true;
  }
  const previousValue=dot(t,t.weights.critic,p.phi),nextValue=terminal?0:dot(t,t.weights.critic,nextPhi);
  const target=terminal?reward:m.add(reward,m.mul(discount,nextValue)),delta=m.sub(target,previousValue);
  let scale=1,advantage=delta;
  if(t.config.normalizeMotor){
    t.tdRms=m.add(m.mul(.96875,t.tdRms),m.mul(.03125,m.mul(delta,delta)));
    scale=m.max(1e-6,m.sqrt(t.tdRms));advantage=clip(t,m.div(delta,scale),4);
  }
  const derivative=m.mul(.9,m.mul(p.baseProbability,m.sub(1,p.baseProbability)));
  const factor=p.cruise?m.div(derivative,p.probability):m.div(m.mul(-1,derivative),m.sub(1,p.probability));
  const actorStep=m.mul(.05,advantage),criticStep=m.mul(.1,delta);
  for(let j=0;j<t.config.motorDimensions;j++){
    t.eligibility.actor[j]=m.add(m.mul(decay,t.eligibility.actor[j]),m.mul(factor,p.phi[j]));
    t.eligibility.critic[j]=m.add(m.mul(decay,t.eligibility.critic[j]),p.phi[j]);
    t.weights.actor[j]=clip(t,m.add(t.weights.actor[j],m.mul(actorStep,t.eligibility.actor[j])));
    t.weights.critic[j]=clip(t,m.add(t.weights.critic[j],m.mul(criticStep,t.eligibility.critic[j])));
  }
  if(t.config.motorAnchorStrength>0)throw Error('motor anchors not supported on kernel-taste path (frozen options never set them)');
  if(t.config.motorConsolidationRate>0)throw Error('motor consolidation not supported on kernel-taste path (frozen options never set it)');
  t.work.motorUpdates++;t.work.liveUpdates++;t.motorPending=null;
  if(terminal){t.eligibility.actor.fill(0);t.eligibility.critic.fill(0);}
  emit(structuredClone({type:'motor-update',record:{...p,duration,finalEnergy:energy,terminal,reward},previousValue,nextValue,discount,decay,target,delta}));
}
function tasteKernelRenewalUpdate(t,energy,terminal,emit){
  const p=t.motorPending,m=math(t);assert.ok(p&&t.config.holdTicks===1);
  const delta=m.sub(energy,p.initialEnergy),target=m.less(0,delta)?0:1;
  const error=m.sub(target,p.baseProbability),step=m.mul(t.config.renewalRate,error);
  for(let j=0;j<t.config.motorDimensions;j++)t.weights.actor[j]=clip(t,m.add(t.weights.actor[j],m.mul(step,p.phi[j])));
  if(t.config.motorConsolidationRate>0)throw Error('motor consolidation not supported on kernel-taste path (frozen options never set it)');
  t.work.motorUpdates++;t.work.liveUpdates++;t.motorPending=null;
  emit(structuredClone({type:'motor-renewal',record:{...p,finalEnergy:energy,terminal},delta,target,error,step}));
}
// --- adapted buffers (eviction scoring uses kernel prediction; BT evictBias 0 keeps this dormant) ---
function tasteKernelRemember(t,record){
  const recentLimit=t.config.recent??8,olderLimit=(t.config.capacity??32)-recentLimit;
  t.recent.push(structuredClone(record));
  if(t.recent.length<=recentLimit)return;
  const displaced=t.recent.shift();t.olderSeen++;
  if(t.older.length<olderLimit){t.older.push(displaced);return;}
  const bias=t.config.evictBias??0;
  if(bias===0){const index=indexDraw(t,'retentionRngState',t.olderSeen);if(math(t).less(index,olderLimit))t.older[index]=displaced;return;}
  const m=math(t),score=r=>{const e=m.sub(r.target,tasteKernelPrediction(t,r.phi));return m.mul(e,e);};
  const dScore=score(displaced);
  let victim=0,vScore=score(t.older[0]);
  for(let i=1;i<t.older.length;i++){const s=score(t.older[i]);
    if(bias>0?m.less(s,vScore):m.less(vScore,s)){victim=i;vScore=s;}}
  if(bias>0?m.less(vScore,dScore):m.less(dScore,vScore)){t.older[victim]=displaced;t.work.evictSwaps++;}
}
function tasteKernelSlotObserve(t,gap){
  const m=math(t),alpha=.02;
  if(t.gapEma===null||t.gapEma===undefined){t.gapEma=gap;t.slotC=[gap,gap];t.activeSlot=0;return;}
  t.gapEma=m.add(t.gapEma,m.mul(alpha,m.sub(gap,t.gapEma)));
  const dist=s=>{const dev=m.sub(t.gapEma,t.slotC[s]);return m.mul(dev,dev);};
  const idle=1-t.activeSlot;
  if(m.less(dist(idle),dist(t.activeSlot)))t.activeSlot=idle;
  const rho=t.config.slotRate??0.05;
  t.slotC[1-t.activeSlot]=m.add(t.slotC[1-t.activeSlot],m.mul(rho,m.sub(t.gapEma,t.slotC[1-t.activeSlot])));
}
function tasteKernelStreamObserve(t,phi,target){
  const m=math(t),alpha=.05;
  for(let i=0;i<2;i++){
    const prediction=tasteKernelPrediction(t,phi);
    const dev=m.sub(target,prediction),error=m.mul(dev,dev);
    t.streamEma[i]=m.add(t.streamEma[i],m.mul(alpha,m.sub(error,t.streamEma[i])));
  }
  const challenger=1-t.controller;
  if(m.less(t.streamEma[challenger],m.sub(t.streamEma[t.controller],t.config.streamHysteresis)))t.controller=challenger;
}
// --- adapted choose/observe (prediction sites use kernel; all else mirrors taste-energy) ---
export function chooseTasteKernelAction(t,own,emit=()=>{}){
  assert.equal(own.agentId,t.agentId);assert.ok(!t.dead&&!t.awaitingObservation);
  assert.equal(own.tick,t.lastObservedTick+1);assert.ok(Number.isFinite(own.energy));
  assert.equal(typeof own.odorPresent,'boolean');assert.equal(typeof own.contactPresent,'boolean');assert.ok(signs(own.cue));
  assert.ok(t.config.cueBlind?own.cue.every(v=>v===0):own.cue.every(v=>own.odorPresent?v===1||v===-1:v===0));
  const {taste,motor,prediction:contextPrediction}=tasteKernelFeatures(t,own.raw,own.cue,own.contactPresent,own.odorPresent),m=math(t);
  if(t.hold.remaining===0){
    if(t.motorPending){
      assert.notEqual(t.config.motorRule,'renewal');assert.equal(own.tick-t.motorPending.tick,t.config.holdTicks);
      if(t.config.motorRule==='progress')progressUpdate(t,own.energy,own.raw,false,emit);
      else tasteKernelMotorUpdate(t,own.energy,motor,false,t.config.holdTicks,emit);
    }
    const baseProbability=sigmoid(t,m.add(t.priorLogit,dot(t,t.weights.actor,motor))),probability=m.add(.05,m.mul(.9,baseProbability));
    const cruise=t.inference?!m.less(baseProbability,.5):m.less(draw(t,'motorRngState'),probability);
    t.hold={cruise,remaining:t.config.holdTicks};
    t.motorPending=t.acquisition?{tick:own.tick,phi:[...motor],cruise,baseProbability,probability,initialEnergy:own.energy,
      ...(t.config.motorRule==='progress'?{proximity:own.raw[3],contactPresent:own.contactPresent}:{})}:null;
    if(t.config.marginReadback){t.work.scalarOperations+=2+t.config.motorDimensions;
      emit({type:'motor-margin',record:{tick:own.tick,cruise,baseProbability,probability,phi:[...motor]}});}
  }
  const prediction=own.odorPresent?(contextPrediction??tasteKernelPrediction(t,taste)):1;
  const probability=!own.odorPresent?1:t.config.feedingRule==='greedy'?(m.less(prediction,.5)?.05:.95):m.add(.05,m.mul(.9,prediction));
  const accept=m.less(draw(t,'feedRngState'),probability),action=m.add(t.hold.cruise?0:2,accept?0:1);
  t.hold.remaining--;
  if(t.balance)t.balance.before=own.energy;
  beginStationaryTasteAction(t.credit,{agentId:own.agentId,tick:own.tick,action,cue:own.cue,contactPresent:own.contactPresent&&own.odorPresent});
  t.decisions++;t.lastDecisionTick=own.tick;t.awaitingObservation=true;
  return action;
}
export function observeTasteKernelBody(t,own,emit=()=>{},aux){
  assert.equal(own.agentId,t.agentId);assert.ok(!t.dead&&t.awaitingObservation);
  assert.equal(own.tick,t.lastDecisionTick);assert.equal(own.tick,t.lastObservedTick+1);
  assert.ok(Number.isFinite(own.energy)&&typeof own.terminal==='boolean');
  const before=t.credit.scalarOperations,example=finishStationaryTasteAction(t.credit,own);
  t.work.scalarOperations+=t.credit.scalarOperations-before;
  if(t.balance){t.balance.delta=math(t).sub(own.energy,t.balance.before);t.balance.before=null;}
  if(t.acquisition&&example){
    const phi=tasteKernelPhi(t,example.cue);t.work.scalarOperations++;
    if(t.config.phaseSlots>1){if(t.slotLastTick===null||t.slotLastTick===undefined)t.slotLastTick=example.tick;else{tasteKernelSlotObserve(t,example.tick-t.slotLastTick);t.slotLastTick=example.tick;}}
    const record={...example,phi,target:example.outcomeSign===1?1:0,experience:t.tasteExamples+1,...(t.config.phaseSlots>1?{slot:t.activeSlot}:{})};
    tasteKernelRemember(t,record);
    if(t.config.streams>1)tasteKernelStreamObserve(t,record.phi,record.target);
    const beforeN=t.kernel.records.length;
    updateKernel(t.kernel,record.phi,record.target);
    t.work.scalarOperations+=tasteKernelUpdateBill(beforeN);
    t.tasteExamples++;t.acquiredTasteExamples++;
    t.work.liveUpdates++;t.work.tasteLiveUpdates=(t.work.tasteLiveUpdates??0)+1;
  }
  if(t.motorPending&&t.config.motorRule==='renewal')tasteKernelRenewalUpdate(t,own.energy,own.terminal,emit);
  else if(own.terminal&&t.motorPending){
    if(t.config.motorRule==='progress')progressUpdate(t,own.energy,null,true,emit);
    else tasteKernelMotorUpdate(t,own.energy,null,true,own.tick-t.motorPending.tick+1,emit);
  }
  t.lastObservedTick=own.tick;t.awaitingObservation=false;t.dead=own.terminal;
}
export function freezeTasteKernelBody(t){freezeTasteEnergyBody(t);}
export function resetTasteKernelBody(t){
  resetTasteEnergyBody(t);
  t.kernel=createKernelLearner(t.config.tasteDimensions,TASTE_KERNEL_PROGRAM,TK_CAPACITY);
  t.kind='taste-kernel-v1';
}
export function compactTasteKernelBody(t){compactTasteEnergyBody(t);}
export function restoreTasteKernelBody(value){
  const t=restoreTasteEnergyBody(value);
  t.kernel=createKernelLearner(t.config.tasteDimensions,TASTE_KERNEL_PROGRAM,TK_CAPACITY);
  t.kind='taste-kernel-v1';
  return t;
}
