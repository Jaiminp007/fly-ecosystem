import {World,DT} from '../engine.mjs';
import {challengeAt,stress} from '../challenges.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referenceDirectory=process.argv[2];
if(!referenceDirectory)throw Error('Provide a completed future-value study directory');
const reference=JSON.parse(await readFile(join(referenceDirectory,'results.json'),'utf8'));
const recorded=JSON.parse(await readFile(join(referenceDirectory,'heldout.json'),'utf8'));
const count=process.argv[3]===undefined?recorded.length:Number(process.argv[3]);
if(!Number.isInteger(count)||count<2||count>recorded.length||reference.locked.parameters.returnMode!=='td')throw Error('Expected a TD study and a valid seed count >= 2');
const directory=join(referenceDirectory,'cost-diagnosis');await mkdir(directory,{recursive:true});
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/diagnose-episodic-costs.mjs'],sourceSha256={};
for(const file of sourceFiles){const bytes=await readFile(file);sourceSha256[file]=createHash('sha256').update(bytes).digest('hex');if(reference.protocol.sourceSha256[file]&&reference.protocol.sourceSha256[file]!==sourceSha256[file])throw Error('Reference source mismatch: '+file);const path=join(directory,'sources',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);}
const engineSource=await readFile('engine.mjs','utf8');
const extract=expression=>{const match=engineSource.match(expression);if(!match)throw Error('Energy formula no longer matches the diagnostic parser: '+expression);return Number(match[1]);};
const coefficients={movement:extract(/speed\*([.\d]+)/),neuralNode:extract(/f\.genome\.nodes\.length\*([.\d]+)/),signal:extract(/f\.signal\*([.\d]+)\*DT/),moveOffset:extract(/const speed=\(move\+([.\d]+)\)/),moveDivisor:extract(/const speed=\(move\+[.\d]+\)\/([.\d]+)\*g\.speed/)};
const p=reference.protocol,parameters=reference.locked.parameters;
const profiles={learned:{learning:true,parameters},observedWindow:{learning:true,parameters:{...parameters,returnMode:'mean'}},noMemory:{learning:true,parameters:{...parameters,memoryLearning:false}},frozen:{learning:false,parameters}};
const protocol={at:new Date().toISOString(),referenceDirectory,sourceSha256,seeds:recorded.slice(0,count).map(row=>row.seed),coefficients,profiles,interpretation:'Same-seed cost/behaviour diagnosis of an already completed study. Coefficients are extracted from the engine source. Sum nominal body, movement, neural, signal, stress, storage, action lookup and value lookup costs; subtract the observed energy-cap adjustment and add terminal energy dissipation. All reconstructed expenditure and recorded final outcomes must match. Nominal component differences identify accounting contributions, not causal policy mechanisms. Stop/full-speed and blocked-or-clamped ticks describe executed motor commands and positions.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');
const keys=['metabolism','movement','neural','signal','stress','storage','actionLookup','valueLookup','capAdjustment','terminalDissipation'];
function run(seed,profile,expected){
 const world=new World({seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:profile.learning,actorParameters:p.actorParameters,episodicParameters:profile.parameters,reproduction:false,mutation:false,...p.environment});
 const initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),parameters=world.config.episodicParameters,costs=Object.fromEntries(keys.map(key=>[key,0]));
 const behaviour={agentTicks:0,feedingTicks:0,stoppedTicks:0,fullSpeedTicks:0,blockedOrClampedTicks:0,distance:0,speedSum:0,actions:Array(5).fill(0)};
 for(let tick=0;tick<p.horizonTicks;tick++){
  const before=world.flies.map(fly=>({fly,x:fly.x,y:fly.y}));if(!world.step())break;
  const alive=new Set(world.flies.map(fly=>fly.id)),challenge=challengeAt(world.config,world.tick);
  for(const {fly,x,y}of before){
   const state=fly.brain.episodic,dead=!alive.has(fly.id),terminal=dead&&state.lastUpdate?.target.terminal&&state.lastUpdate.step===state.steps;
   // An aligned TD controller has one pending transition at death. The terminal
   // record is appended after motion costs were charged, so exclude that append
   // from this step's storage/action-lookup count (reservoir length is bounded).
   const recordsAtCost=terminal?Math.min(parameters.capacity,state.memory.seen-1):state.memory.records.length;
   const actionRecords=(state.steps-1)%parameters.decisionTicks===0?recordsAtCost:0,valueRecords=state.lookupRecordsThisStep-actionRecords;
   if(recordsAtCost<0||valueRecords<0)throw Error('Invalid reconstructed lookup counts');
   const speed=(fly.lastActions[1]+coefficients.moveOffset)/coefficients.moveDivisor*fly.genome.traits.speed;
   const stepCosts={metabolism:fly.genome.traits.metabolism*DT,movement:speed*coefficients.movement*DT,neural:fly.genome.nodes.length*coefficients.neuralNode*DT,signal:fly.signal*coefficients.signal*DT,stress:stress(challenge,fly)*DT,storage:recordsAtCost*parameters.memoryEnergyPerRecordSecond*DT,actionLookup:actionRecords*parameters.lookupEnergyPerRecord,valueLookup:valueRecords*parameters.lookupEnergyPerRecord};
   const nominal=Object.values(stepCosts).reduce((sum,value)=>sum+value,0),capAdjustment=nominal-fly.lastEnergyCost;
   if(capAdjustment< -1e-9)throw Error('Nominal costs do not cover actual charged cost');
   for(const[key,value]of Object.entries(stepCosts))costs[key]+=value;
   costs.capAdjustment+=Math.max(0,capAdjustment);if(dead)costs.terminalDissipation+=fly.energy;
   behaviour.agentTicks++;if(fly.lastFood>0)behaviour.feedingTicks++;if(speed<1e-12)behaviour.stoppedTicks++;if(Math.abs(speed-fly.genome.traits.speed)<1e-9)behaviour.fullSpeedTicks++;
   const moved=Math.hypot(fly.x-x,fly.y-y);behaviour.distance+=moved;behaviour.speedSum+=speed;if(speed>1e-12&&moved<1e-9)behaviour.blockedOrClampedTicks++;
   fly.lastActions.forEach((value,index)=>{behaviour.actions[index]+=value;});
  }
 }
 const reconstructed=keys.reduce((sum,key)=>sum+(key==='capAdjustment'?-costs[key]:costs[key]),0);
 if(Math.abs(reconstructed-world.totals.dissipated)>1e-6)throw Error('Reconstructed expenditure does not match engine');
 const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated},wanted=Object.fromEntries(Object.keys(actual).map(key=>[key,expected[key]]));
 if(!isDeepStrictEqual(actual,wanted))throw Error('Cost observation changed recorded outcomes');
 return{...actual,costs,behaviour,reconstructed,accountingResidual:reconstructed-world.totals.dissipated,exactReplay:true};
}
const rows=[];
for(const row of recorded.slice(0,count)){
 const arms={};for(const[name,profile]of Object.entries(profiles))arms[name]=run(row.seed,profile,row.arms[name]);
 rows.push({seed:row.seed,arms});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({seed:row.seed,completed:rows.length,total:count}));
}
const summary={};
for(const control of Object.keys(profiles).filter(name=>name!=='learned'))summary[control]={costDifferences:Object.fromEntries(keys.map(key=>[key,interval95(rows.map(row=>(row.arms.learned.costs[key]-row.arms[control].costs[key])/p.founders))])),fullSpeedFractionDifference:interval95(rows.map(row=>row.arms.learned.behaviour.fullSpeedTicks/row.arms.learned.behaviour.agentTicks-row.arms[control].behaviour.fullSpeedTicks/row.arms[control].behaviour.agentTicks)),feedingFractionDifference:interval95(rows.map(row=>row.arms.learned.behaviour.feedingTicks/row.arms.learned.behaviour.agentTicks-row.arms[control].behaviour.feedingTicks/row.arms[control].behaviour.agentTicks))};
for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==sourceSha256[file])throw Error('Sources changed during diagnosis');
const result={protocol,rows,summary,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,coefficients,summary},null,2));
