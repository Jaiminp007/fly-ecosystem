// Exploration only (non-bank seeds 99101+): selection relay headroom. Survivors per generation.
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from '../scripts/rsi-p6-lib.mjs';
const NR=+process.argv[2]||4,NL=+process.argv[3]||4,G=+process.argv[4]||8,TAU=2,BASE=99101;
function makeEmbodied(seed,fam,name){const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};}
const pool=new Pool(8);
async function arm(prob,k,{masks0=L.S0.masks,revise=null,select=null,prune=false}){
  const H=makeHistories(BASE+500+k,G*NL),rng=L.makeRng(L.mix(prob.bankSeed^0x5e1ec7)),prog={code:'masks',masks:masks0,step:4,replays:1,odor:prob.odor,...(revise?{selfRevise:{mode:revise,every:8,z:3,cap:16,evidence:'residual'}}:{})};
  let inh=Array(NL).fill(null),parentAdded=[...Array(NL)].map(()=>Array(24).fill([]));const surv=[],held=[];
  for(let g=0;g<G;g++){
    const r=await Promise.all([...Array(NL).keys()].map(l=>pool.run(prog,H[g*NL+l],{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^(g*7919)^l),...(inh[l]?{inheritTaste:inh[l]}:{})})));
    surv.push(L.mean(r.map(x=>x.survivors)));held.push(L.mean(r.flatMap(x=>x.tasteStates.map(t=>t.masks.filter(m=>prob.target.includes(m)).length))));
    if(!revise){inh=Array(NL).fill(null);continue;}
    const nextAdded=[];
    inh=r.map((x,l)=>{const st=x.tasteStates.map((c,i)=>{let masks=[...c.masks],ev=c.evidence?[...c.evidence]:null;
        if(prune)for(const m of parentAdded[l][i]){const j=masks.indexOf(m);if(j<0||masks0.includes(m))continue;if(Math.abs(c.weights[c.masks.indexOf(m)])<=TAU){masks.splice(j,1);if(ev)ev[m]=0;}}
        return {alive:c.alive,rec:{masks,evidence:ev,n:c.n,s2:c.s2},added:c.added??[]};});
      const pool_=select==='survivors'?st.filter(s=>s.alive):st,src=pool_.length?pool_:st;
      const pick=[...Array(24).keys()].map(i=>select?src[Math.floor(rng()*src.length)]:st[i]);
      nextAdded.push(pick.map(p=>p.added));return pick.map(p=>p.rec);});
    parentAdded=nextAdded;}
  return {surv,held,all:L.mean(surv),late:L.mean(surv.slice(-3))};}
const ARMS={S0:{},TRUE:'T',RELAY:{revise:'evid'},SELECT:{revise:'evid',select:'survivors',prune:true},SEL_SHAM:{revise:'evid',select:'random',prune:true},SEL_RAND:{revise:'random',select:'survivors',prune:true}};
const probs=[...Array(NR).keys()].map(i=>makeEmbodied(BASE+i,i%2?'staircase':'pairs',`r${i}`));
const out=await Promise.all(probs.map(async(p,k)=>Object.fromEntries(await Promise.all(Object.entries(ARMS).map(async([a,o])=>[a,await arm(p,k,o==='T'?{masks0:[0,...p.target]}:o)])))));
for(const a of Object.keys(ARMS))console.log(a.padEnd(9),'all',L.mean(out.map(o=>o[a].all)).toFixed(2),'late',L.mean(out.map(o=>o[a].late)).toFixed(2),'| per rule all:',out.map(o=>o[a].all.toFixed(1)).join(' '),'| held end',out.map(o=>o[a].held.at(-1).toFixed(1)).join(' '));
pool.close();
