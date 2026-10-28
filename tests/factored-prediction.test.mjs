import test from 'node:test';
import assert from 'node:assert/strict';
import {createPredictiveModel,predictTransition,learnTransition,restorePredictiveModel,planTransitionActions} from '../learning/predictive-model.mjs';
const observation=x=>[x,...Array(16).fill(0)],action=x=>[0,x,0,0,0];

test('a factored model learns action-sensitive dynamics with state-only rewards and plans through predicted future states',()=>{
  const model=createPredictiveModel({rewardActionConditioned:false});
  for(let i=0;i<2000;i++){const x=(i%5-2)*.2,a=i%2?1:-1;learnTransition(model,observation(x),action(a),{reward:.5*x,nextObservation:observation(x+.05*a)});}
  const plus=predictTransition(model,observation(0),action(1)),minus=predictTransition(model,observation(0),action(-1));
  assert.equal(plus.reward,minus.reward);assert.ok(plus.nextObservation[0]>minus.nextObservation[0]);assert.ok(model.weights[0].slice(18).every(x=>x===0));
  const plan=planTransitionActions(model,observation(0),[{id:'slow',action:action(-1)},{id:'fast',action:action(1)}],{horizon:4});assert.equal(plan.selected,'fast');assert.equal(model.kind,'factored-transition');
});

test('factored head checkpoints continue exactly and reject missing or contradictory head identity',()=>{
  const a=createPredictiveModel({rewardActionConditioned:false});for(let i=0;i<100;i++)learnTransition(a,observation(.2),action(i%2?1:-1),{reward:.1,nextObservation:observation(.25)});
  const b=restorePredictiveModel(JSON.parse(JSON.stringify(a)));for(let i=0;i<40;i++){const data={reward:.1,nextObservation:observation(.3)};assert.deepEqual(learnTransition(a,observation(.2),action(1),data),learnTransition(b,observation(.2),action(1),data));}assert.deepEqual(a,b);
  const missing=structuredClone(a);delete missing.config.rewardActionConditioned;assert.throws(()=>restorePredictiveModel(missing),/identity/);
  const mislabeled=structuredClone(a);mislabeled.weights[0][18]=.1;assert.throws(()=>restorePredictiveModel(mislabeled),/action weights/);
  assert.throws(()=>createPredictiveModel({rewardActionConditioned:null}),/conditioning/);
});
