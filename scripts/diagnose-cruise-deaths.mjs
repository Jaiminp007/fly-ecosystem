import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
const referenceDirectory=resolve(process.argv[2]||''),count=Number(process.argv[3]||10),r=JSON.parse(await readFile(join(referenceDirectory,'results.json'))),recorded=JSON.parse(await readFile(join(referenceDirectory,'heldout.json'))),p=r.protocol;
if(!Number.isInteger(count)||count<2||count>recorded.length)throw Error('Invalid replay count');
const directory=join(referenceDirectory,'death-credit-diagnosis'),files=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/diagnose-cruise-deaths.mjs'],sourceSha256={};await mkdir(directory,{recursive:true});
for(const name of files){const bytes=await readFile(name);sourceSha256[name]=createHash('sha256').update(bytes).digest('hex');const dest=join(directory,'sources',name);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);}
const protocol={at:new Date().toISOString(),referenceDirectory,sourceSha256,seeds:recorded.slice(0,count).map(row=>row.seed),scope:'Exact same-seed replay of terminal outcomes and value updates. Founder matching is across interacting worlds, not isolated individual causal attribution. Death-credit values describe actual targets; they do not establish a causal explanation of survival differences.'};await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');
const rows=[];
for(const row of recorded.slice(0,count)){
 const arms={};
 for(const name of ['learned','observedWindow','noMemory']){
  const parameters={...p.parameters,...(name==='observedWindow'?{returnMode:'mean'}:{}),...(name==='noMemory'?{memoryLearning:false}:{})},world=new World({seed:row.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...p.environment}),founders=[...world.flies],initial=founders.reduce((s,f)=>s+f.energy,0),deaths=[];
  for(let tick=0;tick<p.horizonTicks;tick++){
   const before=new Map(world.flies.map(f=>[f.id,{fly:f,energy:f.energy,decision:structuredClone(f.brain.episodic.lastDecision)}]));if(!world.step())break;const alive=new Set(world.flies.map(f=>f.id));
   for(const[id,b]of before)if(!alive.has(id)){const f=b.fly,state=f.brain.episodic;deaths.push({id,tick:world.tick,preEnergy:b.energy,postEnergy:f.energy,actualReward:f.reward,actualCost:f.lastEnergyCost,lastFoodClipped:f.lastFood,choice:state.choice,lastDecision:b.decision?{step:b.decision.step,negative:b.decision.retrieval.negative.estimate,positive:b.decision.retrieval.positive.estimate}:null,terminalUpdate:state.lastUpdate?.target.terminal?structuredClone(state.lastUpdate):null});}
  }
  const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((s,f)=>s+f.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated};if(!isDeepStrictEqual(actual,Object.fromEntries(Object.keys(actual).map(k=>[k,row.arms[name][k]]))))throw Error('Death replay mismatch');arms[name]={...actual,deaths,exactReplay:true};
 }
 rows.push({seed:row.seed,arms});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({completed:rows.length,total:count}));
}
const terminal=rows.flatMap(r=>r.arms.learned.deaths).filter(d=>d.terminalUpdate),summary={deathsByArm:Object.fromEntries(['learned','observedWindow','noMemory'].map(name=>[name,rows.reduce((s,r)=>s+r.arms[name].deaths.length,0)])),terminalTargets:terminal.map(d=>({tick:d.tick,reward:d.actualReward,value:d.terminalUpdate.value,observed:d.terminalUpdate.target.observed,estimatedFuture:d.terminalUpdate.target.estimatedFuture})),populationDifference:interval95(rows.map(r=>r.arms.learned.population-r.arms.noMemory.population))};
for(const name of files)if(createHash('sha256').update(await readFile(name)).digest('hex')!==sourceSha256[name])throw Error('Sources changed during death replay');await writeFile(join(directory,'results.json'),JSON.stringify({protocol,rows,summary,completedAt:new Date().toISOString()},null,2)+'\n');console.log(JSON.stringify({directory,summary},null,2));
