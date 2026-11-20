// BALDWIN fixtures (G5 gate). Zero bank worlds: synthetic curves/records,
// temp-dir bank, engine unit checks. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createTasteEnergyBody} from '../learning/taste-energy.mjs';
import {scoreEpisodeBaldwin,scoreBaldwin,baldwinDevBank,
  B_RETURN_START,B_EPISODE_TICKS} from '../scripts/baldwin-dev.mjs';

const mkRow=(arm,seed,off,rate,refBase=10)=>{
  const means={},counts={};
  for(let t=0;t<1792;t++){means[t]=0;counts[t]=24;}
  for(let t=100;t<512;t++)means[t]=refBase;
  if(off!==null)for(let t=1536+off;t<1792;t++)means[t]=refBase;
  return {history:{seed},arm,rate,curves:{means,counts},phaseRows:[],
    endpoint:{budgetAdjustedEnergyPerFounder:1.0}};
};
const SEEDS=[402001,402010,402019,402028];
const mkSet=(offs,rates)=>SEEDS.flatMap(s=>['cons0','consWeak','consMod'].map(a=>mkRow(a,s,offs[a],rates[a])));

test('scorer GO when consolidation accelerates return-A relearning',()=>{
  const rows=mkSet({cons0:100,consWeak:20,consMod:10},{cons0:0,consWeak:0.0001,consMod:0.001});
  const v=scoreBaldwin(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'BALDWIN-GO');
  assert.deepEqual(v.medians,{cons0:100,consWeak:20,consMod:10});
});

test('scorer NOGO when nothing improves + INVALID on rate mismatch',()=>{
  const rows=mkSet({cons0:100,consWeak:100,consMod:100},{cons0:0,consWeak:0.0001,consMod:0.001});
  const v=scoreBaldwin(rows);
  assert.equal(v.go,false);
  assert.equal(v.verdict,'BALDWIN-NOGO');
  const bad=rows.map(r=>r.arm==='cons0'&&r.history.seed===402001?{...r,rate:0.001}:r);
  const vb=scoreBaldwin(bad);
  assert.equal(vb.go,false);
  assert.equal(vb.verdict,'INVALID');
});

test('scorer INCOMPLETE-SATURATED (fast + censored control) + DESIGN-FAILURE',()=>{
  const fast=mkSet({cons0:10,consWeak:0,consMod:0},{cons0:0,consWeak:0.0001,consMod:0.001});
  const vf=scoreBaldwin(fast);
  assert.equal(vf.go,false);
  assert.equal(vf.verdict,'INCOMPLETE-SATURATED');
  const enab=mkSet({cons0:null,consWeak:20,consMod:20},{cons0:0,consWeak:0.0001,consMod:0.001});
  const ve=scoreBaldwin(enab);
  assert.equal(ve.go,false);
  assert.equal(ve.verdict,'INCOMPLETE-SATURATED');
  const none=mkSet({cons0:null,consWeak:null,consMod:null},{cons0:0,consWeak:0.0001,consMod:0.001});
  const vn=scoreBaldwin(none);
  assert.equal(vn.go,false);
  assert.equal(vn.verdict,'DESIGN-FAILURE');
});

test('config switch: slowTaste iff rate>0 (bank built cleanly pre-spend)',()=>{
  const off=createTasteEnergyBody(7,12345,{tasteRate:1});
  assert.equal(off.config.consolidationRate,0);
  assert.equal(off.weights.slowTaste,undefined);
  const on=createTasteEnergyBody(7,12345,{tasteRate:1,consolidationRate:0.001});
  assert.ok(Array.isArray(on.weights.slowTaste));
});
test('spent bank 402001-402036 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-spend maintenance: the BALDWIN bank built cleanly pre-spend
  // (36-unique, range-exact, exclusions registered — verified in the
  // pre-spend run) and is now spent; the builder must refuse to rebuild
  // it anywhere. Standing rule.
  const dir=mkdtempSync(join(tmpdir(),'baldwin-bank-guard-'));
  assert.throws(()=>baldwinDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});

test('return-A windowing: bounds, sustain requirement, censoring',()=>{
  const means={},counts={};
  for(let t=0;t<1792;t++){means[t]=0;counts[t]=24;}
  for(let t=100;t<512;t++)means[t]=10;
  for(let t=1600;t<1792;t++)means[t]=10;
  const r=scoreEpisodeBaldwin(means,counts,10,24);
  assert.deepEqual(r,{ticks:64,censored:false,reason:'criterion-met'});
  const thin={...means};
  for(let t=1600;t<1607;t++)thin[t]=0;
  const r2=scoreEpisodeBaldwin(thin,counts,10,24);
  assert.equal(r2.ticks,71);
  const never={...means};
  for(let t=1536;t<1792;t++)never[t]=0;
  const r3=scoreEpisodeBaldwin(never,counts,10,24);
  assert.deepEqual(r3,{ticks:null,censored:true,reason:'never-reached'});
  assert.equal(B_RETURN_START,1536);
  assert.equal(B_EPISODE_TICKS,256);
});
