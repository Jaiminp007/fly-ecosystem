// RSI P6 runner (plan: docs/RSI_P6_PLAN.md, frozen before any stage ran on bank seeds).
// Usage: node scripts/rsi-p6.mjs <level2|test> [smoke]. Writes evidence/rsi-p6/<stage>.json.
import {writeFileSync,readFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as L from './rsi-p6-lib.mjs';
const STAGE=process.argv[2],SMOKE=process.argv[3]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p6/',import.meta.url);
const CODE=['scripts/rsi-p6.mjs','scripts/rsi-p6-lib.mjs','learning/intervention-study.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const out=(name,obj)=>{mkdirSync(DIR,{recursive:true});writeFileSync(new URL(name,DIR),JSON.stringify({schema:1,plan:'docs/RSI_P6_PLAN.md',code:CODE,smoke:SMOKE,...obj,seconds:(performance.now()-t0)/1000},null,2)+'\n');};
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
// Exact one-sided sign-flip test of mean(d) > 0 over all 2^n sign assignments.
const signFlip=d=>{const n=d.length,obs=L.mean(d);let ge=0;for(let s=0;s<1<<n;s++){let t=0;for(let i=0;i<n;i++)t+=(s>>i&1?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return ge/2**n;};
const NL=SMOKE?2:6,NT=SMOKE?2:12,NP=SMOKE?1:6;
const trainRules=(base,k)=>[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(base+OFF+k*10+i,`tr${k}.${i}`));

if(STAGE==='level2'){
  // Level 2: fixed hill climber over U. Each candidate U trains NL libraries (lib k on rules 1101000+10k+i,
  // training seed k), validated frozen on 6 staircase validation rules. Accept if mean validation score is
  // higher and per-library wins > losses against the incumbent's libraries (paired by k).
  const val=[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1102001+OFF+i,`v${i+1}`)),rng=L.makeRng(1103001+OFF);
  const score=U=>[...Array(NL).keys()].map(j=>{const k=j+1,lib=L.train(trainRules(1101000,k),U,k);return L.mean(L.evalLib(lib,U,'frozen',val,k));});
  let inc=L.U0,incS=score(inc);const log=[{U:inc,scores:incS,mean:L.mean(incS),accepted:true}],seen=new Set([JSON.stringify(inc)]);say({phase:'level2',U:inc,mean:L.mean(incS)});
  for(let p=0;p<NP;p++){
    let cand=null;for(let tries=0;tries<50&&!cand;tries++){const keys=Object.keys(L.U_SPACE),g=keys[Math.floor(rng()*keys.length)],opts=L.U_SPACE[g].filter(v=>v!==inc[g]),c={...inc,[g]:opts[Math.floor(rng()*opts.length)]};if(!seen.has(JSON.stringify(c)))cand=c;}
    seen.add(JSON.stringify(cand));const s=score(cand),w=s.filter((x,i)=>x>incS[i]).length,l=s.filter((x,i)=>x<incS[i]).length,ok=L.mean(s)>L.mean(incS)&&w>l;
    log.push({U:cand,scores:s,mean:L.mean(s),wins:w,losses:l,accepted:ok});say({phase:'level2',proposal:p+1,U:cand,mean:L.mean(s),wins:w,losses:l,accepted:ok});
    if(ok){inc=cand;incS=s;}
  }
  out(SMOKE?'level2.smoke.json':'level2.json',{stage:'level2',Ustar:inc,log,PASS:true});
}

if(STAGE==='test'){
  const f=new URL(SMOKE?'level2.smoke.json':'level2.json',DIR);if(!existsSync(f))throw new Error('run level2 first');
  const Ustar=JSON.parse(readFileSync(f,'utf8')).Ustar;
  const pairs=[...Array(SMOKE?1:12).keys()].map(i=>L.makePairs(1104001+OFF+i,`t${i+1}`)),stairs=[...Array(SMOKE?1:6).keys()].map(i=>L.makeStaircase(1106001+OFF+i,`ts${i+1}`));
  const S0p=L.mean(pairs.map(p=>L.finalScore(L.S0,p))),rows=[];
  for(let k=1;k<=NT;k++){
    const R=trainRules(1105000,k),A=L.train(R,Ustar,k),B=L.train(R,L.U0,k),N=L.train(R,L.U0,k,{invention:false}),Z=L.newLibrary();
    const e=(lib,U,mode,set)=>L.mean(L.evalLib(lib,U,mode,set,k));
    const topTerm=lib=>Object.keys(lib.stats).filter(id=>!L.HYPER.includes(id)).sort((a,b)=>L.post(lib.stats[b],L.U0)-L.post(lib.stats[a],L.U0))[0];
    const r={lib:k,Ustar:e(A,Ustar,'frozen',pairs),U0:e(B,L.U0,'frozen',pairs),noInv:e(N,L.U0,'frozen',pairs),L0:e(Z,L.U0,'uniform',pairs),
      stairUstar:e(A,Ustar,'frozen',stairs),stairL0:e(Z,L.U0,'uniform',stairs),
      U0invented:B.invented,U0topTerm:topTerm(B),U0topTermInvented:B.invented.includes(topTerm(B)),UstarTop:L.topMove(A,Ustar)};
    rows.push(r);say({lib:k,Ustar:r.Ustar.toFixed(2),U0:r.U0.toFixed(2),noInv:r.noInv.toFixed(2),L0:r.L0.toFixed(2),U0topTerm:r.U0topTerm,inv:r.U0topTermInvented});
  }
  const d=(a,b)=>rows.map(r=>r[a]-r[b]),stat=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)});
  const c1=stat(d('Ustar','U0')),c2=stat(d('U0','noInv')),c3=stat(d('Ustar','L0')),invTop=rows.filter(r=>r.U0topTermInvented).length;
  const res={Ustar,S0pairs:S0p,meanU0pairs:L.mean(rows.map(r=>r.U0)),C1_UstarVsU0:c1,C2_U0VsNoInvention:c2,C2_invTopCount:invTop,C3_UstarVsL0:c3,
    reported:{stairUstarMinusL0:stat(d('stairUstar','stairL0'))},
    pass:{C1:JSON.stringify(Ustar)!==JSON.stringify(L.U0)&&c1.mean>0&&c1.p<.05,
      C2:invTop>=Math.ceil(NT*2/3)&&c2.p<.01&&c2.mean>=1,
      C3:c3.p<.01&&c3.mean>=1&&L.mean(rows.map(r=>r.U0))>S0p}};
  const PASS=Object.values(res.pass).every(Boolean);say({phase:'result',pass:res.pass,C1:[c1.mean,c1.p],C2:[c2.mean,c2.p,invTop],C3:[c3.mean,c3.p],PASS});
  out(SMOKE?'test.smoke.json':'test.json',{stage:'test',rows,result:res,PASS});
}
