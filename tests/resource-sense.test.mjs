import test from 'node:test';
import assert from 'node:assert/strict';
import {localResourceSense} from '../learning/resource-sense.mjs';
import {createOptionModel,rememberOption,predictOption,restoreOptionModel} from '../learning/option-outcome.mjs';
const base=()=>Array(17).fill(0),body={x:0,y:0,genome:{traits:{sense:50}}};

test('resource receptor is local, bounded and reports the same patch selection criterion',()=>{
  assert.equal(localResourceSense(body,[{x:1,y:0,amount:.06},{x:51,y:0,amount:100}]),0);
  assert.equal(localResourceSense(body,[{x:10,y:0,amount:1},{x:40,y:0,amount:3}]),.75);
  assert.equal(localResourceSense(body,[{x:10,y:0,amount:1},{x:40,y:0,amount:1}]),.5);
  assert.throws(()=>localResourceSense(body,[{x:0,y:0,amount:-1}]),/patch/);
});

test('extra measurement can resolve constructed identical-observation contexts without changing erased geometry',()=>{
  const sensed=createOptionModel({resourceSense:true,horizon:1,maxDistance:.1}),erased=createOptionModel({horizon:1,maxDistance:.1});
  for(let i=0;i<3;i++)for(const strength of [.1,.9])for(const action of [-1,1]){const reward=(strength<.5?-1:1)*action*.2;rememberOption(sensed,[...base(),strength],action,[reward]);rememberOption(erased,base(),action,[reward]);}
  assert.ok(predictOption(sensed,[...base(),.1]).difference<0);assert.ok(predictOption(sensed,[...base(),.9]).difference>0);assert.equal(predictOption(erased,base()).difference,0);
  const zero=createOptionModel({resourceSense:true,horizon:1});const original=createOptionModel({horizon:1});for(let i=0;i<10;i++){const o=base();o[3]=i/20;rememberOption(zero,[...o,0],i%2?1:-1,[.1]);rememberOption(original,o,i%2?1:-1,[.1]);}assert.deepEqual(predictOption(zero,[...base(),0]),predictOption(original,base()));
});

test('resource model identity and acquired state survive checkpoints while disabled bytes remain exact',()=>{
  assert.deepEqual(createOptionModel(),createOptionModel({resourceSense:false}));
  const a=createOptionModel({resourceSense:true,horizon:1});for(let i=0;i<10;i++)rememberOption(a,[...base(),.5],i%2?1:-1,[.1]);const b=restoreOptionModel(JSON.parse(JSON.stringify(a)));for(let i=0;i<5;i++){rememberOption(a,[...base(),.6],1,[.2]);rememberOption(b,[...base(),.6],1,[.2]);}assert.deepEqual(a,b);
  const missing=structuredClone(a);delete missing.config.resourceSense;assert.throws(()=>restoreOptionModel(missing),/identity/);assert.throws(()=>rememberOption(a,base(),1,[.1]),/observation/);assert.throws(()=>predictOption(a,[...base(),-.1]),/observation/);assert.throws(()=>createOptionModel({resourceSense:1}),/flag/);
});
