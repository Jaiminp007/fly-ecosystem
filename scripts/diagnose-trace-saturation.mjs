import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {interval95} from '../learning/tasks.mjs';

const referenceDirectory=resolve(process.argv[2]||'evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7'),directory=resolve(process.argv[3]||`evidence/trace-saturation/${randomUUID()}`),protocolBytes=await readFile(join(referenceDirectory,'protocol.json')),old=JSON.parse(protocolBytes),outcomeBytes=await readFile(join(referenceDirectory,'outcomes.json')),recorded=JSON.parse(outcomeBytes),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
for(const[file,sha]of Object.entries(old.sourceSha256))assert.equal(hash(await readFile(join(referenceDirectory,'sources',file))),sha);
const {World}=await import(pathToFileURL(join(referenceDirectory,'sources/engine.mjs')).href),seeds=old.seeds.slice(0,10);
const protocol={at:new Date().toISOString(),experiment:'sensory-trace-saturation-diagnostic',referenceDirectory,referenceProtocolSha256:hash(protocolBytes),referenceOutcomesSha256:hash(outcomeBytes),sourceSha256:old.sourceSha256,seeds,environments:old.environments,changeThreshold:.05,interpretation:'Replays the first fixed historical seeds; no new qualification or policy tuning. Count actual trace clipping and flat responses despite changed observations. A parallel exponential average is computed from the SAME recorded input stream as a proposed alternative; it is never fed to the historical world. It does not establish useful learning, prospective survival, or that clipping caused earlier failures. Full final checkpoint hashes must reproduce.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'reference-protocol.json'),protocolBytes);await writeFile(join(directory,'reference-outcomes.json'),outcomeBytes);
const rows=[];
for(const seed of seeds)for(const [environment,settings]of Object.entries(old.environments)){
  const world=new World({seed,founders:old.founders,capacity:240,reproduction:false,mutation:false,...settings,controller:'episodic-actor',learning:true,actorParameters:{...old.actorParameters},episodicParameters:{...old.parameters,memoryLearning:true,neuralLearning:true}}),states=new Map();
  const stats=Object.fromEntries(['fast','slow'].map(kind=>[kind,Array.from({length:17},()=>({samples:0,saturated:0,inputChanges:0,flatDespiteChange:0,emaChangedWhenFlat:0,sumAbsoluteLegacy:0,sumAbsoluteEMA:0}))]));
  for(const fly of world.flies)states.set(fly.id,{previousInputs:Array(17).fill(0),fast:{ids:fly.genome.nodes.filter(n=>n.memory==='fast').map(n=>n.id),previous:Array(17).fill(0),ema:Array(17).fill(0)},slow:{ids:fly.genome.nodes.filter(n=>n.memory==='slow').map(n=>n.id),previous:Array(17).fill(0),ema:Array(17).fill(0)}});
  for(let tick=0;tick<old.horizonTicks;tick++){
    const before=[...world.flies];if(!world.step())break;
    for(const fly of before){const state=states.get(fly.id);for(const kind of ['fast','slow']){const retention=kind==='fast'?.8:old.actorParameters.traceRetention,s=state[kind];
      for(let channel=0;channel<17;channel++){const row=stats[kind][channel],input=fly.lastInputs[channel],actual=fly.brain.activity[s.ids[channel]],previousEMA=s.ema[channel],ema=retention*previousEMA+(1-retention)*input;row.samples++;row.saturated+=Number(Math.abs(actual)>=1-1e-12);row.sumAbsoluteLegacy+=Math.abs(actual);row.sumAbsoluteEMA+=Math.abs(ema);
        if(Math.abs(input-state.previousInputs[channel])>protocol.changeThreshold){row.inputChanges++;if(Math.abs(actual-s.previous[channel])<1e-12){row.flatDespiteChange++;row.emaChangedWhenFlat+=Number(Math.abs(ema-previousEMA)>1e-9);}}
        s.previous[channel]=actual;s.ema[channel]=ema;
      }}state.previousInputs=[...fly.lastInputs];}
  }
  const checkpointSha256=hash(JSON.stringify(world.checkpoint())),expected=recorded.find(row=>row.seed===seed).environments[environment].incumbent;assert.equal(checkpointSha256,expected.fullStateSha256);
  rows.push({seed,environment,stats,exactCompleteWorld:true,checkpointSha256});console.log(JSON.stringify({directory,seed,environment,exactCompleteWorld:true}));
}
const summary=Object.fromEntries(Object.keys(old.environments).map(environment=>[environment,Object.fromEntries(['fast','slow'].map(kind=>[kind,Array.from({length:17},(_,channel)=>{const selected=rows.filter(row=>row.environment===environment).map(row=>row.stats[kind][channel]);return{channel,saturation:interval95(selected.map(s=>s.saturated/s.samples)),inputChanges:selected.reduce((n,s)=>n+s.inputChanges,0),flatDespiteChange:selected.reduce((n,s)=>n+s.flatDespiteChange,0),emaChangedWhenFlat:selected.reduce((n,s)=>n+s.emaChangedWhenFlat,0)};})]))]));
const source=await readFile(new URL(import.meta.url));await writeFile(join(directory,'analysis-source.mjs'),source);const result={protocol,rows,summary,analysisSha256:hash(source),completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,worlds:rows.length,summary},null,2));
