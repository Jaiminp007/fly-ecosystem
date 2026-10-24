import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const directory=resolve(process.argv[2]||''),load=async name=>JSON.parse(await readFile(join(directory,name),'utf8')),r=await load('results.json'),p=await load('protocol.json'),forks=await load('action-forks.json'),reference=await load('reference-study.json'),outcomes=await load('reference-outcomes.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');assert.deepEqual(r.protocol,p);
for(const [name,hash]of [['action-forks.json',p.inputSha256],['reference-study.json',p.referenceSha256],['reference-outcomes.json',p.outcomesSha256]])assert.equal(sha(await readFile(join(directory,name))),hash);
for(const [file,hash]of Object.entries(p.sourceSha256))assert.equal(sha(await readFile(join(directory,'sources',file))),hash);
for(const [file,hash]of Object.entries(p.archivedWorldSourceSha256))assert.equal(sha(await readFile(join(p.sourceDirectory,file))),hash);
assert.deepEqual(r.rows.map(row=>row.seed),p.seeds);assert.deepEqual(p.seeds,forks.rows.map(row=>row.seed));
assert.equal(p.geometry.bandwidth,reference.locked.parameters.bandwidth);assert.equal(p.geometry.maxPairDistance,reference.locked.parameters.maxDistance);
const squared=(a,b)=>a.reduce((sum,x,i)=>sum+(x-b[i])**2,0),sign=x=>Math.abs(x)<1e-9?0:Math.sign(x),close=(a,b)=>{if(a===null||b===null)assert.equal(a,b);else assert.ok(Math.abs(a-b)<1e-12,'Numeric mismatch: '+a+' / '+b);};
function interval(values){const n=values.length,mean=n?values.reduce((a,b)=>a+b,0)/n:null;if(n<2)return{mean,ci95:[null,null],n};const t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*Math.sqrt(values.reduce((sum,x)=>sum+(x-mean)**2,0)/(n-1))/Math.sqrt(n);return{mean,ci95:[mean-half,mean+half],n};}
let cases=0,available=0,eligible=0,comparisons=0;
for(const row of r.rows){
  assert.ok(row.exactBaselineEndpoints);const original=forks.rows.find(x=>x.seed===row.seed);assert.equal(row.cases.length,original.cases.length);
  for(const c of row.cases){
    cases++;const old=original.cases.find(x=>x.tick===c.tick&&x.agentId===c.agentId);assert.ok(old);assert.deepEqual(c.query,old.features);assert.equal(c.actualEffect,old.longDifference);assert.equal(c.rawAdvantage,old.predictedFasterMinusSlower);
    const a=c.retrieval.negative.neighbors,b=c.retrieval.positive.neighbors,pairs=[];assert.equal(c.prediction.pairComparisons,a.length*b.length);assert.equal(c.prediction.additionalRecordReads,2*a.length*b.length);comparisons+=c.prediction.pairComparisons;
    for(const negative of a)for(const positive of b){const pairSquared=squared(negative.features,positive.features);if(pairSquared<=p.geometry.maxPairDistance**2)pairs.push({negativeIndex:negative.index,positiveIndex:positive.index,negativeReward:negative.reward,positiveReward:positive.reward,pairDistance:Math.sqrt(pairSquared),cost:(squared(negative.features,c.query)+squared(positive.features,c.query)+pairSquared)/(2*p.geometry.bandwidth**2)});}
    assert.equal(c.prediction.available,pairs.length>0);assert.equal(c.prediction.pairs.length,pairs.length);
    if(!pairs.length){assert.equal(c.prediction.advantage,null);assert.equal(c.pairedGain,null);continue;}
    available++;const offset=Math.min(...pairs.map(x=>x.cost));let mass=0,negativeSum=0,positiveSum=0,distanceSum=0;
    for(const [i,pair]of pairs.entries()){const captured=c.prediction.pairs[i],weight=Math.exp(-(pair.cost-offset));assert.equal(captured.negativeIndex,pair.negativeIndex);assert.equal(captured.positiveIndex,pair.positiveIndex);assert.equal(captured.negativeReward,pair.negativeReward);assert.equal(captured.positiveReward,pair.positiveReward);close(captured.logCost,pair.cost);close(captured.weight,weight);close(captured.pairDistance,pair.pairDistance);mass+=weight;negativeSum+=weight*pair.negativeReward;positiveSum+=weight*pair.positiveReward;distanceSum+=weight*pair.pairDistance;}
    close(c.prediction.negativeEstimate,negativeSum/mass);close(c.prediction.positiveEstimate,positiveSum/mass);close(c.prediction.advantage,(positiveSum-negativeSum)/mass);close(c.prediction.meanPairDistance,distanceSum/mass);
    const centroid=neighbors=>{const weights=neighbors.map(x=>Math.exp(-squared(x.features,c.query)/(2*p.geometry.bandwidth**2))),total=weights.reduce((s,x)=>s+x,0);return c.query.map((_,i)=>neighbors.reduce((s,x,j)=>s+weights[j]*x.features[i],0)/total);};close(c.centroidGap,Math.sqrt(squared(centroid(a),centroid(b))));
    const raw=sign(c.rawAdvantage),matched=sign(c.prediction.advantage),effect=sign(c.actualEffect);close(c.rawGain,raw*c.actualEffect*.5);close(c.matchedGain,matched*c.actualEffect*.5);close(c.pairedGain,(matched-raw)*c.actualEffect*.5);
    assert.equal(c.eligible,raw!==0&&matched!==0&&effect!==0);if(c.eligible){eligible++;assert.equal(c.rawAgreement,Number(raw===effect));assert.equal(c.matchedAgreement,Number(matched===effect));}
  }
  const selected=row.cases.filter(c=>c.prediction.available),valid=selected.filter(c=>c.eligible),mean=(rows,key)=>rows.length?rows.reduce((s,x)=>s+x[key],0)/rows.length:null;
  assert.deepEqual(row.summary,{cases:row.cases.length,available:selected.length,eligible:valid.length,centroidGap:mean(selected,'centroidGap'),rawGain:mean(selected,'rawGain'),matchedGain:mean(selected,'matchedGain'),pairedGain:mean(selected,'pairedGain'),rawAgreement:mean(valid,'rawAgreement'),matchedAgreement:mean(valid,'matchedAgreement')});
}
assert.equal(r.cases,cases);assert.equal(r.availableCases,available);assert.equal(r.eligibleCases,eligible);
for(const key of Object.keys(r.summary)){const computed=interval(r.rows.map(row=>row.summary[key]).filter(x=>x!==null)),stored=r.summary[key];assert.equal(computed.n,stored.n);close(computed.mean,stored.mean);close(computed.ci95[0],stored.ci95[0]);close(computed.ci95[1],stored.ci95[1]);}
assert.equal(r.prospectiveStudySignal,r.summary.pairedGain.ci95[0]!==null&&r.summary.pairedGain.ci95[0]>0);

// Independent archived baseline/retrieval replay on the first and last seed.
const {World}=await import(pathToFileURL(join(p.sourceDirectory,'engine.mjs')).href),replays=[];
for(const row of [r.rows[0],r.rows.at(-1)]){
  const parent=reference.protocol,world=new World({seed:row.seed,founders:parent.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:parent.actorParameters,episodicParameters:reference.locked.parameters,reproduction:false,mutation:false,...parent.environment}),initial=world.flies.reduce((s,f)=>s+f.energy,0);
  for(const tick of [...new Set(row.cases.map(c=>c.tick))].sort((a,b)=>a-b)){world.advance(tick-world.tick);const branch=World.restore(world.checkpoint());branch.step();for(const c of row.cases.filter(c=>c.tick===tick)){const d=branch.flies.find(f=>f.id===c.agentId).brain.episodic.lastDecision;assert.deepEqual(d.features,c.query);assert.deepEqual(d.retrieval,c.retrieval);}}
  world.advance(parent.horizonTicks-world.tick);const observed={ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((s,f)=>s+f.energy,0)-initial)/parent.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated},recorded=outcomes.find(x=>x.seed===row.seed).arms.learned;assert.deepEqual(observed,Object.fromEntries(Object.keys(observed).map(key=>[key,recorded[key]])));replays.push({seed:row.seed,exactBaselineEndpoints:true,exactSampledRetrievals:true});
}
const source=await readFile(new URL(import.meta.url));await writeFile(join(directory,'audit-source.mjs'),source);
const audit={at:new Date().toISOString(),auditorSha256:sha(source),seeds:r.rows.length,cases,availableCases:available,eligibleCases:eligible,pairComparisons:comparisons,prospectiveStudySignal:r.prospectiveStudySignal,replays,checks:['archived algorithm, estimator and input hashes','exact pairing with historical fork cases','every pair distance, cutoff, log cost, weight and return estimate independently recomputed','pair comparison and proposed additional read accounting','action centroid separation recomputed','same-case gain and agreement comparisons','seed-level summaries and fixed signal recomputed','first/last archived baseline endpoints and sampled retrievals replayed'],limitations:['Reuses historical data with finite-horizon counterfactual effects; no prospective policy qualification.','Only the first and last baseline/retrieval trajectories were independently replayed by this audit; the analysis driver checked all included baseline endpoints.','The prototype is offline and does not establish ecological survival, checkpoint integration, continual retention or RSI.']};
await writeFile(join(directory,'audit.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2));
