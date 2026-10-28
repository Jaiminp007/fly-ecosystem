import {World} from '../engine.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const saved=JSON.parse(await readFile('evidence/autonomous-learning/live-habitat.json','utf8'));
const rows=[];
for(const [name,mask,learning]of [['all',31,true],['navigation',3,true],['turn',1,true],['frozen',31,false]]){
 const config={...saved.config,learning,actorParameters:{...saved.config.actorParameters,plasticOutputs:mask}},world=new World(config);const checkpoints=[];
 let ticks=0;for(;ticks<7200&&world.step();ticks++)if(world.tick%500===0)checkpoints.push(world.metrics());
 rows.push({name,plasticOutputs:mask,learning,metrics:world.metrics(),checkpoints});console.log(JSON.stringify({name,metrics:world.metrics()}));
}
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','scripts/motor-plasticity-ablation.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile('evidence/autonomous-learning/motor-plasticity-ablation.json',JSON.stringify({protocol:{config:saved.config,horizonTicks:7200,seedCount:1,interpretation:'Development diagnostic on the recorded extinction seed. Learning masks change which motor readouts receive plastic updates; the other outputs retain inherited weights and exploration. This is not independent confirmation or evidence of general adaptation.'},sourceSha256,rows},null,2)+'\n');
