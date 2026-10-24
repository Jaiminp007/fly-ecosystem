import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';

const campaign=JSON.parse(await readFile('runs/autonomy/ecology/state.json','utf8'));
if(campaign.status==='running')throw Error('Lock the policy after the bounded ecological search finishes');
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','scripts/confirm-ecology.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
for(const file of ['engine.mjs','learning/trace-actor.mjs'])if(campaign.sourceSha256[file]!==sourceSha256[file])throw Error('Ecology policy source does not match this runtime');
const id=randomUUID(),directory=`evidence/ecology-confirmation/${id}`,firstSeed=parseInt(id.slice(0,8),16)>>>0;
const protocol={id,at:new Date().toISOString(),parentCampaign:campaign.id,sourceSha256,parameters:campaign.parameters,seeds:Array.from({length:100},(_,i)=>((firstSeed+i*7919)>>>0)||1),environment:{nutrient:.4,ecology:'baseline'},horizonTicks:1800,founders:24,reproduction:false,mutation:false,challenges:'off',seasonal:false,primary:'Learning enabled minus disabled from birth: net energy per initial founder over a fixed 180-second interval.',gate:'The lower seed-paired 95% interval must be above zero, with no mean ending-population loss.',interpretation:'One independent locked-policy confirmation in the scarcity environment. Parameters and sample count are fixed before evaluation. This does not validate other environments, continuous skill retention, or RSI.'};
await mkdir(directory,{recursive:true});await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
const started=performance.now(),rows=[];
for(const seed of protocol.seeds){
 const arms={};let founderHash;
 for(const learning of [true,false]){
  const world=new World({seed,founders:protocol.founders,capacity:240,controller:'trace-actor',actorParameters:protocol.parameters,learning,mutation:false,reproduction:false,challenges:'off',seasonal:false,...protocol.environment});
  const hash=createHash('sha256').update(JSON.stringify(world.flies)).digest('hex');if(founderHash&&founderHash!==hash)throw Error('Unmatched founders');founderHash=hash;
  const initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0);world.advance(protocol.horizonTicks);
  arms[learning?'learned':'frozen']={ticks:world.tick,population:world.flies.length,netEnergyPerFounder:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/protocol.founders,foodEaten:world.totals.foodEaten,energySpent:world.totals.dissipated,accountingResidual:world.metrics().accountingError};
 }
 rows.push({seed,founderHash,arms});
 await writeFile(`${directory}/progress.json`,JSON.stringify({protocol,rows},null,2)+'\n');
 console.log(JSON.stringify(rows.at(-1)));
}
const summary={learningGain:interval95(rows.map(row=>row.arms.learned.netEnergyPerFounder-row.arms.frozen.netEnergyPerFounder)),populationDifference:interval95(rows.map(row=>row.arms.learned.population-row.arms.frozen.population))};
const passed=summary.learningGain.ci95[0]>0&&summary.populationDifference.mean>=0,report={protocol,rows,summary,passed,wallSeconds:(performance.now()-started)/1000};
await writeFile(`${directory}/results.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,passed,summary},null,2));
await writeFile('runs/autonomy/ecology-confirmation.json',JSON.stringify({id,parentCampaign:campaign.id,parameters:protocol.parameters,at:protocol.at,summary,passed,evidenceDirectory:directory},null,2)+'\n');
