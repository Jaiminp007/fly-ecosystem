// Deterministic source diagnosis. No worlds, rewards, fitting or candidate search.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {createMushroomBody,mushroomFeatures} from '../learning/mushroom-body.mjs';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {digest} from '../learning/intervention-study.mjs';

const directory=resolve(process.argv[2]);await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const sourceSha256={};
for(const file of ['engine.mjs','challenges.mjs','scripts/audit-cue-representation.mjs',
  ...(await readdir('learning')).filter(n=>n.endsWith('.mjs')).map(n=>`learning/${n}`)]){
  const bytes=await readFile(file),target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});sourceSha256[file]=digest(bytes);
}
const protocol={schema:1,kind:'deterministic-cue-representation-audit-v1',createdAt:new Date().toISOString(),sourceSha256,
  energy:[.1,.5,.9],proximity:[0,.5,1],previousIntake:[-1,0,1],walls:[[0,0],[1,0],[0,1]],histories:['empty','neutral','fixed-cue'],
  scope:'Exhaust all sixteen possible odors at each fixed nuisance/history context. No worlds, rewards, valence labels, fitting, parameter choices or statistical qualification. Exact equal active sets force equal policy probabilities for all possible readout weights within that context. Restricted-context collisions do not establish the cause of an empirical failure.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const contexts=[];
for(const energy of protocol.energy)for(const proximity of protocol.proximity)for(const previousIntake of protocol.previousIntake)for(const walls of protocol.walls)for(const history of protocol.histories){
  const patterns=[];
  for(let i=0;i<16;i++){
    const raw=Array(17).fill(0);raw[0]=1;raw[3]=proximity;raw[4]=energy;raw[10]=walls[0];raw[11]=walls[1];raw[13]=previousIntake;raw[16]=1;
    const bits=Array.from({length:4},(_,j)=>(i>>j&1)?1:-1),obs=cueObservation(raw,bits),s=createMushroomBody(1,41);
    if(history!=='empty'){const past=Array(17).fill(0);past[0]=1;past[3]=.5;past[4]=.5;past[16]=1;
      const observation=cueObservation(past,history==='neutral'?[0,0,0,0]:[1,-1,1,-1]);s.history=[1,-1,1].map(choice=>({observation:[...observation],choice}));}
    const phi=mushroomFeatures(s,obs),active=phi.flatMap((v,j)=>v!==0?[j]:[]);assert.equal(active.length,8);
    patterns.push({bits,active});
  }
  const groups={};for(const [i,p]of patterns.entries())(groups[p.active.join(',')]||=[]).push(i);
  contexts.push({energy,proximity,previousIntake,walls,history,patterns,distinctActiveSets:Object.keys(groups).length,collisions:Object.values(groups).filter(g=>g.length>1)});
}
await writeFile(join(directory,'representations.json'),JSON.stringify({schema:1,protocolSha256:digest(await readFile(join(directory,'protocol.json'))),contexts},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({contexts:contexts.length,featureEvaluations:contexts.length*16,contextsWithCollisions:contexts.filter(c=>c.collisions.length).length,minimumDistinctActiveSets:Math.min(...contexts.map(c=>c.distinctActiveSets))}));
