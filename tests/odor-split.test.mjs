// ODOR DEV R10 fixtures (3/3 green required before triage; zero bank worlds).
// Synthetic agent seeds 900051-900053 (outside all bank ranges; white-box
// choose/observe cycles only — never drawn, never a bank). update() is
// module-private, so fixtures drive it through observeOdorRoutedTaste.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';

const CUE=[1,-1,1,-1];
const PHI=[1,1,-1,1,-1,-1,1,-1,-1,1,-1];
const TS=Math.sqrt(11),LOG3=Math.log(3);
const sig=x=>1/(1+Math.exp(-x));
const own=(tick,lastFood)=>({agentId:1,tick,energy:65,raw:Array(17).fill(0),cue:[...CUE],odorPresent:true,contactPresent:true,contactHomogeneous:true,lastFood,terminal:false});
const cycle=(state,tick,lastFood)=>{chooseOdorRoutedTaste(state,{agentId:1,tick,energy:65,raw:Array(17).fill(0),cue:[...CUE],odorPresent:true,contactPresent:true,contactHomogeneous:true},{fixedMove:-1,requireHomogeneousContact:true,tasteDecisionMode:'threshold'});observeOdorRoutedTaste(state,own(tick,lastFood));};
// Legacy replication (single matrix, two updates per cycle).
const legacy=(w,t)=>{
  for(let u=0;u<2;u++){
    const pred=sig(LOG3+w.reduce((s,v,j)=>s+v*PHI[j],0)/TS);
    const step=.5*(t-pred)/TS;
    for(let j=0;j<w.length;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*PHI[j]));
  }
  return w;
};
// Split replication: only the routed head moves (two updates per cycle).
const routed=(w,t)=>{
  for(let u=0;u<2;u++){
    const pred=sig(LOG3+w.reduce((s,v,j)=>s+v*PHI[j],0)/TS);
    const step=.5*(t-pred)/TS;
    for(let j=0;j<w.length;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*PHI[j]));
  }
  return w;
};

test('R10F1 routing math: target routes exactly, unrouted head bitwise untouched, both directions',()=>{
  const s=createOdorRoutedTasteBody(1,900051,{splitTaste:true});
  const go=s.taste.goW.map((_,j)=>(j-5)*0.1*PHI[j]);
  const nogo=s.taste.nogoW.map((_,j)=>(3-j)*0.1*PHI[j]);
  for(let j=0;j<11;j++){s.taste.goW[j]=go[j];s.taste.nogoW[j]=nogo[j];}
  cycle(s,1,0.1);
  const go1=routed([...go],1);
  assert.deepEqual(s.taste.goW,go1);
  assert.deepEqual(s.taste.nogoW,nogo);
  s.taste.memory=[];
  cycle(s,2,-0.1);
  const nogo1=routed([...nogo],0);
  assert.deepEqual(s.taste.nogoW,nogo1);
  assert.deepEqual(s.taste.goW,go1);
});

test('R10F2 null-default identity: splitTaste=false, absent key, legacy replication agree; no heads',()=>{
  const runs=[createOdorRoutedTasteBody(1,900052,{splitTaste:false}),createOdorRoutedTasteBody(1,900052,{})];
  const legacyW=new Array(11).fill(0);
  for(const s of runs){
    assert.equal(s.taste.splitTaste,false);
    assert.equal(s.taste.goW,undefined);
    assert.equal(s.taste.nogoW,undefined);
    for(let k=0;k<4;k++){cycle(s,k+1,k%2===0?0.1:-0.1);s.taste.memory=[];}
  }
  for(const t of [1,0,1,0])legacy(legacyW,t);
  for(const s of runs)assert.deepEqual(s.taste.weights,legacyW);
  assert.deepEqual(runs[0].taste.weights,runs[1].taste.weights);
});

test('R10F3 billing: same-split determinism plus split-vs-legacy 32/cycle',()=>{
  const mk=split=>createOdorRoutedTasteBody(1,900053,split?{splitTaste:true}:{});
  const deltas={};
  for(const split of [true,false]){
    const s=mk(split);deltas[split]=[];
    for(let k=0;k<3;k++){
      const o=s.work.scalarOperations;
      cycle(s,k+1,k===1?-0.2:0.1);
      deltas[split].push(s.work.scalarOperations-o);
    }
  }
  assert.deepEqual(deltas[true].map((d,k)=>d-deltas[false][k]),[32,32,32]);
});
