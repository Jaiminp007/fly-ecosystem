import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const parameters=JSON.parse(await readFile('runs/autonomy/state.json','utf8')).parameters;
const protocol={seeds:Array.from({length:10},(_,i)=>6001+i*113),horizonTicks:1800,founders:24,reproduction:false,mutation:false,challenges:'off',seasonal:false,primary:'Net energy gained per initial agent over a fixed 180-second life interval; food intake alone may reward wasteful expenditure',parameters,interpretation:'Matched trace-actor learning versus disabled from birth. Task-training gains do not imply a benefit in the ecological habitat.'};
const rows=[],start=performance.now();
const environments=[{id:'abundant',nutrient:3,ecology:'baseline'},{id:'scarce',nutrient:.4,ecology:'baseline'},{id:'scarce-relocation',nutrient:.4,ecology:'relocation'}];protocol.environments=environments;
for(const environment of environments)for(const seed of protocol.seeds){
 const arms={};let founderHash;
 for(const learning of [true,false]){
   const world=new World({seed,founders:protocol.founders,capacity:240,controller:'trace-actor',actorParameters:parameters,learning,mutation:false,reproduction:false,challenges:'off',seasonal:false,nutrient:environment.nutrient,ecology:environment.ecology});
   const hash=createHash('sha256').update(JSON.stringify(world.flies)).digest('hex');if(founderHash&&founderHash!==hash)throw Error('Unmatched founders');founderHash=hash;
   const initialAgentEnergy=world.flies.reduce((sum,fly)=>sum+fly.energy,0);world.advance(protocol.horizonTicks);arms[learning?'learned':'frozen']={ticks:world.tick,population:world.flies.length,foodPerFounder:world.totals.foodEaten/protocol.founders,foodEaten:world.totals.foodEaten,energySpent:world.totals.dissipated,netEnergyPerFounder:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initialAgentEnergy)/protocol.founders,feedingEfficiency:world.totals.foodEaten/Math.max(1e-9,world.totals.dissipated),deaths:world.totals.deaths,accountingResidual:world.metrics().accountingError,meanEnergy:world.metrics().meanEnergy};
 }
 rows.push({seed,environment:environment.id,founderHash,arms});console.log(JSON.stringify(rows.at(-1)));
}
const summary=Object.fromEntries(environments.map(environment=>{const selected=rows.filter(row=>row.environment===environment.id);return[environment.id,Object.fromEntries(['netEnergyPerFounder','foodPerFounder','feedingEfficiency','population'].map(key=>[key+'Difference',interval95(selected.map(row=>row.arms.learned[key]-row.arms.frozen[key]))]))];}));
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','scripts/actor-world-evaluation.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const report={protocol,sourceSha256,rows,summary,wallSeconds:(performance.now()-start)/1000};
await mkdir('evidence/actor-world',{recursive:true});await writeFile('evidence/actor-world/results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary));
