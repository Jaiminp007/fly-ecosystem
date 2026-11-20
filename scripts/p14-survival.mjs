// P14 (plan: docs/RSI_P14_PLAN.md, frozen before the run): does taste skill change survival? NONE / S0 / TRUE
// programs on 12 embodied rules (many-odor world) at nutrientScale 0.75, 1, 1.5. Usage: node scripts/p14-survival.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/p14/',import.meta.url),NR=SMOKE?2:12,HALF=SMOKE?1:6,H=SMOKE?2:16,SCALES=SMOKE?[1]:[.75,1,1.5];
const CODE=['scripts/p14-survival.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d);let ge=0;for(let s=0;s<1<<n;s++){let t=0;for(let i=0;i<n;i++)t+=(s>>i&1?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return ge/2**n;};
function makeEmbodied(seed,fam,name){
  const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const pool=new Pool(8),probs=[...Array(NR).keys()].map(i=>makeEmbodied(2001001+OFF+i,i<HALF?'pairs':'staircase',`${i<HALF?'p':'s'}${i+1}`));
const arms=p=>({NONE:[0],S0:L.S0.masks,TRUE:[0,...p.target]});
const rows=await Promise.all(probs.map(async(prob,i)=>{const hs=makeHistories((2002000+OFF+i+1)>>>0,H),out={rule:prob.name,family:prob.family};
  // Resumable cache (infrastructure only, added after two interrupted runs): each (rule, scale, arm) cell is
  // deterministic; a finished cell is stored and reused, so a restart cannot change any result.
  const CACHE=new URL(SMOKE?'cells.smoke/':'cells/',DIR);mkdirSync(CACHE,{recursive:true});
  for(const sc of SCALES)for(const [a,masks] of Object.entries(arms(prob))){const cell=new URL(`${prob.name}_${a}_${sc}.json`,CACHE);
    if(existsSync(cell)){out[`${a}@${sc}`]=JSON.parse(readFileSync(cell,'utf8'));continue;}
    const r=await Promise.all(hs.map(h=>pool.run({code:'masks',masks,step:4,replays:1,odor:prob.odor},h,{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^0x7f4a7c15),nutrientScale:sc})));
    for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite');out[`${a}@${sc}`]={survivors:L.mean(r.map(x=>x.survivors)),energy:L.mean(r.map(x=>x.energy))};writeFileSync(cell,JSON.stringify(out[`${a}@${sc}`]));}
  say({rule:out.rule,...Object.fromEntries(Object.entries(out).filter(([k])=>k.includes('@')).map(([k,v])=>[k,v.survivors.toFixed(1)]))});return out;}));
const st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)}),res={};
for(const sc of SCALES){const S=a=>rows.map(r=>r[`${a}@${sc}`].survivors),E=a=>L.mean(rows.map(r=>r[`${a}@${sc}`].energy));
  const s1=st(S('TRUE').map((v,i)=>v-S('NONE')[i])),none=L.mean(S('NONE'));
  res[sc]={S1:s1,NONEsurvivors:none,S0survivors:L.mean(S('S0')),TRUEsurvivors:L.mean(S('TRUE')),S0minusNONE:st(S('S0').map((v,i)=>v-S('NONE')[i])),TRUEminusS0:st(S('TRUE').map((v,i)=>v-S('S0')[i])),
    energy:{NONE:E('NONE'),S0:E('S0'),TRUE:E('TRUE')},pass:{S1:s1.mean>=3&&s1.p<.01,S2:none>=2}};}
const PASS=SCALES.some(sc=>res[sc].pass.S1&&res[sc].pass.S2);
say({phase:'result',...Object.fromEntries(SCALES.map(sc=>[sc,{NONE:res[sc].NONEsurvivors.toFixed(2),S0:res[sc].S0survivors.toFixed(2),TRUE:res[sc].TRUEsurvivors.toFixed(2),S1:[res[sc].S1.mean.toFixed(2),res[sc].S1.p],S0mN:[res[sc].S0minusNONE.mean.toFixed(2),res[sc].S0minusNONE.p],pass:res[sc].pass}])),PASS});
mkdirSync(DIR,{recursive:true});writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P14_PLAN.md',code:CODE,smoke:SMOKE,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
