// RSI P8 (plan: docs/RSI_P8_PLAN.md): P7 repeated in a calibrated, many-odor world.
// For each of 12 embodied staircase rules (8-bit odor code, odor table re-drawn every 32 ticks), library k
// (trained with U0 + invention on the calibrated surrogate) runs the frozen surrogate search; L0 runs uniform
// search. A, B and S0 are scored embodied (energy per founder, 16 fresh histories, threshold decisions).
// Usage: node scripts/rsi-p8-embodied.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories as embodiedHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p8/',import.meta.url),N=SMOKE?1:12,H=SMOKE?2:16;
const CODE=['scripts/rsi-p8-embodied.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
L.TASK.odors=85;L.TASK.encounters=40;L.TASK.noise=.07; // calibrated surrogate (plan)
const U=L.U0;
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d);let ge=0;for(let s=0;s<1<<n;s++){let t=0;for(let i=0;i<n;i++)t+=(s>>i&1?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return ge/2**n;};
// Embodied rule: 16 distinct random 8-bit odor codes (indexed by 4-bit cue pattern) + staircase valence (P4 form).
function makeEmbodied(seed,name){
  const s=L.makeStaircase(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const pool=new Pool(8);
const embodied=async(p,prob,hs)=>{const r=await Promise.all(hs.map(h=>pool.run({code:'masks',masks:p.masks,step:p.step,replays:p.replays,odor:prob.odor},h,{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^0x7f4a7c15)})));
  for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');return r.map(x=>x.energy);};
const rows=[];
for(let k=1;k<=N;k++){
  const prob=makeEmbodied(1401000+OFF+k,`e${k}`),lib=L.train([...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1405000+OFF+k*10+i,`tr${k}.${i}`)),U,k);
  const A=L.search({problem:prob,lib,U,mode:'frozen',seed:(prob.bankSeed*7+k)>>>0}).final,B=L.search({problem:prob,lib:L.newLibrary(),U:L.U0,mode:'uniform',seed:(prob.bankSeed*7+k)>>>0}).final;
  const hs=embodiedHistories((1402000+OFF+k)>>>0,H),[eA,eB,eS]=await Promise.all([embodied(A,prob,hs),embodied(B,prob,hs),embodied(L.S0,prob,hs)]);
  const r={rule:prob.name,A,B,A_energy:L.mean(eA),B_energy:L.mean(eB),S0_energy:L.mean(eS),A_surrogate:L.finalScore(A,prob),B_surrogate:L.finalScore(B,prob),
    targetInA:A.masks.filter(m=>prob.target.includes(m)).length,targetInB:B.masks.filter(m=>prob.target.includes(m)).length};
  rows.push(r);say({rule:r.rule,A:r.A_energy.toFixed(2),B:r.B_energy.toFixed(2),S0:r.S0_energy.toFixed(2),tA:r.targetInA,tB:r.targetInB});
}
const d=(a,b)=>rows.map(r=>r[a]-r[b]),st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)});
const AB=st(d('A_energy','B_energy')),AS=st(d('A_energy','S0_energy'));
const res={U,TASK:L.TASK,AminusB:AB,AminusS0:AS,pass:{E1_AvsB:AB.mean>=1&&AB.p<.05,E2_AvsS0:AS.mean>=1&&AS.p<.05}};
const PASS=Object.values(res.pass).every(Boolean);say({phase:'result',AB:[AB.mean,AB.p,AB.positive],AS:[AS.mean,AS.p,AS.positive],PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P8_PLAN.md',code:CODE,smoke:SMOKE,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
