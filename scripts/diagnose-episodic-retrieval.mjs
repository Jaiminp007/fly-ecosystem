import {World,INPUTS} from '../engine.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {join} from 'node:path';

const directory=process.argv[2],count=Number(process.argv[3]||10);
if(!directory||!Number.isInteger(count)||count<1)throw Error('Provide a completed credit-study directory and optional seed count');
const report=JSON.parse(await readFile(join(directory,'results.json'),'utf8'));
const original=JSON.parse(await readFile(join(directory,'heldout.json'),'utf8'));
if(count>original.length)throw Error('Not enough recorded seeds');
const p=report.protocol,rows=[],sourceSha256={};
for(const file of ['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','scripts/diagnose-episodic-retrieval.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
for(const row of original.slice(0,count)){
 const world=new World({seed:row.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:report.locked.parameters,reproduction:false,mutation:false,...p.environment});
 const summary={seed:row.seed,decisions:0,matureDecisions:0,bothSupported:0,oneSupported:0,neitherSupported:0,negativeKnownMissingPreferred:0,reasons:{},matureReasons:{},featureDifferenceSums:Array(INPUTS.length).fill(0),neighborPairs:0};
 const initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0);
 for(let i=0;i<p.horizonTicks;i++){
  if(!world.step())break;
  for(const fly of world.flies){
   const d=fly.brain.episodic.lastDecision;
   if(d.step!==fly.brain.episodic.steps)continue;
   summary.decisions++;summary.reasons[d.reason]=(summary.reasons[d.reason]||0)+1;
   // Fixed diagnostic cutoff, not a new performance or promotion gate.
   if(d.retrieval.stored<64)continue;
   summary.matureDecisions++;summary.matureReasons[d.reason]=(summary.matureReasons[d.reason]||0)+1;
   const a=d.retrieval.negative,b=d.retrieval.positive,n=Number(a.neighbors.length>0)+Number(b.neighbors.length>0);
   summary[n===2?'bothSupported':n===1?'oneSupported':'neitherSupported']++;
   if(d.reason==='retrieval'&&((!a.neighbors.length&&b.estimate<0)||(!b.neighbors.length&&a.estimate<0)))summary.negativeKnownMissingPreferred++;
   for(const neighbor of [...a.neighbors,...b.neighbors]){summary.neighborPairs++;neighbor.features.forEach((value,index)=>{summary.featureDifferenceSums[index]+=(value-d.features[index])**2;});}
  }
 }
 const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated};
 const expected=Object.fromEntries(Object.keys(actual).map(key=>[key,row.arms.learned[key]]));
 if(!isDeepStrictEqual(actual,expected))throw Error('Replay mismatch for seed '+row.seed);
 rows.push({...summary,exactReplay:true});console.log(JSON.stringify({seed:row.seed,exactReplay:true,matureDecisions:summary.matureDecisions}));
}
const totals={};
for(const key of ['decisions','matureDecisions','bothSupported','oneSupported','neitherSupported','negativeKnownMissingPreferred','neighborPairs'])totals[key]=rows.reduce((sum,row)=>sum+row[key],0);
const featureDifferences=INPUTS.map((name,index)=>({name,sum:rows.reduce((sum,row)=>sum+row.featureDifferenceSums[index],0)})).sort((a,b)=>b.sum-a.sum);
const result={at:new Date().toISOString(),reference:join(directory,'results.json'),sourceSha256,scope:'Same-seed replay diagnosis of the first recorded held-out seeds. This is not an independent confirmation or evidence of a new policy. Final population, energy, food and expenditure are checked exactly. Feature-distance contributions describe the chosen retrieval metric, not causal relevance to survival.',rows,totals,featureDifferences};
await writeFile(join(directory,'retrieval-diagnosis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({directory,totals,featureDifferences},null,2));
