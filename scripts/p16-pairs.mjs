// P16 (plan: docs/RSI_P16_PLAN.md, frozen before the run): generic pairwise representation from birth vs S0, survival.
// Arms S0 / PAIRS / TRUE on 24 embodied rules (many-odor world). Usage: node scripts/p16-pairs.mjs [smoke]
import {writeFileSync,readFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const SMOKE=process.argv[2]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/p16/',import.meta.url),NR=SMOKE?2:24,HALF=SMOKE?1:12,H=SMOKE?2:16;
const CODE=['scripts/p16-pairs.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d),rng=L.makeRng(2304999);let ge=0;const D=200000;for(let s=0;s<D;s++){let t=0;for(let i=0;i<n;i++)t+=(rng()<.5?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return (ge+1)/(D+1);};
function makeEmbodied(seed,fam,name){
  const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const ord=k=>[...Array(L.FULL).keys()].filter(m=>L.order(m)===k),PAIRS=[0,...ord(1),...ord(2)];
const pool=new Pool(8),probs=[...Array(NR).keys()].map(i=>makeEmbodied(2301001+OFF+i,i<HALF?'pairs':'staircase',`${i<HALF?'p':'s'}${i+1}`));
const arms=p=>({S0:L.S0.masks,PAIRS,TRUE:[0,...p.target]});
const CACHE=new URL(SMOKE?'cells.smoke/':'cells/',DIR);mkdirSync(CACHE,{recursive:true});
const rows=await Promise.all(probs.map(async(prob,i)=>{const hs=makeHistories((2302001+OFF+i)>>>0,H),out={rule:prob.name,family:prob.family};
  // Resumable cache (infrastructure only): each (rule, arm) cell is deterministic; a finished cell is reused.
  for(const [a,masks] of Object.entries(arms(prob))){const cell=new URL(`${prob.name}_${a}.json`,CACHE);
    if(existsSync(cell)){out[a]=JSON.parse(readFileSync(cell,'utf8'));continue;}
    const r=await Promise.all(hs.map(h=>pool.run({code:'masks',masks,step:4,replays:1,odor:prob.odor},h,{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^0x7f4a7c15)})));
    for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite');
    out[a]={survivors:L.mean(r.map(x=>x.survivors)),energy:L.mean(r.map(x=>x.energy)),tastings:L.mean(r.map(x=>x.examples))/24};writeFileSync(cell,JSON.stringify(out[a]));}
  say({rule:out.rule,S0:out.S0.survivors.toFixed(1),PAIRS:out.PAIRS.survivors.toFixed(1),TRUE:out.TRUE.survivors.toFixed(1)});return out;}));
const st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)});
const D=(a,b,f=null)=>rows.filter(r=>!f||r.family===f).map(r=>r[a].survivors-r[b].survivors);
const g1=st(D('PAIRS','S0')),fp=st(D('PAIRS','S0','pairs')),fs=st(D('PAIRS','S0','staircase')),gap=st(D('TRUE','S0'));
const m=(a,k)=>L.mean(rows.map(r=>r[a][k]));
const res={G1:g1,family:{pairs:fp,staircase:fs},TRUEminusS0:gap,captured:g1.mean/gap.mean,
  means:Object.fromEntries(['S0','PAIRS','TRUE'].map(a=>[a,{survivors:m(a,'survivors'),energy:m(a,'energy'),tastings:m(a,'tastings')}])),
  pass:{G1:g1.mean>=1.25&&g1.p<.01,G2:fp.mean>0&&fs.mean>0}};
const PASS=res.pass.G1&&res.pass.G2;say({phase:'result',G1:[g1.mean.toFixed(2),g1.positive,g1.p],pairs:fp.mean.toFixed(2),stair:fs.mean.toFixed(2),captured:res.captured.toFixed(2),pass:res.pass,PASS});
writeFileSync(new URL(SMOKE?'run.smoke.json':'run.json',DIR),JSON.stringify({schema:1,plan:'docs/RSI_P16_PLAN.md',code:CODE,smoke:SMOKE,rows,result:res,PASS,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
