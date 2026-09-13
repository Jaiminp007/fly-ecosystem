import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CheckpointStore} from '../persistence.mjs';
import {World} from '../engine.mjs';
import {telemetry} from '../telemetry.mjs';
test('serialized saves, rolling retention and malformed recovery preservation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'afterwing-'));try{const store=new CheckpointStore(dir,{retain:2});await store.init();assert.equal(await store.recover(),null);
 await Promise.all([store.save('autosave.json',{order:1}),store.save('autosave.json',{order:2})]);assert.equal((await store.recover()).order,2);
 for(let tick=0;tick<4;tick++)await store.rolling({world:{tick}});assert.equal((await store.list()).length,2);
 await assert.rejects(store.load('../secret.json'));await writeFile(join(dir,'autosave.json'),'broken');await assert.rejects(store.recover());assert.equal(await readFile(join(dir,'autosave.json'),'utf8'),'broken');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('telemetry detects a single-sex bottleneck without mutating the world',()=>{const w=new World();w.flies.forEach(f=>f.sex=0);const before=JSON.stringify(w.checkpoint());const t=telemetry(w);assert.equal(t.reproductiveBottleneck,true);assert.equal(t.sexes[1].population,0);assert.equal(JSON.stringify(w.checkpoint()),before);});
