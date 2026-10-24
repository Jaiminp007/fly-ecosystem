import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {challengeAt,fertility,stress} from '../challenges.mjs';
test('challenge schedule is deterministic with distinct food and danger pressures',()=>{
 const c={challenges:'cycle',challengeStartTick:100};assert.equal(challengeAt(c,100).index,0);assert.equal(challengeAt(c,1900).index,1);assert.equal(challengeAt(c,3700).renewal,.65);
 const drift=challengeAt(c,1900);assert.ok(fertility(drift,drift.bloom)>fertility(drift,{x:-1000,y:-1000}));const storm=challengeAt(c,5500);assert.equal(stress(storm,storm.hazard),.35);assert.equal(stress(storm,{x:-1000,y:-1000}),0);assert.equal(challengeAt({},6000),null);
});
test('challenge continuation, accounting and phase records survive checkpoints',()=>{
 const a=new World({seed:7,founders:12,challenges:'cycle'});a.advance(1850);const b=World.restore(JSON.parse(JSON.stringify(a.checkpoint())));a.advance(100);b.advance(100);assert.deepEqual(a.checkpoint(),b.checkpoint());assert.ok(Math.abs(a.metrics().accountingError)<1e-6);assert.equal(a.checkpoint().model,'compact-challenges-v2');assert.equal(a.challengeHistory[0].endTick,1800);
});
test('off preserves legacy dynamics; challenge activation cannot revive extinct worlds',()=>{
 const a=new World({seed:23}),b=new World({seed:23,challenges:'off'});a.advance(100);b.advance(100);assert.deepEqual(a.metrics(),b.metrics());assert.equal(a.rng.state,b.rng.state);
 a.flies=[];a.config.challenges='cycle';const tick=a.tick;a.advance(100);assert.equal(a.tick,tick);const cp=b.checkpoint();cp.model='compact-challenges-v2';assert.throws(()=>World.restore(cp),/mismatch/);
});

test('stress-zone costs preserve energy accounting and expose danger to sensors',()=>{
 const w=new World({founders:2,challenges:'cycle',nutrient:0});w.tick=5399;const c=challengeAt(w.config,5400);w.flies.forEach(f=>{f.x=c.hazard.x;f.y=c.hazard.y;f.energy=100;});w.food.forEach(p=>p.amount=0);w.initialEnergy=w.energy();w.step();assert.ok(w.flies.every(f=>f.energy<100));assert.ok(Math.abs(w.metrics().accountingError)<1e-7);assert.equal(w.snapshot().challenge.index,3);
});

test('seeded food relocations are checkpointable and preserve accounting without consuming the world RNG',()=>{
 const baseline=new World({seed:41,founders:8,ecology:'baseline'});
 const moving=new World({seed:41,founders:8,ecology:'relocation'});
 assert.deepEqual(baseline.flies,moving.flies);
 assert.equal(baseline.rng.state,moving.rng.state);
 moving.nextRelocationTick=1;
 const resumed=World.restore(JSON.parse(JSON.stringify(moving.checkpoint())));
 moving.step();resumed.step();
 assert.deepEqual(moving.checkpoint(),resumed.checkpoint());
 assert.equal(moving.events.at(-1).kind,'resource-shift');
 assert.notDeepEqual(moving.resourceCenters,baseline.resourceCenters);
 assert.ok(Math.abs(moving.metrics().accountingError)<1e-7);
 assert.equal(moving.snapshot().model,'compact-relocation-v3');
});

test('observations expose agent actions, senses and lifetime death causes without drawing randomness',()=>{
 const w=new World({seed:13,founders:4});
 w.step();const rng=w.rng.state;const snapshot=w.snapshot();
 assert.equal(w.rng.state,rng);
 assert.equal(snapshot.interface.inputs.length,17);
 assert.equal(snapshot.flies[0].actions.length,5);
 assert.equal(snapshot.flies[0].inputs.length,17);
 assert.ok(Object.hasOwn(snapshot.flies[0],'energyCost'));
});

test('signal ablations cost no signal energy when disabled and round-trip their mode',()=>{
 const w=new World({seed:19,founders:8,signalMode:'disabled'});
 w.advance(30);
 assert.equal(w.totals.signalCost,0);
 assert.ok(Math.abs(w.metrics().accountingError)<1e-7);
 const checkpoint=JSON.parse(JSON.stringify(w.checkpoint()));
 assert.equal(checkpoint.model,'compact-signals-v4');
 assert.deepEqual(World.restore(checkpoint).checkpoint(),checkpoint);
});
