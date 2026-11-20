// RSI P11 (plan: docs/RSI_P11_PLAN.md, frozen before the run): embodied A (U* library) vs A0 (U0 library)
// on 32 fresh pairs rules, many-odor world, calibrated surrogate. Usage: node scripts/rsi-p11-l2embodied.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories as embodiedHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p11/',import.meta.url),N=SMOKE?2:32,H=SMOKE?2:16;
const CODE=['scripts/rsi-p11-l2embodied.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
L.TASK.odors=85;L.TASK.encounters=40;L.TASK.noise=.07;
const Ustar=JSON.parse(readFileSync(new URL('../evidence/rsi-p9/level2.json',import.meta.url),'utf8')).Ustar,U0={...L.U0,inventParent:'best',inventGenes:1};
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d),rng=L.makeRng(1704999);let ge=0;const D=200000;for(let s=0;s<D;s++){let t=0;for(let i=0;i<n;i++)t+=(rng()<.5?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return (ge+1)/(D+1);};
function makeEmbodied(seed,name){
  const s=L.makePairs(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const pool=new Pool(8);
const embodied=async(p,prob,hs)=>{const r=await Promise.all(hs.map(h=>pool.run({code:'masks',masks:p.masks,step:p.step,replays:p.replays,odor:prob.odor},h,{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^0x7f4a7c15)})));
  for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');return r.map(x=>x.energy);};
const evid=(lib,U)=>L.topMove(lib,U).startsWith('extend/evid');
const rows=[];
for(let k=1;k<=N;k++){
  const prob=makeEmbodied(1701000+OFF+k,`q${k}`),R=[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1705000+OFF+k*10+i,`tr${k}.${i}`));
  const lib=L.train(R,Ustar,k),lib0=L.train(R,U0,k),seed=(prob.bankSeed*7+k)>>>0;
  const A=L.search({problem:prob,lib,U:Ustar,mode:'frozen',seed}).final,A0=L.search({problem:prob,lib:lib0,U:U0,mode:'frozen',seed}).final;
  const hs=embodiedHistories((1702000+OFF+k)>>>0,H),[eA,eA0]=await Promise.all([embodied(A,prob,hs),embodied(A0,prob,hs)]);
  const r={rule:prob.name,A,A0,A_energy:L.mean(eA),A0_energy:L.mean(eA0),evidA:evid(lib,Ustar),evidA0:evid(lib0,U0),
    targetInA:A.masks.filter(m=>prob.target.includes(m)).length,targetInA0:A0.masks.filter(m=>prob.target.includes(m)).length};
  rows.push(r);say({rule:r.rule,A:r.A_energy.toFixed(2),A0:r.A0_energy.toFixed(2),evid:[r.evidA,r.evidA0],t:[r.targetInA,r.targetInA0]});
}
const d=rows.map(r=>r.A_energy-r.A0_energy),res={Ustar,diffs:d,mean:L.mean(d),sd:sd(d),positive:d.filter(x=>x>0).length,negative:d.filter(x=>x<0).length,p:signFlip(d),
  reported:{discoveryA:rows.filter(r=>r.evidA).length,discoveryA0:rows.filter(r=>r.evidA0).length}};
res.pass={G1:res.mean>0&&res.p<.05};const PASS=res.pass.G1;say({phase:'result',mean:res.mean,p:res.p,pos:res.positive,neg:res.negative,...res.reported,PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P11_PLAN.md',code:CODE,smoke:SMOKE,TASK:L.TASK,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
