import {World} from '../engine.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {interval95} from '../learning/tasks.mjs';

const referenceDirectory=process.argv[2],count=Number(process.argv[3]||10);
if(!referenceDirectory||!Number.isInteger(count)||count<2)throw Error('Provide a completed speed-study directory and optional seed count >= 2');
const reference=JSON.parse(await readFile(join(referenceDirectory,'results.json'),'utf8'));
const recorded=JSON.parse(await readFile(join(referenceDirectory,'heldout.json'),'utf8'));
if(reference.locked.parameters.actuator!=='move'||count>recorded.length)throw Error('Expected a completed movement-control study with enough seeds');
const directory=join(referenceDirectory,'horizon-diagnosis');await mkdir(directory,{recursive:true});
const p=reference.protocol,parameters=reference.locked.parameters;
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/diagnose-episodic-horizon.mjs'],sourceSha256={};
for(const file of sourceFiles){const bytes=await readFile(file);sourceSha256[file]=createHash('sha256').update(bytes).digest('hex');const path=join(directory,'sources',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);}
const protocol={at:new Date().toISOString(),referenceDirectory,sourceSha256,seeds:recorded.slice(0,count).map(row=>row.seed),snapshotTicks:[400,900,1400].map(tick=>Math.ceil(tick/parameters.decisionTicks)*parameters.decisionTicks),agentsPerSnapshot:2,shortHorizon:parameters.decisionTicks,longHorizon:128,interpretation:'Post-hoc same-seed counterfactual diagnosis, not independent policy confirmation. Fork a recorded world before a decision and force the first target-agent speed choice by its exploration RNG. Restore the same future target decision RNG after that first choice in both forks; other initial RNG streams remain identical. Later dynamics and population can diverge. Normal learning continues in each diagnostic fork. No fork outcome enters the baseline or trains a live agent. Compare short and longer target-agent energy effects; limited-horizon effects do not establish optimal long-run actions.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');
const advance=state=>{let x=state;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};
const forcedSeeds={};
for(let seed=1;seed<1000000&&Object.keys(forcedSeeds).length<2;seed++){const first=advance(seed),second=advance(first);if(first/4294967296<parameters.exploration){const action=second/4294967296<.5?-1:1;forcedSeeds[action]??=seed;}}
if(!forcedSeeds[-1]||!forcedSeeds[1])throw Error('Could not construct both forced exploration choices');
const rows=[];
for(const original of recorded.slice(0,count)){
 const world=new World({seed:original.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...p.environment});
 const initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),cases=[];
 for(const tick of protocol.snapshotTicks){
  world.advance(tick-world.tick);if(world.tick!==tick)continue;
  const checkpoint=world.checkpoint();
  for(const agent of world.flies.slice(0,protocol.agentsPerSnapshot)){
   if(agent.brain.episodic.steps%parameters.decisionTicks!==0)throw Error('Snapshot is not at a decision boundary');
   const natural=World.restore(checkpoint);natural.step();
   const next=natural.flies.find(fly=>fly.id===agent.id);if(!next)continue;
   const nextRandomState=next.brain.episodic.memory.rngState,naturalDecision=structuredClone(next.brain.episodic.lastDecision),arms={},finalCheckpoints={};let retrieval;
   for(const choice of [-1,1]){
    const fork=World.restore(checkpoint),target=fork.flies.find(fly=>fly.id===agent.id);target.brain.episodic.memory.rngState=forcedSeeds[choice];
    let rewardSum=0,short=null;
    for(let step=1;step<=protocol.longHorizon;step++){
     const alive=fork.flies.find(fly=>fly.id===agent.id);if(!fork.step())break;
     if(alive)rewardSum+=alive.reward;
     if(step===1){
      if(target.brain.episodic.lastDecision.choice!==choice)throw Error('Forced choice failed');
      if(retrieval&&!isDeepStrictEqual(retrieval,target.brain.episodic.lastDecision.retrieval))throw Error('Changing exploration RNG altered retrieved estimates');
      retrieval=target.brain.episodic.lastDecision.retrieval;target.brain.episodic.memory.rngState=nextRandomState;
     }
     if(step===protocol.shortHorizon)short={energyChange:(fork.flies.find(fly=>fly.id===agent.id)?.energy||0)-agent.energy,rewardSum,alive:fork.flies.includes(target)};
    }
    const long={energyChange:(fork.flies.find(fly=>fly.id===agent.id)?.energy||0)-agent.energy,rewardSum,alive:fork.flies.includes(target)};
    arms[choice<0?'slower':'faster']={short:short??long,long};
    finalCheckpoints[choice]=fork.checkpoint();
   }
   natural.advance(protocol.longHorizon-1);
   if(!isDeepStrictEqual(natural.checkpoint(),finalCheckpoints[naturalDecision.choice]))throw Error('Factual-action fork differs from the unmodified natural trajectory');
   cases.push({tick,agentId:agent.id,factualForkExact:true,naturalChoice:naturalDecision.choice,naturalReason:naturalDecision.reason,predictedFasterMinusSlower:retrieval.positive.estimate-retrieval.negative.estimate,inputs:agent.lastInputs,arms,shortDifference:arms.faster.short.energyChange-arms.slower.short.energyChange,longDifference:arms.faster.long.energyChange-arms.slower.long.energyChange});
  }
 }
 world.advance(p.horizonTicks-world.tick);
 const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated};
 const expected=Object.fromEntries(Object.keys(actual).map(key=>[key,original.arms.learned[key]]));
 if(!isDeepStrictEqual(actual,expected))throw Error('Baseline replay mismatch for seed '+original.seed);
 const sign=value=>Math.abs(value)<1e-9?0:Math.sign(value),eligible=cases.filter(row=>sign(row.predictedFasterMinusSlower)!==0&&sign(row.shortDifference)!==0&&sign(row.longDifference)!==0);
 const fraction=predicate=>eligible.length?eligible.filter(predicate).length/eligible.length:null;
 const summary={eligible:eligible.length,shortAgreement:fraction(row=>sign(row.predictedFasterMinusSlower)===sign(row.shortDifference)),longAgreement:fraction(row=>sign(row.predictedFasterMinusSlower)===sign(row.longDifference)),shortLongDisagreement:fraction(row=>sign(row.shortDifference)!==sign(row.longDifference)),meanShortDifference:cases.reduce((sum,row)=>sum+row.shortDifference,0)/cases.length,meanLongDifference:cases.reduce((sum,row)=>sum+row.longDifference,0)/cases.length,naturalChoiceGainOverRandomFirstChoice:cases.reduce((sum,row)=>sum+row.naturalChoice*row.longDifference*.5,0)/cases.length,greedyChoiceGainOverRandomFirstChoice:cases.reduce((sum,row)=>sum+sign(row.predictedFasterMinusSlower)*row.longDifference*.5,0)/cases.length};
 rows.push({seed:original.seed,exactBaselineReplay:true,cases,summary});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({seed:original.seed,summary}));
}
const summary=Object.fromEntries(['shortAgreement','longAgreement','shortLongDisagreement','meanShortDifference','meanLongDifference','naturalChoiceGainOverRandomFirstChoice','greedyChoiceGainOverRandomFirstChoice'].map(key=>[key,interval95(rows.map(row=>row.summary[key]).filter(value=>value!==null&&Number.isFinite(value)))]));
const result={protocol,rows,summary,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,summary},null,2));
