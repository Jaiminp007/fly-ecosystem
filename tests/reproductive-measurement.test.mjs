import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {measureReproductiveWorld} from '../learning/reproductive-measurement.mjs';
const config={seed:503,founders:12,capacity:240,controller:'episodic-actor',learning:true,mutation:false,reproduction:true,nutrient:3,seasonal:false};

test('reproductive measurement preserves complete trajectories and merges population exposure across checkpoint continuation',()=>{
  const a=new World(config),b=new World(config),full=measureReproductiveWorld(a,{untilTick:600,sampleEvery:100}),part=measureReproductiveWorld(b,{untilTick:300,sampleEvery:100}),restored=World.restore(b.checkpoint()),tail=measureReproductiveWorld(restored,{untilTick:600,sampleEvery:100});assert.deepEqual(a.checkpoint(),restored.checkpoint());assert.equal(full.populationTicks,part.populationTicks+tail.populationTicks);assert.equal(full.births,part.births+tail.births);assert.equal(full.deaths,part.deaths+tail.deaths);assert.equal(full.checkedNewborns,full.births);
  const plain=new World(config);plain.advance(600);assert.deepEqual(a.checkpoint(),plain.checkpoint());assert.equal(full.terminal,'horizon');assert.equal(full.aliveAtHorizon,1);
});

test('extinction credits only lived population time and capacity stop remains censored',()=>{
  const extinct=new World({...config,founders:4});for(const f of extinct.flies)f.energy=.00001;for(const p of extinct.food){p.amount=0;p.regrowth=0;}extinct.initialEnergy=extinct.energy();const r=measureReproductiveWorld(extinct,{untilTick:100});assert.equal(r.populationTicks,4);assert.equal(r.endingPopulation,0);assert.equal(r.terminal,'extinct');assert.equal(r.aliveAtHorizon,0);assert.equal(r.endTick,1);
  const capped=new World(config);capped.capacityReached=true;const c=measureReproductiveWorld(capped,{untilTick:100});assert.equal(c.populationTicks,0);assert.equal(c.terminal,'capacity');assert.equal(c.aliveAtHorizon,null);assert.equal(c.capacityCensored,true);assert.equal(c.endTick,0);
});
