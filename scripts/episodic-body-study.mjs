import {World,OUTPUTS} from '../engine.mjs';
import {episodicBodyParameters} from '../learning/episodic-actor.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
const prior=JSON.parse(await readFile('runs/autonomy/state.json','utf8'));
const id=randomUUID(),directory=`evidence/episodic-body/${id}`,offset=parseInt(id.slice(0,8),16)>>>0;
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','scripts/episodic-body-study.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const profiles={neural:{controller:'trace-actor',learning:true},neuralFrozen:{controller:'trace-actor',learning:false},episodic:{controller:'episodic-actor',learning:true},episodicFrozen:{controller:'episodic-actor',learning:false},noCorrection:{controller:'episodic-actor',learning:true,episodicParameters:{turnGain:0}},fifo:{controller:'episodic-actor',learning:true,episodicParameters:{replacement:'fifo'}}};
const protocol={id,at:new Date().toISOString(),sourceSha256,actorParameters:prior.parameters,episodicParameters:episodicBodyParameters(),seeds:Array.from({length:10},(_,i)=>((offset+i*7919)>>>0)||1),environment:{nutrient:.4,ecology:'baseline',challenges:'off',seasonal:false},horizonTicks:1800,founders:24,reproduction:false,mutation:false,profiles,primary:'Episodic learning minus disabled-from-birth net energy per founder; mean ending population must not decrease.',secondary:'Compare with the neural controller, zero steering correction with memory still active, and FIFO retention.',interpretation:'Development transfer test of bounded episodic steering in the actual ecological engine. Stored features, actual correction actions and subsequent discounted rewards drive decisions. Memory storage and lookup incur explicit engineered energy charges. This is a new embodied algorithm, not evidence that the discrete task results transfer automatically or that RSI is achieved.'};
await mkdir(directory,{recursive:true});await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
const rows=[],started=performance.now();
for(const seed of protocol.seeds){
 const arms={};let founderHash;
 for(const[name,profile]of Object.entries(profiles)){
  const world=new World({seed,founders:protocol.founders,capacity:240,actorParameters:protocol.actorParameters,reproduction:false,mutation:false,...protocol.environment,...profile});
  const hash=createHash('sha256').update(JSON.stringify(world.flies.map(({brain,...fly})=>fly))).digest('hex');if(founderHash&&founderHash!==hash)throw Error('Unmatched founders');founderHash=hash;
  const initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),founders=[...world.flies],actions=Array(OUTPUTS.length).fill(0);let agentTicks=0,feedingTicks=0,decisions=0;const deaths=[];
  for(let tick=0;tick<protocol.horizonTicks;tick++){
   const before=[...world.flies];if(!world.step())break;
   for(const fly of before){agentTicks++;if(fly.lastFood>0)feedingTicks++;fly.lastActions.forEach((value,index)=>{actions[index]+=value;});if(fly.brain.episodic&&(fly.brain.episodic.steps-1)%world.config.episodicParameters.decisionTicks===0)decisions++;if(!world.flies.includes(fly))deaths.push({tick:world.tick,id:fly.id,energy:fly.energy,inputs:fly.lastInputs,actions:fly.lastActions,memorySeen:fly.brain.episodic?.memory.seen??0});}
  }
  const metrics=world.metrics();if(Math.abs(metrics.accountingError)>1e-6)throw Error('Energy accounting failed');
  arms[name]={model:world.modelId(),ticks:world.tick,population:world.flies.length,netEnergyPerFounder:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/protocol.founders,foodEaten:world.totals.foodEaten,energySpent:world.totals.dissipated,accountingResidual:metrics.accountingError,agentTicks,feedingFraction:feedingTicks/Math.max(1,agentTicks),meanActions:actions.map(sum=>sum/Math.max(1,agentTicks)),decisions,storedExperiences:founders.reduce((sum,fly)=>sum+(fly.brain.episodic?.memory.records.length??0),0),experiencesSeen:founders.reduce((sum,fly)=>sum+(fly.brain.episodic?.memory.seen??0),0),deaths};
 }
 rows.push({seed,founderHash,arms});await writeFile(`${directory}/progress.json`,JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({seed,arms:Object.fromEntries(Object.entries(arms).map(([name,arm])=>[name,{population:arm.population,energy:arm.netEnergyPerFounder}]))}));
}
const comparisons={learning:'episodicFrozen',neural:'neural',correction:'noCorrection',retention:'fifo'};
const summary=Object.fromEntries(Object.entries(comparisons).map(([name,control])=>[name,{energy:interval95(rows.map(row=>row.arms.episodic.netEnergyPerFounder-row.arms[control].netEnergyPerFounder)),population:interval95(rows.map(row=>row.arms.episodic.population-row.arms[control].population))}]));
const passed=summary.learning.energy.ci95[0]>0&&summary.learning.population.mean>=0;
await writeFile(`${directory}/results.json`,JSON.stringify({protocol,rows,summary,passed,wallSeconds:(performance.now()-started)/1000},null,2)+'\n');console.log(JSON.stringify({directory,passed,summary},null,2));
