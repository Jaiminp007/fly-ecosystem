// RSI V6 (plan: docs/RSI_V6_PLAN.md). As V5, plus dense credit available to
// the update rule (every tried move credited by its dev gain), training from
// the identity start, more training problems, and an invention ablation.
// Usage: node scripts/rsi-v6.mjs <out.json> [smoke|devcheck]
import {writeFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';

const MODE=process.argv[3]??'full',SMOKE=MODE==='smoke';
const SHORT=[160,160,160,64];
const ACTIONS=['add','remove','keepOnly'],RANKS=['evid','antiEvid','random','lowOrder','highOrder'],KS=[1,2,3,4,6,8];
const HYPER=['stepUp','stepDown','replaysUp','replaysDown'],STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
const U_SPACE={credit:['count','gain','meanGain'],alpha:[.5,1,2,4],rho:[0,.1,.25,.5],floor:[.05,.2,.5],beta:[5,20,50],power:[1,2,4]};
const U0={credit:'gain',alpha:1,rho:.25,floor:.2,beta:20,power:1};
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
// count/gain: credit only accepted proposals (V5). meanGain: every tried move is
// credited with its dev gain; weight = floor + exp(beta * shrunk mean gain).
// power sharpens weights (w^power), concentrating search on the best-credited moves.
const weightOf=(U,t,h,g)=>(U.credit==='meanGain'?U.floor+Math.exp(U.beta*g/(t+U.alpha)):U.floor+(h+.5*U.alpha)/(t+U.alpha))**U.power;
function revise(lib,U,records){
  const t={},h={},g={};
  for(const r of records){t[r.op]=(t[r.op]||0)+1;g[r.op]=(g[r.op]||0)+r.gain;if(r.accepted)h[r.op]=(h[r.op]||0)+(U.credit==='gain'?10*r.confirmGain:1);}
  for(const o of lib.ops)o.w=weightOf(U,t[o.id]||0,h[o.id]||0,g[o.id]||0);
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
    if(learn&&!lib.ops.some(x=>x.id===m.op.id))lib.ops.push(entry(m.op,weightOf(U,0,0,0),true));
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
const TRAIN=[single('train-s3+',970101,3,1),majority('train-maj124+',970102,[1,2,4],1),single('train-s5-',970103,5,-1),majority('train-maj286-',970104,[2,8,6],-1),
  single('train-s10+',970105,10,1),majority('train-maj186+',970106,[1,8,6],1),single('train-s12-',970107,12,-1),majority('train-maj483-',970108,[4,8,3],-1)];
const VALID=[single('val-s9+',975101,9,1),majority('val-maj148-',975102,[1,4,8],-1),single('val-s6-',975103,6,-1),majority('val-maj249+',975104,[2,4,9],1)];
// Design-check bank (single/majority only; never the test family).
const DEV=[single('dev-s7+',978001,7,1),majority('dev-maj128-',978002,[1,2,8],-1),single('dev-s11-',978003,11,-1),majority('dev-maj346+',978004,[3,4,6],1)];
const TEST_BASE=SMOKE?990700:987000;
const TEST=[['AND',[2,3],1],['OR',[0,1],-1],['AND',[0,1,2],-1],['OR',[1,2,3],1],['AND',[0,3],-1],['OR',[1,3],1],['AND',[0,1,3],1],['OR',[0,2],-1]].map(([k,b,s],i)=>gate(k,b,s,TEST_BASE+i+1));
const C=SMOKE?{trainBudget:5,metaSteps:1,trainSeeds:[1],validSeeds:1,valid:VALID.slice(0,1),reps:[101],test:TEST.slice(0,1),testSeeds:[1],train:TRAIN.slice(0,2)}
  :{trainBudget:16,metaSteps:6,trainSeeds:[1,2],validSeeds:3,valid:VALID,reps:[101,102,103],test:TEST,testSeeds:[1,2],train:TRAIN};

async function trainLibrary(pool,U,trainSeed){
  const lib=seedLibrary(),records=[],accepted=[];
  for(const problem of C.train){
    const r=await search(pool,{problem,start:IDENTITY,lib,U,budget:C.trainBudget,seed:(problem.bankSeed*31+trainSeed)>>>0,learn:true});
    records.push(...r.record);accepted.push(...r.accepted.map(a=>({problem:problem.name,...a})));revise(lib,U,records);
  }
  return {lib,records,accepted};
}
const libSummary=lib=>{const term=lib.ops.filter(o=>!o.hyper),tw=term.reduce((a,o)=>a+o.w,0),top=[...term].sort((a,b)=>b.w-a.w)[0];
  return {inventedShare:term.filter(o=>o.invented).reduce((a,o)=>a+o.w,0)/tw,topTerm:top.id,topTermInvented:top.invented,ops:[...lib.ops].sort((a,b)=>b.w-a.w).map(o=>[o.id,+o.w.toFixed(3),o.invented])};};
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
const uKey=U=>JSON.stringify(U),passes=c=>c.wins>c.losses&&c.pOneSided<.05&&c.meanA>c.meanB;
// Train one library per training seed, evaluate each frozen library; rows are ordered (trainSeed, problem, seed).
async function trainAndEval(U,problems,seedsFor,trainSeeds){
  const libs=[],rows=[];
  for(const ts of trainSeeds){const L=await trainLibrary(pool,U,ts);libs.push({trainSeed:ts,...libSummary(L.lib),accepted:L.accepted.length});
    rows.push(...(await evalLibrary(pool,L.lib,problems,seedsFor)).map(x=>({trainSeed:ts,...x})));}
  return {libs,rows};
}
if(MODE==='sharpcheck'){
  // Dev-bank check: the devcheck U0 library with its weights raised to a power.
  const {readFileSync}=await import('node:fs'),d=JSON.parse(readFileSync('evidence/rsi-v6/devcheck.json','utf8')),seeds=p=>[1,2,3].map(i=>p.bankSeed*7+i);
  const parse=([id,w,invented])=>{const [action,rank,k]=id.split('/');return entry(k?{action,rank,k:Number(k)}:{hyper:id},w,invented);};
  for(const power of [2,4]){const lib={ops:d.res[0].libs[0].ops.map(parse).map(o=>({...o,w:o.w**power}))},r=await evalLibrary(pool,lib,DEV,seeds);say({phase:'sharpcheck',power,cmp:paired(r,d.L0)});}
  pool.close();process.exit(0);
}
if(MODE==='devcheck'){
  // Design check on the DEV bank only: does dense credit give a library that beats the blind seed library?
  const seeds=p=>[1,2,3].map(i=>p.bankSeed*7+i),L0=await evalLibrary(pool,seedLibrary(),DEV,seeds),res=[];
  for(const U of [U0,{...U0,credit:'meanGain'}]){const r=await trainAndEval(U,DEV,seeds,[1]);const x={phase:'devcheck',U,libs:r.libs,cmp:paired(r.rows,L0)};res.push(x);say(x);}
  writeFileSync(out,JSON.stringify({schema:1,kind:'rsi-v6-devcheck',L0,res},null,2)+'\n');pool.close();process.exit(0);
}
// Level 2: revise the update rule U by hill climbing on validation problems (2 training seeds per U).
const validSeeds=p=>Array.from({length:C.validSeeds},(_,i)=>p.bankSeed*7+i+1),metaRng=makeRng(424242);
let U=U0,cur=await trainAndEval(U,C.valid,validSeeds,C.trainSeeds);const meta=[],triedU=new Set([uKey(U)]);
say({phase:'meta-start',U,val:mean(cur.rows.map(r=>r.score)),libs:cur.libs.map(l=>[l.topTerm,l.inventedShare])});
// Coordinate search: genes in a shuffled order, one proposal per gene per pass.
const geneOrder=Object.keys(U_SPACE).filter(g=>g!=='beta');for(let i=geneOrder.length-1;i>0;i--){const j=Math.floor(metaRng()*(i+1));[geneOrder[i],geneOrder[j]]=[geneOrder[j],geneOrder[i]];}
for(let i=0;i<C.metaSteps;i++){
  let V=null;
  for(let j=0;j<200&&!V;j++){const g=j===0?geneOrder[i%geneOrder.length]:(U.credit==='meanGain'?[...geneOrder,'beta']:geneOrder)[Math.floor(metaRng()*(geneOrder.length+(U.credit==='meanGain'?1:0)))],vals=U_SPACE[g].filter(v=>v!==U[g]),x={...U,[g]:vals[Math.floor(metaRng()*vals.length)]};if(!triedU.has(uKey(x)))V=x;}
  triedU.add(uKey(V));
  const r=await trainAndEval(V,C.valid,validSeeds,C.trainSeeds),cmp=paired(r.rows,cur.rows),ok=cmp.meanA>cmp.meanB&&cmp.wins>cmp.losses;
  meta.push({proposal:V,cmp,accepted:ok,libs:r.libs});say({phase:'meta',proposal:V,cmp,accepted:ok,libs:r.libs.map(l=>[l.topTerm,l.inventedShare])});
  if(ok){U=V;cur=r;}
}
const Ustar=U,UstarNoInv={...Ustar,rho:0};
// Test: fresh training replicates; frozen libraries; unseen threshold-rule family.
const testSeeds=rep=>p=>C.testSeeds.map(s=>p.bankSeed*7+rep*10+s);
const names=['L0','U0','Ustar','UstarNoInv'],libs=Object.fromEntries(names.map(n=>[n,[]])),rows=Object.fromEntries(names.map(n=>[n,[]]));
for(const rep of C.reps){
  const trained={L0:{lib:seedLibrary(),accepted:[]}},cache=new Map();
  for(const [n,V] of [['U0',U0],['Ustar',Ustar],['UstarNoInv',UstarNoInv]]){if(!cache.has(uKey(V)))cache.set(uKey(V),{name:n,...await trainLibrary(pool,V,rep)});trained[n]=cache.get(uKey(V));}
  for(const n of names){
    if(n!=='L0')libs[n].push({rep,...libSummary(trained[n].lib),accepted:trained[n].accepted});
    const same=trained[n].name&&trained[n].name!==n,r=same?rows[trained[n].name].filter(x=>x.rep===rep):(await evalLibrary(pool,trained[n].lib,C.test,testSeeds(rep))).map(x=>({rep,...x}));
    rows[n].push(...r);say({phase:'test',rep,lib:n,sameAs:same?trained[n].name:null,mean:mean(r.map(x=>x.score))});
  }
}
const noSearch=[];for(const p of C.test)noSearch.push({problem:p.name,...await final(pool,IDENTITY,p)});
const changed=uKey(Ustar)!==uKey(U0),s={U0,Ustar,changed,noSearchMean:mean(noSearch.map(r=>r.score)),
  UstarVsU0:paired(rows.Ustar,rows.U0),UstarVsNoInv:paired(rows.Ustar,rows.UstarNoInv),UstarVsL0:paired(rows.Ustar,rows.L0),U0vsL0:paired(rows.U0,rows.L0),
  energy:{UstarVsL0:paired(rows.Ustar,rows.L0,'energy'),UstarVsU0:paired(rows.Ustar,rows.U0,'energy'),UstarVsNoInv:paired(rows.Ustar,rows.UstarNoInv,'energy')},
  survivors:Object.fromEntries(names.map(n=>[n,mean(rows[n].map(r=>r.survivors))])),
  topTermInventedUstar:libs.Ustar.filter(l=>l.topTermInvented).length};
s.C1=changed&&passes(s.UstarVsU0);
s.C2=Ustar.rho>0&&passes(s.UstarVsNoInv)&&s.topTermInventedUstar>=2;
s.C3=passes(s.UstarVsL0)&&s.UstarVsL0.meanA>s.noSearchMean;
s.seconds=(performance.now()-t0)/1000;
say({phase:'summary',summary:s});
writeFileSync(out,JSON.stringify({schema:1,kind:'rsi-v6',plan:'docs/RSI_V6_PLAN.md',mode:MODE,config:C,train:TRAIN,valid:VALID,test:TEST,meta,libs,rows,noSearch,summary:s,log},null,2)+'\n');
pool.close();
