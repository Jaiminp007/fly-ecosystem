import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';

// Fresh seed pairs test the resource intervention suggested by one live extinction.
// Reproduction stays enabled: this measures whole population trajectories, not a
// pure within-life mechanism. The separate short ecological task isolates that.
const recorded=JSON.parse(await readFile('evidence/autonomous-learning/live-habitat.json','utf8'));
const id=randomUUID(),directory=`evidence/resource-pressure/${id}`;
const firstSeed=(parseInt(id.slice(0,8),16)>>>0)||1;
const seeds=Array.from({length:10},(_,i)=>((firstSeed+i*7919)>>>0)||1);
const sourceSha256={};
for(const file of ['engine.mjs','learning/trace-actor.mjs','scripts/resource-pressure-study.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const protocol={id,startedAt:new Date().toISOString(),sourceSha256,seeds,horizonTicks:7200,config:recorded.config,nutrients:[1,3],learningArms:[true,false],primary:'Population alive at the fixed endpoint; also report extinctions, lifespan/energy deaths, births, and capacity stops.',interpretation:'Resource intervention and learning policy comparisons in evolving populations. Different trajectories include inherited selection and reproduction feedback. This does not isolate within-life learning or prove an ecological learning mechanism. Seed-level t intervals are approximate exploratory summaries; every paired outcome is retained.'};
await mkdir(directory,{recursive:true});
await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
const rows=[],started=performance.now();
for(const seed of seeds){
 const arms={};let founderHash;
 for(const nutrient of protocol.nutrients)for(const learning of protocol.learningArms){
  const world=new World({...recorded.config,seed,nutrient,learning});
  const hash=createHash('sha256').update(JSON.stringify(world.flies)).digest('hex');
  if(founderHash&&founderHash!==hash)throw Error('Unmatched initial founders');founderHash=hash;
  const history=[];
  for(let tick=0;tick<protocol.horizonTicks&&world.step();tick++)if(world.tick%600===0)history.push(world.metrics());
  arms[`${nutrient}:${learning?'learned':'frozen'}`]={metrics:world.metrics(),totals:world.totals,history};
 }
 rows.push({seed,founderHash,arms});
 await writeFile(`${directory}/progress.json`,JSON.stringify({protocol,rows},null,2)+'\n');
 console.log(JSON.stringify({seed,arms:Object.fromEntries(Object.entries(arms).map(([key,value])=>[key,value.metrics]))}));
}
const contrasts={resourceLearned:['3:learned','1:learned'],resourceFrozen:['3:frozen','1:frozen'],learningLowFood:['1:learned','1:frozen'],learningHigherFood:['3:learned','3:frozen']};
const summary={contrasts:Object.fromEntries(Object.entries(contrasts).map(([key,[a,b]])=>[key,interval95(rows.map(row=>row.arms[a].metrics.population-row.arms[b].metrics.population))])),arms:Object.fromEntries(Object.keys(rows[0].arms).map(key=>[key,{extinctions:rows.filter(row=>row.arms[key].metrics.status==='extinct').length,capacityStops:rows.filter(row=>row.arms[key].metrics.status==='capacity').length,population:interval95(rows.map(row=>row.arms[key].metrics.population))}]))};
const report={protocol,rows,summary,wallSeconds:(performance.now()-started)/1000};
await writeFile(`${directory}/results.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({directory,summary},null,2));
