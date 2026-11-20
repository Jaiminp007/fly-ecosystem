// RSI V5 (plan: docs/RSI_V5_PLAN.md). Invented moves from primitive genes,
// a revised update rule (level 2), and a test on an unseen world family.
// Usage: node scripts/rsi-v5.mjs <out.json> [smoke]
import {writeFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';

const SMOKE=process.argv[3]==='smoke';
const SHORT=[160,160,160,64];
const ACTIONS=['add','remove','keepOnly'],RANKS=['evid','antiEvid','random','lowOrder','highOrder'],KS=[1,2,3,4,6,8];
const HYPER=['stepUp','stepDown','replaysUp','replaysDown'],STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
const U_SPACE={credit:['count','gain'],alpha:[.5,1,2,4],rho:[0,.1,.25,.5],floor:[.05,.2,.5]};
const U0={credit:'gain',alpha:1,rho:.25,floor:.2};
const IDENTITY={masks:[...Array(16).keys()],step:4,replays:1};
const ALL=[...Array(15).keys()].map(i=>i+1);
const order=m=>[0,1,2,3].reduce((n,b)=>n+(m>>b&1),0);
const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const opId=o=>o.hyper??`${o.action}/${o.rank}/${o.k}`;
const makeRng=seed=>{let r=seed>>>0||1;return ()=>(r=advanceRng(r))/4294967296;};
function pick(entries,rng){const total=entries.reduce((a,[,w])=>a+w,0);let u=rng()*total;for(const [k,w] of entries){u-=w;if(u<=0)return k;}return entries.at(-1)[0];}
const entry=(o,w,invented)=>({...o,id:opId(o),w,invented});
const seedLibrary=()=>({ops:[...ACTIONS.map(action=>entry({action,rank:'random',k:1},1,false)),...HYPER.map(hyper=>entry({hyper},1,false))]});

function rankWeights(rank,pool,evidence){
  if(rank==='random')return pool.map(()=>1);
  if(rank==='lowOrder')return pool.map(m=>Math.exp(-2*order(m)));
  if(rank==='highOrder')return pool.map(m=>Math.exp(2*order(m)));
  const top=Math.max(...pool.map(m=>Math.abs(evidence[m])))||1;
  return pool.map(m=>{const r=Math.abs(evidence[m])/top;return Math.exp(((rank==='evid'?r:1-r)-1)/.1);});
}
function sampleK(pool,weights,k,rng){
  const p=[...pool],w=[...weights],out=[];
  while(out.length<k&&p.length){const i=pick(p.map((_,j)=>[j,w[j]]),rng);out.push(p[i]);p.splice(i,1);w.splice(i,1);}
  return out;
}
function applyOp(op,p,evidence,rng){
  const q={...p,masks:[...p.masks]};
  if(op.hyper){
    if(op.hyper.startsWith('step')){const i=STEPS.indexOf(p.step)+(op.hyper==='stepUp'?1:-1);if(i<0||i>=STEPS.length)return null;q.step=STEPS[i];}
    else{const i=REPLAYS.indexOf(p.replays)+(op.hyper==='replaysUp'?1:-1);if(i<0||i>=REPLAYS.length)return null;q.replays=REPLAYS[i];}
    return q;
  }
  const inSet=p.masks.filter(m=>m!==0),out=ALL.filter(m=>!p.masks.includes(m));
  const pool=op.action==='add'?out:op.action==='remove'?inSet:ALL;
  if(!pool.length)return null;
  const chosen=sampleK(pool,rankWeights(op.rank,pool,evidence),op.k,rng);
  if(op.action==='add')q.masks.push(...chosen);
  else if(op.action==='remove')q.masks=q.masks.filter(m=>!chosen.includes(m));
  else q.masks=[0,...chosen];
  return q;
}
// Invention: mutate one gene of a weighted-chosen library term move.
function invent(lib,rng){
  const base=pick(lib.ops.filter(o=>!o.hyper).map(o=>[o,o.w]),rng);
  const gene=['action','rank','k'][Math.floor(rng()*3)],vals={action:ACTIONS,rank:RANKS,k:KS}[gene].filter(v=>v!==base[gene]);
  const o={action:base.action,rank:base.rank,k:base.k};o[gene]=vals[Math.floor(rng()*vals.length)];
  return {...o,id:opId(o)};
}
function revise(lib,U,records){
  const t={},h={};
  for(const r of records){t[r.op]=(t[r.op]||0)+1;if(r.accepted)h[r.op]=(h[r.op]||0)+(U.credit==='gain'?10*r.confirmGain:1);}
  for(const o of lib.ops)o.w=U.floor+((h[o.id]||0)+.5*U.alpha)/((t[o.id]||0)+U.alpha);
}
const program=p=>({code:'masks',masks:p.masks,step:p.step,replays:p.replays});
async function run(pool,p,histories,world){
  const r=await Promise.all(histories.map(h=>pool.run(program(p),h,world)));
  const evidence=Array(16).fill(0);for(const x of r)for(let m=0;m<16;m++)evidence[m]+=x.termEvidence[m];
  return {scores:r.map(x=>x.discrimination),energy:mean(r.map(x=>x.energy)),survivors:mean(r.map(x=>x.survivors)),evidence};
}
async function search(pool,{problem,start,lib,U,budget,seed,learn}){
  const rng=makeRng(seed),dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let incumbent=structuredClone(start),inc=await run(pool,incumbent,dev,problem.world),used=1;
  const tried=new Set([key(incumbent)]),record=[],accepted=[];
  while(used<budget){
    let m=null;
    for(let i=0;i<100&&!m;i++){
      let op;
      if(learn&&rng()<U.rho){const o=invent(lib,rng);op=lib.ops.find(x=>x.id===o.id)??o;}
      else op=pick(lib.ops.map(o=>[o,o.w]),rng);
      const q=applyOp(op,incumbent,inc.evidence,rng);
      if(q&&!tried.has(key(q)))m={op,q};
    }
    if(!m)break;tried.add(key(m.q));
    if(learn&&!lib.ops.some(x=>x.id===m.op.id))lib.ops.push(entry(m.op,U.floor+.5,true));
    const cand=await run(pool,m.q,dev,problem.world);used++;
    const gain=mean(cand.scores)-mean(inc.scores),wins=cand.scores.filter((x,i)=>x>inc.scores[i]).length;let ok=false,confirmGain=null;
    if(gain>0&&wins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6);
      const [a,b]=await Promise.all([run(pool,m.q,fresh,problem.world),run(pool,incumbent,fresh,problem.world)]);used+=2;
      confirmGain=mean(a.scores)-mean(b.scores);ok=confirmGain>0&&a.scores.filter((x,i)=>x>b.scores[i]).length>=4;
    }
    record.push({op:m.op.id,gain,confirmGain,accepted:ok});
    if(ok){accepted.push({op:m.op.id,to:m.q,confirmGain});incumbent=m.q;inc=cand;}
  }
  return {final:incumbent,accepted,record,used};
}
const final=async(pool,p,problem)=>{const x=await run(pool,p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem.world);return {score:mean(x.scores),energy:x.energy,survivors:x.survivors};};

// Problems.
const single=(name,bankSeed,mask,sign)=>({name,bankSeed,world:{phaseDurations:SHORT,valenceRule:{mask,sign}}});
const thresh=(name,bankSeed,terms,bias,sign)=>({name,bankSeed,world:{phaseDurations:SHORT,valenceRule:{terms,bias,sign}}});
const majority=(name,bankSeed,[a,b,c],sign)=>thresh(name,bankSeed,[[a,1],[b,1],[c,1]],0,sign);
const gate=(kind,bits,sign,bankSeed)=>thresh(`${kind}(${bits})${sign>0?'+':'-'}`,bankSeed,bits.map(b=>[1<<b,1]),(kind==='AND'?-1:1)*(bits.length-.5),sign);
const TRAIN=[single('train-s3+',970001,3,1),majority('train-maj124+',970002,[1,2,4],1),single('train-s5-',970003,5,-1),majority('train-maj286-',970004,[2,8,6],-1)];
const VALID=[single('val-s9+',975001,9,1),majority('val-maj148-',975002,[1,4,8],-1),single('val-s6-',975003,6,-1),majority('val-maj249+',975004,[2,4,9],1)];
const TEST_BASE=SMOKE?990500:985000;
const TEST=[['AND',[0,1],1],['OR',[2,3],-1],['AND',[0,2,3],1],['OR',[0,1,2],-1],['AND',[1,3],-1],['OR',[0,3],1],['AND',[1,2,3],-1],['OR',[1,2],1]].map(([k,b,s],i)=>gate(k,b,s,TEST_BASE+i+1));
const C=SMOKE?{trainBudget:5,metaSteps:1,validSeeds:1,valid:VALID.slice(0,1),reps:[101],test:TEST.slice(0,1),testSeeds:[1],train:TRAIN.slice(0,2)}
  :{trainBudget:20,metaSteps:5,validSeeds:3,valid:VALID,reps:[101,102,103],test:TEST,testSeeds:[1,2],train:TRAIN};

async function trainLibrary(pool,U,trainSeed){
  const lib=seedLibrary(),records=[],accepted=[];let incumbent=structuredClone(IDENTITY);
  for(const problem of C.train){
    const r=await search(pool,{problem,start:incumbent,lib,U,budget:C.trainBudget,seed:(problem.bankSeed*31+trainSeed)>>>0,learn:true});
    records.push(...r.record);accepted.push(...r.accepted.map(a=>({problem:problem.name,...a})));incumbent=r.final;revise(lib,U,records);
  }
  return {lib,records,accepted};
}
const libSummary=lib=>{const term=lib.ops.filter(o=>!o.hyper),tw=term.reduce((a,o)=>a+o.w,0);
  return {inventedShare:term.filter(o=>o.invented).reduce((a,o)=>a+o.w,0)/tw,ops:[...lib.ops].sort((a,b)=>b.w-a.w).map(o=>[o.id,+o.w.toFixed(3),o.invented])};};
async function evalLibrary(pool,lib,problems,seedsFor){
  const rows=[];
  for(const problem of problems)for(const s of seedsFor(problem)){
    const r=await search(pool,{problem,start:IDENTITY,lib,U:null,budget:6,seed:s,learn:false});
    const f=await final(pool,r.final,problem);rows.push({problem:problem.name,searchSeed:s,final:r.final,ops:r.accepted.map(a=>a.op),...f});
  }
  return rows;
}
function signTest(w,l){const n=w+l;let p=0;const c=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};for(let k=w;k<=n;k++)p+=c(n,k)/2**n;return n?p:1;}
function paired(A,B,field='score'){let w=0,l=0;A.forEach((x,i)=>{const y=B[i];if(x.problem!==y.problem||x.searchSeed!==y.searchSeed)throw new Error('unpaired');if(x[field]>y[field]+1e-12)w++;else if(x[field]<y[field]-1e-12)l++;});
  return {wins:w,losses:l,ties:A.length-w-l,pOneSided:signTest(w,l),meanA:mean(A.map(x=>x[field])),meanB:mean(B.map(x=>x[field]))};}

const out=process.argv[2],pool=new Pool(8),t0=performance.now(),log=[],say=x=>{log.push(x);console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));};
// Level 2: revise the update rule U by hill climbing on validation problems.
const validSeeds=p=>Array.from({length:C.validSeeds},(_,i)=>p.bankSeed*7+i+1);
const uKey=U=>JSON.stringify(U),metaRng=makeRng(424242);
let U=U0,cur=await trainLibrary(pool,U,1),curVal=await evalLibrary(pool,cur.lib,C.valid,validSeeds);const meta=[],triedU=new Set([uKey(U)]);
say({phase:'meta-start',U,val:mean(curVal.map(r=>r.score)),lib:libSummary(cur.lib)});
for(let i=0;i<C.metaSteps;i++){
  let V=null;for(let j=0;j<100&&!V;j++){const g=Object.keys(U_SPACE)[Math.floor(metaRng()*4)],vals=U_SPACE[g].filter(v=>v!==U[g]),x={...U,[g]:vals[Math.floor(metaRng()*vals.length)]};if(!triedU.has(uKey(x)))V=x;}
  triedU.add(uKey(V));
  const L=await trainLibrary(pool,V,1),val=await evalLibrary(pool,L.lib,C.valid,validSeeds),cmp=paired(val,curVal),ok=cmp.meanA>cmp.meanB&&cmp.wins>cmp.losses;
  meta.push({proposal:V,cmp,accepted:ok,lib:libSummary(L.lib)});say({phase:'meta',proposal:V,cmp,accepted:ok});
  if(ok){U=V;cur=L;curVal=val;}
}
const Ustar=U;
// Test: fresh training replicates for U0 and U*, frozen libraries, unseen family.
const testSeeds=rep=>p=>C.testSeeds.map(s=>p.bankSeed*7+rep*10+s);
const libs={L0:[],U0:[],Ustar:[]},rows={L0:[],U0:[],Ustar:[]};
for(const rep of C.reps){
  const a=await trainLibrary(pool,U0,rep);libs.U0.push({rep,...libSummary(a.lib),accepted:a.accepted});
  const b=uKey(Ustar)===uKey(U0)?a:await trainLibrary(pool,Ustar,rep);libs.Ustar.push({rep,...libSummary(b.lib),accepted:b.accepted});
  for(const [name,lib] of [['L0',seedLibrary()],['U0',a.lib],['Ustar',b.lib]]){
    const r=name==='Ustar'&&b===a?rows.U0.filter(x=>x.rep===rep):await evalLibrary(pool,lib,C.test,testSeeds(rep));rows[name].push(...r.map(x=>({rep,...x})));
    say({phase:'test',rep,lib:name,mean:mean(r.map(x=>x.score))});
  }
}
const noSearch=[];for(const p of C.test)noSearch.push({problem:p.name,...await final(pool,IDENTITY,p)});
const changed=uKey(Ustar)!==uKey(U0);
const s={
  U0,Ustar,changed,
  noSearchMean:mean(noSearch.map(r=>r.score)),
  UstarVsU0:paired(rows.Ustar,rows.U0),U0vsL0:paired(rows.U0,rows.L0),UstarVsL0:paired(rows.Ustar,rows.L0),
  energy:{U0vsL0:paired(rows.U0,rows.L0,'energy'),UstarVsL0:paired(rows.Ustar,rows.L0,'energy')},
  survivors:{L0:mean(rows.L0.map(r=>r.survivors)),U0:mean(rows.U0.map(r=>r.survivors)),Ustar:mean(rows.Ustar.map(r=>r.survivors))},
  inventedShareU0:mean(libs.U0.map(l=>l.inventedShare)),
};
const passes=c=>c.wins>c.losses&&c.pOneSided<.05&&c.meanA>c.meanB;
s.C1=changed&&passes(s.UstarVsU0);
s.C2=s.inventedShareU0>.5&&passes(s.U0vsL0);
s.C3=passes(s.U0vsL0)&&s.U0vsL0.meanA>s.noSearchMean;
s.seconds=(performance.now()-t0)/1000;
say({phase:'summary',summary:s});
writeFileSync(out,JSON.stringify({schema:1,kind:'rsi-v5',plan:'docs/RSI_V5_PLAN.md',smoke:SMOKE,config:C,train:TRAIN,valid:VALID,test:TEST,meta,libs,rows,noSearch,summary:s,log},null,2)+'\n');
pool.close();
