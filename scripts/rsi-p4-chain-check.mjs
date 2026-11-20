// RSI P4 chain check (plan: docs/RSI_P4_CHAIN_PLAN.md). No learner. Staircase valence rules over an
// 8-bit odor code read only by taste; moves can only grow a program term by one bit. Asks whether a
// hand-coded greedy search accepts >= 3 moves in sequence, whether later moves depend on earlier ones,
// and whether a one-jump shortcut over all low-order terms reaches the same place.
// Usage: node scripts/rsi-p4-chain-check.mjs <out.json> [smoke]
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
function proposalOrder(mode,rng){
  if(mode==='greedy')return GREEDY;
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
async function search(pool,{problem,mode,budget,seed}){
  const rng=makeRng(seed),dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let inc=S0,incR=await run(pool,inc,dev,problem),used=1;const tried=new Set([key(inc)]),record=[];
  while(used<budget){
    let m=null;for(const op of proposalOrder(mode,rng)){const q=applyOp(op,inc,incR.evidence,rng);if(q&&!tried.has(key(q))){m={op,q};break;}}
    if(!m)break;tried.add(key(m.q));
    const cand=await run(pool,m.q,dev,problem);used++;
    const gain=mean(cand.scores)-mean(incR.scores),wins=cand.scores.filter((x,i)=>x>incR.scores[i]).length;let ok=false,confirmGain=null;
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

// Problems: random 8-bit odor code per pattern (16 distinct codes), staircase rule over a random bit order:
// value = sign * sgn(.5 + T1 + 2 T12 + 2 T123 + T1234). Best linear readout accuracy over all 16 patterns
// rises .625 -> .75 -> .875 -> 1 as each staircase term is added (scratch brute force, plan section 2).
function makeProblem(i){
  const rng=makeRng(999001+i),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(W).keys()].map(b=>c>>b&1?1:-1));}
  const bits=[...Array(W).keys()];for(let j=W-1;j>0;j--){const k=Math.floor(rng()*(j+1));[bits[j],bits[k]]=[bits[k],bits[j]];}
  const t=[1<<bits[0]];for(let j=1;j<4;j++)t.push(t[j-1]|1<<bits[j]);
  const sign=rng()<.5?-1:1;
  return {name:`stair${i+1}${sign>0?'+':'-'}`,bankSeed:999001+i,odor,staircase:t,rule:{terms:[[t[0],1],[t[1],2],[t[2],2],[t[3],1]],bias:.5,sign,odor}};
}
const ALLP=[...Array(12).keys()].map(makeProblem);
const PROBS=SMOKE?ALLP.slice(0,1):ALLP,BUDGET=SMOKE?4:18;
const SHORT_KS=[1,2,3,4,6],LOW=[...Array(FULL).keys()].filter(m=>m&&order(m)<=4);

const pool=new Pool(SMOKE?6:8),t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const CK=OUT+'.ckpt.json',ckpt=existsSync(CK)?JSON.parse(readFileSync(CK,'utf8')):{},save=()=>writeFileSync(CK,JSON.stringify(ckpt));
const CODE=['scripts/rsi-p4-chain-check.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex'));
const CFG=createHash('sha256').update(JSON.stringify({PROBS:PROBS.map(p=>p.name),BUDGET,CODE})).digest('hex').slice(0,12);
if(ckpt.cfg&&ckpt.cfg!==CFG)throw new Error('checkpoint from a different config');ckpt.cfg=CFG;
async function cached(k,f){if(!(k in ckpt)){ckpt[k]=await f();save();}return ckpt[k];}
const rows=[];
for(const problem of PROBS){
  const dev=makeHistories(problem.bankSeed,6),base=await run(pool,S0,dev,problem);
  const one=(mode,seed)=>cached(`${mode}:${seed}:${problem.name}`,async()=>{const s=await search(pool,{problem,mode,budget:BUDGET,seed:(problem.bankSeed*7+seed)>>>0});
    return {final:s.final,record:s.record.map(({to,from,...r})=>r),accepted:s.record.filter(x=>x.accepted).map(x=>({op:x.op,from:x.from,to:x.to,gain:x.gain})),used:s.used,energy:await final(pool,s.final,problem)};});
  const G=await one('greedy',1),U=await one('uniform',1);
  const E0=await cached(`s0:${problem.name}`,()=>final(pool,S0,problem));
  // Shortcut: keepOnly top-k by S0 evidence over every term of order <= 4 (one jump, no frontier).
  const shortcut=await cached(`short:${problem.name}`,async()=>{const o={};for(const k of SHORT_KS){const masks=[0,...[...LOW].sort((a,b)=>Math.abs(base.evidence[b])-Math.abs(base.evidence[a])).slice(0,k)];
    o[k]=await final(pool,{...S0,masks},problem);}return o;});
  // Order dependence: the concrete edit made by the third accepted move (terms added/removed, knob changes)
  // applied straight to S0; dev gain on S0 vs its in-chain dev gain.
  const orderDep=G.accepted.length<3?null:await cached(`order:${problem.name}`,async()=>{const a=G.accepted[2],add=a.to.masks.filter(m=>!a.from.masks.includes(m)),del=a.from.masks.filter(m=>!a.to.masks.includes(m));
    const q={masks:[...S0.masks.filter(m=>!del.includes(m)),...add.filter(m=>!S0.masks.includes(m))],step:a.to.step!==a.from.step?a.to.step:S0.step,replays:a.to.replays!==a.from.replays?a.to.replays:S0.replays};
    if(key(q)===key(S0))return {op:a.op,add,del,inChain:a.gain,onS0:0};
    return {op:a.op,add,del,inChain:a.gain,onS0:mean((await run(pool,q,dev,problem)).scores)-mean(base.scores)};});
  const bestShort=Math.max(...Object.values(shortcut)),hit=G.final.masks.filter(m=>problem.staircase.includes(m)).length;
  rows.push({problem:problem.name,staircase:problem.staircase,S0:E0,G:G.energy,U:U.energy,shortcut,bestShort,Gops:G.accepted.map(a=>a.op),Uops:U.accepted.map(a=>a.op),Gfinal:G.final,staircaseHit:hit,orderDep});
  say({problem:problem.name,S0:E0.toFixed(2),G:G.energy.toFixed(2),U:U.energy.toFixed(2),short:bestShort.toFixed(2),Gacc:G.accepted.length,ops:G.accepted.map(a=>a.op),hit});
}
const chained=rows.filter(r=>r.Gops.length>=3),od=rows.filter(r=>r.orderDep&&r.orderDep.onS0!==null);
const res={GminusS0:mean(rows.map(r=>r.G-r.S0)),GminusU:mean(rows.map(r=>r.G-r.U)),GminusShortcut:mean(rows.map(r=>r.G-r.bestShort)),
  Gaccepted:mean(rows.map(r=>r.Gops.length)),chainedRules:chained.length,meanStaircaseHit:mean(rows.map(r=>r.staircaseHit)),
  orderDep:od.length?{n:od.length,inChain:mean(od.map(r=>r.orderDep.inChain)),onS0:mean(od.map(r=>r.orderDep.onS0))}:null};
res.pass={C1_chain:chained.length>=Math.ceil(rows.length*2/3),C2_order:!!res.orderDep&&res.orderDep.onS0<=.5*res.orderDep.inChain,C3_noShortcut:res.GminusShortcut>=1.0,C4_headroom:res.GminusU>=1.5};
say({phase:'result',...res});
writeFileSync(OUT,JSON.stringify({schema:1,kind:'rsi-p4-chain-check',cfg:CFG,rows,result:res,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
