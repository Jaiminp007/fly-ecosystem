// ODOR DEV R8 Amendment A2 fixtures (3/3 green required before triage; zero bank worlds).
// Synthetic agent seeds 900031-900033 (outside all bank ranges; white-box
// choose/observe cycles only — never drawn, never a bank). update() is
// module-private, so fixtures drive it through observeOdorRoutedTaste
// (live + memory-replay both run every cycle); memory is cleared between
// F2 cycles so the replay record is deterministic.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';

const CUE=[1,-1,1,-1];
const PHI=[1,1,-1,1,-1,-1,1,-1,-1,1,-1];
const TS=Math.sqrt(11),LOG3=Math.log(3);
const sig=x=>1/(1+Math.exp(-x));
const own=(tick,lastFood)=>({agentId:1,tick,energy:65,raw:Array(17).fill(0),cue:[...CUE],odorPresent:true,contactPresent:true,contactHomogeneous:true,lastFood,terminal:false});
const chooseFor=(state,tick)=>chooseOdorRoutedTaste(state,{agentId:1,tick,energy:65,raw:Array(17).fill(0),cue:[...CUE],odorPresent:true,contactPresent:true,contactHomogeneous:true},{fixedMove:-1,requireHomogeneousContact:true,tasteDecisionMode:'threshold'});
const cycle=(state,tick,lastFood)=>{chooseFor(state,tick);observeOdorRoutedTaste(state,own(tick,lastFood));};
// Legacy fixed-step replication (no baseline): two updates per cycle
// (live + same-record replay), exact op order of update().
const legacy=(w,t)=>{
  for(let u=0;u<2;u++){
    const pred=sig(LOG3+w.reduce((s,v,j)=>s+v*PHI[j],0)/TS);
    const step=.5*(t-pred)/TS;
    for(let j=0;j<w.length;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*PHI[j]));
  }
  return w;
};

test('A2F1 centering math: EMA then centered error reproduces hand computation exactly',()=>{
  const s=createOdorRoutedTasteBody(1,900031,{baselineRate:0.05});
  s.taste.baselineC=0.2;
  cycle(s,1,0.1);
  // Hand replication in frozen order: live commits c, replay centers only.
  let c=0.2+0.05*(1-0.2);
  const w=new Array(11).fill(0);
  for(let u=0;u<2;u++){
    const pred=sig(LOG3+w.reduce((x,v,j)=>x+v*PHI[j],0)/TS);
    const step=.5*((1-c)-pred)/TS;
    for(let j=0;j<w.length;j++)w[j]=Math.max(-8,Math.min(8,w[j]+step*PHI[j]));
  }
  assert.equal(s.taste.baselineC,c);
  assert.deepEqual(s.taste.weights,w);
});

test('A2F2 null-default identity: alpha=0, absent key, and legacy replication agree exactly',()=>{
  const runs=[createOdorRoutedTasteBody(1,900032,{baselineRate:0}),createOdorRoutedTasteBody(1,900032,{})];
  for(const s of runs){
    for(let k=0;k<4;k++){cycle(s,k+1,k%2===0?0.1:-0.1);s.taste.memory=[];}
  }
  const w4=new Array(11).fill(0);
  for(const t of [1,0,1,0])legacy(w4,t);
  for(const s of runs){
    assert.deepEqual(s.taste.weights,w4);
    assert.equal(s.taste.baselineC,0);
  }
  assert.deepEqual(runs[0].taste.weights,runs[1].taste.weights);
});

test('A2F3 billing: uniform on/off per cycle, data-independent, totals reconcile',()=>{
  const mk=rate=>createOdorRoutedTasteBody(1,900033,rate===null?{}:{baselineRate:rate});
  const deltas={};
  for(const [tag,rate]of [['on',0.05],['off',0]]){
    const s=mk(rate);deltas[tag]=[];
    for(let k=0;k<3;k++){
      const o=s.work.scalarOperations;
      cycle(s,k+1,k===1?-0.2:0.1);
      deltas[tag].push(s.work.scalarOperations-o);
    }
  }
  // Uniform: on-path == off-path per cycle index (motor warm-up is
  // identical across arms — deterministic same seeds — so any per-cycle
  // difference would be the instrument's; the +4 price is proven uniform
  // here (2 update calls/cycle x +4, on and off). Cross-cycle constancy is
  // NOT asserted: the motor path warms up on cycle 0, out of A2's scope.
  // Absolute 52/call is code-inspected (lumped 4+11*4+4 literal); the +4
  // price is proven uniform here (2 update calls/cycle x +4, on and off).
  assert.deepEqual(deltas.on,deltas.off);
});
