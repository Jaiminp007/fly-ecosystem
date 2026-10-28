import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {World} from '../engine.mjs';
import {EcosystemManager} from '../platform/manager.mjs';
import {WorkerEcosystemManager} from '../platform/worker-manager.mjs';

async function workspace(t) {
  const root=await mkdtemp(join(tmpdir(),'afterwing-worker-manager-')),managers=[];
  t.after(async()=>{try{for(const manager of managers)await manager.close();}finally{await rm(root,{recursive:true,force:true});}});
  return {root,async manager(name,Type=WorkerEcosystemManager){const manager=new Type(join(root,name));await manager.init();managers.push(manager);return manager;}};
}
const withoutMetadata=state=>{const {ecosystem,...view}=state;return view;};

test('worker server views, acquired state, controls and disk checkpoints match the local backend',async t=>{
  const space=await workspace(t),worker=await space.manager('worker'),local=await space.manager('local',EcosystemManager);
  for(const controller of ['neural','trace-actor','episodic-actor']) {
    const config={seed:187,founders:6,capacity:80,...(controller==='neural'?{}:{controller})};
    if(controller==='episodic-actor')config.episodicParameters={actuator:'joint',returnMode:'td',decisionTicks:8,creditTicks:8,discount:.99,moveMode:'levels'};
    const a=(await worker.create({name:controller,config})).ecosystem.id,b=(await local.create({name:controller,config})).ecosystem.id;
    const outcomes=await Promise.all([worker.control(a,{action:'step',ticks:80}),local.control(b,{action:'step',ticks:80})]);
    assert.deepEqual(withoutMetadata(outcomes[0]),withoutMetadata(outcomes[1]));
    assert.deepEqual(withoutMetadata(await worker.frame(a,{sinceTick:40,sinceEvent:1})),withoutMetadata(local.frame(b,{sinceTick:40,sinceEvent:1})));
    assert.deepEqual(await worker.inspect(a,1),local.inspect(b,1));
    assert.deepEqual(await worker.eventPage(a,{limit:2}),local.eventPage(b,{limit:2}));
    assert.deepEqual(await worker.lineage(a,{limit:3}),local.lineage(b,{limit:3}));
    await assert.rejects(worker.eventPage(a,{offset:-1}),/Invalid event page/);
    await assert.rejects(worker.control(a,{action:'configure',config:{controller:'trace-actor'}}),/Unsupported/);
    await assert.rejects(worker.control(a,{action:'configure',config:{capacity:0}}),/Invalid capacity/);
    await worker.control(a,{action:'configure',config:{nutrient:.7}});await local.control(b,{action:'configure',config:{nutrient:.7}});
    assert.deepEqual(await worker.get(a).world.checkpoint(),local.get(b).world.checkpoint());
    const disk=JSON.parse(await readFile(join(space.root,'worker',a,'autosave.json'),'utf8'));
    assert.deepEqual(disk.checkpoint,local.get(b).world.checkpoint());
    const saved=await worker.control(a,{action:'checkpoint'}),original=disk.checkpoint;
    const steps=await Promise.all([worker.control(a,{action:'step',ticks:12}),worker.control(a,{action:'step',ticks:18})]);
    assert.deepEqual(steps.map(s=>s.metrics.tick),[92,110]);
    await worker.control(a,{action:'restore',name:saved.savedCheckpoint});
    assert.deepEqual(await worker.get(a).world.checkpoint(),original);
    const previous=(await worker.checkpoints(a)).find(name=>name!==saved.savedCheckpoint);
    assert.equal((await worker.get(a).store.load(previous)).checkpoint.world.tick,110);
  }
  const recovered=await space.manager('worker');
  for(const entry of worker.experiments.values()) {
    assert.equal(recovered.get(entry.id).paused,true);
    assert.deepEqual(await recovered.get(entry.id).world.checkpoint(),await entry.world.checkpoint());
  }
});

test('worker realtime scheduling accrues during work, advances only owed ticks and leaves paused worlds untouched',async t=>{
  const space=await workspace(t),manager=await space.manager('scheduler');
  const a=(await manager.create({name:'A',config:{founders:2,reproduction:false,challenges:'off'}})).ecosystem.id;
  const b=(await manager.create({name:'B',config:{founders:2,reproduction:false,challenges:'off'}})).ecosystem.id;
  const initial=await manager.get(a).world.checkpoint();
  await manager.control(a,{action:'speed',value:10});await manager.control(a,{action:'run'});
  assert.equal(manager.advanceRealtime(.2),true);
  manager.advanceRealtime(.1); // Adds debt while the first worker unit is pending.
  await manager.get(a).queue;
  assert.equal(manager.get(a).metrics.tick,10);
  manager.advanceRealtime(0);await manager.get(a).queue;
  manager.advanceRealtime(0);await manager.get(a).queue;
  assert.equal(manager.get(a).metrics.tick,30);
  manager.advanceRealtime(0);await manager.get(a).queue;assert.equal(manager.get(a).metrics.tick,30);
  assert.equal(manager.get(b).metrics.tick,0);
  let release;const gate=new Promise(done=>{release=done;});
  const blocked=manager.exclusive(manager.get(a),()=>gate);
  for(let i=0;i<6;i++)manager.advanceRealtime(.25);
  assert.equal(manager.get(a).owed,150);assert.equal(manager.get(a).runtime.droppedTicks,0);
  release();await blocked;
  while(manager.get(a).owed>=1){manager.advanceRealtime(0);await manager.get(a).queue;}
  const exact=World.restore(initial);exact.advance(180);
  assert.deepEqual(await manager.get(a).world.checkpoint(),exact.checkpoint());
  await manager.control(a,{action:'pause'});assert.equal(manager.advanceRealtime(.2),false);
  assert.equal(manager.get(a).metrics.tick,180);
});

test('worker-side checkpoint failure pauses the habitat without overwriting previous evidence',async t=>{
  const space=await workspace(t),manager=await space.manager('failure');
  const id=(await manager.create({name:'Save failure',config:{founders:2}})).ecosystem.id;
  const directory=join(space.root,'failure',id),previous=await readFile(join(directory,'autosave.json'),'utf8');
  await rename(directory,directory+'.offline');
  try {
    await assert.rejects(manager.control(id,{action:'run'}),/ENOENT/);
    assert.equal(manager.get(id).paused,true);assert.match(manager.get(id).error,/Checkpoint failed:.*ENOENT/);
    assert.equal(await readFile(join(directory+'.offline','autosave.json'),'utf8'),previous);
  } finally {await rename(directory+'.offline',directory);}
  await manager.flush();assert.equal(manager.get(id).error,null);
});
