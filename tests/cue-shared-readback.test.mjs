import test from 'node:test';
import assert from 'node:assert/strict';
import {createCueSharedSteering,chooseCueSharedSteering,terminateCueSharedSteering} from '../learning/cue-shared-steering.mjs';

function advance(seed){let value=seed;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;}
function route(cue){if(cue.every(value=>value===0))return 0;return 1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);}
function scores(reference,context,features){return reference.shared.map((row,action)=>row.reduce((sum,weight,index)=>sum+(weight+reference.banks[context][action][index])*features[index],0));}
function update(reference,energy,nextContext,nextFeatures,available,terminal){
  const prior=reference.pending,prediction=scores(reference,prior.route,prior.features)[prior.action],next=terminal?0:scores(reference,nextContext,nextFeatures);
  const bootstrap=terminal?0:available?Math.max(...next):next[0],delta=(energy-prior.energy)/120+Math.exp(-1/256)*bootstrap-prediction;
  for(let index=0;index<8;index++){
    const increment=.025*delta*prior.features[index];
    reference.shared[prior.action][index]=Math.max(-8,Math.min(8,reference.shared[prior.action][index]+increment));
    reference.banks[prior.route][prior.action][index]=Math.max(-8,Math.min(8,reference.banks[prior.route][prior.action][index]+increment));
  }
  reference.work+=terminal?129:177;reference.updates++;reference.pending=null;
}
test('independent cross-context TD, RNG and work reconstruction',()=>{
  const seed=123456789,state=createCueSharedSteering(1,seed),zeros=()=>Array.from({length:2},()=>Array(8).fill(0));
  const reference={shared:zeros(),banks:Array.from({length:17},zeros),pending:null,rng:seed,work:288,updates:0};
  for(let tick=1;tick<=80;tick++){
    const cue=tick%5===0?[0,0,0,0]:Array.from({length:4},(_,index)=>(tick>>index&1)?1:-1),context=route(cue);
    const features=[1,tick/100,Math.sin(tick),Math.cos(tick),0,.2,-.3,.4],energy=20+Math.sin(tick/4),available=tick%3!==0;
    reference.work+=9;if(reference.pending)update(reference,energy,context,features,available,false);
    const predictions=scores(reference,context,features),best=available&&predictions[1]>predictions[0]?1:0;
    reference.rng=advance(reference.rng);const proposed=available&&reference.rng/4294967296<.1?1-best:best,action=available&&tick%2===0?1:0;
    const actual=chooseCueSharedSteering(state,{agentId:1,tick,energy,cue,features,midpointAvailable:available},{forcedAction:action});
    reference.work+=65;reference.pending={tick,energy,route:context,action,features};
    assert.deepEqual(actual,{action,proposed,predictions});assert.deepEqual(state.weights,reference.shared);assert.deepEqual(state.contextWeights,reference.banks);
    assert.equal(state.rngState,reference.rng);assert.equal(state.work.scalarOperations,reference.work);assert.equal(state.updates,reference.updates);
  }
  update(reference,0,null,null,false,true);terminateCueSharedSteering(state,{agentId:1,tick:80,energy:0});
  assert.deepEqual(state.weights,reference.shared);assert.deepEqual(state.contextWeights,reference.banks);assert.equal(state.work.scalarOperations,reference.work);assert.equal(state.updates,reference.updates);
});
