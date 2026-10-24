import {parentPort,workerData} from 'node:worker_threads';
import {World,validateConfig} from '../engine.mjs';
import {CheckpointStore} from '../persistence.mjs';
import {telemetry} from '../telemetry.mjs';

if(!parentPort)throw Error('World worker requires an owning thread');
try{
 const world=World.restore(workerData.checkpoint);
 const store=workerData.directory?new CheckpointStore(workerData.directory):null;
 // Async disk operations are serialized with simulation commands as well.
 let queue=Promise.resolve();
 parentPort.on('message',message=>{
  queue=queue.then(async()=>{
  const {id,command,value}=message;
  try{
   let result;
   switch(command){
    case 'advance':if(!Number.isInteger(value)||value<1||value>1000)throw Error('Worker advance must be 1–1000 ticks');world.advance(value);result=world.metrics();break;
    case 'checkpoint':result=world.checkpoint();break;
    case 'state':result=world.snapshot();break;
    case 'metrics':result=world.metrics();break;
    case 'frame':result=world.frame(value||{});break;
    case 'inspect':if(!Number.isSafeInteger(value)||value<1)throw Error('Invalid worker agent ID');result=world.inspect(value);break;
    case 'platformState':result={...world.snapshot(),telemetry:telemetry(world),eventCount:world.events.length,eventHasMore:world.events.length>100};break;
    case 'platformFrame':result={...world.frame(value||{}),telemetry:telemetry(world),eventCount:world.events.length};break;
    case 'eventPage':
    case 'lineage':{
     const {offset=0,limit=100}=value||{},maximum=command==='eventPage'?200:500;
     if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>maximum)throw Error('Invalid '+(command==='eventPage'?'event':'lineage')+' page');
     const items=command==='eventPage'?world.events:world.lineage;
     if(command==='eventPage'){const end=Math.max(0,items.length-offset),start=Math.max(0,end-limit);result={total:items.length,offset,limit,hasMore:start>0,items:items.slice(start,end)};}
     else result={total:items.length,offset,limit,items:items.slice(offset,offset+limit)};
     break;
    }
    case 'configure':{
     const next={...world.config,...value};validateConfig(next);
     if(next.capacity<world.flies.length)throw Error('Capacity must cover the living population');
     if(next.capacity>world.config.capacity)world.capacityReached=false;
     world.config=next;world.record('intervention',`Settings changed: ${JSON.stringify(value)}`,{changes:value});
     result={config:world.config,metrics:world.metrics()};break;
    }
    case 'record':world.record(value.kind,value.text);result=world.metrics();break;
    case 'save':{
     if(!store)throw Error('Worker checkpoint store is not configured');
     if(value.name!=='autosave.json'&&!/^checkpoint-\d+-tick-\d+\.json$/.test(value.name))throw Error('Invalid worker checkpoint name');
     const start=performance.now();await store.save(value.name,{...value.metadata,checkpoint:world.checkpoint()});
     result={savedAt:value.metadata.savedAt,tick:world.tick,durationMs:performance.now()-start};break;
    }
    default:throw Error('Unknown world-worker command');
   }
   parentPort.postMessage({id,ok:true,result});
  }catch(error){parentPort.postMessage({id,ok:false,error:{name:error.name,message:error.message}});}
  });
 });
 parentPort.postMessage({ready:true,model:world.modelId(),metrics:world.metrics(),config:world.config});
}catch(error){parentPort.postMessage({ready:false,error:{name:error.name,message:error.message}});parentPort.close();}
