// RSI P10 (plan: docs/RSI_P10_PLAN.md, frozen before the run): joint test in one system, scored embodied.
// Library trained with U* (P9 level 2) + invention on calibrated-surrogate staircase rules; frozen search on
// unseen embodied pairs rules (many-odor world, shift 32); vs blind search (L0) and S0; A0 (U0) reported.
// Usage: node scripts/rsi-p10-joint.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories as embodiedHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p10/',import.meta.url),N=SMOKE?1:12,H=SMOKE?2:16;
const CODE=['scripts/rsi-p10-joint.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
L.TASK.odors=85;L.TASK.encounters=40;L.TASK.noise=.07; // calibrated surrogate (P8)
const Ustar=JSON.parse(readFileSync(new URL('../evidence/rsi-p9/level2.json',import.meta.url),'utf8')).Ustar,U0={...L.U0,inventParent:'best',inventGenes:1};
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d);let ge=0;for(let s=0;s<1<<n;s++){let t=0;for(let i=0;i<n;i++)t+=(s>>i&1?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return ge/2**n;};
function makeEmbodied(seed,name){
  const s=L.makePairs(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const pool=new Pool(8);
const embodied=async(p,prob,hs)=>{const r=await Promise.all(hs.map(h=>pool.run({code:'masks',masks:p.masks,step:p.step,replays:p.replays,odor:prob.odor},h,{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^0x7f4a7c15)})));
  for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');return r.map(x=>x.energy);};
const topTerm=(lib,U)=>Object.keys(lib.stats).filter(id=>!L.HYPER.includes(id)).sort((a,b)=>L.post(lib.stats[b],U)-L.post(lib.stats[a],U))[0];
const rows=[];
for(let k=1;k<=N;k++){
  const prob=makeEmbodied(1601000+OFF+k,`p${k}`),R=[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1605000+OFF+k*10+i,`tr${k}.${i}`));
  const lib=L.train(R,Ustar,k),lib0=L.train(R,U0,k),seed=(prob.bankSeed*7+k)>>>0;
  const A=L.search({problem:prob,lib,U:Ustar,mode:'frozen',seed}).final,A0=L.search({problem:prob,lib:lib0,U:U0,mode:'frozen',seed}).final,B=L.search({problem:prob,lib:L.newLibrary(),U:U0,mode:'uniform',seed}).final;
  const hs=embodiedHistories((1602000+OFF+k)>>>0,H),[eA,eA0,eB,eS]=await Promise.all([embodied(A,prob,hs),embodied(A0,prob,hs),embodied(B,prob,hs),embodied(L.S0,prob,hs)]);
  const top=topTerm(lib,Ustar);
  const r={rule:prob.name,A,A0,B,A_energy:L.mean(eA),A0_energy:L.mean(eA0),B_energy:L.mean(eB),S0_energy:L.mean(eS),topTerm:top,topInvented:lib.invented.includes(top),
    targetInA:A.masks.filter(m=>prob.target.includes(m)).length,targetInB:B.masks.filter(m=>prob.target.includes(m)).length};
  rows.push(r);say({rule:r.rule,A:r.A_energy.toFixed(2),A0:r.A0_energy.toFixed(2),B:r.B_energy.toFixed(2),S0:r.S0_energy.toFixed(2),top,inv:r.topInvented,tA:r.targetInA,tB:r.targetInB});
}
const d=(a,b)=>rows.map(r=>r[a]-r[b]),st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)});
const AB=st(d('A_energy','B_energy')),AS=st(d('A_energy','S0_energy')),AA0=st(d('A_energy','A0_energy')),inv=rows.filter(r=>r.topInvented).length;
const res={Ustar,AminusB:AB,AminusS0:AS,invTop:inv,reported:{AminusA0:AA0},pass:{J1:AB.mean>=1&&AB.p<.05,J2:AS.mean>=1&&AS.p<.05,J3:inv>=Math.ceil(N*2/3)}};
const PASS=Object.values(res.pass).every(Boolean);say({phase:'result',AB:[AB.mean,AB.p,AB.positive],AS:[AS.mean,AS.p,AS.positive],inv,AA0:[AA0.mean,AA0.p],PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P10_PLAN.md',code:CODE,smoke:SMOKE,TASK:L.TASK,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
