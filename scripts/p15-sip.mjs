// P15 (plan: docs/RSI_P15_PLAN.md, frozen before the run): does taste skill change survival? NONE / S0 / TRUE
// programs on 12 embodied rules (many-odor world) at nutrientScale 0.75, 1, 1.5. Usage: node scripts/p14-survival.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/p15/',import.meta.url),NR=SMOKE?2:12,HALF=SMOKE?1:6,H=SMOKE?2:16,SCALES=[1];
const CODE=['scripts/p15-sip.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d);let ge=0;for(let s=0;s<1<<n;s++){let t=0;for(let i=0;i<n;i++)t+=(s>>i&1?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return ge/2**n;};
function makeEmbodied(seed,fam,name){
  const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const pool=new Pool(8),probs=[...Array(NR).keys()].map(i=>makeEmbodied(2201001+OFF+i,i<HALF?'pairs':'staircase',`${i<HALF?'p':'s'}${i+1}`));
const arms=p=>({S0:[L.S0.masks,{}],SIP:[L.S0.masks,{sipFraction:.1,sipLabels:true}],SHAM:[L.S0.masks,{sipFraction:.1}],TRUE:[[0,...p.target],{}]});
const rows=await Promise.all(probs.map(async(prob,i)=>{const hs=makeHistories((2202000+OFF+i+1)>>>0,H),out={rule:prob.name,family:prob.family};
  // Resumable cache (infrastructure only, added after two interrupted runs): each (rule, scale, arm) cell is
  // deterministic; a finished cell is stored and reused, so a restart cannot change any result.
  const CACHE=new URL(SMOKE?'cells.smoke/':'cells/',DIR);mkdirSync(CACHE,{recursive:true});
  for(const sc of SCALES)for(const [a,[masks,body]] of Object.entries(arms(prob))){const cell=new URL(`${prob.name}_${a}_${sc}.json`,CACHE);
    if(existsSync(cell)){out[`${a}@${sc}`]=JSON.parse(readFileSync(cell,'utf8'));continue;}
    const r=await Promise.all(hs.map(h=>pool.run({code:'masks',masks,step:4,replays:1,odor:prob.odor},h,{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^0x7f4a7c15),nutrientScale:sc,...body})));
    for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite');out[`${a}@${sc}`]={survivors:L.mean(r.map(x=>x.survivors)),energy:L.mean(r.map(x=>x.energy)),tastings:L.mean(r.map(x=>x.examples))/24,discrimination:L.mean(r.map(x=>x.discrimination))};writeFileSync(cell,JSON.stringify(out[`${a}@${sc}`]));}
  say({rule:out.rule,...Object.fromEntries(Object.entries(out).filter(([k])=>k.includes('@')).map(([k,v])=>[k,v.survivors.toFixed(1)]))});return out;}));
const st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)}),S=(a,k='survivors')=>rows.map(r=>r[`${a}@1`][k]);
const g1=st(S('SIP').map((v,i)=>v-S('S0')[i])),g2=st(S('SIP').map((v,i)=>v-S('SHAM')[i])),g3=S('SIP','tastings').filter((v,i)=>v>S('S0','tastings')[i]).length;
const res={G1:g1,G2:g2,G3:g3,reported:Object.fromEntries(['S0','SIP','SHAM','TRUE'].map(a=>[a,{survivors:L.mean(S(a)),energy:L.mean(S(a,'energy')),tastings:L.mean(S(a,'tastings')),discrimination:L.mean(S(a,'discrimination'))}])),
  pass:{G1:g1.mean>=2&&g1.p<.01,G2:g2.mean>=2&&g2.p<.01,G3:g3>=Math.ceil(NR*11/12)}};
const PASS=Object.values(res.pass).every(Boolean);say({phase:'result',G1:[g1.mean.toFixed(2),g1.positive,g1.p],G2:[g2.mean.toFixed(2),g2.positive,g2.p],G3:g3,surv:Object.fromEntries(Object.entries(res.reported).map(([a,v])=>[a,v.survivors.toFixed(2)])),pass:res.pass,PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P15_PLAN.md',code:CODE,smoke:SMOKE,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
