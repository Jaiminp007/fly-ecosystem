// ODOR DEV R8 Amendment A1 fixtures (3/3 green required before triage; zero bank worlds).
// Synthetic agent seeds 900021-900023 (outside all bank ranges; unit-level only,
// direct tasteUpdate calls — never drawn, never a bank).
import assert from 'node:assert/strict';
import test from 'node:test';
import {createTasteEnergyBody,tasteUpdate} from '../learning/taste-energy.mjs';

const PHI=[0.1,-0.2,0.3,-0.15,0.25,0.05,-0.1,0.2,-0.05,0.15,-0.3];
const sig=x=>1/(1+Math.exp(-x));
const LOG3=Math.log(3);

test('A1F1 centering math: EMA then centered error reproduces hand computation exactly',()=>{
  const s=createTasteEnergyBody(1,900021,{baselineRate:0.05});
  s.tasteBaselineC=0.2;
  const w=[...s.weights.taste];
  let c=0.2;
  for(const t of [1,0]){
    const rec={phi:[...PHI],target:t};
    tasteUpdate(s,rec,'live',()=>{});
    // Hand replication in frozen order: c <- c+alpha(t-c); t' = t-c;
    // pred = sigmoid(priorLogit + w.phi); err = t'-pred; w += rate*err*phi.
    c=c+0.05*(t-c);
    const tp=t-c;
    const pred=sig(LOG3+w.reduce((a,v,j)=>a+v*PHI[j],0));
    const err=tp-pred,step=0.1*err;
    for(let j=0;j<w.length;j++)w[j]=w[j]+step*PHI[j];
    assert.equal(s.tasteBaselineC,c);
    assert.deepEqual(s.weights.taste,w);
  }
});

test('A1F2 null-default identity: br=0 follows legacy math exactly, baseline stays 0',()=>{
  const recs=[1,0,1,1,0].map(t=>({phi:[...PHI],target:t}));
  const run=(opts)=>{
    const s=createTasteEnergyBody(2,900022,opts);
    for(const r of recs)tasteUpdate(s,{...r,phi:r.phi.slice()},'live',()=>{});
    return s;
  };
  const a=run({baselineRate:0}),b=run({});
  // Legacy replication (no baseline): err = t-pred; w += 0.1*err*phi.
  const w=new Array(11).fill(0);
  for(const t of [1,0,1,1,0]){
    const pred=sig(LOG3+w.reduce((x,v,j)=>x+v*PHI[j],0));
    const step=0.1*(t-pred);
    for(let j=0;j<w.length;j++)w[j]=w[j]+step*PHI[j];
  }
  for(const s of [a,b]){
    assert.deepEqual(s.weights.taste,w);
    assert.equal(s.tasteBaselineC,0);
  }
  assert.deepEqual(a.weights.taste,b.weights.taste);
});

test('A1F3 billing: uniform +4 per tasteUpdate call, live and replay',()=>{
  const rec={phi:[...PHI],target:1};
  const live=createTasteEnergyBody(3,900023,{baselineRate:0.05});
  const o0=live.work.scalarOperations;
  tasteUpdate(live,{...rec,phi:rec.phi.slice()},'live',()=>{});
  const dLive=live.work.scalarOperations-o0;
  const o1=live.work.scalarOperations;
  tasteUpdate(live,{...rec,phi:rec.phi.slice()},'replay',()=>{});
  const dReplay=live.work.scalarOperations-o1;
  // Uniform across modes (discarded EMA on replay bills identically).
  assert.equal(dLive,dReplay);
  // Absolute: rest-path 73 (dot 22: 11 mul + 11 add via reduce-with-initial
  // + sigmoid 4 + prior add 1 + err sub 1 + step mul 1 + weight loop 22 +
  // clip max/min 22) + brake-always 3 + baseline 4 = 80. The frozen +4 is
  // embedded uniformly (via m when on, +4 plain when off); uniformity
  // across modes/arms is the asserted property, 80 the reconciled total.
  assert.equal(dLive,80);
  const off=createTasteEnergyBody(4,900024,{});
  const p0=off.work.scalarOperations;
  tasteUpdate(off,{...rec,phi:rec.phi.slice()},'live',()=>{});
  assert.equal(off.work.scalarOperations-p0,80);
});
