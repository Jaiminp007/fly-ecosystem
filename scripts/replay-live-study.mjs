import {World,OUTPUTS} from '../engine.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
const recorded=JSON.parse(await readFile('evidence/autonomous-learning/live-habitat.json','utf8'));
const saved=JSON.parse(await readFile('evidence/autonomous-learning/live-extinction-checkpoint.json','utf8'));
function run(learning,capture=false){
 const world=new World({...recorded.config,learning});
 const totals={agentTicks:0,feedingTicks:0,stationaryMovementRequests:0,outputSums:OUTPUTS.map(()=>0),positive:OUTPUTS.map(()=>0),extreme:OUTPUTS.map(()=>0)};
 const history=[],deaths=[];
 for(let tick=0;tick<7200;tick++){
  const before=[...world.flies],positions=new Map(before.map(f=>[f.id,{x:f.x,y:f.y}]));if(!world.step())break;
  for(const fly of before){totals.agentTicks++;if(fly.lastFood>0)totals.feedingTicks++;fly.lastActions.forEach((x,i)=>{totals.outputSums[i]+=x;if(x>0)totals.positive[i]++;if(Math.abs(x)>.98)totals.extreme[i]++;});if(fly.lastActions[1]>0&&Math.hypot(fly.x-positions.get(fly.id).x,fly.y-positions.get(fly.id).y)<1e-9)totals.stationaryMovementRequests++;
   if(capture&&!world.flies.includes(fly)){const event=world.events.find(event=>event.tick===world.tick&&event.kind==='death'&&event.agentId===fly.id);deaths.push({tick:world.tick,id:fly.id,cause:event?.cause,sex:fly.sex,age:fly.age,energy:fly.energy,offspring:fly.offspring,generation:fly.generation,inputs:fly.lastInputs,outputs:fly.lastActions,foodLastStep:fly.lastFood,energyCost:fly.lastEnergyCost,meanAcquiredWeightChange:fly.brain.plastic.reduce((sum,p)=>sum+Math.abs(p),0)/fly.brain.plastic.length});}
  }
  if(world.tick%100===0){const eligibility=[0,1].map(sex=>{const flies=world.flies.filter(f=>f.sex===sex);return{sex,alive:flies.length,mature:flies.filter(f=>f.age>=f.genome.traits.maturity).length,energyEligible:flies.filter(f=>f.age>=f.genome.traits.maturity&&f.energy>=65&&f.cooldown<=0).length,positiveMate:flies.filter(f=>f.lastActions[3]>0).length,meanEnergy:flies.reduce((sum,f)=>sum+f.energy,0)/Math.max(1,flies.length)};});history.push({tick:world.tick,population:world.flies.length,births:world.totals.births,deaths:world.totals.deaths,meanEnergy:world.metrics().meanEnergy,food:world.metrics().food,eligibility});}
 }
 return {world,report:{learning,metrics:world.metrics(),totals,actionStatistics:OUTPUTS.map((name,i)=>({name,mean:totals.outputSums[i]/Math.max(1,totals.agentTicks),positiveFraction:totals.positive[i]/Math.max(1,totals.agentTicks),extremeFraction:totals.extreme[i]/Math.max(1,totals.agentTicks)})),history,deaths}};
}
const learned=run(true,true),frozen=run(false);
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','scripts/replay-live-study.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const report={sourceSha256,protocol:{config:recorded.config,horizonTicks:7200,observations:'Every simulation tick and every agent; output statistics include agents dying that step. Eligibility is measured after the step, including reproduction transfers and cooldown resets. The frozen arm disables lifetime learning from birth; reproduction and inherited mutation remain enabled. One seed is a diagnostic, not a generalization result.'},matchesSavedCheckpoint:isDeepStrictEqual(learned.world.checkpoint().world,saved.world),arms:{learning:learned.report,frozen:frozen.report}};
await writeFile('evidence/autonomous-learning/live-replay.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({matchesSavedCheckpoint:report.matchesSavedCheckpoint,arms:Object.fromEntries(Object.entries(report.arms).map(([key,value])=>[key,{metrics:value.metrics,actions:value.actionStatistics,eligibilityHistory:value.history.filter((_,i)=>i%5===0)}]))},null,2));
