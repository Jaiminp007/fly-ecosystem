// RSI V4: data-guided improver (plan: docs/RSI_GUIDED_PLAN_V1.md).
// Level 0: fly taste learner {masks, step, replays}. Level 1: improver = weights
// over 10 move operators (incl. guidedAdd/guidedReduce, which read the flies' own
// recorded taste experience) and over term order. The improver rewrites its own
// weights from its own record (gain credit) after training problems 2 and 4.
import {writeFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';

const SHORT=[160,160,160,64];
const OPS=['add','remove','swap','reduce','guidedAdd','guidedReduce','stepUp','stepDown','replaysUp','replaysDown'];
const STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
const order=m=>[0,1,2,3].reduce((n,b)=>n+(m>>b&1),0);
const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const uniformImprover=()=>({version:0,ops:Object.fromEntries(OPS.map(o=>[o,1])),orders:{1:1,2:1,3:1,4:1}});
function pick(entries,rng){const total=entries.reduce((a,[,w])=>a+w,0);let u=rng()*total;for(const [k,w] of entries){u-=w;if(u<=0)return k;}return entries.at(-1)[0];}
const pickMask=(imp,pool,rng)=>pool.length?pick(pool.map(m=>[m,imp.orders[order(m)]]),rng):null;
// Evidence-weighted term choice: softmax over |evidence| / max, temperature 0.1.
function guidedMask(evidence,pool,rng){
  if(!pool.length)return null;const top=Math.max(...pool.map(m=>Math.abs(evidence[m])))||1;
  return pick(pool.map(m=>[m,Math.exp((Math.abs(evidence[m])/top-1)/.1)]),rng);
}
function move(imp,p,evidence,rng){
  const op=pick(OPS.map(o=>[o,imp.ops[o]]),rng),all=[...Array(15).keys()].map(i=>i+1),inSet=p.masks.filter(m=>m!==0),out=all.filter(m=>!p.masks.includes(m));
  const q={...p,masks:[...p.masks]};let mask=null;
  if(op==='add'){mask=pickMask(imp,out,rng);if(mask===null)return null;q.masks.push(mask);}
  else if(op==='remove'){mask=pickMask(imp,inSet,rng);if(mask===null)return null;q.masks=q.masks.filter(m=>m!==mask);}
  else if(op==='swap'){const a=pickMask(imp,inSet,rng);mask=pickMask(imp,out,rng);if(a===null||mask===null)return null;q.masks=q.masks.map(m=>m===a?mask:m);}
  else if(op==='reduce'){mask=pickMask(imp,all,rng);q.masks=[0,mask];}
  else if(op==='guidedAdd'){mask=guidedMask(evidence,out,rng);if(mask===null)return null;q.masks.push(mask);}
  else if(op==='guidedReduce'){mask=guidedMask(evidence,all,rng);q.masks=[0,mask];}
  else if(op==='stepUp'||op==='stepDown'){const i=STEPS.indexOf(p.step)+(op==='stepUp'?1:-1);if(i<0||i>=STEPS.length)return null;q.step=STEPS[i];}
  else{const i=REPLAYS.indexOf(p.replays)+(op==='replaysUp'?1:-1);if(i<0||i>=REPLAYS.length)return null;q.replays=REPLAYS[i];}
  return {candidate:q,op,mask};
}
const program=p=>({code:'masks',masks:p.masks,step:p.step,replays:p.replays});
async function run(pool,p,histories,world){
  const r=await Promise.all(histories.map(h=>pool.run(program(p),h,world)));
  const evidence=Array(16).fill(0);for(const x of r)for(let m=0;m<16;m++)evidence[m]+=x.termEvidence[m];
  return {scores:r.map(x=>x.score),energy:mean(r.map(x=>x.energy)),evidence};
}
async function search(pool,{problem,start,improver,budget,seed}){
  let r=seed>>>0||1;const rng=()=>(r=advanceRng(r))/4294967296;
  const dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let incumbent=structuredClone(start),inc=await run(pool,incumbent,dev,problem.world),used=1;
  const tried=new Set([key(incumbent)]),record=[],accepted=[];
  while(used<budget){
    let m=null;for(let i=0;i<100&&!m;i++){const x=move(improver,incumbent,inc.evidence,rng);if(x&&!tried.has(key(x.candidate)))m=x;}
    if(!m)break;tried.add(key(m.candidate));
    const cand=await run(pool,m.candidate,dev,problem.world);used++;
    const gain=mean(cand.scores)-mean(inc.scores),wins=cand.scores.filter((x,i)=>x>inc.scores[i]).length;let ok=false,confirmGain=null;
    if(gain>0&&wins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6);
      const [a,b]=await Promise.all([run(pool,m.candidate,fresh,problem.world),run(pool,incumbent,fresh,problem.world)]);used+=2;
      confirmGain=mean(a.scores)-mean(b.scores);ok=confirmGain>0&&a.scores.filter((x,i)=>x>b.scores[i]).length>=4;
    }
    record.push({op:m.op,maskOrder:m.mask===null?null:order(m.mask),gain,confirmGain,accepted:ok});
    if(ok){accepted.push({op:m.op,to:m.candidate,confirmGain});incumbent=m.candidate;inc=cand;}
  }
  return {problem:problem.name,start,final:incumbent,accepted,record,used};
}
function reviseImprover(imp,records){
  const next=structuredClone(imp);next.version++;
  const stat=k=>{const t={},h={};for(const r of records){const v=k(r);if(v===null)continue;t[v]=(t[v]||0)+1;if(r.accepted)h[v]=(h[v]||0)+10*r.confirmGain;}return {t,h};};
  const o=stat(r=>r.op);for(const op of OPS)next.ops[op]=.2+((o.h[op]||0)+.5)/((o.t[op]||0)+1);
  const d=stat(r=>r.maskOrder);for(const k of [1,2,3,4])next.orders[k]=.2+((d.h[k]||0)+.5)/((d.t[k]||0)+1);
  return next;
}
const final=async(pool,p,problem)=>{const x=await run(pool,p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem.world);return {score:mean(x.scores),energy:x.energy};};
function signTest(w,l){const n=w+l;let p=0;const c=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};for(let k=w;k<=n;k++)p+=c(n,k)/2**n;return n?p:1;}

const out=process.argv[2],pool=new Pool(6),t0=performance.now(),log=[],say=x=>{log.push(x);console.log(JSON.stringify(x));};
const prob=(name,bankSeed,mask,sign)=>({name,bankSeed,rule:{mask,sign},world:{phaseDurations:SHORT,valenceRule:{mask,sign}}});
const train=[prob('train-m1',950001,1,1),prob('train-m3',950002,3,-1),prob('train-m2',950003,2,-1),prob('train-m5',950004,5,1)];
const banks=[[990000,1],[995000,-1]].map(([bank,flip])=>({bank,problems:[[4,1],[8,-1],[6,1],[9,-1],[10,1],[12,-1]].map(([m,sg],i)=>prob('b'+bank+'-m'+m,bank+i+1,m,sg*flip))}));
const IDENTITY={masks:[...Array(16).keys()],step:4,replays:1};
let improver=uniformImprover(),incumbent=structuredClone(IDENTITY);const improvers=[improver],records=[],trainRuns=[];
for(const [i,problem] of train.entries()){
  const r=await search(pool,{problem,start:incumbent,improver,budget:20,seed:problem.bankSeed});trainRuns.push(r);records.push(...r.record);
  say({phase:'train',problem:problem.name,improverVersion:improver.version,accepted:r.accepted,final:r.final});
  incumbent=r.final;
  if(i%2===1){improver=reviseImprover(improver,records);improvers.push(improver);say({phase:'revise',improver});}
}
const starts={copy:incumbent,identity:IDENTITY},results=[];
for(const {bank,problems} of banks)for(const problem of problems){
  const base={copy:await final(pool,starts.copy,problem),identity:await final(pool,starts.identity,problem)};
  for(const s of [1,2,3])for(const [startName,start] of Object.entries(starts))for(const imp of improvers){
    const r=await search(pool,{problem,start,improver:imp,budget:6,seed:problem.bankSeed*7+s});
    const f=await final(pool,r.final,problem);
    const row={phase:'test',bank,problem:problem.name,searchSeed:s,start:startName,improverVersion:imp.version,final:r.final,ops:r.accepted.map(a=>a.op),finalScore:f.score,finalEnergy:f.energy,startScore:base[startName].score,startEnergy:base[startName].energy};
    results.push(row);say(row);
  }
}
const pair=(rows,a,b)=>{let w=0,l=0;for(const x of rows.filter(r=>r.improverVersion===a)){const y=rows.find(z=>z.improverVersion===b&&z.problem===x.problem&&z.searchSeed===x.searchSeed&&z.start===x.start);if(x.finalScore>y.finalScore+1e-12)w++;else if(x.finalScore<y.finalScore-1e-12)l++;}return {wins:w,losses:l,pOneSided:signTest(w,l)};};
const summary={banks:{}};let pass=true;
for(const {bank} of banks){
  const rows=results.filter(r=>r.bank===bank),b={};
  for(const st of Object.keys(starts)){b[st]={noSearch:mean(rows.filter(r=>r.start===st&&r.improverVersion===0).map(r=>r.startScore))};for(const imp of improvers)b[st]['v'+imp.version]=mean(rows.filter(r=>r.start===st&&r.improverVersion===imp.version).map(r=>r.finalScore));}
  b.v2_vs_v0=pair(rows,2,0);b.v1_vs_v0=pair(rows,1,0);b.v2_vs_v1=pair(rows,2,1);
  b.pass=b.v2_vs_v0.wins>b.v2_vs_v0.losses&&b.v2_vs_v0.pOneSided<.05&&['copy','identity'].every(st=>b[st].v2>b[st].v0)&&['copy','identity'].every(st=>b[st].v2>b[st].noSearch);
  pass=pass&&b.pass;summary.banks[bank]=b;
}
summary.pooled={v1_vs_v0:pair(results,1,0),v2_vs_v1:pair(results,2,1),v2_vs_v0:pair(results,2,0)};
summary.successiveRevisions=summary.pooled.v1_vs_v0.wins>summary.pooled.v1_vs_v0.losses&&summary.pooled.v2_vs_v1.wins>=summary.pooled.v2_vs_v1.losses;
summary.gateB=pass;summary.seconds=(performance.now()-t0)/1000;
say({phase:'summary',summary});
writeFileSync(out,JSON.stringify({schema:1,kind:'rsi-guided',plan:'docs/RSI_GUIDED_PLAN_V1.md',train,banks,improvers,trainRuns,results,summary,log},null,2)+'\n');
pool.close();
