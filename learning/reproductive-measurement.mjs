import assert from 'node:assert/strict';
import {DT} from '../engine.mjs';

// Read-only instrumentation of a world trajectory. This adds no reward,
// controller update, mate attraction, resource or demographic intervention.
export function measureReproductiveWorld(world,{untilTick,sampleEvery=100,onProgress=null,onCheckpoint=null,checkpointAt=null}={}){
  if(!Number.isSafeInteger(untilTick)||untilTick<=world.tick||!Number.isSafeInteger(sampleEvery)||sampleEvery<1)throw Error('Invalid reproductive measurement horizon');
  const startTick=world.tick,initialBirths=world.totals.births,initialDeaths=world.totals.deaths,initialNodes=new Set(world.flies.map(f=>f.genome.nodes.length));
  let populationTicks=0,peakPopulation=world.flies.length,checkedNewborns=0,maxAbsoluteAccountingError=0;
  const samples=[];
  function sample(){
    const females=world.flies.filter(f=>f.sex===0),males=world.flies.filter(f=>f.sex===1),ready=f=>f.energy>=65&&f.age>=f.genome.traits.maturity&&f.cooldown<=0,rf=females.filter(ready),rm=males.filter(ready);
    let readyPairs=0,positiveMatePairs=0;for(const a of rf)for(const b of rm)if(Math.hypot(a.x-b.x,a.y-b.y)<=26){readyPairs++;if(a.lastActions[3]>0&&b.lastActions[3]>0)positiveMatePairs++;}
    const metrics=world.metrics();maxAbsoluteAccountingError=Math.max(maxAbsoluteAccountingError,Math.abs(metrics.accountingError));
    if(world.config.episodicParameters.memoryLearning===false)assert.ok(world.flies.every(f=>f.brain.episodic.memory.seen===0&&f.brain.episodic.memory.records.length===0));
    if(!world.config.mutation)assert.ok(world.flies.every(f=>initialNodes.has(f.genome.nodes.length)));
    samples.push({tick:world.tick,population:metrics.population,births:metrics.births,deaths:metrics.deaths,generation:metrics.generation,meanNodes:metrics.meanNodes,meanEnergy:metrics.meanEnergy,food:metrics.food,females:females.length,males:males.length,readyFemales:rf.length,readyMales:rm.length,readyPairs,positiveMatePairs,accountingError:metrics.accountingError,status:metrics.status});
  }
  sample();
  while(world.tick<untilTick&&world.flies.length&&!world.capacityReached){
    const population=world.flies.length;if(!world.step())break;populationTicks+=population;peakPopulation=Math.max(peakPopulation,world.flies.length);
    for(const f of world.flies)if(f.born===world.tick){
      assert.equal(f.brain.actor.steps,0);assert.equal(f.brain.episodic.steps,0);assert.equal(f.brain.episodic.memory.seen,0);assert.equal(f.brain.episodic.memory.records.length,0);assert.equal(f.brain.episodic.pending.length,0);assert.equal(f.brain.baseline,0);assert.ok(f.brain.plastic.every(x=>x===0));assert.ok(f.brain.eligibility.every(x=>x===0));assert.ok(Object.values(f.brain.activity).every(x=>x===0));checkedNewborns++;
    }
    if(world.tick===checkpointAt&&onCheckpoint)onCheckpoint(world);
    if(world.tick%sampleEvery===0){sample();if(onProgress)onProgress({tick:world.tick,population:world.flies.length,peakPopulation,births:world.totals.births,deaths:world.totals.deaths});}
  }
  if(samples.at(-1).tick!==world.tick)sample();
  const capacityCensored=world.capacityReached,terminal=capacityCensored?'capacity':world.flies.length===0?'extinct':world.tick===untilTick?'horizon':'stopped';
  return{startTick,endTick:world.tick,requestedEndTick:untilTick,populationTicks,agentSeconds:populationTicks*DT,peakPopulation,checkedNewborns,births:world.totals.births-initialBirths,deaths:world.totals.deaths-initialDeaths,endingPopulation:world.flies.length,aliveAtHorizon:capacityCensored?null:world.tick===untilTick&&world.flies.length>0?1:0,capacityCensored,terminal,maxAbsoluteAccountingError,samples};
}
