import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DT} from '../engine.mjs';

const base=process.argv[2]||'http://127.0.0.1:8767',directory=resolve(process.argv[3]||`evidence/runtime-profile/${randomUUID()}`),seconds=Number(process.argv[4]||60);
if(!Number.isFinite(seconds)||seconds<15||seconds>600)throw Error('Live sample must be 15–600 seconds');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const latencies=[],samples=[];
const get=async path=>{
  const start=performance.now(),response=await fetch(base+path,{signal:AbortSignal.timeout(15_000)}),data=await response.json();
  latencies.push({path,ms:performance.now()-start,status:response.status});if(!response.ok)throw Error(path+' returned '+response.status+': '+JSON.stringify(data));return data;
};
const health=await get('/healthz'),initial=await get('/api/ecosystems'),active=initial.filter(w=>!w.paused);
if(!health.ok||!active.length)throw Error('No healthy running habitats to observe');
console.log(JSON.stringify({directory,phase:'warming-up',active:active.map(w=>w.id)}));
// Settle startup/export work before starting the measurement. Read-only.
await new Promise(done=>setTimeout(done,10_000));
const start=performance.now(),sample=async()=>{const worlds=await get('/api/ecosystems');samples.push({wallMs:performance.now()-start,worlds});return worlds;};
await sample();let nextLog=10_000;const cursors=new Map();
while(performance.now()-start<seconds*1000) {
  for(const entry of active) {
    const cursor=cursors.get(entry.id)||{tick:0,event:0},frame=await get(`/api/ecosystems/${entry.id}/frame?sinceTick=${cursor.tick}&sinceEvent=${cursor.event}`);
    cursors.set(entry.id,{tick:frame.metrics.tick,event:frame.eventCursor});
    if(samples.length%4===0&&frame.flies.length)await get(`/api/ecosystems/${entry.id}/agents/${frame.flies[0].id}`);
  }
  await sample();
  if(performance.now()-start>=nextLog) {console.log(JSON.stringify({directory,phase:'observing',wallSeconds:samples.at(-1).wallMs/1000}));nextLog+=10_000;}
  await new Promise(done=>setTimeout(done,250));
}
const first=samples[0],last=samples.at(-1),duration=(last.wallMs-first.wallMs)/1000,ms=latencies.map(row=>row.ms).sort((a,b)=>a-b);
const worlds=active.map(w=>{const begin=first.worlds.find(x=>x.id===w.id),end=last.worlds.find(x=>x.id===w.id);return {id:w.id,name:w.name,requestedSpeed:end.speed,ratio:(end.metrics.tick-begin.metrics.tick)*DT/duration,initial:begin,final:end,droppedTicksDuringWindow:end.runtime&&begin.runtime?end.runtime.droppedTicks-begin.runtime.droppedTicks:null,clippedWallSecondsDuringWindow:end.runtime&&begin.runtime?end.runtime.clippedWallSeconds-begin.runtime.clippedWallSeconds:null};});
const report={at:new Date().toISOString(),base,health,secondsObserved:duration,worlds,samples,latencies,requestLatencyMs:{count:ms.length,median:ms[Math.floor(ms.length*.5)],p95:ms[Math.floor(ms.length*.95)],max:ms.at(-1)},scope:'Read-only observation of the real live platform with frame/agent/list polling and its existing autosaves. Ten-second warmup excluded. Actual tick deltas; no population reset, scheduler changes, speed controls or policy intervention. Finite sample, not animation FPS or a causal optimization comparison.'};
await writeFile(join(directory,'live-sample.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({directory,phase:'done',secondsObserved:duration,worlds:worlds.map(w=>({id:w.id,name:w.name,ratio:w.ratio,population:w.final.metrics.population,meanNodes:w.final.metrics.meanNodes,droppedTicks:w.droppedTicksDuringWindow,clippedWallSeconds:w.clippedWallSecondsDuringWindow})),requestLatencyMs:report.requestLatencyMs}));
