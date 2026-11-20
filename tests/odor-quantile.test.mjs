// ODOR DEV R9 fixtures (3/3 green required before triage; zero bank worlds).
// Synthetic agent seeds 900041-900043 (outside all bank ranges; white-box
// choose/observe cycles only — never drawn, never a bank). update() is
// module-private, so fixtures drive it through observeOdorRoutedTaste.
// Formula basis: R9 PLAN V1 + AMENDMENT A1 (F3 = 1361, not 1358).
import assert from 'node:assert/strict';
import test from 'node:test';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';

const CUE=[1,-1,1,-1];
const PHI=[1,1,-1,1,-1,-1,1,-1,-1,1,-1];
const TS=Math.sqrt(11),LOG3=Math.log(3);
const sig=x=>1/(1+Math.exp(-x));
const own=(tick,lastFood)=>({agentId:1,tick,energy:65,raw:Array(17).fill(0),cue:[...CUE],odorPresent:true,contactPresent:true,contactHomogeneous:true,lastFood,terminal:false});
const cycle=(state,tick,lastFood)=>{chooseOdorRoutedTaste(state,{agentId:1,tick,energy:65,raw:Array(17).fill(0),cue:[...CUE],odorPresent:true,contactPresent:true,contactHomogeneous:true},{fixedMove:-1,requireHomogeneousContact:true,tasteDecisionMode:'threshold'});observeOdorRoutedTaste(state,own(tick,lastFood));};

test('R9F1 quantile math: preset heads reproduce hand computation exactly, tau branches distinct',()=>{
  const s=createOdorRoutedTasteBody(1,900041,{quantileHeads:8});
  for(let h=0;h<8;h++)for(let j=0;j<11;j++)s.taste.qweights[h][j]=(h-3.5)*0.2*PHI[j];
  const w=s.taste.qweights.map(r=>[...r]);
  for(const t of [1,0]){
    cycle(s,t===1?1:2,t===1?0.1:-0.1);
    // Hand replication in frozen order: live commits nothing (baseline off),
    // both updates center nothing; per head err = tau - I(t<pred).
    for(let u=0;u<2;u++){
      for(let h=0;h<8;h++){
        const tau=(h+0.5)/8;
        const pred=sig(LOG3+w[h].reduce((x,v,j)=>x+v*PHI[j],0)/TS);
        const step=.5*(tau-(t<pred?1:0))/TS;
        for(let j=0;j<11;j++)w[h][j]=Math.max(-8,Math.min(8,w[h][j]+step*PHI[j]));
      }
    }
    // Memory cleared after first target so the replay record is deterministic.
    s.taste.memory=[];
  }
  assert.deepEqual(s.taste.qweights,w);
  // Tau branches distinct: head 0 (tau .0625) and head 7 (tau .9375) moved
  // differently on the same records (quantile asymmetry is real).
  assert.notDeepEqual(s.taste.qweights[0],s.taste.qweights[7]);
});

test('R9F2 null-default identity: quantileHeads=1, absent key, legacy replication agree; no qweights',()=>{
  const runs=[createOdorRoutedTasteBody(1,900042,{quantileHeads:1}),createOdorRoutedTasteBody(1,900042,{})];
  const legacy=(w,t)=>{
    for(let u=0;u<2;u++){
      const pred=sig(LOG3+w.reduce((s,v,j)=>s+v*PHI[j],0)/TS);
      const step=.5*(t-pred)/TS;
      for(let j=0;j<w.length;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*PHI[j]));
    }
    return w;
  };
  for(const s of runs){
    assert.equal(s.taste.quantileK,1);
    assert.equal(s.taste.qweights,undefined);
    for(let k=0;k<4;k++){cycle(s,k+1,k%2===0?0.1:-0.1);s.taste.memory=[];}
  }
  const w4=new Array(11).fill(0);
  for(const t of [1,0,1,0])legacy(w4,t);
  for(const s of runs)assert.deepEqual(s.taste.weights,w4);
  assert.deepEqual(runs[0].taste.weights,runs[1].taste.weights);
});

test('R9F3 billing: same-K determinism plus K-scaling 1361 (Amendment A1)',()=>{
  const mk=K=>createOdorRoutedTasteBody(1,900043,K===1?{}:{quantileHeads:K});
  const deltas={};
  for(const K of [8,1]){
    const s=mk(K);deltas[K]=[];
    for(let k=0;k<3;k++){
      const o=s.work.scalarOperations;
      cycle(s,k+1,k===1?-0.2:0.1);
      deltas[K].push(s.work.scalarOperations-o);
    }
  }
  assert.deepEqual(deltas[8].map((d,k)=>d-deltas[1][k]),[1361,1361,1361]);
});
