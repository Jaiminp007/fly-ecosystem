import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {createOdorRoutedMotor,chooseOdorRoutedMotor,observeOdorRoutedMotor,freezeOdorRoutedMotor,resetOdorRoutedMotor} from './odor-routed-motor.mjs';
import {createStationaryTasteCredit,beginStationaryTasteAction,finishStationaryTasteAction} from './stationary-taste-credit.mjs';
import {learnDecoupledCueTaste,predictDecoupledCueTaste,resetDecoupledCueTaste} from './decoupled-cue-taste.mjs';
import {chooseContactAction} from './contact-action-bandit.mjs';

const priorLogit=Math.log(3),tasteScale=Math.sqrt(11);
const draw=state=>{state.taste.rngState=advanceRng(state.taste.rngState);state.work.scalarOperations+=7;return state.taste.rngState/4294967296;};
function features(state,cue){
  if(state.taste.code==='masks'){
    // Composable code: one Walsh product per listed mask over the 4 cue bits.
    // Opt-in wide odor (tasteProgram.odor): each 4-bit cue pattern names an
    // n-bit odor code read only by taste; masks then range over those n bits.
    const odor=state.taste.odor,bits=odor?odor[cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0)]:cue;
    const phi=state.taste.masks.map(mask=>{let value=1;for(let bit=0;bit<bits.length;bit++)if(mask>>bit&1)value*=bits[bit];return value;});
    state.work.scalarOperations+=2*phi.length;return phi;
  }
  if(state.taste.code==='identity'){
    // Complete Walsh basis over the 4 cue bits: distinct cues get orthogonal
    // feature vectors, so an update on one cue leaves every other cue's
    // prediction unchanged (no cross-task interference). 16 products.
    const phi=[];for(let mask=0;mask<16;mask++){let value=1;for(let bit=0;bit<4;bit++)if(mask>>bit&1)value*=cue[bit];phi.push(value);}
    state.work.scalarOperations+=32;return phi;
  }
  const phi=[1,...cue];
  for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)phi.push(cue[first]*cue[second]);
  state.work.scalarOperations+=6;return phi;
}
function odorBits(state,cue){const odor=state.taste.odor;return odor?odor[cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0)]:cue;}
const walshOf=(mask,bits)=>{let value=1;for(let bit=0;bit<bits.length;bit++)if(mask>>bit&1)value*=bits[bit];return value;};
// In-life self-revision. Evidence per Walsh term = sum over own examples of term*r, where r is
// target - own prediction before the update ('residual': what the current model fails to explain)
// or 2*target-1 ('raw'); the threshold scales with sqrt(sum r^2). Every `every` examples
// the fly scores the one-bit extensions of its current masks; if the best one's |evidence| exceeds
// z*sqrt(sum residual^2) it adds a mask: that one ('evid') or a random extension ('random', a sham
// matched in timing and count). New weight 0; stored records gain the feature.
function selfRevise(state,record){
  const r=state.taste.revise,bits=record.bits,res=r.kind==='raw'?2*record.target-1:r.residual;r.n++;r.s2=(r.s2??0)+res*res;
  for(let m=0;m<r.evidence.length;m++)r.evidence[m]+=walshOf(m,bits)*res;state.work.scalarOperations+=2*r.evidence.length+3;
  if(r.n%r.every||state.taste.masks.length>=r.cap)return;
  const have=new Set(state.taste.masks),kids=new Set();
  for(const m of state.taste.masks)if(m)for(let b=0;b<bits.length;b++){const c=m|1<<b;if(!have.has(c))kids.add(c);}
  const list=[...kids].sort((a,b)=>a-b);state.work.scalarOperations+=2*list.length;if(!list.length)return;
  const best=list.reduce((a,c)=>Math.abs(r.evidence[c])>Math.abs(r.evidence[a])?c:a,list[0]);
  if(Math.abs(r.evidence[best])<=r.z*Math.sqrt(r.s2))return;
  let chosen=best;if(r.mode==='random'){r.rngState=advanceRng(r.rngState);chosen=list[Math.floor(r.rngState/4294967296*list.length)];}
  // 'oracle' (bound check only): adds the next true term not yet held, at the times 'evid' would add.
  if(r.mode==='oracle'){chosen=r.oracle.find(m=>!have.has(m));if(chosen===undefined)return;}
  state.taste.masks.push(chosen);state.taste.weights.push(0);r.added.push({n:r.n,mask:chosen});
  for(const rec of state.taste.memory)if(rec.bits)rec.phi.push(walshOf(chosen,rec.bits));
  state.work.scalarOperations+=4+state.taste.memory.length;
}
function prediction(state,phi){
  const K=state.taste.quantileK??1;
  if(state.taste.splitTaste===true){
    // R10 split behavior (docs/ODOR_DEV_ROUND10_PLAN_V1.md, frozen):
    // difference of readouts. Uniform 59 billing (2x29 + 1 difference).
    let dg=0,dn=0;
    for(let j=0;j<11;j++){dg+=state.taste.goW[j]*phi[j];dn+=state.taste.nogoW[j]*phi[j];}
    state.work.scalarOperations+=59;
    return 1/(1+Math.exp(-(priorLogit+(dg-dn)/tasteScale)));
  }
  if(K<=1){
    const logit=(state.taste.prior??priorLogit)+state.taste.weights.reduce((sum,weight,index)=>sum+weight*phi[index],0)/Math.sqrt(phi.length);
    state.work.scalarOperations+=29;return 1/(1+Math.exp(-logit));
  }
  // R9 distributional behavior (docs/ODOR_DEV_ROUND9_PLAN_V1.md, frozen):
  // mean of head predictions; rule unchanged, representation enriched.
  let sum=0;
  for(let h=0;h<K;h++){
    const w=state.taste.qweights[h];
    let dot=0;for(let j=0;j<11;j++)dot+=w[j]*phi[j];
    sum+=1/(1+Math.exp(-(priorLogit+dot/tasteScale)));
  }
  state.work.scalarOperations+=K*30;return sum/K;
}
export function predictTargetTaste(state,cue,cueTastePolicy=null){
  assert.ok(Array.isArray(cue)&&cue.length===4&&(cue.every(value=>value===0)||cue.every(value=>value===-1||value===1)));
  assert.ok(cueTastePolicy===null||['shared','shared-plus-cue'].includes(cueTastePolicy));
  state.work.scalarOperations+=2;
  if(cue[0]===0)return 1;
  if(cueTastePolicy!==null){assert.ok(state.cueTaste);state.work.scalarOperations+=60;return predictDecoupledCueTaste(state.cueTaste,cue,cueTastePolicy);}
  return .05+.9*prediction(state,features(state,cue));
}
function update(state,record,mode){
  assert.ok(mode==='live'||mode==='replay');
  // A2 adaptive baseline (docs/ODOR_DEV_ROUND8_AMENDMENT_A2.md, frozen):
  // c tracks the background target rate (EMA, alpha=baselineRate);
  // centered error = (target-c)-prediction. EMA computed-always/
  // apply-live: uniform +4 billing in both modes (48->52 lumped);
  // behavior changes only when baselineRate>0 (plain-JS gate, no RNG
  // draws, so null arms match legacy code in weights/decisions).
  const alpha=state.taste.baselineRate??0;
  let target=record.target;
  if(alpha>0){
    const nextC=state.taste.baselineC+alpha*(record.target-state.taste.baselineC);
    if(mode==='live')state.taste.baselineC=nextC;
    target=record.target-state.taste.baselineC;
  }
  const K=state.taste.quantileK??1;
  if(state.taste.splitTaste===true){
    // R10 routed update (docs/ODOR_DEV_ROUND10_PLAN_V1.md, frozen).
    // Plain-JS; mode gates only the (off-in-R10) baseline above. Uniform
    // 82 billing (29 head-pred + 48 update + 4 baseline-off + 1 route).
    const go=record.target===1,w=go?state.taste.goW:state.taste.nogoW;
    let dot=0;for(let j=0;j<11;j++)dot+=w[j]*record.phi[j];
    const pred=1/(1+Math.exp(-(priorLogit+dot/tasteScale)));
    const step=.5*(record.target-pred)/tasteScale;
    for(let j=0;j<11;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*record.phi[j]));
    state.work.scalarOperations+=82;
    return;
  }
  if(K<=1){
    const error=target-prediction(state,record.phi),step=(state.taste.step??.5)*error/Math.sqrt(record.phi.length);
    for(let index=0;index<record.phi.length;index++)state.taste.weights[index]=Math.max(-8,Math.min(8,state.taste.weights[index]+step*record.phi[index]));
    state.work.scalarOperations+=4+11*4+4;
    return;
  }
  // R9 K-head quantile update (docs/ODOR_DEV_ROUND9_PLAN_V1.md, frozen).
  // Plain-JS, mode gates only the (off-in-R9) baseline above; both modes
  // update all heads. Uniform K*82 billing (composition per head: 29 pred
  // + 48 update + 4 baseline-off + 1 tau-indicator).
  for(let h=0;h<K;h++){
    const tau=(h+0.5)/K,w=state.taste.qweights[h];
    let dot=0;for(let j=0;j<11;j++)dot+=w[j]*record.phi[j];
    const pred=1/(1+Math.exp(-(priorLogit+dot/tasteScale)));
    const step=.5*(tau-(target<pred?1:0))/tasteScale;
    for(let j=0;j<11;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*record.phi[j]));
  }
  state.work.scalarOperations+=K*82;
}
// tasteProgram: optional algorithm revision {step, replays, memory, prior} for
// the plain single-head learner; omitted fields keep the original constants.
export function createOdorRoutedTasteBody(agentId,seed,{baselineRate=0,quantileHeads=1,splitTaste=false,tasteCode='pairwise',tasteProgram=null}={}){
  if(tasteProgram!==null){assert.ok(quantileHeads===1&&!splitTaste);const {step=.5,replays=1,memory=32,prior=priorLogit,masks:_masks,odor:_odor,selfRevise:_selfRevise,...rest}=tasteProgram;assert.equal(Object.keys(rest).length,0);
    assert.ok(step>0&&step<=8&&Number.isInteger(replays)&&replays>=0&&replays<=8&&Number.isInteger(memory)&&memory>=1&&memory<=512&&Number.isFinite(prior));}
  assert.ok(['pairwise','identity','masks'].includes(tasteCode));
  const masks=tasteCode==='masks'?tasteProgram?.masks:null,odor=tasteProgram?.odor??null;
  if(odor!==null)assert.ok(tasteCode==='masks'&&Array.isArray(odor)&&odor.length===16&&odor.every(code=>Array.isArray(code)&&code.length===odor[0].length&&code.length>=4&&code.length<=16&&code.every(v=>v===-1||v===1)));
  if(tasteCode==='masks')assert.ok(Array.isArray(masks)&&masks.length>0&&new Set(masks).size===masks.length&&masks.every(m=>Number.isInteger(m)&&m>=0&&m<2**(odor?odor[0].length:4)));
  assert.ok(tasteCode==='pairwise'||(quantileHeads===1&&!splitTaste),'identity code uses the plain single-head learner');
  assert.ok(Number.isFinite(baselineRate)&&baselineRate>=0&&baselineRate<=1);
  assert.ok(Number.isInteger(quantileHeads)&&quantileHeads>=1);
  assert.equal(typeof splitTaste,'boolean');
  const state=createOdorRoutedMotor(agentId,seed);state.work.scalarOperations+=2;
  state.charge={operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0};
  state.taste={weights:Array(tasteCode==='identity'?16:tasteCode==='masks'?masks.length:11).fill(0),...(tasteCode==='identity'?{code:'identity'}:{}),...(tasteCode==='masks'?{code:'masks',masks:[...masks],...(odor!==null?{odor:odor.map(code=>[...code])}:{})}:{}),...(tasteProgram!==null?{step:tasteProgram.step??.5,replays:tasteProgram.replays??1,memoryCap:tasteProgram.memory??32,prior:tasteProgram.prior??priorLogit}:{}),memory:[],seen:0,rngState:(seed^0x63d83595)>>>0||1,baselineC:0,baselineRate,quantileK:quantileHeads,splitTaste,...(quantileHeads>1?{qweights:Array.from({length:quantileHeads},()=>Array(11).fill(0))}:{}),...(splitTaste?{goW:Array(11).fill(0),nogoW:Array(11).fill(0)}:{})};
  // Opt-in in-life self-revision (docs/RSI_P11_PLAN.md): the fly extends its own mask set from its own evidence.
  const revise=tasteProgram?.selfRevise??null;
  if(revise!==null){const {mode,every,z,cap,evidence='residual',oracle=null,...extra}=revise;assert.equal(Object.keys(extra).length,0);
    assert.ok(tasteCode==='masks'&&['evid','random','oracle'].includes(mode)&&(mode==='oracle')===Array.isArray(oracle)&&Number.isInteger(every)&&every>=1&&z>0&&Number.isInteger(cap)&&cap>=masks.length&&['raw','residual'].includes(evidence));
    state.taste.revise={mode,every,z,cap,kind:evidence,...(oracle?{oracle:[...oracle]}:{}),evidence:Array(2**(odor?odor[0].length:4)).fill(0),n:0,added:[],rngState:(seed^0x1b873593)>>>0||1};}
  state.credit=createStationaryTasteCredit(agentId);state.tasteExamples=0;return state;
}
export function chooseOdorRoutedTaste(state,own,{fixedMove=null,requireHomogeneousContact=false,tasteDecisionMode=null,cueTastePolicy=null,contactStop=null,contactBandit=null}={}){
  assert.equal(typeof requireHomogeneousContact,'boolean');
  assert.ok(tasteDecisionMode===null||['sample','threshold'].includes(tasteDecisionMode));
  assert.ok(cueTastePolicy===null||['shared','shared-plus-cue'].includes(cueTastePolicy));
  assert.ok(contactStop===null||['shadow','stop'].includes(contactStop)&&fixedMove===null&&requireHomogeneousContact);
  assert.ok(contactBandit===null||['learned','random','shadow'].includes(contactBandit)&&contactStop===null&&fixedMove===null&&requireHomogeneousContact&&state.contactBandit);
  if(requireHomogeneousContact)assert.equal(typeof own.contactHomogeneous,'boolean');
  const choice=chooseOdorRoutedMotor(state,own,{fixedMove});
  const phi=features(state,own.cue),probability=own.odorPresent?(cueTastePolicy===null?.05+.9*prediction(state,phi):predictTargetTaste(state,own.cue,cueTastePolicy)):1;
  const sampled=draw(state)<probability;state.work.scalarOperations+=4;
  let accept=sampled;if(tasteDecisionMode!==null){const threshold=probability>.5;state.work.scalarOperations+=2;if(tasteDecisionMode==='threshold')accept=threshold;}
  let move=choice.move;
  if(contactStop!==null){
    const eligible=own.odorPresent&&own.contactPresent&&own.contactHomogeneous&&accept;
    move=contactStop==='stop'&&eligible?-1:move;
    const bank=state.banks[choice.route];if(bank.pending)bank.pending.action=move+1;
    state.work.scalarOperations+=7;
    choice.contactStop={eligible,proposedMove:choice.move};
  }
  if(contactBandit!==null&&own.odorPresent&&own.contactPresent&&own.contactHomogeneous&&accept&&move!==-1){
    const before=state.contactBandit.work.scalarOperations,gate=chooseContactAction(state.contactBandit,{agentId:own.agentId,tick:own.tick,energy:own.energy,cue:own.cue,feedProbability:probability},{mode:contactBandit});state.work.scalarOperations+=state.contactBandit.work.scalarOperations-before;
    choice.contactBandit={...gate,proposedMove:move};if(gate.action===1)move=-1;const bank=state.banks[choice.route];if(bank.pending)bank.pending.action=move+1;state.work.scalarOperations+=3;
  }
  const creditAction=(move===-1?2:0)+(accept?0:1);
  beginStationaryTasteAction(state.credit,{agentId:own.agentId,tick:own.tick,action:creditAction,cue:own.cue,contactPresent:own.contactPresent&&own.odorPresent&&(!requireHomogeneousContact||own.contactHomogeneous)});
  return {...choice,action:move+1,move,accept,feedProbability:tasteDecisionMode==='threshold'?Number(accept):probability,...(tasteDecisionMode!==null?{tasteEstimate:probability}:{})};
}
// Read-only instrumentation: listeners receive each completed taste example.
// They cannot change learner state, billing or random draws.
export const tasteExampleListeners=new Set();
export function observeOdorRoutedTaste(state,own,{cueTasteReplay=null}={}){
  const before=state.credit.scalarOperations,example=finishStationaryTasteAction(state.credit,own);
  state.work.scalarOperations+=state.credit.scalarOperations-before;
  if(example&&tasteExampleListeners.size)for(const listener of tasteExampleListeners)listener({agentId:state.agentId,cue:[...example.cue],target:Number(example.outcomeSign===1)});
  if(state.acquisition&&example){
    state.tasteExamples++;
    if(state.cueTaste){const before=state.cueTaste.work.scalarOperations;learnDecoupledCueTaste(state.cueTaste,{agentId:state.agentId,tick:own.tick,cue:example.cue,target:Number(example.outcomeSign===1)},{replayPolicy:cueTasteReplay});state.work.scalarOperations+=state.cueTaste.work.scalarOperations-before;}
    else{
      const record={agentId:state.agentId,tick:own.tick,phi:features(state,example.cue),target:Number(example.outcomeSign===1)};
      if(state.taste.revise){record.bits=[...odorBits(state,example.cue)];state.taste.revise.residual=record.target-prediction(state,record.phi);}
      state.taste.seen++;state.work.scalarOperations+=3;
      const cap=state.taste.memoryCap??32;
      if(state.taste.memory.length<cap)state.taste.memory.push(record);
      else{const index=Math.floor(draw(state)*state.taste.seen);state.work.scalarOperations+=3;if(index<cap)state.taste.memory[index]=record;}
      update(state,record,'live');
      for(let r=0;r<(state.taste.replays??1);r++){
        const index=Math.floor(draw(state)*state.taste.memory.length);state.work.scalarOperations+=2;
        update(state,state.taste.memory[index],'replay');
      }
      if(state.taste.revise)selfRevise(state,record);
    }
  }
  observeOdorRoutedMotor(state,own);
}
export function freezeOdorRoutedTaste(state){freezeOdorRoutedMotor(state);}
export function resetOdorRoutedTaste(state){
  resetOdorRoutedMotor(state);state.taste.weights.fill(0);state.taste.memory=[];state.taste.seen=0;state.taste.baselineC=0;if(state.taste.qweights)for(const w of state.taste.qweights)w.fill(0);if(state.taste.goW)state.taste.goW.fill(0);if(state.taste.nogoW)state.taste.nogoW.fill(0);state.work.scalarOperations+=12;
  if(state.cueTaste){const before=state.cueTaste.work.scalarOperations;resetDecoupledCueTaste(state.cueTaste);state.work.scalarOperations+=state.cueTaste.work.scalarOperations-before;}
}
