// ODOR DEV ROUND 4 fixtures (PLAN V1 §5): frozen BC rule unit tests.
// Synthetic only. Zero bank worlds.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnSteering,superviseOwnSteering,STEERING_FEATURES} from '../learning/own-steering.mjs';

const F=(...xs)=>{const v=new Array(8).fill(0);xs.forEach(([i,x])=>v[i]=x);return v;};

test('already-correct predicts without updating; billing is values-only',()=>{
  const s=createOwnSteering(1,7);
  const r=superviseOwnSteering(s,F([0,1]),0);
  assert.equal(r.updated,false);
  assert.equal(r.ops,2*2*8);
  assert.equal(s.work.scalarOperations,2*2*8);
  assert.deepEqual(s.weights,[new Array(8).fill(0),new Array(8).fill(0)]);
});

test('wrong prediction pushes expert up and rival down with clip bounds',()=>{
  const s=createOwnSteering(1,7);
  // force a wrong prediction: rival strongly positive on feature 0
  s.weights[1][0]=8;
  const r=superviseOwnSteering(s,F([0,1]),0);
  assert.equal(r.action,1);assert.equal(r.updated,true);
  assert.equal(r.ops,2*2*8+2*(2*8+1));
  assert.ok(s.weights[0][0]>0&&s.weights[1][0]<8);
  // clip: extreme features cannot escape [-8,8]
  for(let i=0;i<200;i++)superviseOwnSteering(s,F([0,1000]),0);
  for(const row of s.weights)for(const w of row)assert.ok(w>=-8&&w<=8);
});

test('perceptron converges on separable synthetic data',()=>{
  const s=createOwnSteering(1,7);
  const data=[];
  for(let i=0;i<40;i++)data.push({f:F([0,i%2?1:-1],[1,0.5]),a:i%2});
  for(let epoch=0;epoch<20;epoch++)for(const d of data)superviseOwnSteering(s,d.f,d.a);
  let correct=0;
  for(const d of data){const s0=s.weights[0].reduce((t,w,j)=>t+w*d.f[j],0),s1=s.weights[1].reduce((t,w,j)=>t+w*d.f[j],0);if((s1>s0?1:0)===d.a)correct++;}
  assert.ok(correct>=38,`converged ${correct}/40`);
});

test('rejects bad features and bad experts',()=>{
  const s=createOwnSteering(1,7);
  assert.throws(()=>superviseOwnSteering(s,[1,2,3],0));
  assert.throws(()=>superviseOwnSteering(s,F([0,1]),2));
});
