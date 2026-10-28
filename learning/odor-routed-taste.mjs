import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {createOdorRoutedMotor,chooseOdorRoutedMotor,observeOdorRoutedMotor,freezeOdorRoutedMotor,resetOdorRoutedMotor} from './odor-routed-motor.mjs';
import {createStationaryTasteCredit,beginStationaryTasteAction,finishStationaryTasteAction} from './stationary-taste-credit.mjs';
import {learnDecoupledCueTaste,predictDecoupledCueTaste,resetDecoupledCueTaste} from './decoupled-cue-taste.mjs';
import {chooseContactAction} from './contact-action-bandit.mjs';

const priorLogit=Math.log(3),tasteScale=Math.sqrt(11);
const draw=state=>{state.taste.rngState=advanceRng(state.taste.rngState);state.work.scalarOperations+=7;return state.taste.rngState/4294967296;};
function features(state,cue){
  const phi=[1,...cue];
  for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)phi.push(cue[first]*cue[second]);
  state.work.scalarOperations+=6;return phi;
}
function prediction(state,phi){
  const logit=priorLogit+state.taste.weights.reduce((sum,weight,index)=>sum+weight*phi[index],0)/tasteScale;
  state.work.scalarOperations+=29;return 1/(1+Math.exp(-logit));
}
export function predictTargetTaste(state,cue,cueTastePolicy=null){
  assert.ok(Array.isArray(cue)&&cue.length===4&&(cue.every(value=>value===0)||cue.every(value=>value===-1||value===1)));
  assert.ok(cueTastePolicy===null||['shared','shared-plus-cue'].includes(cueTastePolicy));
  state.work.scalarOperations+=2;
  if(cue[0]===0)return 1;
  if(cueTastePolicy!==null){assert.ok(state.cueTaste);state.work.scalarOperations+=60;return predictDecoupledCueTaste(state.cueTaste,cue,cueTastePolicy);}
  return .05+.9*prediction(state,features(state,cue));
}
function update(state,record){
  const error=record.target-prediction(state,record.phi),step=.5*error/tasteScale;
  for(let index=0;index<11;index++)state.taste.weights[index]=Math.max(-8,Math.min(8,state.taste.weights[index]+step*record.phi[index]));
  state.work.scalarOperations+=4+11*4;
}
export function createOdorRoutedTasteBody(agentId,seed){
  const state=createOdorRoutedMotor(agentId,seed);state.work.scalarOperations+=2;
  state.charge={operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0};
  state.taste={weights:Array(11).fill(0),memory:[],seen:0,rngState:(seed^0x63d83595)>>>0||1};
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
export function observeOdorRoutedTaste(state,own,{cueTasteReplay=null}={}){
  const before=state.credit.scalarOperations,example=finishStationaryTasteAction(state.credit,own);
  state.work.scalarOperations+=state.credit.scalarOperations-before;
  if(state.acquisition&&example){
    state.tasteExamples++;
    if(state.cueTaste){const before=state.cueTaste.work.scalarOperations;learnDecoupledCueTaste(state.cueTaste,{agentId:state.agentId,tick:own.tick,cue:example.cue,target:Number(example.outcomeSign===1)},{replayPolicy:cueTasteReplay});state.work.scalarOperations+=state.cueTaste.work.scalarOperations-before;}
    else{
      const record={agentId:state.agentId,tick:own.tick,phi:features(state,example.cue),target:Number(example.outcomeSign===1)};
      state.taste.seen++;state.work.scalarOperations+=3;
      if(state.taste.memory.length<32)state.taste.memory.push(record);
      else{const index=Math.floor(draw(state)*state.taste.seen);state.work.scalarOperations+=3;if(index<32)state.taste.memory[index]=record;}
      update(state,record);
      const index=Math.floor(draw(state)*state.taste.memory.length);state.work.scalarOperations+=2;
      update(state,state.taste.memory[index]);
    }
  }
  observeOdorRoutedMotor(state,own);
}
export function freezeOdorRoutedTaste(state){freezeOdorRoutedMotor(state);}
export function resetOdorRoutedTaste(state){
  resetOdorRoutedMotor(state);state.taste.weights.fill(0);state.taste.memory=[];state.taste.seen=0;state.work.scalarOperations+=12;
  if(state.cueTaste){const before=state.cueTaste.work.scalarOperations;resetDecoupledCueTaste(state.cueTaste);state.work.scalarOperations+=state.cueTaste.work.scalarOperations-before;}
}
