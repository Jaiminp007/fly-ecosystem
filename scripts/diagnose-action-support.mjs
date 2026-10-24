import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {interval95} from '../learning/tasks.mjs';

const input=resolve(process.argv[2]||'evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/action-horizon-diagnosis/results.json'),directory=resolve(process.argv[3]||`evidence/action-support/${randomUUID()}`),inputBytes=await readFile(input),prior=JSON.parse(inputBytes),sourceDirectory=join(dirname(input),'sources');
const parentDirectory=resolve(prior.protocol.referenceDirectory),referenceBytes=await readFile(join(parentDirectory,'results.json')),reference=JSON.parse(referenceBytes),outcomeBytes=await readFile(join(parentDirectory,'heldout.json')),outcomes=JSON.parse(outcomeBytes),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
for(const [file,sha]of Object.entries(prior.protocol.sourceSha256))assert.equal(hash(await readFile(join(sourceDirectory,file))),sha);
const {World}=await import(pathToFileURL(join(sourceDirectory,'engine.mjs')).href),parameters=reference.locked.parameters,p=reference.protocol;
const protocol={at:new Date().toISOString(),experiment:'posthoc-support-stratification',sourceDirectory,sourceSha256:prior.protocol.sourceSha256,inputPath:input,inputSha256:hash(inputBytes),referenceSha256:hash(referenceBytes),outcomesSha256:hash(outcomeBytes),seeds:prior.rows.map(row=>row.seed),interpretation:'Reused historical action-fork seeds and outcomes, stratified by actual support in the original retrieval. No additional action forks, policy tuning, qualification or new independent sample. Seed-level summaries avoid treating multiple decisions in one world as independent observations. Both-supported recall does not establish matched counterfactual contexts or accurate future predictions.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'action-forks.json'),inputBytes);await writeFile(join(directory,'reference-study.json'),referenceBytes);await writeFile(join(directory,'reference-outcomes.json'),outcomeBytes);
const rows=[],sign=value=>Math.abs(value)<1e-9?0:Math.sign(value);
for(const original of prior.rows) {
  const world=new World({seed:original.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...p.environment}),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),cases=[];
  for(const tick of [...new Set(original.cases.map(row=>row.tick))].sort((a,b)=>a-b)) {
    world.advance(tick-world.tick);assert.equal(world.tick,tick);const natural=World.restore(world.checkpoint());natural.step();
    for(const old of original.cases.filter(row=>row.tick===tick)) {
      const d=natural.flies.find(fly=>fly.id===old.agentId)?.brain.episodic.lastDecision;assert.ok(d);assert.equal(d.choice,old.naturalChoice);assert.equal(d.reason,old.naturalReason);assert.deepEqual(d.features,old.features);assert.equal(d.retrieval.positive.estimate-d.retrieval.negative.estimate,old.predictedFasterMinusSlower);
      const negative=d.retrieval.negative,positive=d.retrieval.positive,support=Number(negative.neighbors.length>0)+Number(positive.neighbors.length>0),predicted=sign(old.predictedFasterMinusSlower),actual=sign(old.longDifference);
      cases.push({tick,agentId:old.agentId,support,negativeCount:negative.neighbors.length,positiveCount:positive.neighbors.length,negativeEstimate:negative.estimate,positiveEstimate:positive.estimate,predictedDifference:old.predictedFasterMinusSlower,longDifference:old.longDifference,greedyGainOverRandom:predicted*old.longDifference*.5,agreement:predicted&&actual?Number(predicted===actual):null});
    }
  }
  world.advance(p.horizonTicks-world.tick);const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated},recorded=outcomes.find(row=>row.seed===original.seed).arms.learned;assert.deepEqual(actual,Object.fromEntries(Object.keys(actual).map(key=>[key,recorded[key]])));
  const summary=Object.fromEntries([0,1,2].map(support=>{const group=cases.filter(row=>row.support===support),eligible=group.filter(row=>row.agreement!==null);return[support,{cases:group.length,eligible:eligible.length,greedyGainOverRandom:group.length?group.reduce((sum,row)=>sum+row.greedyGainOverRandom,0)/group.length:null,agreement:eligible.length?eligible.reduce((sum,row)=>sum+row.agreement,0)/eligible.length:null}];}));
  rows.push({seed:original.seed,exactRecordedEndpoints:true,cases,summary});
}
const summary=Object.fromEntries([0,1,2].map(support=>[support,{cases:rows.reduce((sum,row)=>sum+row.summary[support].cases,0),greedyGainOverRandom:interval95(rows.map(row=>row.summary[support].greedyGainOverRandom).filter(value=>value!==null)),agreement:interval95(rows.map(row=>row.summary[support].agreement).filter(value=>value!==null))}]));
const script=await readFile(new URL(import.meta.url));await writeFile(join(directory,'analysis-source.mjs'),script);
const result={protocol,rows,summary,scriptSha256:hash(script),completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,seeds:rows.length,summary},null,2));
