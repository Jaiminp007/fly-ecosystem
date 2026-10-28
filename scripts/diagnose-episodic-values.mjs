import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referenceDirectory=process.argv[2],count=Number(process.argv[3]||10);
if(!referenceDirectory||!Number.isInteger(count)||count<2)throw Error('Provide a completed value-study directory and optional seed count >= 2');
const reference=JSON.parse(await readFile(join(referenceDirectory,'results.json'),'utf8'));
const recorded=JSON.parse(await readFile(join(referenceDirectory,'heldout.json'),'utf8'));
if(reference.locked.parameters.returnMode!=='td'||count>recorded.length)throw Error('Expected a TD-target study with enough recorded seeds');
const directory=join(referenceDirectory,'value-diagnosis');await mkdir(directory,{recursive:true});
const p=reference.protocol,parameters=reference.locked.parameters,sourceSha256={};
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/diagnose-episodic-values.mjs'];
for(const file of sourceFiles){const bytes=await readFile(file);sourceSha256[file]=createHash('sha256').update(bytes).digest('hex');const path=join(directory,'sources',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);}
const protocol={at:new Date().toISOString(),referenceDirectory,sourceSha256,seeds:recorded.slice(0,count).map(row=>row.seed),decisionTicks:[400,800].map(tick=>Math.ceil(tick/parameters.decisionTicks)*parameters.decisionTicks+1),agentsPerDecision:2,discount:parameters.discount,horizonTicks:p.horizonTicks,interpretation:'Post-hoc same-seed calibration diagnosis. Compare the recalled value for the action actually selected with normalized later rewards under the agent actual exploratory, still-learning policy. TD max targets refer to a greedy continuation, so this is a behaviour-policy return comparison, not an unbiased estimate of greedy-policy value error. Bound any unobserved tail by +/- discount^observedTicks; terminate that tail at zero upon agent death. Do not train from diagnostic results. Check final baseline outcomes against the recorded experiment.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');
const rows=[];
for(const row of recorded.slice(0,count)){
 const world=new World({seed:row.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...p.environment}),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),samples=[];
 for(let tick=0;tick<p.horizonTicks;tick++){
  const before=[...world.flies];if(!world.step())break;
  if(protocol.decisionTicks.includes(world.tick))for(const fly of before.slice(0,protocol.agentsPerDecision)){
   const d=fly.brain.episodic.lastDecision;if(d.step!==world.tick)throw Error('Calibration sample is not at a fresh decision');
   samples.push({agentId:fly.id,decisionTick:world.tick,choice:d.choice,reason:d.reason,prediction:d.retrieval[d.choice<0?'negative':'positive'].estimate,features:[...d.features],rewards:[],realizedReturn:0,discountPower:1,terminal:false});
  }
  for(const sample of samples.filter(sample=>!sample.terminal)){
   const fly=before.find(fly=>fly.id===sample.agentId);if(!fly)throw Error('Missing sampled agent before a recorded terminal transition');
   sample.rewards.push(fly.reward);sample.realizedReturn+=(1-parameters.discount)*sample.discountPower*fly.reward;sample.discountPower*=parameters.discount;
   if(!world.flies.includes(fly))sample.terminal=true;
  }
 }
 const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated},expected=Object.fromEntries(Object.keys(actual).map(key=>[key,row.arms.learned[key]]));
 if(!isDeepStrictEqual(actual,expected))throw Error('Value diagnosis changed baseline outcomes');
 for(const sample of samples){sample.tailBound=sample.terminal?0:sample.discountPower;sample.error=sample.prediction-sample.realizedReturn;sample.errorLower=sample.error-sample.tailBound;sample.errorUpper=sample.error+sample.tailBound;}
 const mean=key=>samples.reduce((sum,sample)=>sum+sample[key],0)/samples.length;
 const summary=Object.fromEntries(['prediction','realizedReturn','tailBound','error','errorLower','errorUpper'].map(key=>[key,mean(key)]));
 rows.push({seed:row.seed,exactBaselineReplay:true,samples,summary});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({seed:row.seed,summary}));
}
const summary=Object.fromEntries(['prediction','realizedReturn','tailBound','error','errorLower','errorUpper'].map(key=>[key,interval95(rows.map(row=>row.summary[key]))]));
for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==sourceSha256[file])throw Error('Diagnostic sources changed while replaying');
const result={protocol,rows,summary,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,summary},null,2));
