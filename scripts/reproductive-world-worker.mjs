import {parentPort} from 'node:worker_threads';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {measureReproductiveWorld} from '../learning/reproductive-measurement.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
parentPort.on('message',async job=>{
  try{
    const world=new World(job.config),founderHash=hash(JSON.stringify(world.flies.map(({brain,...f})=>f)));let middle=null;
    const measurement=measureReproductiveWorld(world,{untilTick:job.horizonTicks,sampleEvery:job.sampleEvery,checkpointAt:job.checkpointAt,onCheckpoint:w=>{if(job.verifyContinuation)middle=w.checkpoint();},onProgress:state=>{if(state.tick%1000===0)parentPort.postMessage({type:'progress',jobId:job.id,...state});}});
    const final=world.checkpoint(),finalSha256=hash(JSON.stringify(final));let continuation=null;
    if(job.verifyContinuation){const checkpoint=middle||final,replay=World.restore(checkpoint);replay.advance(job.horizonTicks-replay.tick);assert.deepEqual(replay.checkpoint(),final);const stem=job.id.replaceAll(':','-');await writeFile(join(job.directory,stem+'-checkpoint.json'),JSON.stringify(checkpoint)+'\n');await writeFile(join(job.directory,stem+'-final.json'),JSON.stringify(final)+'\n');continuation={fromTick:checkpoint.world.tick,exactCompleteState:true,checkpointSha256:hash(JSON.stringify(checkpoint)),finalSha256};}
    parentPort.postMessage({type:'result',jobId:job.id,result:{seed:job.seed,environment:job.environment,arm:job.arm,founderHash,measurement,metrics:world.metrics(),totals:world.totals,finalSha256,continuation,config:world.config}});
  }catch(error){parentPort.postMessage({type:'error',jobId:job.id,error:{name:error.name,message:error.message,stack:error.stack}});}
});
