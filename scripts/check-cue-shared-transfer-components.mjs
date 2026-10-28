import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-shared-transfer-components/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
let decisions=0,receipts=0,replays=0,assignments=0;const rows=[];
for(const input of protocol.inputs){
  const anchor=read(join(root,input.anchor)),row=read(join(base,'rows',input.history.seed+'.json'));assert.equal(hash(readFileSync(join(root,input.anchor))),input.anchorSha256);
  let commonWorld=null;
  for(const arm of protocol.arms){
    const label=input.history.seed+'-'+arm,initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pricing=initial.state.pricing;
    const worldHash=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);assert.equal(worldHash,row.arms[arm].startWorldSha256);
    const reconstructed=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:input.history.probeSeeds.transfer,steeringMode:arm==='native'?'native':'learned',compactFrozen:true});
    for(const fly of reconstructed.world.flies){
      const state=reconstructed.learners[fly.id],target=arm==='shared-only'?state.steering.contextWeights[0]:state.steering.weights;
      for(const values of target)for(let index=0;index<values.length;index++)if(arm==='shared-only'||arm==='residual-only')values[index]=0;
      state.work.scalarOperations+=16;state.charge.storageBytes=0;const ops=state.work.scalarOperations-state.charge.operationsBilled;
      assert.equal(ops,16);const due=ops*pricing.operationEnergy;state.charge.operationsBilled=state.work.scalarOperations;state.charge.outstandingEnergy+=due;state.charge.incurredEnergy+=due;assignments++;
    }
    assert.deepEqual(reconstructed.checkpoint(false),initial);
    const storage={},paid={},pending={},digest=createHash('sha256');let events=0;
    const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;assert.ok(event.own.cue.every(value=>value===0));
        storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        assert.ok(event.steering.action===0||event.available);if(arm==='native')assert.equal(event.steering.action,0);
        assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,row.arms[arm].trace.events);assert.equal(digest.digest('hex'),row.arms[arm].trace.sha256);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
      assert.deepEqual(state.steering.weights,prior.steering.weights);assert.deepEqual(state.steering.contextWeights,prior.steering.contextWeights);assert.deepEqual(state.taste.weights,prior.taste.weights);
      for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);
    }
    const replayDigest=createHash('sha256');let replayEvents=0;reconstructed.attach(event=>{replayDigest.update(JSON.stringify(event)+'\n');replayEvents++;});
    const endpoint=reconstructed.advance(protocol.ticks);reconstructed.attach(null);assert.deepEqual(endpoint,row.arms[arm].endpoint);assert.deepEqual(reconstructed.checkpoint(false),final);
    assert.equal(replayEvents,events);assert.equal(replayDigest.digest('hex'),row.arms[arm].trace.sha256);replays++;
  }
  rows.push(row);console.log(JSON.stringify({seed:input.history.seed,decisions,replays,assignments}));
}
const result=read(join(base,'results.json'));
for(const arm of protocol.arms)for(const control of ['full','native'])if(arm!==control){
  const key=arm+'-vs-'+control,values=rows.map(row=>row.effects[key]);
  for(const [index,row]of rows.entries()){
    const current=row.arms[arm].endpoint,reference=row.arms[control].endpoint;close(values[index].energy,current.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder);
    assert.equal(values[index].survivors,current.survivors-reference.survivors);
  }
  close(result.comparisons[key].meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/values.length);
  assert.equal(result.comparisons[key].positiveHistories,values.filter(value=>value.energy>0).length);assert.equal(result.comparisons[key].survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));
}
assert.equal(decisions,receipts);const report={schema:1,passed:true,decisions,receipts,replays,assignments,scope:'Independent fixed component assignments, setup charges, trace/ledger and contrast reconstruction plus captured-source physical replay; not independent physics or complete low-level cost adequacy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
