import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {incrementalOverlapRecommendation} from '../learning/incremental-overlap.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1'),output=join(root,'evidence/incremental-overlap-measurement/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(previous.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
assert.equal(hash(readFileSync(join(root,'learning/filtered-overlap.mjs'))),previous.sourceSha256['learning/filtered-overlap.mjs']);
const captured=name=>pathToFileURL(join(base,'sources',name)).href;
const {OdorRoutedExperiment}=await import(captured('learning/odor-routed-experiment.mjs'));
const {filteredOverlapRecommendation}=await import(captured('learning/filtered-overlap.mjs'));
const inputs=[];for(const history of previous.histories)for(const family of ['C','transfer']){
  const label=history.seed+'-replay-'+(family==='C'?'acquire-C':'probe-transfer-current'),start=join(base,'starts',label+'.json'),final=join(base,'finals',label+'.json');
  inputs.push({seed:history.seed,family,label,startSha256:hash(readFileSync(start)),finalSha256:hash(readFileSync(final)),ticks:family==='C'?512:256});
}
const names=['scripts/measure-incremental-overlap.mjs','learning/incremental-overlap.mjs','learning/filtered-overlap.mjs','tests/incremental-overlap.test.mjs','docs/INCREMENTAL_OVERLAP_DESIGN.md'];
const sources=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
write(join(output,'protocol.json'),{schema:1,inputs,sourceSha256:sources,pricing:read(join(base,'starts',inputs[0].label+'.json')).state.pricing,dt:.1,
  scope:'Outcome-informed same-state declared work and encoded scratch byte-time on captured-source physical replay; not embodied performance or low-level cost proof.'});
for(const name of names){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const startPath=join(base,'starts',input.label+'.json'),finalPath=join(base,'finals',input.label+'.json');assert.equal(hash(readFileSync(startPath)),input.startSha256);assert.equal(hash(readFileSync(finalPath)),input.finalSha256);
  const start=read(startPath),run=OdorRoutedExperiment.restore(start),oldScratch={},newScratch={};
  for(const [id,state]of Object.entries(start.state.learners)){oldScratch[id]=structuredClone(state.scratch);newScratch[id]=structuredClone(state.scratch);}
  const counts={decisions:0,oldOperations:0,indexedOperations:0,oldScratchByteTicks:0,indexedScratchByteTicks:0,cheaperDecisions:0};
  run.attach(event=>{
    if(event.type!=='decision')return;const points=run.learners[event.id].spatialPoints,oldWork={scalarOperations:0},newWork={scalarOperations:0};
    const original=filteredOverlapRecommendation(points,oldWork,oldScratch[event.id]),indexed=incrementalOverlapRecommendation(points,newWork,newScratch[event.id]);
    assert.deepEqual(original,event.recommendation);assert.deepEqual(indexed,original);assert.equal(newScratch[event.id].separation,oldScratch[event.id].separation);
    const oldBytes=encodedStateBytes(oldScratch[event.id]),indexedBytes=encodedStateBytes(newScratch[event.id]);
    counts.decisions++;counts.oldOperations+=oldWork.scalarOperations;counts.indexedOperations+=newWork.scalarOperations;counts.oldScratchByteTicks+=oldBytes;counts.indexedScratchByteTicks+=indexedBytes;
    const pricing=start.state.pricing;counts.cheaperDecisions+=Number(newWork.scalarOperations*pricing.operationEnergy+indexedBytes*pricing.byteEnergyPerSecond*.1<oldWork.scalarOperations*pricing.operationEnergy+oldBytes*pricing.byteEnergyPerSecond*.1);
  });
  run.advance(input.ticks);run.attach(null);assert.deepEqual(run.checkpoint(false),read(finalPath));
  const pricing=start.state.pricing,operationDelta=counts.indexedOperations-counts.oldOperations,byteTickDelta=counts.indexedScratchByteTicks-counts.oldScratchByteTicks;
  const declaredEnergyDelta=operationDelta*pricing.operationEnergy+byteTickDelta*pricing.byteEnergyPerSecond*.1;
  const row={...input,counts,operationDelta,byteTickDelta,declaredEnergyDelta};write(join(output,'rows',input.seed+'-'+input.family+'.json'),row);rows.push(row);console.log(JSON.stringify(row));
}
const totals={};for(const family of ['C','transfer']){
  const sum={decisions:0,oldOperations:0,indexedOperations:0,oldScratchByteTicks:0,indexedScratchByteTicks:0,cheaperDecisions:0,operationDelta:0,byteTickDelta:0,declaredEnergyDelta:0};
  for(const row of rows.filter(item=>item.family===family)){for(const key of ['decisions','oldOperations','indexedOperations','oldScratchByteTicks','indexedScratchByteTicks','cheaperDecisions'])sum[key]+=row.counts[key];for(const key of ['operationDelta','byteTickDelta','declaredEnergyDelta'])sum[key]+=row[key];}
  totals[family]=sum;
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
write(join(output,'results.json'),{schema:1,totals,scope:'Same-state offline declared work and encoded scratch byte-time; not embodied performance or complete low-level audit.'});console.log(JSON.stringify(totals));
