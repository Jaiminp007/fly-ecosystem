import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {WorkerWorld} from '../platform/worker-world.mjs';

test('worker owns independent state and serializes concurrent commands with exact full-world continuation',async t=>{
 const world=new World({seed:73,founders:8,capacity:80,controller:'episodic-actor',ecology:'relocation',episodicParameters:{actuator:'joint',returnMode:'td',decisionTicks:8,creditTicks:8,discount:.99,moveMode:'levels'}});world.advance(80);const checkpoint=world.checkpoint(),worker=new WorkerWorld(checkpoint);t.after(()=>worker.close());
 await worker.ready;checkpoint.world.flies[0].energy=0;
 const results=await Promise.all([worker.advance(12),worker.advance(18)]);world.advance(30);assert.deepEqual(results.map(x=>x.tick),[92,110]);assert.deepEqual(await worker.checkpoint(),world.checkpoint());
 const inspection=await worker.inspect(world.flies[0].id);inspection.energy=0;assert.deepEqual(await worker.checkpoint(),world.checkpoint());assert.deepEqual(await worker.frame({sinceTick:80}),world.frame({sinceTick:80}));
 await assert.rejects(worker.advance(1001),/1–1000/);assert.deepEqual(await worker.checkpoint(),world.checkpoint());
 await worker.close();await assert.rejects(worker.metrics(),/closed/);
});
test('two workers do not share acquired state or randomness, and report malformed startup state',async t=>{
 const world=new World({seed:91,founders:4,controller:'trace-actor'}),original=world.checkpoint(),a=new WorkerWorld(original),b=new WorkerWorld(original);t.after(()=>Promise.all([a.close(),b.close()]));await Promise.all([a.ready,b.ready]);await a.advance(40);assert.deepEqual(await b.checkpoint(),original);world.advance(40);assert.deepEqual(await a.checkpoint(),world.checkpoint());
 const invalid=structuredClone(original);invalid.world.rng.state=0;const bad=new WorkerWorld(invalid);t.after(()=>bad.close());await assert.rejects(bad.ready,/clock or geometry/);
});
test('closing during startup rejects waiting requests and remains idempotent',async()=>{
 const worker=new WorkerWorld(new World({seed:11,founders:2}).checkpoint()),request=assert.rejects(worker.metrics(),/closed/);await worker.close();await request;await worker.close();await assert.rejects(worker.ready,/closed/);await assert.rejects(worker.checkpoint(),/closed/);
});
