import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {createCoverageBody,chooseCoverageAction,observeCoverageBody,freezeCoverageBody,resetCoverageBody} from './coverage-sarsa.mjs';
import {createStationaryTasteCredit,beginStationaryTasteAction,finishStationaryTasteAction} from './stationary-taste-credit.mjs';

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
function update(state,record){
  const error=record.target-prediction(state,record.phi),step=.5*error/tasteScale;
  for(let index=0;index<11;index++)state.taste.weights[index]=Math.max(-8,Math.min(8,state.taste.weights[index]+step*record.phi[index]));
  state.work.scalarOperations+=4+11*4;
}
export function createCoverageTasteBody(agentId,seed){
  const state=createCoverageBody(agentId,seed);state.work.scalarOperations+=2;
  state.taste={weights:Array(11).fill(0),memory:[],seen:0,rngState:(seed^0x63d83595)>>>0||1};
  state.credit=createStationaryTasteCredit(agentId);state.tasteExamples=0;return state;
}
export function chooseCoverageTaste(state,own,{fixedMove=null}={}){
  const choice=chooseCoverageAction(state,own);
  const move=fixedMove??choice.move;
  if(fixedMove!==null){
    assert.ok([-1,0,1].includes(fixedMove));
    if(state.pending)state.pending.action=move+1;
  }
  const phi=features(state,own.cue),probability=own.odorPresent?.05+.9*prediction(state,phi):1;
  const accept=draw(state)<probability;state.work.scalarOperations+=4;
  const creditAction=(move===-1?2:0)+(accept?0:1);
  beginStationaryTasteAction(state.credit,{agentId:own.agentId,tick:own.tick,action:creditAction,cue:own.cue,contactPresent:own.contactPresent&&own.odorPresent});
  return {...choice,action:move+1,move,accept,feedProbability:probability};
}
export function observeCoverageTaste(state,own){
  const before=state.credit.scalarOperations,example=finishStationaryTasteAction(state.credit,own);
  state.work.scalarOperations+=state.credit.scalarOperations-before;
  if(state.acquisition&&example){
    const record={agentId:state.agentId,tick:own.tick,phi:features(state,example.cue),target:Number(example.outcomeSign===1)};
    state.tasteExamples++;state.taste.seen++;state.work.scalarOperations+=3;
    if(state.taste.memory.length<32)state.taste.memory.push(record);
    else{const index=Math.floor(draw(state)*state.taste.seen);state.work.scalarOperations+=3;if(index<32)state.taste.memory[index]=record;}
    update(state,record);
    const index=Math.floor(draw(state)*state.taste.memory.length);state.work.scalarOperations+=2;
    update(state,state.taste.memory[index]);
  }
  observeCoverageBody(state,own);
}
export function freezeCoverageTaste(state){freezeCoverageBody(state);}
export function resetCoverageTaste(state){
  resetCoverageBody(state);state.taste.weights.fill(0);state.taste.memory=[];state.taste.seen=0;state.work.scalarOperations+=12;
}
