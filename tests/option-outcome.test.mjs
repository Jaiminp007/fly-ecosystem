import test from 'node:test';
import assert from 'node:assert/strict';
import {createOptionModel,rememberOption,predictOption,restoreOptionModel} from '../learning/option-outcome.mjs';
const inputs=x=>Array.from({length:17},(_,i)=>i===3?x:i===16?1:0);

test('finite-window outcomes require both local actions and preserve discounted factual targets',()=>{
  const model=createOptionModel({horizon:3});assert.equal(predictOption(model,inputs(.5)).available,false);
  for(let i=0;i<2;i++)rememberOption(model,inputs(.5),-1,[.1,.2,.3]);
  assert.equal(predictOption(model,inputs(.5)).available,false);
  for(let i=0;i<2;i++)rememberOption(model,inputs(.5),1,[.3,.2,.1]);
  const before=JSON.stringify(model),p=predictOption(model,inputs(.5));assert.ok(p.available);assert.equal(p.positive.estimate,.3+.99*.2+.99**2*.1);assert.ok(p.difference>0);assert.equal(JSON.stringify(model),before);
  const erased=predictOption(model,inputs(.5),{eraseAction:true});assert.equal(erased.difference,0);
  assert.throws(()=>rememberOption(model,inputs(.5),1,[.2,.1]),/completed/);
});

test('local outcome model represents opposite action effects in different sensory contexts',()=>{
  const model=createOptionModel({horizon:1,maxDistance:.1});
  for(let i=0;i<3;i++)for(const x of [0,1])for(const action of [-1,1])rememberOption(model,inputs(x),action,[x===0?-.2*action:.2*action]);
  assert.ok(predictOption(model,inputs(0)).difference<0);assert.ok(predictOption(model,inputs(1)).difference>0);
  assert.equal(predictOption(model,inputs(.5)).available,false);
});

test('bounded option histories continue exactly after JSON restore and reject corrupt targets',()=>{
  const a=createOptionModel({capacity:16,horizon:2});for(let i=0;i<30;i++)rememberOption(a,inputs(i/100),i%2?1:-1,[.1,-.02]);
  const b=restoreOptionModel(JSON.parse(JSON.stringify(a)));for(let i=0;i<20;i++){rememberOption(a,inputs(.2),i%2?1:-1,[.3,.1]);rememberOption(b,inputs(.2),i%2?1:-1,[.3,.1]);assert.deepEqual(predictOption(a,inputs(.2)),predictOption(b,inputs(.2)));}assert.deepEqual(a,b);assert.equal(a.records.length,16);
  const broken=structuredClone(a);broken.records[0].value+=.01;assert.throws(()=>restoreOptionModel(broken),/outcome/);
  broken.records[0].value=a.records[0].value;broken.records[0].experience--;assert.throws(()=>restoreOptionModel(broken),/sequence/);
  assert.throws(()=>createOptionModel({minimumPerAction:9}),/configuration/);
});
