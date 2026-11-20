// RSI P2 dev check (plan: docs/RSI_P2_PLAN.md). Thompson-sampled weights over the
// full move grammar, trained on independent per-library banks, scored on energy.
// Usage: node scripts/rsi-p2-dev.mjs <out.json> [smoke]
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

// Rules: single Walsh terms (balanced) and three-quarter-good 2-bit gates (AND-, OR+).
const single=(mask,sign)=>({name:`s${mask}${sign>0?'+':'-'}`,rule:{mask,sign},baseRate:.5});
const gate=(kind,[a,b])=>({name:`${kind}(${a},${b})${kind==='AND'?'-':'+'}`,rule:{terms:[[1<<a,1],[1<<b,1]],bias:(kind==='AND'?-1:1)*1.5,sign:kind==='AND'?-1:1},baseRate:.75});
const PAIRS=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const DEV_RULES=[single(3,1),single(9,-1),single(6,1),gate('AND',[0,2]),gate('OR',[1,3]),gate('OR',[0,3])].map((r,i)=>({...r,bankSeed:994901+i}));
const POOL=[...ALL.flatMap(m=>[single(m,1),single(m,-1)]),...PAIRS.flatMap(p=>[gate('AND',p),gate('OR',p)])].filter(r=>!DEV_RULES.some(d=>d.name===r.name));
const C=SMOKE?{libs:1,trainRules:1,trainBudget:4,evalBudget:3,devRules:DEV_RULES.slice(0,1)}:{libs:6,trainRules:8,trainBudget:16,evalBudget:8,devRules:DEV_RULES};
const trainBank=L=>{const rng=makeRng(994000+L*97),idx=[...POOL.keys()];for(let i=idx.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
  return idx.slice(0,C.trainRules).map((k,i)=>({...POOL[k],bankSeed:994000+L*10+i}));};

const pool=new Pool(4),t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const CK=OUT+'.ckpt.json',ckpt=existsSync(CK)?JSON.parse(readFileSync(CK,'utf8')):{},save=()=>writeFileSync(CK,JSON.stringify(ckpt));
const CODE=['scripts/rsi-p2-dev.mjs','learning/taste-program-eval.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex'));
const CFG_HASH=createHash('sha256').update(JSON.stringify({C,SIGMA0,N0,VAR_FLOOR,DEV_RULES,CODE,v:2})).digest('hex').slice(0,12);
if(ckpt.cfg&&ckpt.cfg!==CFG_HASH)throw new Error('checkpoint from a different config');ckpt.cfg=CFG_HASH;
async function cached(k,f){if(!(k in ckpt)){ckpt[k]=await f();save();}return ckpt[k];}

// 1. Train independent libraries (own training bank, own seeds).
const libs=[];
for(let L=1;L<=C.libs;L++){
  const lib=await cached(`train:${L}`,async()=>{const lib=newLib(),bank=trainBank(L),log=[];
    for(const problem of bank){const r=await search(pool,{problem,mode:'thompson',lib,budget:C.trainBudget,seed:(problem.bankSeed*31+L)>>>0,learn:true});log.push({problem:problem.name,accepted:r.record.filter(x=>x.accepted).map(x=>x.op)});}
    return {...lib,bank:bank.map(b=>b.name),log};});
  libs.push(lib);
  const top=Object.entries(lib.stats).map(([id,s])=>[id,s.sum/(s.n+N0),s.n]).sort((a,b)=>b[1]-a[1]).slice(0,3);
  say({phase:'train',lib:L,bank:lib.bank,top});
}
const hashes=libs.map(l=>createHash('sha256').update(JSON.stringify(l.stats)).digest('hex'));
if(new Set(hashes).size!==hashes.length)throw new Error('libraries are not independent (duplicate hash)');

// 2. Evaluate A_L (frozen Thompson) and B_L (uniform grammar) with eval seed bankSeed*7+L, O (oracle, seed L=1)
// and no-search identity on dev rules. Each library difference gets its own B draw.
const arms=[...libs.flatMap((l,i)=>[[`A${i+1}`,'thompson',l,i+1],[`B${i+1}`,'uniform',null,i+1]]),['O','oracle',null,1]],rows={};
for(const [name,mode,lib,L] of arms){rows[name]=[];
  for(const problem of C.devRules){
    const r=await cached(`eval:${name}:${problem.name}`,async()=>{const s=await search(pool,{problem,mode,lib,budget:C.evalBudget,seed:(problem.bankSeed*7+L)>>>0,learn:false});return {problem:problem.name,final:s.final,ops:s.record.filter(x=>x.accepted).map(x=>x.op),...await final(pool,s.final,problem)};});
    rows[name].push(r);}
  say({phase:'eval',arm:name,energy:mean(rows[name].map(r=>r.energy))});
}
const identity=[];for(const problem of C.devRules)identity.push(await cached(`id:${problem.name}`,async()=>({problem:problem.name,...await final(pool,IDENTITY,problem)})));

// 3. Gate (plan section "Dev gate").
const mB=mean(libs.flatMap((_,i)=>rows[`B${i+1}`].map(r=>r.energy))),mO=mean(rows.O.map(r=>r.energy)),mI=mean(identity.map(r=>r.energy));
const diffs=libs.map((_,i)=>mean(rows[`A${i+1}`].map(r=>r.energy))-mean(rows[`B${i+1}`].map(r=>r.energy))),sd=Math.sqrt(diffs.reduce((a,d)=>a+(d-mean(diffs))**2,0)/Math.max(1,diffs.length-1));
const requiredLibs=mean(diffs)>0?Math.ceil(10.03*(sd/mean(diffs))**2+2.7):Infinity;
const evidTop=libs.filter(l=>{const t=Object.entries(l.stats).sort((a,b)=>b[1].sum/(b[1].n+N0)-a[1].sum/(a[1].n+N0))[0][0];return t.startsWith('keepOnly/evid/');}).length;
const gateRes={oracleMinusB:mO-mB,AminusB:diffs,meanAminusB:mean(diffs),sdAminusB:sd,positive:diffs.filter(d=>d>0).length,requiredLibs,evidTopCount:evidTop,
  identityEnergy:mI,Benergy:mB,Oenergy:mO,
  pass:{oracleGap:mO-mB>=1.5,positive5of6:diffs.filter(d=>d>0).length>=5,meanAtLeast1:mean(diffs)>=1,power:requiredLibs<=12}};
gateRes.PASS=Object.values(gateRes.pass).every(Boolean);
say({phase:'gate',...gateRes});
writeFileSync(OUT,JSON.stringify({schema:1,kind:'rsi-p2-dev',plan:'docs/RSI_P2_PLAN.md',cfg:CFG_HASH,config:C,devRules:C.devRules,libs,rows,identity,gate:gateRes,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
