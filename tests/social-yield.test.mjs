import test from 'node:test';
import assert from 'node:assert/strict';
import {yieldFeatures,createYieldPredictor,predictYield,updateYield,ownYieldSamples} from '../learning/social-yield.mjs';

test('labels become available only after eight own transitions and never cross phases or founders',()=>{
  const records=Array.from({length:20},(_,index)=>({id:1,tick:index+1,phase:index<10?'A':'B',raw:Array(17).fill(0),outputs:[0,0,1,-1,0],intake:index===7?1:0}));
  const result=ownYieldSamples(records);assert.equal(result.samples.length,6);assert.equal(result.censored,14);
  assert.deepEqual(result.samples.map(sample=>sample.label),[1,1,1,0,0,0]);
  assert.ok(result.samples.every(sample=>sample.availableTick-sample.record.tick===7));
});
test('social blindness shares dimensions; delayed information is past-only; prediction never changes weights',()=>{
  const records=Array.from({length:42},(_,index)=>({tick:index+1,phase:'A',raw:Array(17).fill(index/100),outputs:[0,0,1],intake:0}));
  const sample=ownYieldSamples(records).samples[32];assert.equal(sample.delayed[0],0);assert.equal(sample.social[0],.32);
  const social=yieldFeatures(sample.record,sample.social,'social'),blind=yieldFeatures(sample.record,sample.social,'blind');assert.equal(social.length,blind.length);
  assert.deepEqual(blind.slice(-5),Array(5).fill(0));
  const model=createYieldPredictor(social.length),before=[...model.weights];assert.equal(predictYield(model,social),.5);assert.deepEqual(model.weights,before);
  updateYield(model,social,1);assert.ok(predictYield(model,social)>.5);assert.equal(model.updates,1);
});
