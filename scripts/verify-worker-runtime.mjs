import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {World,DT} from '../engine.mjs';
import {createPlatform} from '../platform/server.mjs';

// Uses archived live-world copies. It never controls the source server.
const inputDirectory=resolve(process.argv[2]||'evidence/worker-world-benchmark/84f0a74d-4c1d-45b1-92d0-15f556ba99e5');
const directory=resolve(process.argv[3]||`evidence/worker-runtime/${randomUUID()}`);
const seconds=Number(process.argv[4]||60);
if(!Number.isFinite(seconds)||seconds<15||seconds>600)throw Error('Runtime observation must be 15–600 seconds');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const reference=JSON.parse(await readFile(join(inputDirectory,'results.json'),'utf8'));
const inputs=[],sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','platform/manager.mjs','platform/worker-manager.mjs','platform/worker-world.mjs','platform/world-worker.mjs','platform/server.mjs','platform/controller-adapter.mjs','platform/autonomy.mjs','persistence.mjs','telemetry.mjs','scripts/verify-worker-runtime.mjs'],sourceSha256={};
for(const file of sourceFiles) {
  const bytes=await readFile(file);sourceSha256[file]=createHash('sha256').update(bytes).digest('hex');
  const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);
}
for(const input of reference.inputs) {
  const bytes=await readFile(join(inputDirectory,input.id+'.json')),checkpoint=World.restore(JSON.parse(bytes)).checkpoint();
  const savedAt=new Date().toISOString(),path=join(directory,'runs',input.id);await mkdir(path,{recursive:true});
  await writeFile(join(directory,input.id+'-initial.json'),JSON.stringify(checkpoint));
  await writeFile(join(path,'autosave.json'),JSON.stringify({schema:1,id:input.id,name:input.name,createdAt:savedAt,parentId:null,speed:10,savedAt,checkpointClock:0,checkpoint}));
  inputs.push({...input,checkpoint,inputSha256:createHash('sha256').update(bytes).digest('hex')});
}
const app=await createPlatform({directory:join(directory,'runs'),autonomyDirectory:join(directory,'autonomy'),port:0,workers:true});
const base=`http://127.0.0.1:${app.server.address().port}`,samples=[],latencies=[],cursors=new Map();
const request=async(path,data)=>{
  const start=performance.now(),response=await fetch(base+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),body=await response.json();
  latencies.push({path,ms:performance.now()-start,status:response.status});
  if(!response.ok)throw Error(path+' returned '+response.status+': '+JSON.stringify(body));return body;
};
console.log(JSON.stringify({directory,base,seconds,phase:'starting'}));
try {
  for(const input of inputs)await request(`/api/ecosystems/${input.id}/control`,{action:'run'});
  const start=performance.now(),first=await request('/api/ecosystems');
  samples.push({wallMs:performance.now()-start,worlds:first});
  let nextLog=10_000;
  while(performance.now()-start<seconds*1000) {
    for(const input of inputs) {
      const cursor=cursors.get(input.id)||{tick:0,event:0};
      const frame=await request(`/api/ecosystems/${input.id}/frame?sinceTick=${cursor.tick}&sinceEvent=${cursor.event}`);
      cursors.set(input.id,{tick:frame.metrics.tick,event:frame.eventCursor});
      if(!frame.flies.length||frame.ecosystem.paused)throw Error('Observation world stopped: '+input.id);
      if(samples.length%4===0)await request(`/api/ecosystems/${input.id}/agents/${frame.flies[0].id}`);
    }
    samples.push({wallMs:performance.now()-start,worlds:await request('/api/ecosystems')});
    if(performance.now()-start>=nextLog) {
      const last=samples.at(-1),previous=samples.findLast(row=>row.wallMs<=last.wallMs-9000)||samples[0];
      console.log(JSON.stringify({directory,phase:'observing',wallSeconds:last.wallMs/1000,ratios:last.worlds.map(w=>({id:w.id,ratio:(w.metrics.tick-previous.worlds.find(p=>p.id===w.id).metrics.tick)*DT/((last.wallMs-previous.wallMs)/1000),population:w.metrics.population,meanNodes:w.metrics.meanNodes}))}));nextLog+=10_000;
      await writeFile(join(directory,'progress.json'),JSON.stringify({sourceSha256,samples,latencies},null,2));
    }
    await new Promise(done=>setTimeout(done,250));
  }
  for(const input of inputs)await request(`/api/ecosystems/${input.id}/control`,{action:'pause'});
  const final=[];
  for(const input of inputs) {
    const exported=await request(`/api/ecosystems/${input.id}/checkpoint`),{provenance,...checkpoint}=exported;
    await writeFile(join(directory,input.id+'-final.json'),JSON.stringify(checkpoint));
    const disk=JSON.parse(await readFile(join(directory,'runs',input.id,'autosave.json'),'utf8'));
    if(!isDeepStrictEqual(checkpoint,disk.checkpoint))throw Error('Paused final autosave does not match exported state: '+input.id);
    const expected=World.restore(input.checkpoint),ticks=checkpoint.world.tick-expected.tick,replayStart=performance.now();expected.advance(ticks);
    if(!isDeepStrictEqual(checkpoint,expected.checkpoint()))throw Error('Serial trajectory differs: '+input.id);
    final.push({id:input.id,ticks,exactSerialMatch:true,exactDiskMatch:true,replayMs:performance.now()-replayStart,sha256:createHash('sha256').update(JSON.stringify(checkpoint)).digest('hex')});
    console.log(JSON.stringify({directory,phase:'exact-replay',...final.at(-1)}));
  }
  await app.close();
  // New workers must recover all acquired state without advancing the clock.
  const recovered=await createPlatform({directory:join(directory,'runs'),autonomyDirectory:join(directory,'autonomy'),port:0,realtime:false,workers:true});
  try {
    for(const row of final) {
      const checkpoint=await recovered.manager.get(row.id).world.checkpoint();
      if(createHash('sha256').update(JSON.stringify(checkpoint)).digest('hex')!==row.sha256)throw Error('Restart state differs: '+row.id);
      if(!recovered.manager.get(row.id).paused)throw Error('Restart resumed a habitat');row.exactRestartMatch=true;
    }
  } finally {await recovered.close();}
  for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==sourceSha256[file])throw Error('Runtime source changed during verification: '+file);
  const firstSample=samples[0],lastSample=samples.at(-1),duration=(lastSample.wallMs-firstSample.wallMs)/1000;
  const observation=lastSample.worlds.map(w=>({id:w.id,name:w.name,ratio:(w.metrics.tick-firstSample.worlds.find(p=>p.id===w.id).metrics.tick)*DT/duration,population:w.metrics.population,meanNodes:w.metrics.meanNodes,autosavedDuringWindow:w.savedAt!==firstSample.worlds.find(p=>p.id===w.id).savedAt,runtime:w.runtime}));
  const ui=latencies.filter(row=>/frame\?|\/agents\/|^\/api\/ecosystems$/.test(row.path)).map(row=>row.ms).sort((a,b)=>a-b);
  const report={at:new Date().toISOString(),sourceSha256,inputDirectory,secondsRequested:seconds,secondsObserved:duration,inputs:inputs.map(({checkpoint,...input})=>input),samples,latencies,observation,uiRequestLatencyMs:{count:ui.length,median:ui[Math.floor(ui.length*.5)],p95:ui[Math.floor(ui.length*.95)],max:ui.at(-1)},final,passed:observation.every(w=>w.ratio>=9.8&&w.autosavedDuringWindow&&w.runtime.droppedTicks===0)&&final.every(w=>w.exactSerialMatch&&w.exactDiskMatch&&w.exactRestartMatch),scope:'Isolated actual HTTP server using resident workers, UI frame/inspection polling and 15-second autosaves on copies of two archived live worlds. Original server stays untouched. Exact full-state serial replay and paused restart. Finite observation, not a promise for all future populations or 10× qualification for the original live instance.'};
  await writeFile(join(directory,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,phase:'done',observation,uiRequestLatencyMs:report.uiRequestLatencyMs,passed:report.passed}));
} catch(error) {
  await writeFile(join(directory,'failure.json'),JSON.stringify({at:new Date().toISOString(),error:{name:error.name,message:error.message},sourceSha256,samples,latencies},null,2));throw error;
} finally {await app.close();}
