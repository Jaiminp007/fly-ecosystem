import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/frozen-memory-transfer/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);
  return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
const {CoverageExperiment}=await import(pathToFileURL(join(base,'sources/learning/coverage-experiment.mjs')).href);
let decisions=0,receipts=0,replays=0,compactedBodies=0;
for(const input of protocol.inputs){
  const anchor=read(join(root,input.anchor)),row=read(join(base,'rows',input.history.seed+'.json'));assert.equal(hash(readFileSync(join(root,input.anchor))),input.anchorSha256);
  const uncompressed=read(join(base,'starts',input.history.seed+'-uncompacted.json')),compacted=read(join(base,'starts',input.history.seed+'-compacted.json'));
  for(const fly of uncompressed.world.world.flies){
    const old=uncompressed.state.learners[fly.id],fresh=compacted.state.learners[fly.id],arrays=[old.taste.memory,...Object.values(old.banks).map(bank=>bank.memory)];
    if(Object.hasOwn(old.steering,'memory'))arrays.push(old.steering.memory);
    const operations=arrays.reduce((sum,array)=>sum+bytes(array),0)+4;
    assert.equal(fresh.work.scalarOperations-old.work.scalarOperations,operations);assert.equal(fresh.charge.operationsBilled-old.charge.operationsBilled,operations);
    close(fresh.charge.outstandingEnergy-old.charge.outstandingEnergy,operations*uncompressed.state.pricing.operationEnergy);
    close(fresh.charge.incurredEnergy-old.charge.incurredEnergy,operations*uncompressed.state.pricing.operationEnergy);
    assert.equal(fresh.taste.memory.length,0);for(const bank of Object.values(fresh.banks))assert.equal(bank.memory.length,0);
    if(Object.hasOwn(fresh.steering,'memory'))assert.equal(fresh.steering.memory.length,0);
    const normalized=structuredClone(fresh);normalized.taste.memory=old.taste.memory;for(const route of ['present','absent'])normalized.banks[route].memory=old.banks[route].memory;
    if(Object.hasOwn(old.steering,'memory'))normalized.steering.memory=old.steering.memory;
    normalized.work.scalarOperations=old.work.scalarOperations;normalized.charge=old.charge;assert.deepEqual(normalized,old);compactedBodies++;
  }
  let commonWorld=null;
  for(const arm of protocol.arms){
    const label=input.history.seed+'-'+arm,initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pricing=initial.state.pricing;
    const worldHash=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);assert.equal(worldHash,row.arms[arm].startWorldSha256);
    let reconstructed;
    if(arm==='native-full')reconstructed=CoverageExperiment.fork({...structuredClone(anchor),kind:'coverage-world'},{phase:'transfer',seed:input.history.probeSeeds.transfer,mode:'native-full'});
    else{reconstructed=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:input.history.probeSeeds.transfer,mode:arm==='reset'?'reset':'current',steeringMode:arm==='native'?'native':'learned',compactFrozen:arm!=='uncompacted'});reconstructed.spatialSelector='incremental';}
    assert.deepEqual(reconstructed.checkpoint(false),initial);
    const storage={},paid={},pending={},digest=createHash('sha256');let events=0;
    const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        if(event.steering){assert.ok(event.steering.action===0||event.available);assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);}
        decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,row.arms[arm].trace.events);assert.equal(digest.digest('hex'),row.arms[arm].trace.sha256);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(state.steering){assert.deepEqual(state.steering.weights,prior.steering.weights);assert.deepEqual(state.taste.weights,prior.taste.weights);for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);}
    }
    const replayDigest=createHash('sha256');let replayEvents=0;reconstructed.attach(event=>{replayDigest.update(JSON.stringify(event)+'\n');replayEvents++;});
    const endpoint=reconstructed.advance(protocol.ticks);reconstructed.attach(null);assert.deepEqual(endpoint,row.arms[arm].endpoint);assert.deepEqual(reconstructed.checkpoint(false),final);
    assert.equal(replayEvents,events);assert.equal(replayDigest.digest('hex'),row.arms[arm].trace.sha256);replays++;
  }
  console.log(JSON.stringify({seed:input.history.seed,decisions,replays,compactedBodies}));
}
assert.equal(decisions,receipts);
const report={schema:1,passed:true,decisions,receipts,replays,compactedBodies,scope:'Independent frozen memory/setup accounting, reported-work/storage/debt and exact captured-source replay; not independent physics or complete low-level operation audit.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
