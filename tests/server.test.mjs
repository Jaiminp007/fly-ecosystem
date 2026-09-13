import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {once} from 'node:events';
import {resolve} from 'node:path';

test('local HTTP workflow persists and restores a world; rejects cross-origin and invalid imports',async()=>{
  await mkdir('runs',{recursive:true});const dir=await mkdtemp(resolve('runs/http-test-'));const port=18765;
  const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),RUNS_DIR:dir},stdio:['ignore','pipe','pipe']});
  try{
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server startup timed out')),6000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);child.once('exit',code=>{if(code)reject(new Error(`Server exited ${code}`));});});
    const base=`http://127.0.0.1:${port}`;
    const get=async p=>(await fetch(base+p)).json();
    const post=async data=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
    assert.equal((await fetch(base)).status,200);
    const before=await get('/api/state');assert.equal(before.metrics.tick,0);
    assert.equal((await post({action:'step'})).data.metrics.tick,10);
    const saved=await post({action:'save'});assert.equal(saved.status,200);
    await post({action:'step'});await post({action:'load',name:saved.data.name});assert.equal((await get('/api/state')).metrics.tick,10);
    const checkpoint=await get('/api/checkpoint');assert.equal((await post({action:'import',checkpoint})).status,200);
    checkpoint.world.flies[0].x=null;assert.equal((await post({action:'import',checkpoint})).status,400);assert.equal((await get('/api/state')).metrics.tick,10);
    const cross=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://example.com'},body:'{"action":"run"}'});assert.equal(cross.status,403);
    assert.equal((await post({action:'speed',value:5})).data.runtime.speed,5);
    await post({action:'run'});await new Promise(r=>setTimeout(r,250));await post({action:'pause'});assert.ok((await get('/api/state')).metrics.tick>10);
    const bad=await post({action:'load',name:'../../etc/passwd'});assert.equal(bad.status,400);
  }finally{child.kill('SIGTERM');await once(child,'exit');await rm(dir,{recursive:true,force:true});}
});
