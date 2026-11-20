// RSI P9 (plan: docs/RSI_P9_PLAN.md, frozen before any bank run): level 2 over U extended with the
// invention operator, in the calibrated surrogate; frozen U* tested against U0 on 32 fresh libraries.
// Usage: node scripts/rsi-p9.mjs <level2|test> [smoke]. Writes evidence/rsi-p9/<stage>.json.
import {writeFileSync,readFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as L from './rsi-p6-lib.mjs';
const STAGE=process.argv[2],SMOKE=process.argv[3]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p9/',import.meta.url);
const CODE=['scripts/rsi-p9.mjs','scripts/rsi-p6-lib.mjs','learning/intervention-study.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
L.TASK.odors=85;L.TASK.encounters=40;L.TASK.noise=.07; // calibrated surrogate (P8)
const SPACE={...L.U_SPACE,inventParent:['best','sample'],inventGenes:[1,2]},U0={...L.U0,inventParent:'best',inventGenes:1};
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const out=(name,obj)=>{mkdirSync(DIR,{recursive:true});writeFileSync(new URL(name,DIR),JSON.stringify({schema:1,plan:'docs/RSI_P9_PLAN.md',code:CODE,smoke:SMOKE,TASK:L.TASK,...obj,seconds:(performance.now()-t0)/1000},null,2)+'\n');};
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d),rng=L.makeRng(1504999);let ge=0;const D=200000;for(let s=0;s<D;s++){let t=0;for(let i=0;i<n;i++)t+=(rng()<.5?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return (ge+1)/(D+1);};
const trainRules=(base,k)=>[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(base+OFF+k*10+i,`tr${k}.${i}`));
const evid=(lib,U)=>L.topMove(lib,U).startsWith('extend/evid');

if(STAGE==='level2'){
  const NL=SMOKE?2:12,NP=SMOKE?1:8,val=[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1502001+OFF+i,`v${i+1}`)),rng=L.makeRng(1503001+OFF);
  const score=U=>[...Array(NL).keys()].map(j=>{const k=j+1,lib=L.train(trainRules(1501000,k),U,k);return L.mean(L.evalLib(lib,U,'frozen',val,k));});
  let inc=U0,incS=score(inc);const log=[{U:inc,scores:incS,mean:L.mean(incS),accepted:true}],seen=new Set([JSON.stringify(inc)]);say({phase:'level2',U:inc,mean:L.mean(incS)});
  for(let p=0;p<NP;p++){
    let cand=null;for(let tries=0;tries<50&&!cand;tries++){const keys=Object.keys(SPACE),g=keys[Math.floor(rng()*keys.length)],opts=SPACE[g].filter(v=>v!==inc[g]),c={...inc,[g]:opts[Math.floor(rng()*opts.length)]};if(!seen.has(JSON.stringify(c)))cand=c;}
    if(!cand)break;seen.add(JSON.stringify(cand));const s=score(cand),w=s.filter((x,i)=>x>incS[i]).length,l=s.filter((x,i)=>x<incS[i]).length,ok=L.mean(s)>L.mean(incS)&&w>l;
    log.push({U:cand,scores:s,mean:L.mean(s),wins:w,losses:l,accepted:ok});say({phase:'level2',proposal:p+1,U:cand,mean:L.mean(s),wins:w,losses:l,accepted:ok});
    if(ok){inc=cand;incS=s;}
  }
  out(SMOKE?'level2.smoke.json':'level2.json',{stage:'level2',Ustar:inc,log});
}

if(STAGE==='test'){
  const f=new URL(SMOKE?'level2.smoke.json':'level2.json',DIR);if(!existsSync(f))throw new Error('run level2 first');
  const Ustar=JSON.parse(readFileSync(f,'utf8')).Ustar,NT=SMOKE?2:32;
  const pairs=[...Array(SMOKE?1:12).keys()].map(i=>L.makePairs(1504001+OFF+i,`r${i+1}`)),rows=[];
  for(let k=1;k<=NT;k++){
    const R=trainRules(1505000,k),A=L.train(R,Ustar,k),B=L.train(R,U0,k);
    const r={lib:k,Ustar:L.mean(L.evalLib(A,Ustar,'frozen',pairs,k)),U0:L.mean(L.evalLib(B,U0,'frozen',pairs,k)),evidUstar:evid(A,Ustar),evidU0:evid(B,U0)};
    rows.push(r);say({lib:k,Ustar:r.Ustar.toFixed(2),U0:r.U0.toFixed(2),evid:[r.evidUstar,r.evidU0]});
  }
  const d=rows.map(r=>r.Ustar-r.U0),res={Ustar,diffs:d,mean:L.mean(d),sd:sd(d),positive:d.filter(x=>x>0).length,negative:d.filter(x=>x<0).length,p:signFlip(d),
    reported:{inventionGeneChanged:Ustar.inventParent!=='best'||Ustar.inventGenes!==1,discoveryUstar:rows.filter(r=>r.evidUstar).length,discoveryU0:rows.filter(r=>r.evidU0).length}};
  res.pass={L2:JSON.stringify(Ustar)!==JSON.stringify(U0)&&res.mean>0&&res.p<.05};const PASS=res.pass.L2;
  say({phase:'result',mean:res.mean,p:res.p,pos:res.positive,neg:res.negative,...res.reported,PASS});
  out(SMOKE?'test.smoke.json':'test.json',{stage:'test',rows,result:res,PASS});
}
