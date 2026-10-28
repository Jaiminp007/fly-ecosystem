import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-probe-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json')),earlier=read(join(base,'earlier.json')),later=read(join(base,'later.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
assert.deepEqual(earlier.state.history,later.state.history);assert.ok(earlier.world.world.tick<later.world.world.tick);
const worldHashes={},rows=[];
for(const item of protocol.cases){
  const start=read(join(base,item.label+'-start.json')),final=read(join(base,item.label+'-final.json')),price=start.state.pricing.operationEnergy;
  const worldHash=hash(JSON.stringify(start.world));if(worldHashes[item.phase])assert.equal(worldHash,worldHashes[item.phase]);else worldHashes[item.phase]=worldHash;
  close(start.state.startingDebt,Object.values(later.state.learners).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0));
  for(const fly of start.world.world.flies){
    const id=fly.id,old=later.state.learners[id],state=start.state.learners[id],source=item.earlier?earlier.state.learners[id]:old;
    assert.ok(!state.acquisition&&!state.steering.acquisition);assert.equal(state.pending,null);assert.equal(state.steering.pending,null);
    const expectedCopy=item.mode==='reset'?213:106;
    assert.equal(state.work.scalarOperations-old.work.scalarOperations,expectedCopy);
    close(state.charge.outstandingEnergy,old.charge.outstandingEnergy+expectedCopy*price);
    close(state.charge.incurredEnergy,old.charge.incurredEnergy+expectedCopy*price);
    if(item.mode==='reset'){
      assert.ok(state.weights.flat().every(value=>value===0));assert.ok(state.taste.weights.every(value=>value===0));assert.ok(state.steering.weights.flat().every(value=>value===0));
    }else{
      assert.deepEqual(state.weights,source.weights);assert.deepEqual(state.taste.weights,source.taste.weights);assert.deepEqual(state.steering.weights,source.steering.weights);
    }
  }
  const stream=createReadStream(join(base,item.label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let decisions=0,receipts=0,observations=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const initial=start.state.learners[event.id],state=event.auditState;
      assert.ok(!state.acquisition&&!state.steering.acquisition);assert.equal(state.pending,null);assert.equal(state.steering.pending,null);
      assert.deepEqual(state.weights,initial.weights);assert.deepEqual(state.taste.weights,initial.taste.weights);assert.deepEqual(state.steering.weights,initial.steering.weights);
      if(item.steeringMode==='native')assert.equal(event.steering.action,0);
      if(item.steeringMode==='guarded')assert.equal(event.steering.action,Number(event.available));
      decisions++;
    }else if(event.type==='physical')receipts++;
    else{assert.equal(event.type,'observe');observations++;}
  }
  assert.equal(decisions,receipts);assert.equal(decisions,observations);
  for(const fly of start.world.world.flies){
    const initial=start.state.learners[fly.id],state=final.state.learners[fly.id];
    assert.deepEqual(state.weights,initial.weights);assert.deepEqual(state.taste.weights,initial.taste.weights);assert.deepEqual(state.steering.weights,initial.steering.weights);
    assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
  }
  rows.push({label:item.label,decisions,receipts,observations,worldHash,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Captured-source hashes, common starting-world hashes, saved/reset weights, freeze status, setup operations and debt, forced actions and frozen weights. Ancestry replay uses captured implementation separately; full sensory, physical and independent operation audits remain separate.'};
writeFileSync(join(base,'probe-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
