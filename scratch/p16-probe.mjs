// Exploration only (non-bank seeds 99001+): generic richer representations vs S0 / TRUE, survival.
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from '../scripts/rsi-p6-lib.mjs';
const NR=+process.argv[2]||4,H=+process.argv[3]||4;
function makeEmbodied(seed,fam,name){const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};}
const ord=k=>[...Array(L.FULL).keys()].filter(m=>L.order(m)===k);
const P=[0,...ord(1),...ord(2)];const arms=p=>({PAIRS8:{masks:P,step:8},PAIRS_R2:{masks:P,step:4,replays:2},PAIRS_REV:{masks:P,step:4,selfRevise:{mode:'evid',every:8,z:3,cap:48,evidence:'residual'}}});
const pool=new Pool(8),probs=[...Array(NR).keys()].map(i=>makeEmbodied(99001+i,i%2?'staircase':'pairs',`r${i}`));
const out={};
await Promise.all(probs.map(async(p,i)=>{const hs=makeHistories(99501+i,H);for(const [a,masks] of Object.entries(arms(p))){
  const r=await Promise.all(hs.map(h=>pool.run({code:'masks',replays:1,...masks,odor:p.odor},h,{valenceRule:p.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(p.bankSeed^0x7f4a7c15)})));
  (out[a]??=[])[i]={fam:p.family,surv:L.mean(r.map(x=>x.survivors)),en:L.mean(r.map(x=>x.energy)),ex:L.mean(r.map(x=>x.examples))};}}));
for(const [a,v] of Object.entries(out))console.log(a,v.map(x=>`${x.fam[0]} s${x.surv.toFixed(1)} e${x.en.toFixed(1)} n${x.ex.toFixed(0)}`).join(' | '));
pool.close();
