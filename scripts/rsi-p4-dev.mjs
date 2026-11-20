// RSI P4 dev check (plan: docs/RSI_P4_DEV_PLAN.md). Learned search prior on the P4 staircase task.
// Search core, grammar and problems copied from scripts/rsi-p4-chain-check.mjs; learner, eval order and
// gate copied from scripts/rsi-p3a-dev.mjs (Thompson training, greedy-by-posterior eval, paired B_L).
// Usage: node scripts/rsi-p4-dev.mjs <out.json> [smoke]
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';
const OUT=process.argv[2],SMOKE=process.argv[3]==='smoke';
const W=8,FULL=2**W,order=m=>{let n=0;for(let b=0;b<W;b++)n+=m>>b&1;return n;};
const STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
const S0={masks:[0,...[...Array(W).keys()].map(b=>1<<b)],step:4,replays:1};
const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const makeRng=seed=>{let r=seed>>>0||1;return ()=>(r=advanceRng(r))/4294967296;};
const children=p=>{const s=new Set();for(const m of p.masks)if(m)for(let b=0;b<W;b++)if(!(m>>b&1)&&!p.masks.includes(m|1<<b))s.add(m|1<<b);return [...s];};
const GRAMMAR=[
  ...[1,2].flatMap(k=>['evid','random'].map(rank=>({action:'extend',rank,k}))),
  ...[1,2,4].flatMap(k=>['weak','random'].map(rank=>({action:'remove',rank,k}))),
  ...[1,2,3,4].map(k=>({action:'keepOnly',rank:'evid',k})),
  ...['stepUp','stepDown','replaysUp','replaysDown'].map(hyper=>({hyper}))
].map(o=>({...o,id:o.hyper??`${o.action}/${o.rank}/${o.k}`}));
const byId=id=>GRAMMAR.find(o=>o.id===id);
function pick(pool,rank,k,evidence,rng,low=false){
  if(rank==='random'){const p=[...pool];for(let i=p.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p.slice(0,k);}
  return [...pool].sort((a,b)=>low?Math.abs(evidence[a])-Math.abs(evidence[b]):Math.abs(evidence[b])-Math.abs(evidence[a])).slice(0,k);
}
function applyOp(op,p,evidence,rng){
  const q={...p,masks:[...p.masks]};
  if(op.hyper){
    if(op.hyper.startsWith('step')){const i=STEPS.indexOf(p.step)+(op.hyper==='stepUp'?1:-1);if(i<0||i>=STEPS.length)return null;q.step=STEPS[i];}
    else{const i=REPLAYS.indexOf(p.replays)+(op.hyper==='replaysUp'?1:-1);if(i<0||i>=REPLAYS.length)return null;q.replays=REPLAYS[i];}
    return q;
  }
  const terms=p.masks.filter(m=>m!==0);
  if(op.action==='extend'){const c=children(p);if(!c.length)return null;q.masks.push(...pick(c,op.rank,op.k,evidence,rng));}
  else if(op.action==='remove'){if(terms.length<=op.k)return null;const out=pick(terms,op.rank,op.k,evidence,rng,true);q.masks=q.masks.filter(m=>!out.includes(m));}
  else{if(terms.length<=op.k)return null;q.masks=[0,...pick(terms,op.rank,op.k,evidence,rng)];}
  return q;
}
// Hand-coded greedy order (the "oracle" a learner would have to discover); uniform = random order.
const GREEDY=['extend/evid/1','keepOnly/evid/1','keepOnly/evid/2','keepOnly/evid/3','keepOnly/evid/4','remove/weak/1','remove/weak/2','remove/weak/4','extend/evid/2','stepUp','stepDown','replaysUp','replaysDown'].map(byId);
const SIGMA0=2,N0=1,VAR_FLOOR=.25;
const newLib=()=>({stats:Object.fromEntries(GRAMMAR.map(o=>[o.id,{n:0,sum:0,sumSq:0}]))});
function pooledVar(lib){let n=0,s=0,ss=0;for(const v of Object.values(lib.stats)){n+=v.n;s+=v.sum;ss+=v.sumSq;}return n<2?SIGMA0**2:Math.max(VAR_FLOOR,(ss-s*s/n)/(n-1));}
function gauss(rng){const u=Math.max(rng(),1e-12),v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function proposalOrder(mode,rng,lib=null){
  if(mode==='greedy')return GREEDY;
  if(mode==='greedyLib'){const set=[...GRAMMAR];for(let i=set.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[set[i],set[j]]=[set[j],set[i]];}
    const m=o=>{const st=lib.stats[o.id];return st.sum/(st.n+N0);};return set.sort((a,b)=>m(b)-m(a));}
  if(mode==='thompson'){const s2=pooledVar(lib);return GRAMMAR.map(o=>{const st=lib.stats[o.id];return [o,st.sum/(st.n+N0)+Math.sqrt(s2/(st.n+N0))*gauss(rng)];}).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);}
  const set=[...GRAMMAR];for(let i=set.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[set[i],set[j]]=[set[j],set[i]];}return set;
}
const WORLD=rule=>({valenceRule:rule,tasteDecisionMode:'threshold'});
const program=(p,odor)=>({code:'masks',masks:p.masks,step:p.step,replays:p.replays,odor});
async function run(pool,p,histories,problem){
  const r=await Promise.all(histories.map(h=>pool.run(program(p,problem.odor),h,WORLD(problem.rule))));
  const evidence=Array(FULL).fill(0);for(const x of r)for(let m=0;m<FULL;m++)evidence[m]+=x.termEvidence[m];
  for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');
  return {scores:r.map(x=>x.energy),evidence};
}
// Level-0 search, same accept rule as P2/P3: dev gain > 0 with >= 4/6 wins, then confirm on 6 fresh histories.
async function search(pool,{problem,mode,budget,seed,lib=null,learn=false}){
  const rng=makeRng(seed),dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let inc=S0,incR=await run(pool,inc,dev,problem),used=1;const tried=new Set([key(inc)]),record=[];
  while(used<budget){
    let m=null;for(const op of proposalOrder(mode,rng,lib)){const q=applyOp(op,inc,incR.evidence,rng);if(q&&!tried.has(key(q))){m={op,q};break;}}
    if(!m)break;tried.add(key(m.q));
    const cand=await run(pool,m.q,dev,problem);used++;
    const gain=mean(cand.scores)-mean(incR.scores),wins=cand.scores.filter((x,i)=>x>incR.scores[i]).length;let ok=false,confirmGain=null;
    if(learn){const st=lib.stats[m.op.id];st.n++;st.sum+=gain;st.sumSq+=gain*gain;}
    if(gain>0&&wins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6);
      const [a,b]=await Promise.all([run(pool,m.q,fresh,problem),run(pool,inc,fresh,problem)]);used+=2;
      confirmGain=mean(a.scores)-mean(b.scores);ok=confirmGain>0&&a.scores.filter((x,i)=>x>b.scores[i]).length>=4;
    }
    record.push({op:m.op.id,to:m.q,gain,wins,confirmGain,accepted:ok,from:inc});
    if(ok){inc=m.q;incR=cand;}
  }
  return {final:inc,record,used};
}
async function final(pool,p,problem){return mean((await run(pool,p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem)).scores);}

function makeProblem(seed,name){
  const rng=makeRng(seed),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(W).keys()].map(b=>c>>b&1?1:-1));}
  const bits=[...Array(W).keys()];for(let j=W-1;j>0;j--){const k=Math.floor(rng()*(j+1));[bits[j],bits[k]]=[bits[k],bits[j]];}
  const t=[1<<bits[0]];for(let j=1;j<4;j++)t.push(t[j-1]|1<<bits[j]);
  const sign=rng()<.5?-1:1;
  return {name:`${name}${sign>0?'+':'-'}`,bankSeed:seed,odor,staircase:t,rule:{terms:[[t[0],1],[t[1],2],[t[2],2],[t[3],1]],bias:.5,sign,odor}};
}
const DEV_RULES=[...Array(6).keys()].map(i=>makeProblem(999901+i,`dev${i+1}`));
const C=SMOKE?{libs:1,trainRules:1,trainBudget:4,evalBudget:3,devRules:DEV_RULES.slice(0,1)}:{libs:6,trainRules:6,trainBudget:18,evalBudget:12,devRules:DEV_RULES};
const trainBank=L=>[...Array(C.trainRules).keys()].map(i=>makeProblem(999100+L*10+i,`tr${L}.${i}`));

const pool=new Pool(SMOKE?6:8),t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const CK=OUT+'.ckpt.json',ckpt=existsSync(CK)?JSON.parse(readFileSync(CK,'utf8')):{},save=()=>writeFileSync(CK,JSON.stringify(ckpt));
const CODE=['scripts/rsi-p4-dev.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex'));
const CFG_HASH=createHash('sha256').update(JSON.stringify({C:{...C,devRules:C.devRules.map(r=>r.name)},SIGMA0,N0,VAR_FLOOR,CODE,v:1})).digest('hex').slice(0,12);
if(ckpt.cfg&&ckpt.cfg!==CFG_HASH)throw new Error('checkpoint from a different config');ckpt.cfg=CFG_HASH;
async function cached(k,f){if(!(k in ckpt)){ckpt[k]=await f();save();}return ckpt[k];}

// 1. Train independent libraries (own training rules, own seeds), Thompson with online updates.
const libs=[];
for(let L=1;L<=C.libs;L++){
  const lib=await cached(`train:${L}`,async()=>{const lib=newLib(),bank=trainBank(L),log=[];
    for(const problem of bank){const r=await search(pool,{problem,mode:'thompson',lib,budget:C.trainBudget,seed:(problem.bankSeed*31+L)>>>0,learn:true});log.push({problem:problem.name,accepted:r.record.filter(x=>x.accepted).map(x=>x.op)});}
    return {...lib,bank:bank.map(b=>b.name),log};});
  libs.push(lib);
  const top=Object.entries(lib.stats).map(([id,s])=>[id,s.sum/(s.n+N0),s.n]).sort((a,b)=>b[1]-a[1]).slice(0,3);
  say({phase:'train',lib:L,top});
}
const hashes=libs.map(l=>createHash('sha256').update(JSON.stringify(l.stats)).digest('hex'));
if(new Set(hashes).size!==hashes.length)throw new Error('libraries are not independent (duplicate hash)');

// 2. Evaluate A_L (frozen, greedy by posterior mean) and B_L (uniform, own seed) per library, O (hand greedy).
const arms=[...libs.flatMap((l,i)=>[[`A${i+1}`,'greedyLib',l,i+1],[`B${i+1}`,'uniform',null,i+1]]),['O','greedy',null,1]],rows={};
for(const [name,mode,lib,L] of arms){rows[name]=[];
  for(const problem of C.devRules){
    const r=await cached(`eval:${name}:${problem.name}`,async()=>{const s=await search(pool,{problem,mode,lib,budget:C.evalBudget,seed:(problem.bankSeed*7+L)>>>0});
      return {problem:problem.name,final:s.final,ops:s.record.filter(x=>x.accepted).map(x=>x.op),proposed:s.record.map(x=>x.op),energy:await final(pool,s.final,problem)};});
    rows[name].push(r);}
  say({phase:'eval',arm:name,energy:mean(rows[name].map(r=>r.energy)),accepted:mean(rows[name].map(r=>r.ops.length))});
}
const s0=[];for(const problem of C.devRules)s0.push(await cached(`s0:${problem.name}`,async()=>({problem:problem.name,energy:await final(pool,S0,problem)})));

// 3. Gate (P2/P3-A gate, unchanged).
const mB=mean(libs.flatMap((_,i)=>rows[`B${i+1}`].map(r=>r.energy))),mO=mean(rows.O.map(r=>r.energy)),mS0=mean(s0.map(r=>r.energy));
const diffs=libs.map((_,i)=>mean(rows[`A${i+1}`].map(r=>r.energy))-mean(rows[`B${i+1}`].map(r=>r.energy))),sd=Math.sqrt(diffs.reduce((a,d)=>a+(d-mean(diffs))**2,0)/Math.max(1,diffs.length-1));
const requiredLibs=mean(diffs)>0?Math.ceil(10.03*(sd/mean(diffs))**2+2.7):Infinity;
const gateRes={oracleMinusB:mO-mB,AminusB:diffs,meanAminusB:mean(diffs),sdAminusB:sd,positive:diffs.filter(d=>d>0).length,requiredLibs,
  S0energy:mS0,Benergy:mB,Oenergy:mO,
  acceptedA:mean(libs.flatMap((_,i)=>rows[`A${i+1}`].map(r=>r.ops.length))),acceptedB:mean(libs.flatMap((_,i)=>rows[`B${i+1}`].map(r=>r.ops.length))),
  pass:{oracleGap:mO-mB>=1.5,positive5of6:diffs.filter(d=>d>0).length>=5,meanAtLeast1:mean(diffs)>=1,power:requiredLibs<=12}};
gateRes.PASS=Object.values(gateRes.pass).every(Boolean);
say({phase:'gate',...gateRes});
writeFileSync(OUT,JSON.stringify({schema:1,kind:'rsi-p4-dev',plan:'docs/RSI_P4_DEV_PLAN.md',cfg:CFG_HASH,config:{...C,devRules:C.devRules.map(r=>r.name)},libs,rows,s0,gate:gateRes,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
