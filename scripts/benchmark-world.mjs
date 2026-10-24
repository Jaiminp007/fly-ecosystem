import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const [referenceArg,candidateArg,checkpointArg,outputArg,ticksArg='200',repetitionsArg='5']=process.argv.slice(2),ticks=Number(ticksArg),repetitions=Number(repetitionsArg);
if(!referenceArg||!candidateArg||!checkpointArg||!outputArg||!Number.isInteger(ticks)||ticks<1||!Number.isInteger(repetitions)||repetitions<3||repetitions%2!==1)throw Error('Provide reference engine, candidate engine, checkpoint, output, optional ticks and odd repetitions >=3');
const referencePath=resolve(referenceArg),candidatePath=resolve(candidateArg),checkpointPath=resolve(checkpointArg),reference=await import(pathToFileURL(referencePath)),candidate=await import(pathToFileURL(candidatePath));
if(reference.DT!==candidate.DT)throw Error('Time-step mismatch');
const bytes=await readFile(checkpointPath),data=JSON.parse(bytes),times={reference:[],candidate:[]},ratios={reference:[],candidate:[]},hashes=[],elapsedTicks=[];
function run(module){const w=module.World.restore(data),startTick=w.tick,start=performance.now();w.advance(ticks);const ms=performance.now()-start;return{ms,tickDelta:w.tick-startTick,checkpoint:w.checkpoint()};}
run(reference);run(candidate);
for(let repetition=0;repetition<repetitions;repetition++){
 const results={};for(const key of repetition%2?['candidate','reference']:['reference','candidate'])results[key]=run(key==='reference'?reference:candidate);
 if(!isDeepStrictEqual(results.reference.checkpoint,results.candidate.checkpoint))throw Error('Full-world mismatch at repetition '+repetition);
 for(const key of Object.keys(times)){times[key].push(results[key].ms);ratios[key].push(results[key].tickDelta*reference.DT/(results[key].ms/1000));}
 elapsedTicks.push(results.candidate.tickDelta);hashes.push(createHash('sha256').update(JSON.stringify(results.candidate.checkpoint)).digest('hex'));
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)],sourceSha256={};
for(const engine of [referencePath,candidatePath])for(const file of ['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs']){const path=join(dirname(engine),file);let bytes;try{bytes=await readFile(path);}catch(error){if(error.code==='ENOENT'&&file==='learning/joint-episodic.mjs')continue;throw error;}sourceSha256[path]=createHash('sha256').update(bytes).digest('hex');}
const result={at:new Date().toISOString(),referencePath,candidatePath,checkpointPath,checkpointSha256:createHash('sha256').update(bytes).digest('hex'),ticksRequested:ticks,repetitions,elapsedTicks,times,medianMs:Object.fromEntries(Object.entries(times).map(([k,v])=>[k,median(v)])),medianMeasuredRatio:Object.fromEntries(Object.entries(ratios).map(([k,v])=>[k,median(v)])),speedup:median(times.reference)/median(times.candidate),exactWorldMatch:true,hashes,sourceSha256,driverSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),scope:'Alternating matched headless full-world runs, restored from identical real state. Entire final checkpoint, RNGs, acquired state and birth/mutation outcomes must match. Ratios use actual tick deltas, so early stops cannot overstate speed. Not a sustained multiworld-server measurement.'};
await writeFile(resolve(outputArg),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output:resolve(outputArg),speedup:result.speedup,exactWorldMatch:result.exactWorldMatch,medianMeasuredRatio:result.medianMeasuredRatio}));
