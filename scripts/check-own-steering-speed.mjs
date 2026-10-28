import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1'),output=join(root,'evidence/own-steering-speed-intervention/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(output,'protocol.json')),results=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),protocol.developmentProtocolSha256);assert.equal(hash(readFileSync(join(base,'results.json'))),protocol.developmentResultsSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(output,'sources',name))),expected);
const {OwnSteeringExperiment}=await import(pathToFileURL(join(output,'sources/learning/own-steering-experiment.mjs')).href);
let decisions=0,receipts=0;const rows=[];
for(const input of protocol.inputs){
  const seed=input.history.seed,rowPath=join(base,'rows',seed+'.json');assert.equal(hash(readFileSync(rowPath)),input.rowSha256);
  if(!input.available){assert.ok(results.missingHistories.includes(seed));continue;}
  const anchorPath=join(base,'anchors',seed+'-C.json');assert.equal(hash(readFileSync(anchorPath)),input.anchorSha256);
  const anchor=read(anchorPath),baseline=read(rowPath),row=read(join(output,'rows',seed+'.json')),final=read(join(output,'finals',seed+'.json'));
  const initial=OwnSteeringExperiment.fork(anchor,{phase:'transfer',seed:input.history.probeSeeds.transfer,fixedMove:1}).checkpoint(false);
  assert.equal(hash(JSON.stringify(initial.world)),baseline.probes['transfer-current'].startWorldSha256);
  const pricing=final.state.pricing,storage={},paid={},pending={},stream=createReadStream(join(output,'traces',seed+'.jsonl')),digest=createHash('sha256');
  stream.on('data',chunk=>digest.update(chunk));let events=0,count=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      assert.equal(event.choice.move,1);assert.equal(event.choice.action,2);assert.equal(event.outputs[1],1);
      assert.equal(event.own.agentId,event.id);assert.ok(!pending[event.id]);pending[event.id]=event.tick;
      storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;decisions++;count++;
    }else if(event.type==='physical'){
      assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;
    }
  }
  assert.equal(digest.digest('hex'),row.traceSha256);assert.equal(events,row.events);assert.equal(Object.keys(pending).length,0);
  for(const [id,state]of Object.entries(final.state.learners)){
    const old=initial.state.learners[id],charge=state.charge;
    assert.deepEqual(state.weights,old.weights);assert.deepEqual(state.taste.weights,old.taste.weights);assert.deepEqual(state.steering.weights,old.steering.weights);
    close(charge.incurredEnergy,old.charge.incurredEnergy+(state.work.scalarOperations-old.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
    close(charge.paidEnergy,old.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
  }
  const living=final.world.world.flies;assert.equal(row.endpoint.survivors,living.length);close(row.endpoint.physicalEnergy,living.reduce((sum,fly)=>sum+fly.energy,0));
  for(const mode of ['current','reset','native-full']){
    const reference=baseline.probes['transfer-'+mode].endpoint;close(row.effects[mode].energy,row.endpoint.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder);
    assert.equal(row.effects[mode].survivors,row.endpoint.survivors-reference.survivors);
  }
  rows.push(row);console.log(JSON.stringify({seed,decisions:count}));
}
for(const mode of ['current','reset','native-full']){
  const summary=results.comparisons[mode];assert.equal(summary.histories,rows.length);
  close(summary.meanEnergy,rows.reduce((sum,row)=>sum+row.effects[mode].energy,0)/rows.length);
  assert.equal(summary.positiveHistories,rows.filter(row=>row.effects[mode].energy>0).length);
  assert.equal(summary.survivorDifference,rows.reduce((sum,row)=>sum+row.effects[mode].survivors,0));
}
assert.equal(decisions,receipts);assert.equal(results.qualified,false);
const report={schema:1,passed:true,decisions,receipts,histories:rows.length,scope:'Captured-source and input hashes, matched starting worlds, actual full-speed commands, frozen weights, reported-work/storage/payment ledgers and comparisons. Not independent physics or full operation reconstruction.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
