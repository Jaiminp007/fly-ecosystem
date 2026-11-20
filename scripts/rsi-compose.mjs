// Self-improving search with composable taste codes (RSI test V2).
// Level 0: fly taste learner = {masks (Walsh terms over 4 odor bits), step, replays}.
// Level 1: improver = weights over move operators and over mask order (1-4 bits).
// Problems: "odor chemistry" worlds; an odor's value = sign * product of its
// bits over a hidden rule mask (short phases). Test rules are disjoint from
// training rules, so mask identity cannot carry over; only search skill can.
// After every two training problems the improver rewrites its own weights from
// its own accumulated record. Test (b): improver v0 vs v1 vs v2 from the SAME
// start (copied best program, or the general identity code), same budget,
// same histories, same search seeds.
import {writeFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';

const SHORT=[160,160,160,64],OPS=['add','remove','swap','reduce','stepUp','stepDown','replaysUp','replaysDown'];
const STEPS=[.5,1,2,4,8],REPLAYS=[0,1,2,4];
const order=m=>[0,1,2,3].reduce((n,b)=>n+(m>>b&1),0);
const key=p=>JSON.stringify([[...p.masks].sort((a,b)=>a-b),p.step,p.replays]);
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
export const uniformImprover=()=>({version:0,ops:Object.fromEntries(OPS.map(o=>[o,1])),orders:{1:1,2:1,3:1,4:1}});
function pick(entries,rng){const total=entries.reduce((a,[,w])=>a+w,0);let u=rng()*total;for(const [k,w] of entries){u-=w;if(u<=0)return k;}return entries.at(-1)[0];}
function pickMask(imp,pool,rng){return pool.length?pick(pool.map(m=>[m,imp.orders[order(m)]]),rng):null;}
function move(imp,p,rng){
  const op=pick(OPS.map(o=>[o,imp.ops[o]]),rng),inSet=p.masks.filter(m=>m!==0),out=[...Array(16).keys()].filter(m=>m!==0&&!p.masks.includes(m));
  const q={...p,masks:[...p.masks]};let mask=null;
  if(op==='add'){mask=pickMask(imp,out,rng);if(mask===null)return null;q.masks.push(mask);}
  else if(op==='remove'){mask=pickMask(imp,inSet,rng);if(mask===null)return null;q.masks=q.masks.filter(m=>m!==mask);}
  else if(op==='swap'){const a=pickMask(imp,inSet,rng);mask=pickMask(imp,out,rng);if(a===null||mask===null)return null;q.masks=q.masks.map(m=>m===a?mask:m);}
  else if(op==='reduce'){mask=pickMask(imp,[...Array(15).keys()].map(i=>i+1),rng);q.masks=[0,mask];}
  else if(op==='stepUp'||op==='stepDown'){const i=STEPS.indexOf(p.step)+(op==='stepUp'?1:-1);if(i<0||i>=STEPS.length)return null;q.step=STEPS[i];}
  else{const i=REPLAYS.indexOf(p.replays)+(op==='replaysUp'?1:-1);if(i<0||i>=REPLAYS.length)return null;q.replays=REPLAYS[i];}
  return {candidate:q,op,mask};
}
const program=p=>({code:'masks',masks:p.masks,step:p.step,replays:p.replays});
async function scores(pool,p,histories,world){return (await Promise.all(histories.map(h=>pool.run(program(p),h,world)))).map(r=>r.score);}
export async function search(pool,{problem,start,improver,budget,seed}){
  let r=seed>>>0||1;const rng=()=>(r=advanceRng(r))/4294967296;
  const dev=makeHistories(problem.bankSeed,6);let confirmSeed=(problem.bankSeed^0x5bd1e995)>>>0;
  let incumbent=structuredClone(start),incDev=await scores(pool,incumbent,dev,problem.world),used=1;
  const tried=new Set([key(incumbent)]),record=[],accepted=[];
  while(used<budget){
    let m=null;for(let i=0;i<100&&!m;i++){const x=move(improver,incumbent,rng);if(x&&!tried.has(key(x.candidate)))m=x;}
    if(!m)break;tried.add(key(m.candidate));
    const cand=await scores(pool,m.candidate,dev,problem.world);used++;
    const gain=mean(cand)-mean(incDev),wins=cand.filter((x,i)=>x>incDev[i]).length;let ok=false,confirmGain=null;
    if(gain>0&&wins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6);
      const [a,b]=await Promise.all([scores(pool,m.candidate,fresh,problem.world),scores(pool,incumbent,fresh,problem.world)]);used+=2;
      confirmGain=mean(a)-mean(b);ok=confirmGain>0&&a.filter((x,i)=>x>b[i]).length>=4;
    }
    record.push({op:m.op,maskOrder:m.mask===null?null:order(m.mask),gain,confirmGain,accepted:ok});
    if(ok){accepted.push({op:m.op,from:incumbent,to:m.candidate,confirmGain});incumbent=m.candidate;incDev=cand;}
  }
  return {problem:problem.name,start,final:incumbent,accepted,record,used};
}
// Improver self-revision from its own accumulated record.
// credit 'count' (V2): accepted proposals per try. credit 'gain' (V3): the
// confirmed gain of accepted proposals per try, so rare large wins count more.
export function reviseImprover(imp,records,credit='count'){
  const next=structuredClone(imp);next.version++;
  const stat=k=>{const t={},h={};for(const r of records){const v=k(r);if(v===null)continue;t[v]=(t[v]||0)+1;if(r.accepted)h[v]=(h[v]||0)+(credit==='gain'?10*r.confirmGain:1);}return {t,h};};
  const o=stat(r=>r.op);for(const op of OPS)next.ops[op]=.2+((o.h[op]||0)+.5)/((o.t[op]||0)+1);
  const d=stat(r=>r.maskOrder);for(const k of [1,2,3,4])next.orders[k]=.2+((d.h[k]||0)+.5)/((d.t[k]||0)+1);
  return next;
}
const finalScore=async(pool,p,problem)=>mean(await scores(pool,p,makeHistories((problem.bankSeed^0x2545f491)>>>0,8),problem.world));

const out=process.argv[2],credit=process.argv[3]??'count',testBank=Number(process.argv[4]??960000),testSign=Number(process.argv[5]??1),seeds=Array.from({length:Number(process.argv[6]??2)},(_,i)=>i+1),pool=new Pool(6),t0=performance.now(),log=[],say=x=>{log.push(x);console.log(JSON.stringify(x));};
const prob=(name,bankSeed,mask,sign)=>({name,bankSeed,rule:{mask,sign},world:{phaseDurations:SHORT,valenceRule:{mask,sign}}});
const train=[prob('train-m1',950001,1,1),prob('train-m3',950002,3,-1),prob('train-m2',950003,2,-1),prob('train-m5',950004,5,1)];
const test=[[4,1],[8,-1],[6,1],[9,-1],[10,1],[12,-1]].map(([m,sg],i)=>prob('test-m'+m,testBank+i+1,m,sg*testSign));
const IDENTITY={masks:[...Array(16).keys()],step:4,replays:1};
let improver=uniformImprover(),incumbent=structuredClone(IDENTITY);const improvers=[improver],records=[],trainRuns=[];
for(const [i,problem] of train.entries()){
  const run=await search(pool,{problem,start:incumbent,improver,budget:20,seed:problem.bankSeed});trainRuns.push(run);records.push(...run.record);
  say({phase:'train',problem:problem.name,improverVersion:improver.version,accepted:run.accepted.map(a=>({op:a.op,to:a.to,confirmGain:a.confirmGain})),final:run.final});
  incumbent=run.final;
  if(i%2===1){improver=reviseImprover(improver,records,credit);improvers.push(improver);say({phase:'revise',improver});}
}
const starts={copy:incumbent,identity:IDENTITY},results=[];
for(const problem of test){
  const base={copy:await finalScore(pool,starts.copy,problem),identity:await finalScore(pool,starts.identity,problem)};
  for(const s of seeds)for(const [startName,start] of Object.entries(starts))for(const imp of improvers){
    const run=await search(pool,{problem,start,improver:imp,budget:12,seed:problem.bankSeed*7+s});
    const row={phase:'test',problem:problem.name,searchSeed:s,start:startName,improverVersion:imp.version,final:run.final,accepted:run.accepted.length,finalScore:await finalScore(pool,run.final,problem),startScore:base[startName]};
    results.push(row);say(row);
  }
}
const summary={};
for(const startName of Object.keys(starts)){summary[startName]={noSearch:mean(results.filter(r=>r.start===startName&&r.improverVersion===0).map(r=>r.startScore))};
  for(const imp of improvers){const rows=results.filter(r=>r.start===startName&&r.improverVersion===imp.version);summary[startName]['v'+imp.version]=mean(rows.map(r=>r.finalScore));}}
summary.credit=credit;summary.testBank=testBank;summary.testSign=testSign;
const paired=(a,b)=>{const A=results.filter(r=>r.improverVersion===a),B=results.filter(r=>r.improverVersion===b);let w=0,l=0;for(const x of A){const y=B.find(z=>z.problem===x.problem&&z.searchSeed===x.searchSeed&&z.start===x.start);if(x.finalScore>y.finalScore+1e-12)w++;else if(x.finalScore<y.finalScore-1e-12)l++;}return {wins:w,losses:l,ties:A.length-w-l};};
summary.paired={v1_vs_v0:paired(1,0),v2_vs_v0:paired(2,0),v2_vs_v1:paired(2,1)};summary.seconds=(performance.now()-t0)/1000;
say({phase:'summary',summary});
writeFileSync(out,JSON.stringify({schema:1,kind:'rsi-compose',train,test,improvers,trainRuns,results,summary,log},null,2)+'\n');
pool.close();
