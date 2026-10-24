import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EcosystemManager} from '../platform/manager.mjs';
import {createPlatform} from '../platform/server.mjs';

async function workspace(t) {
  const directory = await mkdtemp(join(tmpdir(), 'afterwing-platform-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const manager = new EcosystemManager(directory);
  await manager.init();
  return {directory, manager};
}

test('ecosystems and forked branches own independent neural state and random streams', async t => {
  const {manager} = await workspace(t);
  const first = await manager.create({name: 'Learning habitat', config: {seed: 7, founders: 8}});
  const second = await manager.create({name: 'Control habitat', config: {seed: 7, founders: 8}});
  const a = first.ecosystem.id, b = second.ecosystem.id;
  const untouched = manager.get(b).world.checkpoint();
  await manager.control(a, {action: 'step', ticks: 100});
  assert.deepEqual(manager.get(b).world.checkpoint(), untouched);
  const branch = await manager.fork(a, 'Independent branch');
  const c = branch.ecosystem.id;
  assert.equal(branch.ecosystem.parentId, a);
  assert.equal(branch.ecosystem.paused, true);
  assert.deepEqual(manager.get(c).world.flies, manager.get(a).world.flies);
  assert.notEqual(manager.get(c).world.flies[0].brain, manager.get(a).world.flies[0].brain);
  const source = manager.get(a).world.checkpoint();
  await manager.control(c, {action: 'step', ticks: 20});
  assert.deepEqual(manager.get(a).world.checkpoint(), source);
  assert.equal(manager.state(c).metrics.tick, 120);
});

test('platform controls expose actual offspring genomes with fresh acquired state', async t => {
  const {manager} = await workspace(t);
  const created = await manager.create({name: 'Inheritance', config: {founders: 2, mutation: false}});
  const id = created.ecosystem.id;
  const world = manager.get(id).world;
  for (const fly of world.flies) {
    fly.x = fly.y = 180; fly.age = 35; fly.energy = 100;
    fly.brain.plastic.fill(.4);
  }
  world.initialEnergy = world.energy();
  const state = await manager.control(id, {action: 'step', ticks: 1});
  assert.equal(state.metrics.births, 1);
  assert.equal(state.metrics.population, 3);
  const child = manager.inspect(id, 3);
  assert.deepEqual(child.parents, [1, 2]);
  assert.equal(child.generation, 1);
  assert.ok(child.brain.plastic.every(value => value === 0));
  assert.ok(Object.values(child.brain.activity).every(value => value === 0));
  assert.ok(Math.abs(state.metrics.accountingError) < 1e-7);
});

test('checkpoint restore archives the preceding world; restart recovers exact state paused', async t => {
  const {directory, manager} = await workspace(t);
  const created = await manager.create({name: 'Continuation', config: {founders: 8}});
  const id = created.ecosystem.id;
  await manager.control(id, {action: 'step', ticks: 30});
  const original = manager.get(id).world.checkpoint();
  const saved = await manager.control(id, {action: 'checkpoint'});
  await manager.control(id, {action: 'step', ticks: 20});
  await manager.control(id, {action: 'restore', name: saved.savedCheckpoint});
  assert.deepEqual(manager.get(id).world.checkpoint(), original);
  const names = await manager.checkpoints(id);
  assert.equal(names.length, 2);
  const previous = names.find(name => name !== saved.savedCheckpoint);
  assert.equal((await manager.get(id).store.load(previous)).checkpoint.world.tick, 50);
  await manager.control(id, {action: 'speed', value: 5});
  await manager.control(id, {action: 'run'});
  const recovered = new EcosystemManager(directory);
  await recovered.init();
  assert.equal(recovered.state(id).ecosystem.paused, true);
  assert.equal(recovered.state(id).ecosystem.speed, 5);
  assert.deepEqual(recovered.get(id).world.checkpoint(), original);
  await manager.control(id, {action: 'step', ticks: 25});
  await recovered.control(id, {action: 'step', ticks: 25});
  assert.deepEqual(recovered.get(id).world.checkpoint(), manager.get(id).world.checkpoint());
});

test('concurrent controls serialize, active worlds share compute, and capacity edits remain recoverable', async t => {
  const {manager} = await workspace(t);
  const a = (await manager.create({name: 'A', config: {founders: 4}})).ecosystem.id;
  const b = (await manager.create({name: 'B', config: {founders: 4}})).ecosystem.id;
  const results = await Promise.all([manager.control(a, {action: 'step', ticks: 10}), manager.control(a, {action: 'step', ticks: 10})]);
  assert.deepEqual(results.map(result => result.metrics.tick), [10, 20]);
  const config = structuredClone(manager.get(a).world.config);
  manager.get(a).world.flies = []; // Extinction permits no new founders or invalid capacity.
  await assert.rejects(manager.control(a, {action: 'configure', config: {capacity: 2}}), /cover founders/);
  await assert.rejects(manager.control(a, {action: 'configure', config: {capacity: 0}}), /Invalid capacity/);
  assert.deepEqual(manager.get(a).world.config, config);
  await assert.rejects(manager.control(a, {action: 'run'}), /stopped/);
  await manager.control(b, {action: 'run'});
  const c = (await manager.create({name: 'C', config: {founders: 4}})).ecosystem.id;
  await manager.control(c, {action: 'run'});
  manager.advanceRealtime(.1, 100);
  assert.equal(manager.state(b).metrics.tick, 1);
  assert.equal(manager.state(c).metrics.tick, 1);
  assert.equal(manager.state(a).metrics.tick, 20);
});

test('realtime backlog catches up only owed ticks and respects paused or pending controls',async t=>{
 const {manager}=await workspace(t),id=(await manager.create({name:'Catch-up',config:{founders:2,reproduction:false,challenges:'off'}})).ecosystem.id;
 assert.equal(manager.advanceRealtime(.2,0),false);
 await manager.control(id,{action:'speed',value:10});await manager.control(id,{action:'run'});
 assert.equal(manager.advanceRealtime(.2,0),true);assert.equal(manager.get(id).world.tick,0);
 assert.equal(manager.advanceRealtime(0,1000),false);assert.equal(manager.get(id).world.tick,20);
 assert.equal(manager.advanceRealtime(0,1000),false);assert.equal(manager.get(id).world.tick,20);
 const entry=manager.get(id);entry.pending++;assert.equal(manager.advanceRealtime(.2,1000),false);entry.pending--;assert.equal(entry.world.tick,20);
 await manager.control(id,{action:'pause'});assert.equal(manager.advanceRealtime(.2,1000),false);assert.equal(entry.world.tick,20);
});

test('recovery preserves corrupt evidence and persistence failures pause the affected ecosystem', async t => {
  const {directory, manager} = await workspace(t);
  const id = (await manager.create({name: 'Recovery', config: {founders: 2}})).ecosystem.id;
  const file = join(directory, id, 'autosave.json');
  await writeFile(file, 'broken recovery');
  const recovered = new EcosystemManager(directory);
  await assert.rejects(recovered.init(), /JSON|Unexpected/);
  assert.equal(await readFile(file, 'utf8'), 'broken recovery');
  const entry = manager.get(id);
  entry.store.save = async () => { throw Error('Disk full'); };
  await assert.rejects(manager.control(id, {action: 'run'}), /Disk full/);
  assert.equal(manager.state(id).ecosystem.paused, true);
  assert.match(manager.state(id).ecosystem.error, /Checkpoint failed/);
});

for (const workers of [false,true]) test(`HTTP workflow creates, controls, inspects, checkpoints, forks and recovers independent ecosystems (${workers?'workers':'main'})`, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'afterwing-platform-http-'));
  let app = await createPlatform({directory, port: 0, realtime: false, workers});
  t.after(async () => { await app.close(); await rm(directory, {recursive: true, force: true}); });
  let base = `http://127.0.0.1:${app.server.address().port}`;
  const get = async path => { const res = await fetch(base + path); return {status: res.status, body: await res.json()}; };
  const post = async (path, data, headers = {}) => {
    const res = await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: JSON.stringify(data)});
    return {status: res.status, body: await res.json()};
  };
  assert.equal((await fetch(base)).status, 200);
  assert.match(await (await fetch(base)).text(), /A world of learning flies/);
  assert.equal((await fetch(base + '/app.js')).status, 200);
  assert.equal((await fetch(base + '/controller-adapter.mjs')).status, 200);
  assert.equal((await fetch(base + '/style.css')).status, 200);
  assert.equal((await get('/healthz')).body.ok, true);
  assert.equal((await get('/api/autonomy')).status, 200);
  assert.equal((await post('/api/autonomy', {action: 'start', rounds: 1000})).status, 400);
  assert.equal((await post('/api/ecosystems', {name: 'Foreign'}, {Origin: 'https://example.com'})).status, 403);
  assert.equal((await post('/api/ecosystems', {name: '', config: {}})).status, 400);
  const created = await post('/api/ecosystems', {name: 'Interactive lab', config: {founders: 8, seed: 23}});
  assert.equal(created.status, 201);
  const id = created.body.ecosystem.id;
  const path = `/api/ecosystems/${id}`;
  const frame = await get(path + '/frame?sinceTick=0&sinceEvent=0');
  assert.equal(frame.status, 200);
  assert.equal(frame.body.flies.length, 8);
  assert.equal(Object.hasOwn(frame.body, 'lineage'), false);
  assert.equal((await get(path + '/lineage?offset=0&limit=2')).body.items.length, 2);
  const earlierEvents = await get(path + '/events?offset=0&limit=2');
  assert.equal(earlierEvents.body.items.length, 1);
  assert.equal((await post(path + '/control', {action: 'step', ticks: 20})).body.metrics.tick, 20);
  assert.equal((await get(path + '/agents/1')).body.genome.nodes.length, 30);
  const checkpoint = await post(path + '/control', {action: 'checkpoint'});
  assert.equal((await get(path + '/checkpoints')).body.length, 1);
  const exportData = (await get(path + '/checkpoint')).body;
  assert.equal(exportData.world.tick, 20);
  assert.ok(exportData.provenance.sourceSha256['engine.mjs']);
  assert.ok(exportData.provenance.sourceSha256['learning/trace-actor.mjs']);
  assert.equal((await post(path + '/control', {action: 'step', ticks: 10})).body.metrics.tick, 30);
  assert.equal((await post(path + '/control', {action: 'restore', name: checkpoint.body.savedCheckpoint})).body.metrics.tick, 20);
  const fork = await post(path + '/fork', {name: 'Comparison branch'});
  assert.equal(fork.status, 201);
  assert.equal(fork.body.ecosystem.parentId, id);
  const branch = `/api/ecosystems/${fork.body.ecosystem.id}`;
  await post(branch + '/control', {action: 'step', ticks: 10});
  assert.equal((await get(path)).body.metrics.tick, 20);
  assert.equal((await get('/api/ecosystems')).body.length, 2);
  assert.equal((await post(path + '/control', {action: 'restore', name: '../autosave.json'})).status, 400);
  assert.equal((await get('/api/ecosystems/missing')).status, 404);
  await app.close();
  app = await createPlatform({directory, port: 0, realtime: false, workers});
  base = `http://127.0.0.1:${app.server.address().port}`;
  assert.equal((await get(path)).body.ecosystem.paused, true);
  assert.equal((await get(path)).body.metrics.tick, 20);
  assert.equal((await get(branch)).body.metrics.tick, 30);
});
