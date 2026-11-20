// Bounded self-improving search over taste-learning programs.
// Level 0: the fly's taste learner (program = code/step/replays/memory/prior).
// Level 1: a proposer (which dimension to mutate, which value to try).
// The loop accepts a level-0 revision only if it beats the incumbent on the
// dev histories AND on fresh confirmation histories (paired). After each
// search the proposer rewrites its own distribution from its own record.
// Test (b): on held-out problems, revised proposer vs fixed proposer vs fixed
// proposer started from the copied best program, same budget and histories.
import {writeFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';

export const SPACE={code:['pairwise','identity'],step:[.125,.25,.5,1,2,4],replays:[0,1,2,4],memory:[8,32,128],prior:[0,Math.log(3),Math.log(9)]};
export const DEFAULT={code:'pairwise',step:.5,replays:1,memory:32,prior:Math.log(3)};
const DIMS=Object.keys(SPACE),key=p=>JSON.stringify(DIMS.map(d=>p[d]));
export const uniformProposer=()=>({version:0,dimWeights:Object.fromEntries(DIMS.map(d=>[d,1])),valueWeights:Object.fromEntries(DIMS.map(d=>[d,SPACE[d].map(()=>1)]))});
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;

function pick(weights,rng){const total=weights.reduce((a,b)=>a+b,0);let u=rng()*total;for(let i=0;i<weights.length;i++){u-=weights[i];if(u<=0)return i;}return weights.length-1;}
function propose(proposer,incumbent,rng,tried){
  for(let attempt=0;attempt<50;attempt++){
    const d=DIMS[pick(DIMS.map(x=>proposer.dimWeights[x]),rng)],vals=SPACE[d];
    const w=vals.map((v,i)=>v===incumbent[d]?0:proposer.valueWeights[d][i]);if(w.every(x=>x===0))continue;
    const candidate={...incumbent,[d]:vals[pick(w,rng)]};if(!tried.has(key(candidate)))return {candidate,dim:d};
  }
  return null;
}
async function scores(pool,program,histories,world){return (await Promise.all(histories.map(h=>pool.run(program,h,world)))).map(r=>r.score);}

export async function search(pool,{problem,start,proposer,budget,seed}){
  let r=seed>>>0||1;const rng=()=>(r=advanceRng(r))/4294967296;
  const dev=makeHistories(problem.bankSeed,6);let confirmSeed=problem.bankSeed^0x5bd1e995;
  let incumbent={...start},incDev=await scores(pool,incumbent,dev,problem.world),used=1;
  const record=[],tried=new Set([key(incumbent)]),accepted=[];
  while(used<budget){
    const p=propose(proposer,incumbent,rng,tried);if(!p)break;tried.add(key(p.candidate));
    const candDev=await scores(pool,p.candidate,dev,problem.world);used++;
    const devGain=mean(candDev)-mean(incDev),devWins=candDev.filter((x,i)=>x>incDev[i]).length;
    let ok=false,confirmGain=null;
    if(devGain>0&&devWins>=4&&used+2<=budget){
      confirmSeed=advanceRng(confirmSeed);const fresh=makeHistories(confirmSeed,6);
      const [a,b]=await Promise.all([scores(pool,p.candidate,fresh,problem.world),scores(pool,incumbent,fresh,problem.world)]);used+=2;
      confirmGain=mean(a)-mean(b);ok=confirmGain>0&&a.filter((x,i)=>x>b[i]).length>=4;
    }
    record.push({dim:p.dim,value:p.candidate[p.dim],devGain,devWins,confirmGain,accepted:ok});
    if(ok){accepted.push({from:incumbent,to:p.candidate,dim:p.dim,devGain,confirmGain});incumbent=p.candidate;incDev=candDev;}
  }
  return {problem:problem.name,start,final:incumbent,accepted,record,used};
}
// Proposer self-revision from its own search record: shift mutation mass to
// dimensions whose proposals were accepted, and value mass to accepted values.
export function reviseProposer(proposer,records){
  const next=structuredClone(proposer);next.version++;
  const hits=Object.fromEntries(DIMS.map(d=>[d,0])),tries=Object.fromEntries(DIMS.map(d=>[d,0]));
  for(const r of records){tries[r.dim]++;if(r.accepted){hits[r.dim]++;const i=SPACE[r.dim].indexOf(r.value);next.valueWeights[r.dim][i]+=1;}}
  for(const d of DIMS)next.dimWeights[d]=.25+(hits[d]+.5)/(tries[d]+1);
  return next;
}
export async function finalScore(pool,program,problem){return mean(await scores(pool,program,makeHistories(problem.bankSeed^0x2545f491,8),problem.world));}

if(process.argv[1]&&process.argv[1].endsWith('rsi-search.mjs')){
  const out=process.argv[2],pool=new Pool(6),log=[],t0=performance.now();
  const say=x=>{log.push(x);console.log(JSON.stringify(x));};
  const train=[{name:'normal-train',bankSeed:910001,world:{}},{name:'short-train',bankSeed:910002,world:{phaseDurations:[160,160,160,64]}}];
  const test=[{name:'normal-test',bankSeed:920001,world:{}},{name:'short-test',bankSeed:920002,world:{phaseDurations:[160,160,160,64]}},{name:'adjacent-test',bankSeed:920003,world:{cueCurriculum:'adjacent-opposed'}}];
  // Training: successive searches, the proposer revising itself after each.
  let proposer=uniformProposer(),incumbent={...DEFAULT};const proposers=[proposer],trainRuns=[];
  for(const problem of train){
    const run=await search(pool,{problem,start:incumbent,proposer,budget:16,seed:problem.bankSeed});trainRuns.push(run);
    say({phase:'train',problem:problem.name,proposerVersion:proposer.version,accepted:run.accepted.map(a=>({dim:a.dim,to:a.to[a.dim],confirmGain:a.confirmGain})),final:run.final,used:run.used});
    incumbent=run.final;proposer=reviseProposer(proposer,trainRuns.flatMap(r=>r.record));proposers.push(proposer);
    say({phase:'revise',proposer});
  }
  // Test (b): matched budget on held-out problems and search seeds.
  const arms={fixed:{proposer:proposers[0],start:DEFAULT},revised:{proposer,start:DEFAULT},copy:{proposer:proposers[0],start:incumbent},revisedCopy:{proposer,start:incumbent}};
  const results=[];
  for(const problem of test)for(const s of [1,2,3]){
    const startScore={default:await finalScore(pool,DEFAULT,problem),copy:await finalScore(pool,incumbent,problem)};
    for(const [arm,cfg] of Object.entries(arms)){
      const run=await search(pool,{problem,start:cfg.start,proposer:cfg.proposer,budget:8,seed:problem.bankSeed*31+s});
      const row={phase:'test',problem:problem.name,searchSeed:s,arm,final:run.final,accepted:run.accepted.length,finalScore:await finalScore(pool,run.final,problem),startScore};
      results.push(row);say(row);
    }
  }
  const summary={};for(const arm of Object.keys(arms))summary[arm]=mean(results.filter(r=>r.arm===arm).map(r=>r.finalScore));
  say({phase:'summary',meanFinalScore:summary,seconds:(performance.now()-t0)/1000});
  writeFileSync(out,JSON.stringify({schema:1,kind:'rsi-search',space:SPACE,default:DEFAULT,train,test,proposers,trainRuns,results,summary,log},null,2)+'\n');
  pool.close();
}
