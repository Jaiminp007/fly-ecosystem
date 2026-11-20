// RSI P5 shared core: a fast surrogate of the fly's taste task, plus the level-0 program search.
// The surrogate learner mirrors the single-head masks learner in learning/odor-routed-taste.mjs
// (logistic readout with prior logit, step/sqrt(len) update clipped to +-8, reservoir memory, random
// replays, threshold decisions: a refused odor gives no example). It is NOT the embodied simulation.
import {advanceRng} from '../learning/intervention-study.mjs';
export const W=8,FULL=2**W;
export const makeRng=seed=>{let r=seed>>>0||1;return ()=>(r=advanceRng(r))/4294967296;};
export const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
export const order=m=>{let n=0;for(let b=0;b<W;b++)n+=m>>b&1;return n;};
const walsh=(m,x)=>{let v=1;for(let b=0;b<W;b++)if(m>>b&1)v*=x[b];return v;};
const bitsOf=c=>[...Array(W).keys()].map(b=>c>>b&1?1:-1);

// Task: staircase valence over 4 odor bits b1..b4 (problem-specific), value = sign*sgn(.5+T1+2T12+2T123+T1234).
export function makeProblem(seed,name){
  const rng=makeRng(seed),bits=[...Array(W).keys()];for(let j=W-1;j>0;j--){const k=Math.floor(rng()*(j+1));[bits[j],bits[k]]=[bits[k],bits[j]];}
  const t=[1<<bits[0]];for(let j=1;j<4;j++)t.push(t[j-1]|1<<bits[j]);
  const sign=rng()<.5?-1:1;
  return {name:`${name}${sign>0?'+':'-'}`,bankSeed:seed,staircase:t,sign};
}
export const valence=(problem,x)=>{const [a,b,c,d]=problem.staircase.map(m=>walsh(m,x));return problem.sign*Math.sign(.5+a+2*b+2*c+d);};

// One stream: 3 families of ODORS odors (distinct random codes per stream), ENC encounters each, label noise NOISE.
// Reward: +1 good eaten, -1 bad eaten, 0 refused. Score = 100 * mean reward per encounter.
export const TASK={odors:12,encounters:120,noise:.1};
export function stream(program,problem,seed){
  const rng=makeRng(seed),{masks}=program,n=masks.length,sq=Math.sqrt(n),prior=program.prior??Math.log(3),step=program.step,cap=program.memory??32,replays=program.replays;
  const w=Array(n).fill(0),memory=[],evidence=Array(FULL).fill(0);let seen=0,reward=0,examples=0;
  const used=new Set(),codes=[];while(codes.length<3*TASK.odors){const c=Math.floor(rng()*FULL);if(!used.has(c)){used.add(c);codes.push(c);}}
  const sig=z=>1/(1+Math.exp(-z)),pred=phi=>{let s=0;for(let j=0;j<n;j++)s+=w[j]*phi[j];return sig(prior+s/sq);};
  const update=r=>{const e=r.target-pred(r.phi),k=step*e/sq;for(let j=0;j<n;j++)w[j]=Math.max(-8,Math.min(8,w[j]+k*r.phi[j]));};
  for(let f=0;f<3;f++)for(let e=0;e<TASK.encounters;e++){
    const x=bitsOf(codes[f*TASK.odors+Math.floor(rng()*TASK.odors)]),phi=masks.map(m=>walsh(m,x)),v=valence(problem,x);
    if(.05+.9*pred(phi)<=.5)continue;
    reward+=v;const target=(rng()<TASK.noise?-v:v)>0?1:0;examples++;
    for(let m=0;m<FULL;m++)evidence[m]+=walsh(m,x)*(2*target-1);
    const rec={phi,target};seen++;if(memory.length<cap)memory.push(rec);else{const i=Math.floor(rng()*seen);if(i<cap)memory[i]=rec;}
    update(rec);for(let r=0;r<replays;r++)update(memory[Math.floor(rng()*memory.length)]);
  }
  return {score:100*reward/(3*TASK.encounters),evidence,examples};
}
// A "history" = a batch of STREAMS streams; returns batch mean score and summed evidence.
export const STREAMS=16;
export function makeHistories(seed,count){const rng=makeRng(seed);return Array.from({length:count},()=>Math.floor(rng()*4294967296)>>>0||1);}
export function evalBatch(program,problem,hseed){const rng=makeRng(hseed),ev=Array(FULL).fill(0);let s=0;
  for(let i=0;i<STREAMS;i++){const r=stream(program,problem,Math.floor(rng()*4294967296)>>>0||1);s+=r.score;for(let m=0;m<FULL;m++)ev[m]+=r.evidence[m];}
  return {score:s/STREAMS,evidence:ev};}

// ---- Program search (grammar and accept rule as in scripts/rsi-p4-chain-check.mjs) ----
export const STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
export const S0={masks:[0,...[...Array(W).keys()].map(b=>1<<b)],step:4,replays:1};
export const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const children=p=>{const s=new Set();for(const m of p.masks)if(m)for(let b=0;b<W;b++)if(!(m>>b&1)&&!p.masks.includes(m|1<<b))s.add(m|1<<b);return [...s];};
export const GRAMMAR=[
  ...[1,2].flatMap(k=>['evid','random'].map(rank=>({action:'extend',rank,k}))),
  ...[1,2,4].flatMap(k=>['weak','random'].map(rank=>({action:'remove',rank,k}))),
  ...[1,2,3,4].map(k=>({action:'keepOnly',rank:'evid',k})),
  ...['stepUp','stepDown','replaysUp','replaysDown'].map(hyper=>({hyper}))
].map(o=>({...o,id:o.hyper??`${o.action}/${o.rank}/${o.k}`}));
export const byId=id=>GRAMMAR.find(o=>o.id===id);
function pick(pool,rank,k,evidence,rng,low=false){
  if(rank==='random'){const p=[...pool];for(let i=p.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p.slice(0,k);}
  return [...pool].sort((a,b)=>low?Math.abs(evidence[a])-Math.abs(evidence[b]):Math.abs(evidence[b])-Math.abs(evidence[a])).slice(0,k);
}
export function applyOp(op,p,evidence,rng){
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
export const GREEDY=['extend/evid/2','extend/evid/1','stepDown','extend/random/1','extend/random/2','replaysUp','remove/weak/1','stepUp','replaysDown','remove/weak/2','remove/random/1','remove/random/2','remove/weak/4','remove/random/4','keepOnly/evid/4','keepOnly/evid/3','keepOnly/evid/2','keepOnly/evid/1'].map(byId);
// Library (P3-A rule): per move {n,sum,sumSq} of dev gains; Thompson in training, posterior-mean order at eval.
export const SIGMA0=2,N0=1,VAR_FLOOR=.25;
export const newLib=()=>({stats:Object.fromEntries(GRAMMAR.map(o=>[o.id,{n:0,sum:0,sumSq:0}]))});
function pooledVar(lib){let n=0,s=0,ss=0;for(const v of Object.values(lib.stats)){n+=v.n;s+=v.sum;ss+=v.sumSq;}return n<2?SIGMA0**2:Math.max(VAR_FLOOR,(ss-s*s/n)/(n-1));}
function gauss(rng){const u=Math.max(rng(),1e-12),v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const shuffled=(set,rng)=>{const s=[...set];for(let i=s.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return s;};
export function proposalOrder(mode,rng,lib=null){
  if(mode==='greedy')return GREEDY;
  if(mode==='greedyLib'){const m=o=>{const st=lib.stats[o.id];return st.sum/(st.n+N0);};return shuffled(GRAMMAR,rng).sort((a,b)=>m(b)-m(a));}
  if(mode==='thompson'){const s2=pooledVar(lib);return GRAMMAR.map(o=>{const st=lib.stats[o.id];return [o,st.sum/(st.n+N0)+Math.sqrt(s2/(st.n+N0))*gauss(rng)];}).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);}
  return shuffled(GRAMMAR,rng);
}
export function run(p,histories,problem){const r=histories.map(h=>evalBatch(p,problem,h)),ev=Array(FULL).fill(0);for(const x of r)for(let m=0;m<FULL;m++)ev[m]+=x.evidence[m];return {scores:r.map(x=>x.score),evidence:ev};}
// Level-0 search: dev gain > 0 with >= 4/6 wins, then confirm on 6 fresh histories (2 evals).
export function search({problem,mode,budget,seed,lib=null,learn=false,start=S0}){
  const rng=makeRng(seed),dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let inc=start,incR=run(inc,dev,problem),used=1;const tried=new Set([key(inc)]),record=[];
  while(used<budget){
    let m=null;for(const op of proposalOrder(mode,rng,lib)){const q=applyOp(op,inc,incR.evidence,rng);if(q&&!tried.has(key(q))){m={op,q};break;}}
    if(!m)break;tried.add(key(m.q));
    const cand=run(m.q,dev,problem);used++;
    const gain=mean(cand.scores)-mean(incR.scores),wins=cand.scores.filter((x,i)=>x>incR.scores[i]).length;let ok=false,confirmGain=null;
    if(learn){const st=lib.stats[m.op.id];st.n++;st.sum+=gain;st.sumSq+=gain*gain;}
    if(gain>0&&wins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6),a=run(m.q,fresh,problem),b=run(inc,fresh,problem);used+=2;
      confirmGain=mean(a.scores)-mean(b.scores);ok=confirmGain>0&&a.scores.filter((x,i)=>x>b.scores[i]).length>=4;
    }
    record.push({op:m.op.id,from:inc,to:m.q,gain,wins,confirmGain,accepted:ok});
    if(ok){inc=m.q;incR=cand;}
  }
  return {final:inc,record,used};
}
export const finalScore=(p,problem)=>mean(run(p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem).scores);
