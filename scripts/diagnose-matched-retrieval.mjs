import {matchedRetrieval} from '../learning/matched-retrieval.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

const input=resolve(process.argv[2]||'evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/action-horizon-diagnosis/results.json'),directory=resolve(process.argv[3]||`evidence/matched-retrieval/${randomUUID()}`),inputBytes=await readFile(input),prior=JSON.parse(inputBytes),sourceDirectory=join(dirname(input),'sources');
const referenceBytes=await readFile(join(resolve(prior.protocol.referenceDirectory),'results.json')),reference=JSON.parse(referenceBytes),outcomeBytes=await readFile(join(resolve(prior.protocol.referenceDirectory),'heldout.json')),outcomes=JSON.parse(outcomeBytes),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
for(const [file,sha]of Object.entries(prior.protocol.sourceSha256))assert.equal(hash(await readFile(join(sourceDirectory,file))),sha);
const {World}=await import(pathToFileURL(join(sourceDirectory,'engine.mjs')).href),parameters=reference.locked.parameters,p=reference.protocol;
const sourceFiles=['learning/matched-retrieval.mjs','learning/tasks.mjs','scripts/diagnose-matched-retrieval.mjs'],sourceSha256={};
for(const file of sourceFiles){const bytes=await readFile(file);sourceSha256[file]=hash(bytes);const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);}
const protocol={at:new Date().toISOString(),experiment:'posthoc-matched-retrieval',inputPath:input,inputSha256:hash(inputBytes),referenceSha256:hash(referenceBytes),outcomesSha256:hash(outcomeBytes),sourceDirectory,archivedWorldSourceSha256:prior.protocol.sourceSha256,sourceSha256,seeds:prior.rows.map(row=>row.seed),geometry:{bandwidth:parameters.bandwidth,maxPairDistance:parameters.maxDistance},decision:'No estimator selection, integration or policy qualification from this reused sample. A positive paired gain interval motivates a separately specified prospective experiment. A nonpositive/uncertain interval does not justify deploying this estimator or resampling these cases.',interpretation:'Offline comparison at original factual memories. Match the existing negative/positive nearest-neighbor sets by shared query and pair-context distances. Use only their past reward/value targets. Compute predictions BEFORE joining recorded counterfactual effects. Fixed geometry reuses the incumbent bandwidth and retrieval radius; no fitting to future outcomes. Raw and matched predictions are compared on the same available cases with seed-level aggregation. The effects are finite-horizon target-agent energy changes, not unbiased Q labels or an optimal long-run policy. No new forks, live controls, learning updates, difficulty promotion or RSI claim. A live implementation would additionally price the declared two record reads per checked cross-action pair and verify checkpoints/retention before qualification.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'action-forks.json'),inputBytes);await writeFile(join(directory,'reference-study.json'),referenceBytes);await writeFile(join(directory,'reference-outcomes.json'),outcomeBytes);
const rows=[],sign=x=>Math.abs(x)<1e-9?0:Math.sign(x);
const centroid=(neighbors,query,bandwidth)=>{if(!neighbors.length)return null;const costs=neighbors.map(row=>row.features.reduce((sum,x,i)=>sum+(x-query[i])**2,0)/(2*bandwidth**2)),offset=Math.min(...costs),weights=costs.map(cost=>Math.exp(-(cost-offset))),total=weights.reduce((s,x)=>s+x,0);return query.map((_,i)=>neighbors.reduce((sum,row,j)=>sum+weights[j]*row.features[i],0)/total);};
for(const original of prior.rows){
  const world=new World({seed:original.seed,founders:p.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:p.actorParameters,episodicParameters:parameters,reproduction:false,mutation:false,...p.environment}),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),cases=[];
  for(const tick of [...new Set(original.cases.map(row=>row.tick))].sort((a,b)=>a-b)){
    world.advance(tick-world.tick);assert.equal(world.tick,tick);const natural=World.restore(world.checkpoint());natural.step();
    for(const originalCase of original.cases.filter(row=>row.tick===tick)){
      const d=natural.flies.find(fly=>fly.id===originalCase.agentId)?.brain.episodic.lastDecision;assert.ok(d);assert.equal(d.choice,originalCase.naturalChoice);assert.equal(d.reason,originalCase.naturalReason);assert.deepEqual(d.features,originalCase.features);
      const a=d.retrieval.negative,b=d.retrieval.positive,rawAdvantage=b.estimate-a.estimate;assert.equal(rawAdvantage,originalCase.predictedFasterMinusSlower);
      // No outcome or correct-action label is an argument to this call.
      const prediction=matchedRetrieval(d.features,d.retrieval,protocol.geometry),ca=centroid(a.neighbors,d.features,parameters.bandwidth),cb=centroid(b.neighbors,d.features,parameters.bandwidth),centroidGap=ca&&cb?Math.sqrt(ca.reduce((sum,x,i)=>sum+(x-cb[i])**2,0)):null;
      const actualEffect=originalCase.longDifference,rawSign=sign(rawAdvantage),matchedSign=prediction.available?sign(prediction.advantage):null,actualSign=sign(actualEffect),rawGain=rawSign*actualEffect*.5,matchedGain=prediction.available?matchedSign*actualEffect*.5:null,eligible=prediction.available&&rawSign!==0&&matchedSign!==0&&actualSign!==0;
      cases.push({tick,agentId:originalCase.agentId,query:d.features,retrieval:d.retrieval,centroidGap,prediction,actualEffect,rawAdvantage,rawGain,matchedGain,pairedGain:prediction.available?matchedGain-rawGain:null,eligible,rawAgreement:eligible?Number(rawSign===actualSign):null,matchedAgreement:eligible?Number(matchedSign===actualSign):null});
    }
  }
  world.advance(p.horizonTicks-world.tick);const actual={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/p.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated},expected=outcomes.find(row=>row.seed===original.seed).arms.learned;assert.deepEqual(actual,Object.fromEntries(Object.keys(actual).map(key=>[key,expected[key]])));
  const available=cases.filter(row=>row.prediction.available),eligible=cases.filter(row=>row.eligible),mean=(items,key)=>items.length?items.reduce((sum,row)=>sum+row[key],0)/items.length:null;
  const summary={cases:cases.length,available:available.length,eligible:eligible.length,centroidGap:mean(available,'centroidGap'),rawGain:mean(available,'rawGain'),matchedGain:mean(available,'matchedGain'),pairedGain:mean(available,'pairedGain'),rawAgreement:mean(eligible,'rawAgreement'),matchedAgreement:mean(eligible,'matchedAgreement')};
  rows.push({seed:original.seed,exactBaselineEndpoints:true,cases,summary});
}
const summary=Object.fromEntries(['centroidGap','rawGain','matchedGain','pairedGain','rawAgreement','matchedAgreement'].map(key=>[key,interval95(rows.map(row=>row.summary[key]).filter(x=>x!==null))]));
for(const [file,sha]of Object.entries(sourceSha256))assert.equal(hash(await readFile(file)),sha);
const result={protocol,rows,summary,cases:rows.reduce((sum,row)=>sum+row.cases.length,0),availableCases:rows.reduce((sum,row)=>sum+row.summary.available,0),eligibleCases:rows.reduce((sum,row)=>sum+row.summary.eligible,0),prospectiveStudySignal:summary.pairedGain.ci95[0]!==null&&summary.pairedGain.ci95[0]>0,completedAt:new Date().toISOString()};
await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,cases:result.cases,availableCases:result.availableCases,eligibleCases:result.eligibleCases,prospectiveStudySignal:result.prospectiveStudySignal,summary},null,2));
