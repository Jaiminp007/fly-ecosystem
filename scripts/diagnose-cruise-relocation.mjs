import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referenceDirectory=resolve(process.argv[2]||''),count=Number(process.argv[3]||10);
const reference=JSON.parse(await readFile(join(referenceDirectory,'results.json'))),recorded=JSON.parse(await readFile(join(referenceDirectory,'heldout.json'))),p=reference.protocol;
if(p.environment.ecology!=='relocation'||!Number.isInteger(count)||count<2||count>recorded.length)throw Error('Expected completed relocation study and valid replay count');
const directory=join(referenceDirectory,'adaptation-diagnosis'),sources=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/diagnose-cruise-relocation.mjs'],sourceSha256={};
await mkdir(directory,{recursive:true});
for(const name of sources){const bytes=await readFile(name),hash=createHash('sha256').update(bytes).digest('hex');if(p.sourceSha256[name]&&p.sourceSha256[name]!==hash)throw Error('Reference source changed: '+name);sourceSha256[name]=hash;const dest=join(directory,'sources',name);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);}
const protocol={at:new Date().toISOString(),sourceSha256,seeds:recorded.slice(0,count).map(row=>row.seed),referenceDirectory,postShiftWindowTicks:200,scope:'Post-hoc exact replays, not fresh confirmation. Phase is measured since latest resource-renewal relocation. Retrieved-record source decision ticks are derived from monotonic experience IDs and aligned decision windows; no terminal records are read from living agents. Old records are not necessarily wrong: old-neighbor fractions are descriptive, not proof of a failure cause.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');
const profiles={learned:{...p.parameters},observedWindow:{...p.parameters,returnMode:'mean'},noMemory:{...p.parameters,memoryLearning:false}},rows=[];
const bucket=()=>({agentTicks:0,food:0,cost:0,fastTicks:0,deaths:0,decisions:0,recalled:0,preShiftRecalled:0,ageSum:0,bothSupported:0});
for(const row of recorded.slice(0,count)){
 const arms={};
 for(const[name,parameters]of Object.entries(profiles)){
  const world=new World({seed:row.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...p.environment}),initial=world.flies.reduce((s,f)=>s+f.energy,0),phases={beforeShift:bucket(),earlyAfterShift:bucket(),lateAfterShift:bucket()},shifts=[];let shiftTick=null;
  for(let tick=0;tick<p.horizonTicks;tick++){
   const before=[...world.flies],next=world.nextRelocationTick;if(!world.step())break;
   if(world.tick>=next){shiftTick=world.tick;shifts.push(world.tick);}
   const phase=shiftTick===null?'beforeShift':world.tick-shiftTick<protocol.postShiftWindowTicks?'earlyAfterShift':'lateAfterShift',b=phases[phase],alive=new Set(world.flies.map(f=>f.id));
   for(const fly of before){b.agentTicks++;b.food+=fly.lastFood;b.cost+=fly.lastEnergyCost;if(fly.brain.episodic.choice>0)b.fastTicks++;if(!alive.has(fly.id))b.deaths++;
    const d=fly.brain.episodic.lastDecision;if(d.step!==world.tick)continue;b.decisions++;if(d.retrieval.negative.neighbors.length&&d.retrieval.positive.neighbors.length)b.bothSupported++;
    for(const n of [...d.retrieval.negative.neighbors,...d.retrieval.positive.neighbors]){if(n.experience===null)throw Error('Missing experience age');const sourceTick=1+(n.experience-1)*parameters.decisionTicks;b.recalled++;b.ageSum+=world.tick-sourceTick;if(shiftTick!==null&&sourceTick<shiftTick)b.preShiftRecalled++;}
   }
  }
  const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((s,f)=>s+f.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated};
  if(!isDeepStrictEqual(actual,Object.fromEntries(Object.keys(actual).map(k=>[k,row.arms[name][k]]))))throw Error('Replay differs: '+name+' '+row.seed);
  arms[name]={...actual,phases,shifts,exactReplay:true};
 }
 rows.push({seed:row.seed,arms});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({completed:rows.length,total:count,seed:row.seed}));
}
const summary={};
for(const arm of Object.keys(profiles)){summary[arm]={};for(const phase of ['beforeShift','earlyAfterShift','lateAfterShift']){const get=r=>r.arms[arm].phases[phase];summary[arm][phase]=Object.fromEntries(['fastFraction','oldNeighborFraction','meanRecallAgeTicks','foodPerAgentTick','costPerAgentTick','deaths'].map(key=>[key,interval95(rows.map(row=>{const b=get(row);return key==='fastFraction'?b.fastTicks/b.agentTicks:key==='oldNeighborFraction'?b.preShiftRecalled/Math.max(1,b.recalled):key==='meanRecallAgeTicks'?b.ageSum/Math.max(1,b.recalled):key==='foodPerAgentTick'?b.food/b.agentTicks:key==='costPerAgentTick'?b.cost/b.agentTicks:b.deaths;}))]));}}
for(const name of sources)if(createHash('sha256').update(await readFile(name)).digest('hex')!==sourceSha256[name])throw Error('Sources changed during replay');
const result={protocol,rows,summary,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,summary},null,2));
