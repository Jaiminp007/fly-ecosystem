// ODOR DEV ROUND 3 fixtures (PLAN V1 §5): guard-feature encoding +
// dim-parameterized steering. Synthetic histories/seeds only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnSteering,chooseOwnSteering,STEERING_FEATURES} from '../learning/own-steering.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const mkOwn=(tick,f8)=>({agentId:1,tick,energy:60,features:[...f8],midpointAvailable:true});
const F8=[1,0.5,0,0,0.3,0.1,0.5,0];

test('legacy 8-dim behavior identical; 10-dim bills the exact delta',()=>{
  const a=createOwnSteering(1,7),b=createOwnSteering(1,7,10);
  assert.equal(a.weights[0].length,8);assert.equal(b.weights[0].length,10);
  const ra=chooseOwnSteering(a,mkOwn(1,F8));
  const rb=chooseOwnSteering(b,mkOwn(1,[...F8,1,0.25]));
  assert.equal(ra.action,rb.action); // zero-init extra weights contribute nothing
  assert.equal(b.work.scalarOperations-a.work.scalarOperations,8); // values 40 vs 32
  const ra2=chooseOwnSteering(a,mkOwn(2,F8));
  const rb2=chooseOwnSteering(b,mkOwn(2,[...F8,1,0.25]));
  assert.equal(ra2.action,rb2.action);
  assert.equal(b.work.scalarOperations-a.work.scalarOperations,8+34); // +update delta 26 + choose delta 8
});

test('dim mismatch rejected; non-original learner with dims rejected',()=>{
  const b=createOwnSteering(1,7,10);
  assert.throws(()=>chooseOwnSteering(b,mkOwn(1,F8)));
  assert.throws(()=>new OdorRoutedExperiment({history:{seed:900031,cueSeed:900032,resourceSeeds:[900033,900034,900035,900036]},
    reference:{...VALUE_REFERENCE,founders:2},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringDims:10}));
});

test('smoke: 10-dim steering flows with guard channels in [0,1]',()=>{
  const seen=[];
  const run=new OdorRoutedExperiment({history:{seed:900041,cueSeed:900042,resourceSeeds:[900043,900044,900045,900046]},
    reference:{...VALUE_REFERENCE,founders:2},acquisitionGeometry:'continual',steeringDims:10,
    emit:e=>{if(e.type==='decision')seen.push(e.features);}});
  run.advance(4);
  assert.ok(seen.length>0);
  for(const f of seen){assert.equal(f.length,10);assert.ok(f[8]===0||f[8]===1);assert.ok(f[9]>=0&&f[9]<=1);}
  for(const id of Object.keys(run.learners))assert.equal(run.learners[id].steering.weights[0].length,10);
});
