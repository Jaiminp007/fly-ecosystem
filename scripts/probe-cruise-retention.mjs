import {World} from '../engine.mjs';
import {createEpisodicMemory} from '../learning/episodic.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';

const referencePath=resolve(process.argv[2]||''),directory=resolve(process.argv[3]||`evidence/episodic-retention/${randomUUID()}`),count=Number(process.argv[4]||20);
const referenceBytes=await readFile(referencePath),reference=JSON.parse(referenceBytes),p=reference.protocol,parameters=reference.locked?.parameters||p.parameters;
if(!parameters||!Number.isInteger(count)||count<2)throw Error('Provide policy results and a seed count >=2');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const sourceSha256={},files=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/probe-cruise-retention.mjs'];
for(const name of files){const bytes=await readFile(name);sourceSha256[name]=createHash('sha256').update(bytes).digest('hex');const dest=join(directory,'sources',name);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);}
const seedRng=randomUUID(),offset=parseInt(seedRng.slice(0,8),16)>>>0,seeds=Array.from({length:count},(_,i)=>((offset+i*7919)>>>0)||1);
let seedSource=null;
if(process.argv[5]){
 const path=resolve(process.argv[5]),bytes=await readFile(path),saved=JSON.parse(bytes),source=saved.protocol||saved;
 if(!Array.isArray(source.seeds)||source.seeds.length!==count||new Set(source.seeds).size!==count||source.seeds.some(s=>!Number.isInteger(s)||s<1||s>0xffffffff)||source.trainingATicks!==600||source.trainingBTicks!==1200||source.probeTicks!==600||source.probeEnergy!==60||source.founders!==24)throw Error('Seed-source probe protocol does not match this paired design');
 seeds.splice(0,seeds.length,...source.seeds);seedSource={path,sha256:createHash('sha256').update(bytes).digest('hex'),scope:'Previously sampled probe seeds reused for paired comparison, not a fresh independent qualification'};
 await writeFile(join(directory,'seed-source.json'),bytes);
}
const protocol={at:new Date().toISOString(),referencePath,referenceSha256:createHash('sha256').update(referenceBytes).digest('hex'),parameters,sourceSha256,seeds,founders:24,trainingATicks:600,trainingBTicks:1200,probeTicks:600,probeEnergy:60,environment:{nutrient:.4,seasonal:false,challenges:'off'},interpretation:'Exploratory same-body memory intervention. Train A then B continuously with no acquired-state reset, reproduction or mutation. Only survivors are probed. Each survivor uses its unchanged end-B body, position, neural weights and activity in all matched branches; energy is standardized to 60 and a saved food landscape is restored. Freeze all acquisition during probes. Compare end-B memory, its own saved A memory, and empty memory; synchronize exploration RNG to end B. A/B are resource landscapes, not guaranteed distinct skills. These probes isolate useful retained memory in surviving bodies, not an unbiased survival benefit or broad continual learning. No policy selection or difficulty promotion uses this diagnostic.'};
if(seedSource)protocol.seedSource=seedSource;
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'reference.json'),referenceBytes);
const rows=[];
for(const seed of seeds){
 const world=new World({seed,founders:protocol.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...protocol.environment,ecology:'baseline'});
 world.advance(protocol.trainingATicks);
 const memories=new Map(world.flies.map(f=>[f.id,structuredClone(f.brain.episodic.memory)])),landscapes={a:{food:structuredClone(world.food),centers:structuredClone(world.resourceCenters)}};
 world.config.ecology='relocation';world.nextRelocationTick=world.tick+1;world.record('retention-phase','Continuous B training: resource relocation');world.advance(protocol.trainingBTicks);
 landscapes.b={food:structuredClone(world.food),centers:structuredClone(world.resourceCenters)};
 const checkpoint=world.checkpoint(),probes={};
 for(const landscape of ['a','b']){
  probes[landscape]={};
  for(const mode of ['afterB','atA','empty']){
   const probe=World.restore(checkpoint),beforeIntervention=probe.energy();probe.config.learning=false;probe.config.ecology='baseline';probe.nextRelocationTick=null;probe.food=structuredClone(landscapes[landscape].food);probe.resourceCenters=structuredClone(landscapes[landscape].centers);
   for(const f of probe.flies){const state=f.brain.episodic,current=state.memory;if(!memories.has(f.id))throw Error('Probe body was not alive during A');if(mode==='atA')state.memory=structuredClone(memories.get(f.id));else if(mode==='empty')state.memory=createEpisodicMemory(current.config,current.rngState);state.memory.rngState=current.rngState;state.memory.retentionRngState=current.retentionRngState;state.pending=[];delete state.lastDecision;delete state.lastUpdate;f.energy=protocol.probeEnergy;}
   const interventionEnergy=probe.energy()-beforeIntervention;probe.totals.externalEnergy+=interventionEnergy;if(probe.totals.externalEnergy<0)throw Error('Intervention would invalidate energy ledger');
   // Validate the actual interventions through the checkpoint contract.
   const checked=World.restore(probe.checkpoint()),initial=checked.flies.reduce((s,f)=>s+f.energy,0),founderHash=createHash('sha256').update(JSON.stringify(checked.flies.map(({brain,...f})=>f))).digest('hex');checked.advance(protocol.probeTicks);
   if(Math.abs(checked.metrics().accountingError)>1e-6)throw Error('Probe accounting failed');
   probes[landscape][mode]={population:checked.flies.length,energy:(checked.flies.reduce((s,f)=>s+f.energy,0)-initial)/Math.max(1,world.flies.length),food:checked.totals.foodEaten-world.totals.foodEaten,founderHash,interventionEnergy,accountingResidual:checked.metrics().accountingError};
  }
  if(new Set(Object.values(probes[landscape]).map(r=>r.founderHash)).size!==1)throw Error('Unmatched probe bodies');
 }
 rows.push({seed,survivorsAfterB:world.flies.length,probes});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({directory,completed:rows.length,total:count}));
}
const summary=Object.fromEntries(['a','b'].map(landscape=>[landscape,Object.fromEntries([['afterB','empty'],['afterB','atA'],['atA','empty']].map(([a,b])=>[a+'Minus'+b,Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(r=>r.probes[landscape][a][key]-r.probes[landscape][b][key]))]))]))]));
for(const name of files)if(createHash('sha256').update(await readFile(name)).digest('hex')!==sourceSha256[name])throw Error('Probe sources changed');
const result={protocol,rows,summary,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,summary},null,2));
