// RSI P6 core: the P5 surrogate (copied unchanged except valence, which now reads problem.terms/bias),
// plus a gene grammar with invention, a parameterised level-1 update rule U, and level-0 search.
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

// Problems carry terms [[mask,coef],...] and bias: value = sign*sgn(bias + sum coef*T_mask).
// Seeds are mixed before use: P5's consecutive raw seeds gave correlated rule signs.
export const mix=x=>{x=(x>>>0)^0x9e3779b9;x=Math.imul(x^x>>>16,0x85ebca6b);x=Math.imul(x^x>>>13,0xc2b2ae35);return (x^x>>>16)>>>0||1;};
const shuffleBits=rng=>{const b=[...Array(W).keys()];for(let j=W-1;j>0;j--){const k=Math.floor(rng()*(j+1));[b[j],b[k]]=[b[k],b[j]];}return b;};
// Training/validation family (P5): staircase over 4 bits, .5 + T1 + 2T12 + 2T123 + T1234.
export function makeStaircase(seed,name){
  const rng=makeRng(mix(seed)),bits=shuffleBits(rng),t=[1<<bits[0]];for(let j=1;j<4;j++)t.push(t[j-1]|1<<bits[j]);
  const sign=rng()<.5?-1:1;return {name:`${name}${sign>0?'+':'-'}`,family:'staircase',bankSeed:seed,target:t,terms:[[t[0],1],[t[1],2],[t[2],2],[t[3],1]],bias:.5,sign};
}
// Unseen test family: majority of three disjoint pairwise products, T_ab + T_cd + T_ef (no single-bit term).
export function makePairs(seed,name){
  const rng=makeRng(mix(seed)),b=shuffleBits(rng),t=[0,2,4].map(i=>1<<b[i]|1<<b[i+1]);
  const sign=rng()<.5?-1:1;return {name:`${name}${sign>0?'+':'-'}`,family:'pairs',bankSeed:seed,target:t,terms:t.map(m=>[m,1]),bias:0,sign};
}
export const valence=(problem,x)=>problem.sign*Math.sign(problem.bias+problem.terms.reduce((s,[m,c])=>s+c*walsh(m,x),0));

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

// ---- Level 0: program search over a move library ----
export const STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
export const S0={masks:[0,...[...Array(W).keys()].map(b=>1<<b)],step:4,replays:1};
export const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const children=p=>{const s=new Set();for(const m of p.masks)if(m)for(let b=0;b<W;b++)if(!(m>>b&1)&&!p.masks.includes(m|1<<b))s.add(m|1<<b);return [...s];};
// Gene grammar: action x rank x k (36 term moves) plus 4 fixed knob moves. evid = largest |evidence|,
// weak = smallest |evidence|, random = uniform. Genes are hand-written primitives; combinations are not given.
export const ACTIONS=['extend','remove','keepOnly'],RANKS=['evid','weak','random'],KS=[1,2,3,4],HYPER=['stepUp','stepDown','replaysUp','replaysDown'];
export const moveId=g=>g.hyper??`${g.action}/${g.rank}/${g.k}`;
export const parseMove=id=>HYPER.includes(id)?{hyper:id}:(([action,rank,k])=>({action,rank,k:+k}))(id.split('/'));
export const ALL_MOVES=[...ACTIONS.flatMap(a=>RANKS.flatMap(r=>KS.map(k=>`${a}/${r}/${k}`))),...HYPER];
export const SEED_LIBRARY=['extend/random/1','remove/random/1','keepOnly/random/1',...HYPER];
function pick(pool,rank,k,evidence,rng){
  if(rank==='random'){const p=[...pool];for(let i=p.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p.slice(0,k);}
  const s=[...pool].sort((a,b)=>Math.abs(evidence[b])-Math.abs(evidence[a]));return rank==='evid'?s.slice(0,k):s.reverse().slice(0,k);
}
export function applyMove(id,p,evidence,rng){
  const op=parseMove(id),q={...p,masks:[...p.masks]};
  if(op.hyper){
    if(op.hyper.startsWith('step')){const i=STEPS.indexOf(p.step)+(op.hyper==='stepUp'?1:-1);if(i<0||i>=STEPS.length)return null;q.step=STEPS[i];}
    else{const i=REPLAYS.indexOf(p.replays)+(op.hyper==='replaysUp'?1:-1);if(i<0||i>=REPLAYS.length)return null;q.replays=REPLAYS[i];}
    return q;
  }
  const terms=p.masks.filter(m=>m!==0);
  if(op.action==='extend'){const c=children(p);if(!c.length)return null;q.masks.push(...pick(c,op.rank,op.k,evidence,rng));}
  else if(op.action==='remove'){if(terms.length<=op.k)return null;const out=pick(terms,op.rank,op.k,evidence,rng);q.masks=q.masks.filter(m=>!out.includes(m));}
  else{if(terms.length<=op.k)return null;q.masks=[0,...pick(terms,op.rank,op.k,evidence,rng)];}
  return q;
}
export function run(p,histories,problem){const r=histories.map(h=>evalBatch(p,problem,h)),ev=Array(FULL).fill(0);for(const x of r)for(let m=0;m<FULL;m++)ev[m]+=x.evidence[m];return {scores:r.map(x=>x.score),evidence:ev};}
export const finalScore=(p,problem)=>mean(run(p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem).scores);

// ---- Level 1: library of moves with statistics, updated by rule U ----
// U = {N0 (prior pseudo-count), rho (invention rate), credit ('gain' | 'positive'), explore (Thompson scale)}.
// Posterior mean of a move = sum/(n+N0); 'positive' credits max(gain,0) instead of the raw gain.
// Training: each proposal, with probability rho, invents a move by mutating one gene (action, rank or k) of
// the library's current best term move, if the result is new; otherwise Thompson over the library.
// Evaluation (frozen): library moves ordered by posterior mean, no invention, no updates.
export const U0={N0:1,rho:.25,credit:'gain',explore:1};
export const U_SPACE={N0:[.5,1,2,4],rho:[.1,.25,.5],credit:['gain','positive'],explore:[.5,1,2]};
export const newLibrary=(moves=SEED_LIBRARY)=>({stats:Object.fromEntries(moves.map(id=>[id,{n:0,sum:0,sumSq:0}])),invented:[]});
export const post=(st,U)=>st.sum/(st.n+U.N0);
function pooledVar(lib){let n=0,s=0,ss=0;for(const v of Object.values(lib.stats)){n+=v.n;s+=v.sum;ss+=v.sumSq;}return n<2?4:Math.max(.25,(ss-s*s/n)/(n-1));}
function gauss(rng){const u=Math.max(rng(),1e-12),v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const shuffled=(set,rng)=>{const s=[...set];for(let i=s.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return s;};
// Opt-in invention operator (U.inventParent 'best'|'sample', U.inventGenes 1|2); defaults keep P6-P8 exactly.
// 'sample' picks the parent term move by a Thompson draw instead of the posterior-mean best.
function invent(lib,U,rng){
  const terms=Object.keys(lib.stats).filter(id=>!HYPER.includes(id));
  const best=(U.inventParent??'best')==='sample'?moveOrder('train',{stats:Object.fromEntries(terms.map(id=>[id,lib.stats[id]]))},U,rng)[0]:terms.sort((a,b)=>post(lib.stats[b],U)-post(lib.stats[a],U))[0];
  let g=parseMove(best);const genes=(U.inventGenes??1)===1?[['action','rank','k'][Math.floor(rng()*3)]]:shuffled(['action','rank','k'],rng).slice(0,U.inventGenes);
  for(const gene of genes){const opts={action:ACTIONS,rank:RANKS,k:KS}[gene].filter(v=>v!==g[gene]);g={...g,[gene]:opts[Math.floor(rng()*opts.length)]};}
  const id=moveId(g);if(lib.stats[id])return null;
  lib.stats[id]={n:0,sum:0,sumSq:0};lib.invented.push(id);return id;
}
function moveOrder(mode,lib,U,rng){
  const ids=Object.keys(lib.stats);
  if(mode==='frozen')return shuffled(ids,rng).sort((a,b)=>post(lib.stats[b],U)-post(lib.stats[a],U));
  if(mode==='uniform')return shuffled(ids,rng);
  const s2=pooledVar(lib);return ids.map(id=>{const st=lib.stats[id];return [id,post(st,U)+U.explore*Math.sqrt(s2/(st.n+U.N0))*gauss(rng)];}).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
// Level-0 search (accept rule as P2-P5). mode: 'train' (Thompson + invention + online credit), 'frozen', 'uniform'.
export function search({problem,lib,U=U0,mode,budget=18,seed}){
  const rng=makeRng(seed),dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let inc=S0,incR=run(inc,dev,problem),used=1;const tried=new Set([key(inc)]),record=[];
  while(used<budget){
    let m=null;const fresh=mode==='train'&&rng()<U.rho?invent(lib,U,rng):null;
    for(const id of fresh?[fresh,...moveOrder(mode,lib,U,rng)]:moveOrder(mode,lib,U,rng)){const q=applyMove(id,inc,incR.evidence,rng);if(q&&!tried.has(key(q))){m={id,q};break;}}
    if(!m)break;tried.add(key(m.q));
    const cand=run(m.q,dev,problem);used++;
    const gain=mean(cand.scores)-mean(incR.scores),wins=cand.scores.filter((x,i)=>x>incR.scores[i]).length;let ok=false;
    if(mode==='train'){const st=lib.stats[m.id],c=U.credit==='positive'?Math.max(gain,0):gain;st.n++;st.sum+=c;st.sumSq+=c*c;}
    // Accept rule (opt-in U.winsMin, U.confirm; defaults 4 and true keep P2-P8 behaviour exactly).
    const winsMin=U.winsMin??4,confirm=U.confirm??true;
    if(!confirm&&gain>0&&wins>=winsMin)ok=true;
    else if(confirm&&gain>0&&wins>=winsMin&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const h=makeHistories(confirmSeed,6),a=run(m.q,h,problem),b=run(inc,h,problem);used+=2;
      ok=mean(a.scores)>mean(b.scores)&&a.scores.filter((x,i)=>x>b.scores[i]).length>=winsMin;
    }
    record.push({op:m.id,gain,accepted:ok});
    if(ok){inc=m.q;incR=cand;}
  }
  return {final:inc,record,used};
}
export function train(problems,U,seed,{invention=true}={}){const lib=newLibrary(),V={...U,rho:invention?U.rho:0};
  for(const [i,p] of problems.entries())search({problem:p,lib,U:V,mode:'train',seed:(seed*131+i)>>>0});return lib;}
export const topMove=(lib,U)=>Object.keys(lib.stats).sort((a,b)=>post(lib.stats[b],U)-post(lib.stats[a],U))[0];
export const evalLib=(lib,U,mode,problems,seed)=>problems.map(p=>finalScore(search({problem:p,lib,U,mode,seed:(p.bankSeed*7+seed)>>>0}).final,p));
