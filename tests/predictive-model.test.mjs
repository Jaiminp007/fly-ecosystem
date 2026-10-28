import test from 'node:test';
import assert from 'node:assert/strict';
import {createPredictiveModel,predictTransition,learnTransition,restorePredictiveModel,planTransitionActions} from '../learning/predictive-model.mjs';
const observation=x=>[x,...Array(16).fill(0)],action=x=>[0,x,0,0,0];
const sample=(index)=>{const x=(index%5-2)*.2,a=index%2?1:-1,o=observation(x),next=observation(x+.05*a);return{o,a:action(a),target:{reward:.4*a+.2*x,nextObservation:next}};};

test('the transition learner acquires action effects from observed targets; action erasure removes their distinction',()=>{
  const full=createPredictiveModel(),erased=createPredictiveModel({actionConditioned:false}),frozen=createPredictiveModel();
  for(let i=0;i<2000;i++){const s=sample(i);learnTransition(full,s.o,s.a,s.target);learnTransition(erased,s.o,s.a,s.target);learnTransition(frozen,s.o,s.a,s.target,{learning:false});}
  const plus=predictTransition(full,observation(0),action(1)),minus=predictTransition(full,observation(0),action(-1));
  assert.ok(Math.abs(plus.reward-.4)<.01);assert.ok(Math.abs(minus.reward+.4)<.01);assert.ok(Math.abs(plus.nextObservation[0]-.05)<.01);assert.ok(Math.abs(minus.nextObservation[0]+.05)<.01);
  assert.deepEqual(predictTransition(erased,observation(0),action(1)),predictTransition(erased,observation(0),action(-1)));assert.equal(frozen.seen,0);assert.ok(frozen.weights.flat().every(x=>x===0));
});

test('learned forecasts and open-loop planning preserve state and survive exact continued checkpoints',()=>{
  const model=createPredictiveModel();for(let i=0;i<400;i++){const s=sample(i);learnTransition(model,s.o,s.a,s.target);}
  const restored=restorePredictiveModel(JSON.parse(JSON.stringify(model)));for(let i=400;i<800;i++){const s=sample(i);assert.deepEqual(learnTransition(model,s.o,s.a,s.target),learnTransition(restored,s.o,s.a,s.target));}assert.deepEqual(model,restored);
  const before=structuredClone(model),input=observation(0),options=[{id:'slow',action:action(-1)},{id:'fast',action:action(1)}],plan=planTransitionActions(model,input,options,{horizon:4});assert.equal(plan.available,true);assert.equal(plan.selected,'fast');assert.equal(plan.modelPredictions,8);assert.deepEqual(model,before);assert.deepEqual(input,observation(0));
  const reset=createPredictiveModel();assert.equal(planTransitionActions(reset,input,options).selected,null);assert.deepEqual(predictTransition(reset,input,action(1)),{reward:0,nextObservation:input});
});

test('malformed model state, labels and planning requests are rejected',()=>{
  const model=createPredictiveModel(),bad=structuredClone(model);bad.weights[0][0]=Infinity;assert.throws(()=>restorePredictiveModel(bad),/weights/);
  assert.throws(()=>learnTransition(model,observation(0),action(1),{reward:2,nextObservation:observation(0)}),/reward/);
  assert.throws(()=>predictTransition(model,[0],action(1)),/observation/);assert.throws(()=>createPredictiveModel({learningRate:0}),/configuration/);
  assert.throws(()=>planTransitionActions(model,observation(0),[{id:'same',action:action(1)},{id:'same',action:action(-1)}]),/IDs/);
});
