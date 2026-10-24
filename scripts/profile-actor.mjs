import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import os from 'node:os';

const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1];
if(!args.includes('--reference')||!args.includes('--checkpoint')||!args.includes('--output'))throw Error('Provide --reference module, --checkpoint world JSON, and --output report JSON');
const referencePath=resolve(get('--reference')),checkpointPath=resolve(get('--checkpoint')),currentPath=args.includes('--candidate')?resolve(get('--candidate')):resolve('learning/trace-actor.mjs');
const current=await import(pathToFileURL(currentPath).href);
const reference=await import(pathToFileURL(referencePath).href),checkpoint=JSON.parse(await readFile(checkpointPath,'utf8'));
const world=checkpoint.world,flies=world.flies.filter(fly=>fly.genome.actor);
if(!flies.length)throw Error('No trace actors in checkpoint');
const steps=50,repetitions=5,times={reference:[],current:[]},hashes=[];
function run(module){
 const copies=structuredClone(flies),started=performance.now();
 for(let step=0;step<steps;step++)for(const fly of copies)module.actorStep(fly.genome,fly.brain,fly.lastInputs,fly.reward,world.config.learning,world.config.actorParameters);
 return{ms:performance.now()-started,brains:copies.map(fly=>fly.brain)};
}
run(reference);run(current);
for(let repetition=0;repetition<repetitions;repetition++){
 const results={};for(const key of repetition%2?['current','reference']:['reference','current'])results[key]=run(key==='current'?current:reference);
 if(!isDeepStrictEqual(results.reference.brains,results.current.brains))throw Error('Controller trajectory mismatch');
 for(const key of Object.keys(times))times[key].push(results[key].ms);
 hashes.push(createHash('sha256').update(JSON.stringify(results.current.brains)).digest('hex'));
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const sourceSha256={};for(const file of [referencePath,currentPath,resolve('scripts/profile-actor.mjs'),checkpointPath])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const report={at:new Date().toISOString(),hardware:{cpu:os.cpus()[0].model,platform:os.platform(),arch:os.arch()},protocol:{steps,repetitions,agents:flies.length,meanNodes:flies.reduce((sum,fly)=>sum+fly.genome.nodes.length,0)/flies.length,input:'Repeat the real checkpoint sensor/reward observations; compare the entire acquired state after every benchmark repetition. Controller microbenchmark, not full simulation throughput.'},sourceSha256,times,medianMs:Object.fromEntries(Object.entries(times).map(([key,values])=>[key,median(values)])),speedup:median(times.reference)/median(times.current),exactBrainMatch:true,hashes};
await writeFile(resolve(get('--output')),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
