import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-probe-fixture/20261026-v1'),input=join(root,'evidence/odor-routed-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number')return 8;if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
assert.equal(hash(readFileSync(join(input,'learned-midpoint.json'))),protocol.earlierSha256);assert.equal(hash(readFileSync(join(input,'learned-final.json'))),protocol.laterSha256);
const earlier=read(join(input,'learned-midpoint.json')),later=read(join(input,'learned-final.json')),hashes={},rows=[];
for(const item of protocol.cases){
  const start=read(join(base,item.label+'-start.json')),final=read(join(base,item.label+'-final.json')),price=start.state.pricing,worldHash=hash(JSON.stringify(start.world));
  if(hashes[item.phase])assert.equal(hashes[item.phase],worldHash);else hashes[item.phase]=worldHash;
  close(start.state.startingDebt,Object.values(later.state.learners).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0));
  for(const fly of start.world.world.flies){
    const old=later.state.learners[fly.id],state=start.state.learners[fly.id],source=item.earlier?earlier.state.learners[fly.id]:old;
    assert.ok(!state.acquisition&&!state.steering.acquisition);assert.equal(state.steering.pending,null);
    const setup=item.mode==='reset'?371:185;assert.equal(state.work.scalarOperations-old.work.scalarOperations,setup);
    close(state.charge.outstandingEnergy,old.charge.outstandingEnergy+setup*price.operationEnergy);
    for(const route of ['present','absent']){
      assert.ok(!state.banks[route].acquisition);assert.equal(state.banks[route].pending,null);
      if(item.mode==='reset')assert.ok(state.banks[route].weights.flat().every(value=>value===0));else assert.deepEqual(state.banks[route].weights,source.banks[route].weights);
    }
    if(item.mode==='reset'){assert.ok(state.taste.weights.every(value=>value===0));assert.ok(state.steering.weights.flat().every(value=>value===0));}
    else{assert.deepEqual(state.taste.weights,source.taste.weights);assert.deepEqual(state.steering.weights,source.steering.weights);}
  }
  const ledger=Object.fromEntries(Object.entries(start.state.learners).map(([id,state])=>[id,{debt:state.charge.outstandingEnergy,incurred:state.charge.incurredEnergy,paid:state.charge.paidEnergy,operations:state.charge.operationsBilled}]));
  const pending={},stream=createReadStream(join(base,item.label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let decisions=0,receipts=0,observations=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const state=event.auditState,original=start.state.learners[event.id],balance=ledger[event.id],route=event.own.odorPresent?'present':'absent';
      assert.equal(event.choice.route,route);assert.equal(state.route,route);assert.equal(event.storageBytes,bytes(state));
      for(const name of ['present','absent'])assert.deepEqual(state.banks[name].weights,original.banks[name].weights);
      assert.deepEqual(state.taste.weights,original.taste.weights);assert.deepEqual(state.steering.weights,original.steering.weights);
      const raw=event.own.raw,phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),event.own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,event.own.contactPresent?raw[13]*.25:0];
      const values=state.banks[route].weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*phi[index],0));let action=2;
      for(let index=1;index>=0;index--)if(values[index]>values[action])action=index;
      assert.equal(event.choice.action,action);assert.equal(event.outputs[1],event.choice.move);
      if(item.steeringMode==='native')assert.equal(event.steering.action,0);if(item.steeringMode==='guarded')assert.equal(event.steering.action,Number(event.available));
      const due=(event.work-balance.operations)*price.operationEnergy+event.storageBytes*price.byteEnergyPerSecond*.1;
      balance.debt+=due;balance.incurred+=due;balance.operations=event.work;close(event.requestedExtra,balance.debt);close(state.charge.outstandingEnergy,balance.debt);
      assert.ok(!pending[event.id]);pending[event.id]=event.tick;decisions++;
    }else if(event.type==='physical'){
      const balance=ledger[event.agentId];assert.equal(pending[event.agentId],event.tick);balance.debt=Math.max(0,balance.debt-event.paidExtra);balance.paid+=event.paidExtra;receipts++;
    }else{
      const id=event.own.agentId,state=event.auditState,balance=ledger[id];assert.equal(pending[id],event.own.tick);delete pending[id];
      const due=(state.work.scalarOperations-balance.operations)*price.operationEnergy;assert.ok(due>=0);balance.debt+=due;balance.incurred+=due;balance.operations=state.work.scalarOperations;
      close(state.charge.outstandingEnergy,balance.debt);close(state.charge.incurredEnergy,balance.incurred);close(state.charge.paidEnergy,balance.paid);observations++;
    }
  }
  assert.equal(Object.keys(pending).length,0);assert.equal(decisions,receipts);assert.equal(decisions,observations);
  for(const [id,state]of Object.entries(final.state.learners)){const balance=ledger[id];close(state.charge.outstandingEnergy,balance.debt);close(state.charge.paidEnergy,balance.paid);assert.equal(state.charge.operationsBilled,balance.operations);}
  rows.push({label:item.label,decisions,receipts,observations,worldHash,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Matched physical starts, frozen routed inference, setup charge, encoded state and reported-work/debt ledgers. No independent physics or complete per-operation replay.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
