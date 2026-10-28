import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const directory=resolve(process.argv[2]||''),hash=x=>createHash('sha256').update(x).digest('hex'),p=JSON.parse(await readFile(join(directory,'protocol.json')));
for(const[file,sha]of Object.entries(p.sourceSha256))assert.equal(hash(await readFile(join(directory,'sources',file))),sha);
let data;try{data=JSON.parse(await readFile(join(directory,'results.json')));}catch(error){if(error.code!=='ENOENT')throw error;data=JSON.parse(await readFile(join(directory,'progress.json')));}
const selected=data.rows.filter(row=>row.seed===p.seeds[0]);assert.equal(selected.length,Object.keys(p.arms).length*Object.keys(p.environments).length);
const {World,DT}=await import(pathToFileURL(join(directory,'sources/engine.mjs')).href),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`Numeric mismatch ${a} / ${b}`),replays=[];
for(const row of selected){
  const world=new World(row.config),initialNodes=new Set(world.flies.map(f=>f.genome.nodes.length));assert.equal(hash(JSON.stringify(world.flies.map(({brain,...f})=>f))),row.founderHash);
  let ticks=0,peak=world.flies.length,children=0;const samples=[];
  function observe(){
    const females=world.flies.filter(f=>f.sex===0),males=world.flies.filter(f=>f.sex===1),eligible=f=>f.age>=f.genome.traits.maturity&&f.energy>=65&&f.cooldown<=0,rf=females.filter(eligible),rm=males.filter(eligible);let pairs=0,positive=0;
    for(const f of rf)for(const m of rm)if(Math.hypot(f.x-m.x,f.y-m.y)<=26){pairs++;if(f.lastActions[3]>0&&m.lastActions[3]>0)positive++;}
    const met=world.metrics();samples.push({tick:world.tick,population:met.population,births:met.births,deaths:met.deaths,generation:met.generation,meanNodes:met.meanNodes,meanEnergy:met.meanEnergy,food:met.food,females:females.length,males:males.length,readyFemales:rf.length,readyMales:rm.length,readyPairs:pairs,positiveMatePairs:positive,accountingError:met.accountingError,status:met.status});
  }
  observe();
  for(let t=0;t<p.horizonTicks;t++){
    if(world.capacityReached||!world.flies.length)break;const count=world.flies.length;assert.ok(world.step());ticks+=count;peak=Math.max(peak,world.flies.length);
    for(const f of world.flies)if(f.born===world.tick){children++;assert.equal(f.brain.actor.steps,0);assert.equal(f.brain.episodic.steps,0);assert.equal(f.brain.episodic.memory.records.length,0);assert.equal(f.brain.episodic.memory.seen,0);assert.equal(f.brain.episodic.pending.length,0);assert.equal(f.brain.baseline,0);assert.ok([...f.brain.plastic,...f.brain.eligibility,...Object.values(f.brain.activity)].every(x=>x===0));}
    if(!p.arms[row.arm].memoryLearning)assert.ok(world.flies.every(f=>f.brain.episodic.memory.records.length===0&&f.brain.episodic.memory.seen===0));
    if(!p.arms[row.arm].mutation)assert.ok(world.flies.every(f=>initialNodes.has(f.genome.nodes.length)));
    if(world.tick%p.sampleEvery===0)observe();
  }
  if(samples.at(-1).tick!==world.tick)observe();assert.deepEqual(samples,row.measurement.samples);assert.deepEqual(world.metrics(),row.metrics);assert.deepEqual(world.totals,row.totals);
  const lifetimeTicks=world.lineage.reduce((sum,f)=>sum+Math.min(world.tick,f.died??world.tick)-f.born,0);assert.equal(ticks,lifetimeTicks);assert.equal(ticks,row.measurement.populationTicks);near(ticks*DT,row.measurement.agentSeconds);assert.equal(peak,row.measurement.peakPopulation);assert.equal(children,row.measurement.checkedNewborns);assert.equal(children,world.totals.births);assert.equal(hash(JSON.stringify(world.checkpoint())),row.finalSha256);
  const stem=`${row.seed}-${row.environment}-${row.arm}`,checkpoint=JSON.parse(await readFile(join(directory,'checkpoints',stem+'-checkpoint.json'))),final=JSON.parse(await readFile(join(directory,'checkpoints',stem+'-final.json')));assert.equal(hash(JSON.stringify(checkpoint)),row.continuation.checkpointSha256);assert.equal(hash(JSON.stringify(final)),row.finalSha256);assert.deepEqual(final,world.checkpoint());const continued=World.restore(checkpoint);continued.advance(p.horizonTicks-continued.tick);assert.deepEqual(continued.checkpoint(),final);
  replays.push({seed:row.seed,environment:row.environment,arm:row.arm,inputRowSha256:hash(JSON.stringify(row)),populationTicks:ticks,lifetimeTicks,checkedNewborns:children,exactSamples:true,exactMetrics:true,exactCompleteState:true,exactCheckpointContinuation:true,finalSha256:row.finalSha256});console.log(JSON.stringify({directory,checked:replays.length,total:selected.length,arm:row.arm,environment:row.environment}));
}
const source=await readFile(new URL(import.meta.url));await writeFile(join(directory,'replay-source.mjs'),source);const result={at:new Date().toISOString(),sourceSha256:hash(source),protocolSha256:hash(await readFile(join(directory,'protocol.json'))),replays,scope:'Independent cold physical replay and separate lifetime-sum exposure calculation on the first fixed seed in both environments and all four arms. Exact whole-state, samples, metrics, newborn state and midpoint continuation; not every study seed.'};await writeFile(join(directory,'replays.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
