import {World} from '../engine.mjs';
import {evaluateContext,CONTEXT_PROTOCOL} from '../learning/context-tasks.mjs';
import {episodicBodyParameters} from '../learning/episodic-actor.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const referencePath=process.argv[2];if(!referencePath)throw Error('Provide development episodic-body results.json');
const reference=JSON.parse(await readFile(referencePath,'utf8'));
const id=randomUUID(),directory=`evidence/episodic-body/${id}`,offset=parseInt(id.slice(0,8),16)>>>0;
const developmentSeeds=reference.protocol.seeds,heldoutSeeds=Array.from({length:30},(_,i)=>((offset+i*7919)>>>0)||1);
if(heldoutSeeds.some(seed=>developmentSeeds.includes(seed)))throw Error('Development/held-out seed overlap');
const files=['engine.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/context-tasks.mjs','learning/tasks.mjs','scripts/episodic-feature-study.mjs'];
await mkdir(directory,{recursive:true});const sourceSha256={};for(const file of files){const bytes=await readFile(file);sourceSha256[file]=createHash('sha256').update(bytes).digest('hex');await mkdir(join(directory,'sources',dirname(file)),{recursive:true});await writeFile(join(directory,'sources',file),bytes);}
const protocol={id,at:new Date().toISOString(),referencePath,developmentSeeds,heldoutSeeds,sourceSha256,actorParameters:reference.protocol.actorParameters,environment:reference.protocol.environment,horizonTicks:1800,founders:24,episodicParameters:episodicBodyParameters(),candidates:['slow','fast','current','mixed'],featureDefinitions:{slow:'Normalized slow sensory traces',fast:'Normalized fast sensory traces',current:'Normalized current observations',mixed:'Normalize 75% current observations + 25% slow traces'},contextTask:CONTEXT_PROTOCOL,selection:'Reject modes whose development memory-subcomponent A/B retention averages fall below .8 or lose more than .05 on A. Prefer modes with no mean population loss versus the frozen body control, then highest net energy. If none satisfy the development population constraint, lock the best memory-capable mode for a clearly labelled exploratory test; final guards remain unchanged.',gates:'Held-out energy lower 95% difference > 0 and no mean population loss versus both learning-disabled body and existing neural controller; memory subcomponent A/B accuracy lower bound >= .8 and A retention change lower bound >= -.05.',interpretation:'Tests representation choices after a failed embodied development study. The memory-subcomponent cue task and the continuous whole-body task are distinct evaluations. Held-out seeds are reserved until representation selection is locked. No live habitat is modified.'};
await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
function run(seed,controller,learning,episodicParameters){
 const world=new World({seed,founders:protocol.founders,capacity:240,controller,learning,actorParameters:protocol.actorParameters,mutation:false,reproduction:false,...protocol.environment,...(controller==='episodic-actor'?{episodicParameters}:{})});
 const founderHash=createHash('sha256').update(JSON.stringify(world.flies.map(({brain,...fly})=>fly))).digest('hex'),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),started=performance.now();world.advance(protocol.horizonTicks);
 const metrics=world.metrics();if(Math.abs(metrics.accountingError)>1e-6)throw Error('Energy accounting failed');
 return{seed,founderHash,ticks:world.tick,model:world.modelId(),population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/protocol.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated,residual:metrics.accountingError,wallSeconds:(performance.now()-started)/1000};
}
const mean=(rows,key)=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length,development=[],started=performance.now();
const frozen=developmentSeeds.map(seed=>run(seed,'episodic-actor',false,protocol.episodicParameters));
for(const featureMode of protocol.candidates){
 const parameters={...protocol.episodicParameters,featureMode},rows=developmentSeeds.map(seed=>run(seed,'episodic-actor',true,parameters)),memory=evaluateContext(developmentSeeds.slice(0,4),protocol.actorParameters,undefined,{capacity:parameters.capacity,featureMode});
 const s=memory.summary,memoryEligible=s.aAfterB.mean>=.8&&s.bAfterB.mean>=.8&&s.aRetentionChange.mean>=-.05,populationEligible=mean(rows,'population')>=mean(frozen,'population');
 const entry={featureMode,parameters,rows,memory,memoryEligible,populationEligible,energy:mean(rows,'energy')};development.push(entry);await writeFile(`${directory}/development-${featureMode}.json`,JSON.stringify(entry,null,2)+'\n');console.log(JSON.stringify({phase:'development',featureMode,memoryEligible,populationEligible,energy:entry.energy,population:mean(rows,'population')}));
}
const capable=development.filter(row=>row.memoryEligible);if(!capable.length)throw Error('No feature mode retained the required memory capability');
const safe=capable.filter(row=>row.populationEligible),selected=[...(safe.length?safe:capable)].sort((a,b)=>b.energy-a.energy)[0];
await writeFile(`${directory}/locked-selection.json`,JSON.stringify({featureMode:selected.featureMode,parameters:selected.parameters,developmentPopulationConstraintMet:Boolean(safe.length)},null,2)+'\n');
const profiles={episodic:{controller:'episodic-actor',learning:true,parameters:selected.parameters},frozen:{controller:'episodic-actor',learning:false,parameters:selected.parameters},neural:{controller:'trace-actor',learning:true},neuralFrozen:{controller:'trace-actor',learning:false},noCorrection:{controller:'episodic-actor',learning:true,parameters:{...selected.parameters,turnGain:0}},fifo:{controller:'episodic-actor',learning:true,parameters:{...selected.parameters,replacement:'fifo'}}};
const rows=[];for(const seed of heldoutSeeds){const arms={};let hash;for(const[name,profile]of Object.entries(profiles)){arms[name]=run(seed,profile.controller,profile.learning,profile.parameters);if(hash&&arms[name].founderHash!==hash)throw Error('Unmatched founders');hash=arms[name].founderHash;}rows.push({seed,arms});await writeFile(`${directory}/progress.json`,JSON.stringify({protocol,selected:selected.featureMode,rows},null,2)+'\n');console.log(JSON.stringify({phase:'heldout',seed,completed:rows.length,total:heldoutSeeds.length}));}
const memory=evaluateContext(heldoutSeeds,protocol.actorParameters,undefined,{capacity:selected.parameters.capacity,featureMode:selected.featureMode});
const comparisons=Object.fromEntries(['frozen','neural','neuralFrozen','noCorrection','fifo'].map(control=>[control,{energy:interval95(rows.map(row=>row.arms.episodic.energy-row.arms[control].energy)),population:interval95(rows.map(row=>row.arms.episodic.population-row.arms[control].population))}]));
const memoryPassed=memory.summary.aAfterB.ci95[0]>=.8&&memory.summary.bAfterB.ci95[0]>=.8&&memory.summary.aRetentionChange.ci95[0]>=-.05;
const passed=memoryPassed&&['frozen','neural'].every(control=>comparisons[control].energy.ci95[0]>0&&comparisons[control].population.mean>=0);
const report={protocol,selected:{featureMode:selected.featureMode,parameters:selected.parameters,developmentPopulationConstraintMet:Boolean(safe.length)},development:development.map(({featureMode,memoryEligible,populationEligible,energy})=>({featureMode,memoryEligible,populationEligible,energy})),rows,memory,comparisons,memoryPassed,passed,wallSeconds:(performance.now()-started)/1000};
await writeFile(`${directory}/results.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,selected:report.selected,memoryPassed,passed,comparisons},null,2));
