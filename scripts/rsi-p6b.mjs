// RSI P6b (plan: docs/RSI_P6B_PLAN.md): replication of P6's level-2 result on fresh banks with 32 libraries.
// U* is read from evidence/rsi-p6/level2.json (not re-searched). Usage: node scripts/rsi-p6b.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p6b/',import.meta.url),NT=SMOKE?2:32;
const CODE=['scripts/rsi-p6b.mjs','scripts/rsi-p6-lib.mjs','learning/intervention-study.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const Ustar=JSON.parse(readFileSync(new URL('../evidence/rsi-p6/level2.json',import.meta.url),'utf8')).Ustar;
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
// One-sided sign-flip test, Monte Carlo with 200000 fixed-seed draws (2^32 is too many to enumerate).
const signFlip=d=>{const n=d.length,obs=L.mean(d),rng=L.makeRng(1301999);let ge=0;const D=200000;for(let s=0;s<D;s++){let t=0;for(let i=0;i<n;i++)t+=(rng()<.5?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return (ge+1)/(D+1);};
const pairs=[...Array(SMOKE?1:12).keys()].map(i=>L.makePairs(1301001+OFF+i,`r${i+1}`)),rows=[];
for(let k=1;k<=NT;k++){
  const R=[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1302000+OFF+k*10+i,`tr${k}.${i}`)),A=L.train(R,Ustar,k),B=L.train(R,L.U0,k);
  const r={lib:k,Ustar:L.mean(L.evalLib(A,Ustar,'frozen',pairs,k)),U0:L.mean(L.evalLib(B,L.U0,'frozen',pairs,k))};rows.push(r);say({lib:k,Ustar:r.Ustar.toFixed(2),U0:r.U0.toFixed(2)});
}
const d=rows.map(r=>r.Ustar-r.U0),res={Ustar,diffs:d,mean:L.mean(d),sd:sd(d),positive:d.filter(x=>x>0).length,negative:d.filter(x=>x<0).length,p:signFlip(d)};
res.pass={R1:res.mean>0&&res.p<.05};const PASS=res.pass.R1;say({phase:'result',mean:res.mean,p:res.p,pos:res.positive,neg:res.negative,PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P6B_PLAN.md',code:CODE,smoke:SMOKE,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
