import test from 'node:test';
import assert from 'node:assert/strict';
import {createReplaySteering,chooseReplaySteering,terminateReplaySteering} from '../learning/replay-steering.mjs';

function nextRandom(seed){
  let value=seed;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;
}
function referenceUpdate(weights,record,rate){
  const dot=(row,features)=>row.reduce((sum,value,index)=>sum+value*features[index],0);
  const current=dot(weights[record.action],record.features);
  const next=record.terminal?0:record.available?Math.max(dot(weights[0],record.nextFeatures),dot(weights[1],record.nextFeatures)):dot(weights[0],record.nextFeatures);
  const delta=record.reward+Math.exp(-1/256)*next-current;
  weights[record.action]=weights[record.action].map((value,index)=>Math.max(-8,Math.min(8,value+rate*delta*record.features[index])));
}
test('independent reservoir, updates and work reconstruct a full own history',()=>{
  const agentId=17,seed=13579,state=createReplaySteering(agentId,seed);
  const reference={weights:[Array(8).fill(0),Array(8).fill(0)],memory:[],seen:0,retention:(seed^0x9e3779b9)>>>0||1,replay:(seed^0xa511e9b3)>>>0||1,work:0};
  let previous=null;
  const ingest=(current,terminal)=>{
    const record={agentId,tick:previous.tick,action:previous.action,features:previous.features,nextFeatures:terminal?null:current.features,
      available:terminal?false:current.available,reward:(current.energy-previous.energy)/120,terminal};
    referenceUpdate(reference.weights,record,.05);reference.seen++;
    reference.work+=(terminal?12:20)+(terminal?76:108)+2;
    if(reference.memory.length<32)reference.memory.push(record);
    else{
      reference.retention=nextRandom(reference.retention);const slot=Math.floor(reference.retention/4294967296*reference.seen);
      reference.work+=10;if(slot<32)reference.memory[slot]=record;
    }
    reference.replay=nextRandom(reference.replay);const sample=reference.memory[Math.floor(reference.replay/4294967296*reference.memory.length)];
    referenceUpdate(reference.weights,sample,.01);reference.work+=9+(sample.terminal?76:108);
  };
  for(let tick=1;tick<=90;tick++){
    const current={tick,energy:20+Math.sin(tick/8),features:[1,tick/100,Math.sin(tick),Math.cos(tick),0,0,.25,-.2],available:tick%3!==0};
    if(previous)ingest(current,false);
    current.action=current.available&&tick%2===0?1:0;
    chooseReplaySteering(state,{agentId,tick,energy:current.energy,features:current.features,midpointAvailable:current.available},{forcedAction:current.action});
    reference.work+=49;previous=current;
    assert.deepEqual(state.weights,reference.weights);assert.deepEqual(state.memory,reference.memory);
    assert.equal(state.retentionRngState,reference.retention);assert.equal(state.replayRngState,reference.replay);
    assert.equal(state.work.scalarOperations,reference.work);
  }
  ingest({energy:0},true);terminateReplaySteering(state,{agentId,tick:90,energy:0});
  assert.deepEqual(state.weights,reference.weights);assert.deepEqual(state.memory,reference.memory);
  assert.equal(state.work.scalarOperations,reference.work);assert.equal(state.seen,90);
});
