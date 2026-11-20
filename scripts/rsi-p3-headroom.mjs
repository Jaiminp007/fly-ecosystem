// RSI P3 headroom check (plan: docs/RSI_P3_HEADROOM_PLAN.md). No learner. Measures whether a
// hand-coded greedy move order beats uniform order, how many moves search accepts, and whether
// the best first move depends on the problem. Search core copied verbatim from rsi-p2-dev.mjs.
// Usage: node scripts/rsi-p3-headroom.mjs <out.json> [smoke]
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';
const OUT=process.argv[2],SMOKE=process.argv[3]==='smoke';
const ACTIONS=['add','remove','keepOnly'],RANKS=['evid','antiEvid','random','lowOrder','highOrder'],KS=[1,2,3,4,6,8];
const HYPER=['stepUp','stepDown','replaysUp','replaysDown'],STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
const IDENTITY={masks:[...Array(16).keys()],step:4,replays:1};
const ALL=[...Array(15).keys()].map(i=>i+1),order=m=>[0,1,2,3].reduce((n,b)=>n+(m>>b&1),0);
const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const makeRng=seed=>{let r=seed>>>0||1;return ()=>(r=advanceRng(r))/4294967296;};
const GRAMMAR=[...ACTIONS.flatMap(action=>RANKS.flatMap(rank=>KS.map(k=>({action,rank,k,id:`${action}/${rank}/${k}`})))),...HYPER.map(hyper=>({hyper,id:hyper}))];
const ORACLE=GRAMMAR.filter(o=>o.hyper||(o.action==='keepOnly'&&o.rank==='evid'));

function rankWeights(rank,pool,evidence){
  if(rank==='random')return pool.map(()=>1);
  if(rank==='lowOrder')return pool.map(m=>Math.exp(-2*order(m)));
  if(rank==='highOrder')return pool.map(m=>Math.exp(2*order(m)));
  const top=Math.max(...pool.map(m=>Math.abs(evidence[m])))||1;
  return pool.map(m=>{const r=Math.abs(evidence[m])/top;return Math.exp(((rank==='evid'?r:1-r)-1)/.1);});
}
function sampleK(pool,weights,k,rng){const p=[...pool],w=[...weights],out=[];
  while(out.length<k&&p.length){const t=w.reduce((a,b)=>a+b,0);let u=rng()*t,i=0;for(;i<w.length-1;i++){u-=w[i];if(u<=0)break;}out.push(p[i]);p.splice(i,1);w.splice(i,1);}return out;}
function applyOp(op,p,evidence,rng){
  const q={...p,masks:[...p.masks]};
  if(op.hyper){
    if(op.hyper.startsWith('step')){const i=STEPS.indexOf(p.step)+(op.hyper==='stepUp'?1:-1);if(i<0||i>=STEPS.length)return null;q.step=STEPS[i];}
    else{const i=REPLAYS.indexOf(p.replays)+(op.hyper==='replaysUp'?1:-1);if(i<0||i>=REPLAYS.length)return null;q.replays=REPLAYS[i];}
    return q;
  }
  const inSet=p.masks.filter(m=>m!==0),out=ALL.filter(m=>!p.masks.includes(m)),pool=op.action==='add'?out:op.action==='remove'?inSet:ALL;
  if(!pool.length)return null;
  const chosen=sampleK(pool,rankWeights(op.rank,pool,evidence),op.k,rng);
  if(op.action==='add')q.masks.push(...chosen);else if(op.action==='remove')q.masks=q.masks.filter(m=>!chosen.includes(m));else q.masks=[0,...chosen];
  return q;
}

// Thompson rule (frozen in the plan). Library = per-move {n, sum, sumSq} of dev energy gains.
// Pooled sigma^2 = variance of all gains in the library (SIGMA0^2 until 2 gains exist), floored at 0.25.
// Posterior for a move: mean = sum/(n+N0), var = sigma^2/(n+N0), prior mean 0, N0 = 1. Untried moves: n = 0.
const SIGMA0=2,N0=1,VAR_FLOOR=.25;
const newLib=()=>({stats:Object.fromEntries(GRAMMAR.map(o=>[o.id,{n:0,sum:0,sumSq:0}]))});
function pooledVar(lib){let n=0,s=0,ss=0;for(const v of Object.values(lib.stats)){n+=v.n;s+=v.sum;ss+=v.sumSq;}return n<2?SIGMA0**2:Math.max(VAR_FLOOR,(ss-s*s/n)/(n-1));}
function gauss(rng){const u=Math.max(rng(),1e-12),v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
// Order moves for one proposal. mode: 'thompson' (lib), 'uniform' (all grammar), 'oracle' (uniform over ORACLE).
function proposalOrder(mode,lib,rng){
  if(mode==='greedy')return GREEDY;
  if(mode==='thompson'){const s2=pooledVar(lib);return GRAMMAR.map(o=>{const st=lib.stats[o.id];return [o,st.sum/(st.n+N0)+Math.sqrt(s2/(st.n+N0))*gauss(rng)];}).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);}
  const set=[...(mode==='oracle'?ORACLE:GRAMMAR)];for(let i=set.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[set[i],set[j]]=[set[j],set[i]];}return set;
}

const WORLD=rule=>({valenceRule:rule,tasteDecisionMode:'threshold'});
const program=p=>({code:'masks',masks:p.masks,step:p.step,replays:p.replays});
async function run(pool,p,histories,rule){
  const r=await Promise.all(histories.map(h=>pool.run(program(p),h,WORLD(rule))));
  const evidence=Array(16).fill(0);for(const x of r)for(let m=0;m<16;m++)evidence[m]+=x.termEvidence[m];
  for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');
  return {scores:r.map(x=>x.energy),survivors:r.map(x=>x.survivors),discrimination:r.map(x=>x.discrimination),evidence};
}
// Level-0 search with dev (6) and confirm (6) gates on energy. learn=true updates lib online.
async function search(pool,{problem,mode,lib,budget,seed,learn}){
  const rng=makeRng(seed),dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let inc=IDENTITY,incR=await run(pool,inc,dev,problem.rule),used=1;const tried=new Set([key(inc)]),record=[];
  while(used<budget){
    let m=null;for(const op of proposalOrder(mode,lib,rng)){const q=applyOp(op,inc,incR.evidence,rng);if(q&&!tried.has(key(q))){m={op,q};break;}}
    if(!m)break;tried.add(key(m.q));
    const cand=await run(pool,m.q,dev,problem.rule);used++;
    const gain=mean(cand.scores)-mean(incR.scores),wins=cand.scores.filter((x,i)=>x>incR.scores[i]).length;let ok=false,confirmGain=null;
    if(learn){const st=lib.stats[m.op.id];st.n++;st.sum+=gain;st.sumSq+=gain*gain;}
    if(gain>0&&wins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6);
      const [a,b]=await Promise.all([run(pool,m.q,fresh,problem.rule),run(pool,inc,fresh,problem.rule)]);used+=2;
      confirmGain=mean(a.scores)-mean(b.scores);ok=confirmGain>0&&a.scores.filter((x,i)=>x>b.scores[i]).length>=4;
    }
    record.push({op:m.op.id,to:m.q,gain,wins,confirmGain,accepted:ok});
    if(ok){inc=m.q;incR=cand;}
  }
  return {final:inc,record,used};
}
async function final(pool,p,problem){const x=await run(pool,p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem.rule);
  return {energy:mean(x.scores),survivors:mean(x.survivors),discrimination:mean(x.discrimination)};}

const GREEDY=[3,4,2,6,8,1].map(k=>GRAMMAR.find(o=>o.id===`keepOnly/evid/${k}`)).concat(GRAMMAR.filter(o=>o.hyper));
const PROBES=[2,3,4,6].map(k=>`keepOnly/evid/${k}`).concat(HYPER);

const single=(mask,sign)=>({name:`s${mask}${sign>0?'+':'-'}`,rule:{mask,sign}});
const gate=(kind,[a,b])=>({name:`${kind}(${a},${b})${kind==='AND'?'-':'+'}`,rule:{terms:[[1<<a,1],[1<<b,1]],bias:(kind==='AND'?-1:1)*1.5,sign:kind==='AND'?-1:1}});
const ALLP=[single(1,1),single(2,-1),single(4,1),single(5,-1),single(7,1),single(10,-1),single(11,1),single(12,-1),single(15,1),gate('AND',[1,2]),gate('OR',[0,1]),gate('AND',[2,3])]
  .map((r,i)=>({...r,bankSeed:997001+i,kind:i<9?'single':'gate'}));
const PROBS=SMOKE?ALLP.slice(0,1):ALLP,USEEDS=SMOKE?[1]:[1,2],BUDGET=SMOKE?3:8;

const pool=new Pool(4),t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const CK=OUT+'.ckpt.json',ckpt=existsSync(CK)?JSON.parse(readFileSync(CK,'utf8')):{},save=()=>writeFileSync(CK,JSON.stringify(ckpt));
const CODE=['scripts/rsi-p3-headroom.mjs','learning/taste-program-eval.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex'));
const CFG=createHash('sha256').update(JSON.stringify({PROBS,USEEDS,BUDGET,CODE})).digest('hex').slice(0,12);
if(ckpt.cfg&&ckpt.cfg!==CFG)throw new Error('checkpoint from a different config');ckpt.cfg=CFG;
async function cached(k,f){if(!(k in ckpt)){ckpt[k]=await f();save();}return ckpt[k];}
const lib=null,rows=[];
for(const problem of PROBS){
  const dev=makeHistories(problem.bankSeed,6),base=await run(pool,IDENTITY,dev,problem.rule);
  const probes=await cached(`probe:${problem.name}`,async()=>{const o={};for(const id of PROBES){const q=applyOp(GRAMMAR.find(g=>g.id===id),IDENTITY,base.evidence,makeRng(problem.bankSeed));
    o[id]=q?mean((await run(pool,q,dev,problem.rule)).scores)-mean(base.scores):null;}return o;});
  const one=async(mode,seed)=>cached(`${mode}:${seed}:${problem.name}`,async()=>{const s=await search(pool,{problem,mode,lib,budget:BUDGET,seed:(problem.bankSeed*7+seed)>>>0,learn:false});
    return {final:s.final,ops:s.record.filter(x=>x.accepted).map(x=>x.op),proposed:s.record.map(x=>x.op),...await final(pool,s.final,problem)};});
  const G=await one('greedy',1),U=[];for(const sd of USEEDS)U.push(await one('uniform',sd));
  const I=await cached(`id:${problem.name}`,()=>final(pool,IDENTITY,problem));
  const best=Object.entries(probes).filter(([,v])=>v!=null).sort((a,b)=>b[1]-a[1])[0];
  rows.push({problem:problem.name,kind:problem.kind,I:I.energy,G:G.energy,U:mean(U.map(u=>u.energy)),Gops:G.ops,Uops:U.map(u=>u.ops),probes,bestFirst:best});
  say({problem:problem.name,I:I.energy.toFixed(2),G:G.energy.toFixed(2),U:mean(U.map(u=>u.energy)).toFixed(2),Gacc:G.ops.length,best});
}
const sub=k=>rows.filter(r=>!k||r.kind===k),gap=k=>mean(sub(k).map(r=>r.G-r.U));
const firsts=rows.map(r=>r.bestFirst[0]),counts={};for(const f of firsts)counts[f]=(counts[f]||0)+1;const modal=Math.max(...Object.values(counts))/rows.length;
const res={GminusU:gap(),GminusU_single:gap('single'),GminusU_gate:SMOKE?null:gap('gate'),GminusI:mean(rows.map(r=>r.G-r.I)),Gaccepted:mean(rows.map(r=>r.Gops.length)),
  Uaccepted:mean(rows.flatMap(r=>r.Uops.map(o=>o.length))),bestFirstCounts:counts,modalShare:modal,
  pass:{H1_headroom:gap()>=1.5,H2_chain:mean(rows.map(r=>r.Gops.length))>=2,H3_context:modal<=0.75}};
say({phase:'result',...res});
writeFileSync(OUT,JSON.stringify({schema:1,kind:'rsi-p3-headroom',cfg:CFG,rows,result:res,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
