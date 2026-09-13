import {World,DT} from '../engine.mjs';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sourceSha256=createHash('sha256').update(await readFile(resolve(root,'engine.mjs'))).digest('hex');
const ticks=Number(process.env.TICKS||20000);const seeds=(process.env.SEEDS||'7,23,111').split(',').map(Number);
const treatments=[{name:'learning + mutation',config:{}},{name:'frozen lifetime weights',config:{learning:false}},{name:'no inherited mutation',config:{mutation:false}},{name:'low resources',config:{nutrient:1}}];
const rows=[];await mkdir(resolve(root,'evidence'),{recursive:true});
for(const treatment of treatments)for(const seed of seeds){
  const w=new World({...treatment.config,seed});const start=performance.now();w.advance(ticks);const wall=(performance.now()-start)/1000;
  const row={treatment:treatment.name,seed,requestedTicks:ticks,...w.metrics(),deepestLineageEver:Math.max(...w.lineage.map(l=>l.generation)),wallSeconds:wall,achievedWorldSpeed:w.tick*DT/wall,config:w.config};rows.push(row);console.log(JSON.stringify(row));
  await writeFile(resolve(root,'evidence','experiments.json'),JSON.stringify({model:'compact-evolving-v1',sourceSha256,recordedAt:new Date().toISOString(),protocol:'Independent seeds; fixed 20000-tick requested horizon unless TICKS overridden. No reseeding. Comparisons descriptive; not proof of learning or intelligence. Timings are local observations, not isolated hardware benchmarks.',rows},null,2)+'\n');
}
