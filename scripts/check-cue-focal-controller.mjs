import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-focal-controller/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);
  return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
const {MixedFocalTransfer}=await import(pathToFileURL(join(base,'sources/learning/mixed-focal-transfer.mjs')).href);
let decisions=0,receipts=0,replays=0,setupBodies=0;
for(const selected of protocol.cases){
  const anchor=read(join(root,selected.anchor)),row=read(join(base,'rows',selected.seed+'-'+selected.focal+'.json'));assert.equal(hash(readFileSync(join(root,selected.anchor))),selected.anchorSha256);
  const alive=anchor.world.world.flies.map(fly=>fly.id);let commonWorld=null;
  for(const arm of protocol.arms){
    const cheapIds=arm==='all-residual'?[]:arm==='focal-cheap'?[selected.focal]:arm==='focal-residual'?alive.filter(id=>id!==selected.focal):alive;
    const label=selected.seed+'-'+selected.focal+'-'+arm,initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pricing=initial.state.pricing;
    const worldHash=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);assert.equal(worldHash,row.arms[arm].startWorldSha256);
    const expected=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:selected.probeSeed,steeringMode:'learned',compactFrozen:true});expected.cheapIds=[...cheapIds].sort((left,right)=>left-right);
    for(const fly of expected.world.flies){
      const old=expected.learners[fly.id];for(const values of old.steering.weights)values.fill(0);old.work.scalarOperations+=16;old.charge.storageBytes=0;
      let due=(old.work.scalarOperations-old.charge.operationsBilled)*pricing.operationEnergy;old.charge.operationsBilled=old.work.scalarOperations;old.charge.outstandingEnergy+=due;old.charge.incurredEnergy+=due;
      const scan=bytes(old);old.work.scalarOperations+=scan;old.charge.storageBytes=0;due=(old.work.scalarOperations-old.charge.operationsBilled)*pricing.operationEnergy;
      old.charge.operationsBilled=old.work.scalarOperations;old.charge.outstandingEnergy+=due;old.charge.incurredEnergy+=due;
      if(expected.cheapIds.includes(fly.id))expected.learners[fly.id]={agentId:fly.id,work:{scalarOperations:0},charge:{...old.charge,operationsBilled:0,storageBytes:0},lastDecisionTick:expected.world.tick,lastObservedTick:expected.world.tick};
      setupBodies++;
    }
    assert.deepEqual(expected.checkpoint(false),initial);
    const storage={},paid={},pending={},digest=createHash('sha256');let events=0;
    const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        const isCheap=cheapIds.includes(event.id);assert.equal(event.mode,isCheap?'cheap':'residual');
        if(isCheap){assert.deepEqual(event.choice,{move:1,action:2,accept:true});assert.deepEqual(event.outputs,[Math.tanh(2*(event.raw[2]-event.raw[1])+1.8*(event.raw[10]-event.raw[11])),1,1,-1,0]);}
        else{assert.ok(event.own.cue.every(value=>value===0));assert.ok(event.steering.action===0||event.available);assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);}
        decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,row.arms[arm].trace.events);assert.equal(digest.digest('hex'),row.arms[arm].trace.sha256);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(state.steering){assert.deepEqual(state.steering.weights,prior.steering.weights);assert.deepEqual(state.steering.contextWeights,prior.steering.contextWeights);}
    }
    const reconstructed=MixedFocalTransfer.restore(initial),replayDigest=createHash('sha256');let replayEvents=0;
    reconstructed.attach(event=>{replayDigest.update(JSON.stringify(event)+'\n');replayEvents++;});const endpoint=reconstructed.advance(protocol.ticks);reconstructed.attach(null);
    assert.deepEqual(endpoint,row.arms[arm].endpoint);assert.deepEqual(reconstructed.checkpoint(false),final);assert.equal(replayEvents,events);assert.equal(replayDigest.digest('hex'),row.arms[arm].trace.sha256);
    const focal=final.world.world.flies.find(fly=>fly.id===selected.focal);assert.equal(Boolean(focal),row.arms[arm].focalAlive);close(focal?.energy??0,row.arms[arm].focalEnergy);replays++;
  }
  console.log(JSON.stringify({seed:selected.seed,focal:selected.focal,decisions,replays,setupBodies}));
}
assert.equal(decisions,receipts);const report={schema:1,passed:true,decisions,receipts,replays,setupBodies,scope:'Independent matched-switch setup, assignments, native commands and reported-work/storage/debt plus captured-source replay; not independent physics or low-level energy adequacy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
