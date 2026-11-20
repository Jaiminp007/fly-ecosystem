// RSI P13 (plan: docs/RSI_P13_PLAN.md, frozen before the run): the lineage tunes its own reviser's threshold z.
// Usage: node scripts/rsi-p13.mjs <fixed|meta|sham|result> [smoke]. Writes evidence/rsi-p13/<stage>.json.
import {writeFileSync,readFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import * as L from './rsi-p6-lib.mjs';
const STAGE=process.argv[2],SMOKE=process.argv[3]==='smoke',OFF=SMOKE?500:0,DIR=new URL('../evidence/rsi-p13/',import.meta.url);
const NR=SMOKE?2:24,NL=SMOKE?2:4,G=SMOKE?3:12,HALF=SMOKE?1:12,LATE=SMOKE?[1,2]:[8,9,10,11],TAU=2,STEP=1.25,ZMIN=1.5,ZMAX=4.5;
const CODE=['scripts/rsi-p13.mjs','scripts/rsi-p6-lib.mjs','learning/taste-program-eval.mjs','learning/odor-routed-taste.mjs','engine.mjs'].map(f=>createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex').slice(0,16));
const t0=performance.now(),say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
const sd=v=>Math.sqrt(v.reduce((a,d)=>a+(d-L.mean(v))**2,0)/Math.max(1,v.length-1));
const signFlip=d=>{const n=d.length,obs=L.mean(d),rng=L.makeRng(1904999);let ge=0;const D=200000;for(let s=0;s<D;s++){let t=0;for(let i=0;i<n;i++)t+=(rng()<.5?-1:1)*d[i];if(t/n>=obs-1e-12)ge++;}return (ge+1)/(D+1);};
const file=name=>new URL((SMOKE?name+'.smoke':name)+'.json',DIR);
const save=(name,obj)=>{mkdirSync(DIR,{recursive:true});writeFileSync(file(name),JSON.stringify({schema:1,plan:'docs/RSI_P13_PLAN.md',code:CODE,smoke:SMOKE,...obj,seconds:(performance.now()-t0)/1000})+'\n');};
function makeEmbodied(seed,fam,name){
  const s=(fam==='pairs'?L.makePairs:L.makeStaircase)(seed,name),rng=L.makeRng(L.mix(seed^0x51ed2701)),codes=new Set(),odor=[];
  while(odor.length<16){const c=Math.floor(rng()*L.FULL);if(codes.has(c))continue;codes.add(c);odor.push([...Array(L.W).keys()].map(b=>c>>b&1?1:-1));}
  return {...s,odor,rule:{terms:s.terms,bias:s.bias,sign:s.sign,odor}};
}
const probs=[...Array(NR).keys()].map(i=>makeEmbodied(1901001+OFF+i,i<HALF?'pairs':'staircase',`${i<HALF?'p':'s'}${i+1}`));
const clamp=z=>Math.max(ZMIN,Math.min(ZMAX,z));
// One arm on one rule: kind 'none' (S0), 'fixed', 'meta', 'sham'. Returns energy per generation and z per chain per generation.
async function lineageArm(pool,prob,k,{kind,z0=3,shamZ=null}){
  const H=makeHistories((1902000+OFF+k)>>>0,G*NL),prog={code:'masks',masks:L.S0.masks,step:4,replays:1,odor:prob.odor,...(kind==='none'?{}:{selfRevise:{mode:'evid',every:8,z:z0,cap:16,evidence:'residual'}})};
  let inh=Array(NL).fill(null),prev=null;const energy=[],zs=[],prevLoss=[...Array(NL)].map(()=>[]),pruneLog=[];
  for(let g=0;g<G;g++){
    const r=await Promise.all([...Array(NL).keys()].map(l=>pool.run(prog,H[g*NL+l],{valenceRule:prob.rule,tasteDecisionMode:'threshold',odorShiftEvery:32,odorShiftSeed:L.mix(prob.bankSeed^(g*7919)^l),...(inh[l]?{inheritTaste:inh[l]}:{})})));
    for(const x of r)if(!Number.isFinite(x.energy))throw new Error('non-finite energy');
    energy.push(L.mean(r.map(x=>x.energy)));const states=r.map(x=>x.tasteStates);
    if(kind==='meta'||kind==='sham'){let tested=0,pruned=0;
      inh=states.map((chains,l)=>chains.map((c,i)=>{
        const parent=prev?prev[l][i]:null,parentAdded=parent?parent.added:[],masks=[...c.masks],ev=[...c.evidence],w=new Map(c.masks.map((m,j)=>[m,c.weights[j]]));
        let t=0,p=0;for(const m of parentAdded){if(!masks.includes(m)||L.S0.masks.includes(m))continue;t++;if(Math.abs(w.get(m))<=TAU){masks.splice(masks.indexOf(m),1);ev[m]=0;p++;}}
        tested+=t;pruned+=p;
        const dn=c.n-(inh[l]?.[i]?.n??0),loss=dn>0?(c.s2-(inh[l]?.[i]?.s2??0))/dn:null;let z=c.z;
        if(kind==='meta'){if(t&&p/t>.5)z=clamp(z*STEP);else if(g>0&&c.added.length===0&&loss!==null&&prevLoss[l][i]!=null&&loss>=prevLoss[l][i])z=clamp(z/STEP);}
        else z=shamZ[g][l][i];
        if(loss!==null)prevLoss[l][i]=loss;
        return {masks,evidence:ev,n:c.n,s2:c.s2,z};}));
      pruneLog.push({tested,pruned});
    }else inh=states;
    zs.push(kind==='none'?null:inh.map(chains=>chains.map(c=>c.z??z0)));prev=states;
  }
  return {energy,E_late:L.mean(LATE.map(g=>energy[g])),zs,pruneLog};
}
async function runArms(arms){const pool=new Pool(8),out=probs.map(p=>({rule:p.name,family:p.family}));
  await Promise.all(probs.map(async(prob,i)=>{const res=await Promise.all(arms.map(([name,cfg])=>lineageArm(pool,prob,i+1,typeof cfg==='function'?cfg(i):cfg)));
    arms.forEach(([name],j)=>out[i][name]=res[j]);say({rule:prob.name,...Object.fromEntries(arms.map(([n],j)=>[n,res[j].E_late.toFixed(2)]))});}));
  pool.close();return out;}
if(STAGE==='fixed')save('fixed',{rows:await runArms([['S0',{kind:'none'}],['FIXED3',{kind:'fixed',z0:3}],['FIXED15',{kind:'fixed',z0:1.5}]])});
if(STAGE==='meta')save('meta',{rows:await runArms([['META15',{kind:'meta',z0:1.5}],['META3',{kind:'meta',z0:3}]])});
if(STAGE==='sham'){if(!existsSync(file('meta')))throw new Error('run meta first');const meta=JSON.parse(readFileSync(file('meta'),'utf8')).rows;
  save('sham',{rows:await runArms([['SHAM15',i=>({kind:'sham',z0:1.5,shamZ:meta[(i+1)%NR].META15.zs})]])});}
if(STAGE==='result'){const [f,m,s]=['fixed','meta','sham'].map(n=>JSON.parse(readFileSync(file(n),'utf8')).rows),R=f.map((r,i)=>({...r,...m[i],...s[i]}));
  const st=x=>({diffs:x,mean:L.mean(x),sd:sd(x),positive:x.filter(v=>v>0).length,p:signFlip(x)}),E=(a,i)=>R[i][a].E_late;
  const d1=st(R.map((_,i)=>E('META15',i)-E('FIXED15',i))),gap=L.mean(R.map((_,i)=>E('FIXED3',i)-E('FIXED15',i))),d2=st(R.map((_,i)=>E('META15',i)-E('SHAM15',i))),d3=st(R.map((_,i)=>E('META3',i)-E('FIXED3',i)));
  const finalZ=R.flatMap(r=>r.META15.zs.at(-1).flat()),zUp=finalZ.filter(z=>z>ZMIN+1e-9).length/finalZ.length;
  const reported={FIXED3minusFIXED15:gap,S0:L.mean(R.map(r=>r.S0.E_late)),META15minusS0:L.mean(R.map(r=>r.META15.E_late-r.S0.E_late)),SHAM15minusFIXED15:L.mean(R.map(r=>r.SHAM15.E_late-r.FIXED15.E_late)),finalZmeanMETA15:L.mean(finalZ),finalZmeanMETA3:L.mean(R.flatMap(r=>r.META3.zs.at(-1).flat()))};
  const res={G1:d1,G1bar:Math.max(1,.5*gap),G2:d2,G3:d3,G4:zUp,reported,pass:{G1:d1.mean>=Math.max(1,.5*gap)&&d1.p<.05,G2:d2.mean>0&&d2.p<.01,G3:d3.mean>=-.5,G4:zUp>=.75}};
  const PASS=Object.values(res.pass).every(Boolean);say({phase:'result',G1:[d1.mean,d1.p,res.G1bar],G2:[d2.mean,d2.p],G3:d3.mean,G4:zUp,reported,pass:res.pass,PASS});save('result',{result:res,PASS});}
