// RSI P12 (plan: docs/RSI_P12_PLAN.md, frozen before the run): in-lineage self-revision of the fly's own taste
// program. 24 embodied rules x 4 lineages x 8 generations; arms S0, SELF (evid), SHAM (random). Many-odor world.
// Usage: node scripts/rsi-p12-lineage.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p12/',import.meta.url);
const NR=SMOKE?2:24,NL=SMOKE?2:4,G=SMOKE?2:8,HALF=SMOKE?1:12;
const CODE=['scripts/rsi-p12-lineage.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d),rng=L.makeRng(1804999);let ge=0;const D=200000;for(let s=0;s<D;s++){let t=0;for(let i=0;i<n;i++)t+=(rng()<.5?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return (ge+1)/(D+1);};
function makeEmbodied(seed,fam,name){
  const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const ARMS={S0:null,SELF:'evid',SHAM:'random'},pool=new Pool(8);
async function lineageArm(prob,k,mode){
  const H=makeHistories((1802000+OFF+k)>>>0,G*NL),prog={code:'masks',masks:L.S0.masks,step:4,replays:1,odor:prob.odor,...(mode?{selfRevise:{mode,every:8,z:3,cap:16,evidence:'residual'}}:{})};
  let inh=Array(NL).fill(null);const energy=[];let last=null;
  for(let g=0;g<G;g++){
    const r=await Promise.all([...Array(NL).keys()].map(l=>pool.run(prog,H[g*NL+l],{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^(g*7919)^l),...(inh[l]?{inheritTaste:inh[l]}:{})})));
    for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');
    energy.push(L.mean(r.map(x=>x.energy)));inh=r.map(x=>x.tasteStates);last=r;}
  const added=last.flatMap(x=>x.tasteStates.map(t=>t.masks.filter(m=>!L.S0.masks.includes(m))));
  const F=L.mean(added.map(a=>a.length?a.filter(m=>prob.target.includes(m)).length/a.length:0));
  const held=L.mean(last.flatMap(x=>x.tasteStates.map(t=>t.masks.filter(m=>prob.target.includes(m)).length)));
  return {energy,E_first:energy[0],E_last:L.mean(energy.slice(-Math.min(2,G))),F,addedMean:L.mean(added.map(a=>a.length)),targetsHeld:held};
}
const probs=[...Array(NR).keys()].map(i=>makeEmbodied(1801001+OFF+i,i<HALF?'pairs':'staircase',`${i<HALF?'p':'s'}${i+1}`));
const rows=await Promise.all(probs.map(async(prob,i)=>{const k=i+1,out={rule:prob.name,family:prob.family};
  const res=await Promise.all(Object.entries(ARMS).map(([a,m])=>lineageArm(prob,k,m)));Object.keys(ARMS).forEach((a,j)=>out[a]=res[j]);
  say({rule:out.rule,S0:out.S0.E_last.toFixed(2),SELF:out.SELF.E_last.toFixed(2),SHAM:out.SHAM.E_last.toFixed(2),F:[out.SELF.F.toFixed(2),out.SHAM.F.toFixed(2)],held:out.SELF.targetsHeld.toFixed(2)});return out;}));
const st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)});
const L1=st(rows.map(r=>r.SELF.E_last-r.S0.E_last)),L2=st(rows.map(r=>r.SELF.E_last-r.SHAM.E_last)),L3=st(rows.map(r=>r.SELF.F-r.SHAM.F)),
  L4=st(rows.map(r=>(r.SELF.E_last-r.SELF.E_first)-(r.S0.E_last-r.S0.E_first)));
const res={L1,L2,L3,L4,pass:{L1:L1.mean>=1.65&&L1.p<.05,L2:L2.mean>0&&L2.p<.05,L3:L3.mean>0&&L3.p<.05,L4:L4.mean>0&&L4.p<.05}};
const PASS=Object.values(res.pass).every(Boolean);say({phase:'result',L1:[L1.mean,L1.p],L2:[L2.mean,L2.p],L3:[L3.mean,L3.p],L4:[L4.mean,L4.p],pass:res.pass,PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P12_PLAN.md',code:CODE,smoke:SMOKE,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
