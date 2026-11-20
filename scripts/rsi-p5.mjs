// RSI P5 runner (plan: docs/RSI_P5_PLAN.md, frozen before any stage ran on bank seeds).
// Usage: node scripts/rsi-p5.mjs <chain|dev|test> [smoke]. Writes evidence/rsi-p5/<stage>.json.
// Each stage refuses to run unless the previous stage's output exists and PASSED.
import {writeFileSync,readFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as L from './rsi-p5-lib.mjs';
const STAGE=process.argv[2],SMOKE=process.argv[3]==='smoke',DIR=new URL('../evidence/rsi-p5/',import.meta.url);
const BUDGET=18,TRAIN_RULES=6,OFF=SMOKE?500:0; // smoke runs use seeds offset by 500, never bank seeds
const CODE=['scripts/rsi-p5.mjs','scripts/rsi-p5-lib.mjs','learning/intervention-study.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round(performance.now()-t0),...x}));
const out=(name,obj)=>{mkdirSync(DIR,{recursive:true});writeFileSync(new URL(name,DIR),JSON.stringify({schema:1,plan:'docs/RSI_P5_PLAN.md',code:CODE,smoke:SMOKE,...obj,ms:performance.now()-t0},null,2)+'\n');};
const need=name=>{if(SMOKE)return;const f=new URL(name,DIR);if(!existsSync(f))throw new Error(`${name} missing`);const j=JSON.parse(readFileSync(f,'utf8'));if(!j.PASS)throw new Error(`${name} did not pass`);};
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const lab=(p,m)=>p.staircase.includes(m)?`T${p.staircase.indexOf(m)+1}`:m;

if(STAGE==='chain'){
  const probs=[...Array(SMOKE?2:12).keys()].map(i=>L.makeProblem(1001001+OFF+i,`c${i+1}`)),LOW=[...Array(L.FULL).keys()].filter(m=>m&&L.order(m)<=4),rows=[];
  for(const p of probs){
    const G=L.search({problem:p,mode:'greedy',budget:BUDGET,seed:1}),U=L.search({problem:p,mode:'uniform',budget:BUDGET,seed:(p.bankSeed*7+1)>>>0});
    const dev=L.makeHistories(p.bankSeed,6),base=L.run(L.S0,dev,p),acc=G.record.filter(x=>x.accepted);
    const shortcut=Object.fromEntries([1,2,3,4,6].map(k=>[k,L.finalScore({...L.S0,masks:[0,...[...LOW].sort((a,b)=>Math.abs(base.evidence[b])-Math.abs(base.evidence[a])).slice(0,k)]},p)]));
    let orderDep=null;
    if(acc.length>=3){const a=acc[2],add=a.to.masks.filter(m=>!a.from.masks.includes(m)),del=a.from.masks.filter(m=>!a.to.masks.includes(m));
      const q={masks:[...L.S0.masks.filter(m=>!del.includes(m)),...add.filter(m=>!L.S0.masks.includes(m))],step:a.to.step!==a.from.step?a.to.step:L.S0.step,replays:a.to.replays!==a.from.replays?a.to.replays:L.S0.replays};
      orderDep={op:a.op,add,del,inChain:a.gain,onS0:L.key(q)===L.key(L.S0)?0:L.mean(L.run(q,dev,p).scores)-L.mean(base.scores)};}
    const r={problem:p.name,staircase:p.staircase,S0:L.finalScore(L.S0,p),G:L.finalScore(G.final,p),U:L.finalScore(U.final,p),shortcut,bestShort:Math.max(...Object.values(shortcut)),
      Gops:acc.map(a=>`${a.op}[${a.to.masks.filter(m=>!a.from.masks.includes(m)).map(m=>lab(p,m)).join(',')}]`),Uops:U.record.filter(x=>x.accepted).map(x=>x.op),orderDep};
    rows.push(r);say({problem:r.problem,S0:r.S0.toFixed(2),G:r.G.toFixed(2),U:r.U.toFixed(2),short:r.bestShort.toFixed(2),Gops:r.Gops});
  }
  const chained=rows.filter(r=>r.Gops.length>=3),od=rows.filter(r=>r.orderDep);
  const res={GminusS0:L.mean(rows.map(r=>r.G-r.S0)),GminusU:L.mean(rows.map(r=>r.G-r.U)),GminusShortcut:L.mean(rows.map(r=>r.G-r.bestShort)),Gaccepted:L.mean(rows.map(r=>r.Gops.length)),chainedRules:chained.length,
    orderDep:od.length?{n:od.length,inChain:L.mean(od.map(r=>r.orderDep.inChain)),onS0:L.mean(od.map(r=>r.orderDep.onS0))}:null};
  res.pass={C1_chain:chained.length>=Math.ceil(rows.length*2/3),C2_order:!!res.orderDep&&res.orderDep.onS0<=.5*res.orderDep.inChain,C3_noShortcut:res.GminusShortcut>=1,C4_headroom:res.GminusU>=1.5};
  // C2 is reported, not blocking (plan section 4): it decides the claim's wording, not whether stages continue.
  const PASS=res.pass.C1_chain&&res.pass.C3_noShortcut&&res.pass.C4_headroom;say({phase:'result',...res,PASS});out(SMOKE?'chain.smoke.json':'chain.json',{stage:'chain',rows,result:res,PASS});
}

// Learner stages: train libraries (Thompson, online), evaluate frozen A_L (posterior-mean order) vs paired B_L (uniform).
function trainLib(base,Lk){const lib=L.newLib(),log=[];
  for(let i=0;i<(SMOKE?1:TRAIN_RULES);i++){const p=L.makeProblem(base+Lk*10+i,`tr${Lk}.${i}`),r=L.search({problem:p,mode:'thompson',lib,budget:BUDGET,seed:(p.bankSeed*31+Lk)>>>0,learn:true});
    log.push({problem:p.name,accepted:r.record.filter(x=>x.accepted).map(x=>x.op)});}
  return {...lib,log};}
const top=lib=>Object.entries(lib.stats).map(([id,s])=>[id,+(s.sum/(s.n+L.N0)).toFixed(2),s.n]).sort((a,b)=>b[1]-a[1]).slice(0,4);
function evalArm(mode,lib,Lk,probs){return probs.map(p=>{const s=L.search({problem:p,mode,lib,budget:BUDGET,seed:(p.bankSeed*7+Lk)>>>0});
  return {problem:p.name,final:s.final,ops:s.record.filter(x=>x.accepted).map(x=>x.op),proposed:s.record.map(x=>x.op),score:L.finalScore(s.final,p)};});}

if(STAGE==='dev'){
  need('chain.json');
  const probs=[...Array(SMOKE?1:6).keys()].map(i=>L.makeProblem(1002001+OFF+i,`d${i+1}`)),nL=SMOKE?2:6,libs=[],rows={};
  for(let k=1;k<=nL;k++){const lib=trainLib(1003000+OFF,k);libs.push(lib);say({phase:'train',lib:k,top:top(lib)});
    rows[`A${k}`]=evalArm('greedyLib',lib,k,probs);rows[`B${k}`]=evalArm('uniform',null,k,probs);}
  rows.O=evalArm('greedy',null,1,probs);
  const m=a=>L.mean(rows[a].map(r=>r.score)),diffs=libs.map((_,i)=>m(`A${i+1}`)-m(`B${i+1}`)),mB=L.mean(libs.map((_,i)=>m(`B${i+1}`)));
  const requiredLibs=L.mean(diffs)>0?Math.ceil(10.03*(sd(diffs)/L.mean(diffs))**2+2.7):Infinity;
  const gate={oracleMinusB:m('O')-mB,AminusB:diffs,meanAminusB:L.mean(diffs),sdAminusB:sd(diffs),positive:diffs.filter(d=>d>0).length,requiredLibs,
    acceptedA:L.mean(libs.flatMap((_,i)=>rows[`A${i+1}`].map(r=>r.ops.length))),acceptedB:L.mean(libs.flatMap((_,i)=>rows[`B${i+1}`].map(r=>r.ops.length))),
    pass:{oracleGap:m('O')-mB>=1.5,positive5of6:diffs.filter(d=>d>0).length>=5,meanAtLeast1:L.mean(diffs)>=1,power:requiredLibs<=12}};
  const PASS=Object.values(gate.pass).every(Boolean);say({phase:'gate',...gate,PASS});out(SMOKE?'dev.smoke.json':'dev.json',{stage:'dev',libs,rows,gate,PASS});
}

if(STAGE==='test'){
  need('dev.json');
  const probs=[...Array(SMOKE?1:12).keys()].map(i=>L.makeProblem(1004001+OFF+i,`t${i+1}`)),nL=SMOKE?2:12,libs=[],rows={};
  for(let k=1;k<=nL;k++){const lib=trainLib(1005000+OFF,k);libs.push(lib);say({phase:'train',lib:k,top:top(lib)});
    rows[`A${k}`]=evalArm('greedyLib',lib,k,probs);rows[`B${k}`]=evalArm('uniform',null,k,probs);}
  const m=a=>L.mean(rows[a].map(r=>r.score)),diffs=libs.map((_,i)=>m(`A${i+1}`)-m(`B${i+1}`)),obs=L.mean(diffs);
  // Exact one-sided sign-flip test over all 2^n sign assignments of the per-library differences.
  let ge=0;const n=diffs.length;for(let s=0;s<1<<n;s++){let t=0;for(let i=0;i<n;i++)t+=(s>>i&1?-1:1)*diffs[i];if(t/n>=obs-1e-12)ge++;}
  const p=ge/2**n;
  const result={AminusB:diffs,meanAminusB:obs,sdAminusB:sd(diffs),positive:diffs.filter(d=>d>0).length,p,
    acceptedA:L.mean(libs.flatMap((_,i)=>rows[`A${i+1}`].map(r=>r.ops.length))),acceptedB:L.mean(libs.flatMap((_,i)=>rows[`B${i+1}`].map(r=>r.ops.length))),
    pass:{signFlip:p<.01,meanAtLeast1:obs>=1}};
  const PASS=Object.values(result.pass).every(Boolean);say({phase:'result',...result,PASS});out(SMOKE?'test.smoke.json':'test.json',{stage:'test',libs,rows,result,PASS});
}
