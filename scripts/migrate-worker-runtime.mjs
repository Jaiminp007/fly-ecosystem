import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {openSync,closeSync} from 'node:fs';
import {execFile,spawn} from 'node:child_process';
import {promisify,isDeepStrictEqual} from 'node:util';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {World} from '../engine.mjs';

// Local, one-time migration. Stop the verified listener gracefully, preserve
// every final autosave, recover paused, compare every world, then resume only
// the habitats that were running before migration.
const verificationPath=resolve(process.argv[2]||''),verification=JSON.parse(await readFile(verificationPath,'utf8'));
if(!verification.passed||!verification.final.every(w=>w.exactSerialMatch&&w.exactDiskMatch&&w.exactRestartMatch))throw Error('Worker runtime verification has not passed');
for(const [file,hash] of Object.entries(verification.sourceSha256))if(createHash('sha256').update(await readFile(file)).digest('hex')!==hash)throw Error('Verified source differs: '+file);
const root=process.cwd(),runs=join(root,'runs/platform'),directory=join(root,'evidence/worker-migration',randomUUID()),base='http://127.0.0.1:8767',run=promisify(execFile);
const request=async(path,data)=>{
  const response=await fetch(base+path,{signal:AbortSignal.timeout(30_000),...(data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})}),body=await response.json();
  if(!response.ok)throw Error(path+' returned '+response.status+': '+JSON.stringify(body));return body;
};
const health=await request('/healthz');if(!health.ok||health.runtime==='workers')throw Error('Migration requires a healthy main-thread source server');
const before=await request('/api/ecosystems'),listener=(await run('lsof',['-t','-iTCP:8767','-sTCP:LISTEN'])).stdout.trim().split(/\s+/);
if(listener.length!==1||!/^\d+$/.test(listener[0]))throw Error('Expected exactly one local listener');
const previousPid=Number(listener[0]),cwd=(await run('lsof',['-a','-p',String(previousPid),'-d','cwd','-Fn'])).stdout.split('\n').find(line=>line.startsWith('n'))?.slice(1);
if(cwd!==root)throw Error('Listener working directory differs from this checkout');
const command=(await run('ps',['-p',String(previousPid),'-o','comm='])).stdout.trim();if(!/(^|\/)node$/.test(command))throw Error('Listener is not the expected Node executable');
await mkdir(join(directory,'backups'),{recursive:true});
const report={at:new Date().toISOString(),verificationPath,sourceSha256:verification.sourceSha256,previousPid,before,phase:'stopping',backups:[],recovered:[]};
const save=()=>writeFile(join(directory,'migration.json'),JSON.stringify(report,null,2)+'\n');await save();
console.log(JSON.stringify({directory,phase:report.phase,previousPid}));
try {
  process.kill(previousPid,'SIGTERM');
  const deadline=performance.now()+30_000;let stopped=false;
  while(performance.now()<deadline) {
    try {await run('ps',['-p',String(previousPid),'-o','pid=']);}
    catch(error) {if(error.code!==1)throw error;stopped=true;break;}
    await new Promise(done=>setTimeout(done,200));
  }
  if(!stopped)throw Error('Previous process has not exited; no replacement was launched');
  report.phase='backing-up';await save();
  const expected=new Map();
  for(const entry of before) {
    const source=join(runs,entry.id,'autosave.json'),target=join(directory,'backups',entry.id+'.json');await copyFile(source,target);
    const data=JSON.parse(await readFile(target,'utf8'));
    if(data.id!==entry.id||data.checkpoint.world.tick<entry.metrics.tick)throw Error('Final autosave is older than the observed world: '+entry.id);
    const normalized=World.restore(data.checkpoint).checkpoint();expected.set(entry.id,normalized);
    report.backups.push({id:entry.id,tick:normalized.world.tick,sha256:createHash('sha256').update(JSON.stringify(normalized)).digest('hex'),savedAt:data.savedAt});
  }
  report.phase='starting-workers';await save();
  const descriptor=openSync(join(directory,'platform.log'),'a');
  try {
    const child=spawn(process.execPath,['platform/server.mjs'],{cwd:root,env:{...process.env,PLATFORM_WORLD_WORKERS:'1',PLATFORM_PORT:'8767',PLATFORM_RUNS_DIR:runs},detached:true,stdio:['ignore',descriptor,descriptor]});
    await new Promise((done,reject)=>{child.once('spawn',done);child.once('error',reject);});
    report.pid=child.pid;child.unref();
  } finally {closeSync(descriptor);}
  await save();console.log(JSON.stringify({directory,phase:report.phase,pid:report.pid}));
  const readyDeadline=performance.now()+30_000;let ready=false;
  while(performance.now()<readyDeadline) {
    try {const current=await request('/healthz');if(current.ok&&current.runtime==='workers'){ready=true;break;}}
    catch(error) {report.lastReadinessError={name:error.name,message:error.message};}
    await new Promise(done=>setTimeout(done,250));
  }
  if(!ready)throw Error('Replacement worker server did not report readiness within the observation window');
  const restored=await request('/api/ecosystems');
  if(restored.length!==before.length||restored.some(entry=>!entry.paused||!expected.has(entry.id)))throw Error('Replacement did not restore the same paused ecosystem set');
  for(const entry of restored) {
    const {provenance,...actual}=await request(`/api/ecosystems/${entry.id}/checkpoint`);
    if(!isDeepStrictEqual(actual,expected.get(entry.id)))throw Error('Full recovered world differs: '+entry.id);
    report.recovered.push({id:entry.id,tick:actual.world.tick,exactWorldMatch:true,paused:true});
  }
  report.phase='resuming-original-active-worlds';await save();
  for(const entry of before.filter(w=>!w.paused)) {
    const recovered=restored.find(w=>w.id===entry.id);
    if(recovered.speed!==entry.speed)await request(`/api/ecosystems/${entry.id}/control`,{action:'speed',value:entry.speed});
    await request(`/api/ecosystems/${entry.id}/control`,{action:'run'});
  }
  report.after=await request('/api/ecosystems');report.health=await request('/healthz');report.phase='complete';report.completedAt=new Date().toISOString();await save();
  console.log(JSON.stringify({directory,phase:report.phase,pid:report.pid,recovered:report.recovered.length,active:report.after.filter(w=>!w.paused).map(w=>({id:w.id,speed:w.speed}))}));
} catch(error) {report.phase='failed';report.error={name:error.name,message:error.message};await save();throw error;}
