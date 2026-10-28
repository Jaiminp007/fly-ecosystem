import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPlatform} from '../platform/server.mjs';

const directory=resolve(process.argv[2]||`evidence/prior-inspection/${randomUUID()}`);
await mkdir(directory,{recursive:true});
const reference=JSON.parse(await readFile('evidence/episodic-confirmation/b3ee4b6f-557e-455f-b98b-513c19fc7173/results.json','utf8'));
const app=await createPlatform({directory:join(directory,'runs'),autonomyDirectory:join(directory,'autonomy'),port:0,realtime:false});
try {
  const state=await app.manager.create({name:'Pooled prior · inspection only',config:{seed:9171,founders:8,capacity:40,reproduction:false,mutation:false,controller:'episodic-actor',actorParameters:reference.protocol.actorParameters,episodicParameters:{...reference.protocol.parameters,priorStrength:4},...reference.protocol.environment,ecology:'relocation'}}),id=state.ecosystem.id;
  await app.manager.control(id,{action:'step',ticks:1000});await app.manager.control(id,{action:'step',ticks:600});
  const ready={directory,pid:process.pid,base:`http://127.0.0.1:${app.server.address().port}`,id,scope:'Paused experimental inspection world; no qualification or live policy adoption.'};
  await writeFile(join(directory,'server.json'),JSON.stringify(ready,null,2)+'\n');console.log(JSON.stringify(ready));
} catch(error) {await app.close();throw error;}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close().then(()=>process.exit(0),error=>{console.error(error.message);process.exit(1);}));
