import {World} from '../engine.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const checkpoint=JSON.parse(await readFile('evidence/challenge-release/pre-challenge-world.json'));
const donors=checkpoint.world.flies;
if(!donors.length)throw Error('No living descendants to assess');
const rows=[];
for(const learning of [true,false])for(const seed of [7,23,111])for(const cohort of ['founders','descendants']){
 const world=new World({seed,founders:24,learning,challenges:'cycle'});
 if(cohort==='descendants')for(let i=0;i<world.flies.length;i++){
   const f=world.flies[i];f.genome=structuredClone(donors[i%donors.length].genome);
   f.brain={activity:Object.fromEntries(f.genome.nodes.map(n=>[n.id,0])),plastic:f.genome.edges.map(()=>0),eligibility:f.genome.edges.map(()=>0),baseline:0};
   const l=world.lineage[i];l.nodes=f.genome.nodes.length;l.edges=f.genome.edges.length;l.traits=structuredClone(f.genome.traits);
 }
 world.nextNode=Math.max(world.nextNode,...world.flies.flatMap(f=>f.genome.nodes.map(n=>n.id+1)));
 const start=performance.now();world.advance(7200);
 const row={cohort,learning,seed,...world.metrics(),foodEaten:world.totals.foodEaten,wallSeconds:(performance.now()-start)/1000,phases:world.challengeHistory};rows.push(row);console.log(JSON.stringify({cohort,learning,seed,population:row.population,births:row.births,seconds:row.seconds}));
 await writeFile('evidence/challenge-release/evaluation.json',JSON.stringify({recordedAt:new Date().toISOString(),engineSha256:createHash('sha256').update(await readFile('engine.mjs')).digest('hex'),challengeSha256:createHash('sha256').update(await readFile('challenges.mjs')).digest('hex'),donorCheckpointSha256:createHash('sha256').update(await readFile('evidence/challenge-release/pre-challenge-world.json')).digest('hex'),protocol:'24 age-zero, energy-matched agents; paired positions/seeds; descendants sampled in saved live-agent order, repeated only if fewer than 24. Acquired neural state reset. Mutation and reproduction remain enabled. 7200-tick horizon. Small descriptive comparison, not proof of intelligence or isolated neural improvement; inherited body/life-history traits also differ.',rows},null,2)+'\n');
}
