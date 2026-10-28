import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-motor-freeze/20261026-v1'),census=join(root,'evidence/odor-routed-survival-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(output,'protocol.json')),result=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),protocol.developmentProtocolSha256);assert.equal(hash(readFileSync(join(census,'results.json'))),protocol.censusSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(output,'sources',name))),expected);
let decisions=0,receipts=0;const rows=[];
for(const input of protocol.inputs){
  const seed=input.history.seed,anchorPath=join(base,'anchors',seed+'-A.json'),rowPath=join(base,'rows',seed+'.json');
  assert.equal(hash(readFileSync(anchorPath)),input.anchorSha256);assert.equal(hash(readFileSync(rowPath)),input.rowSha256);
  const anchor=read(anchorPath),baseline=read(rowPath),initial=read(join(output,'starts',seed+'.json')),final=read(join(output,'finals',seed+'.json')),row=read(join(output,'rows',seed+'.json'));
  assert.deepEqual(initial.world,anchor.world);const pricing=initial.state.pricing;
  for(const fly of initial.world.world.flies){
    const prior=anchor.state.learners[fly.id],state=initial.state.learners[fly.id];assert.ok(state.acquisition&&state.steering.acquisition);
    assert.equal(state.work.scalarOperations-prior.work.scalarOperations,80);
    close(state.charge.outstandingEnergy,prior.charge.outstandingEnergy+80*pricing.operationEnergy);
    for(const route of ['present','absent']){assert.ok(!state.banks[route].acquisition);assert.equal(state.banks[route].pending,null);assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);}
  }
  const pending={},storage={},paid={},stream=createReadStream(join(output,'traces',seed+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      assert.ok(!pending[event.id]);pending[event.id]=event.tick;assert.equal(event.choice.route,event.own.odorPresent?'present':'absent');
      const raw=event.own.raw,features=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),event.own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,event.own.contactPresent?raw[13]*.25:0];
      const weights=initial.state.learners[event.id].banks[event.choice.route].weights,values=weights.map(vector=>vector.reduce((sum,weight,index)=>sum+weight*features[index],0));let action=2;
      for(let index=1;index>=0;index--)if(values[index]>values[action])action=index;
      assert.equal(event.choice.action,action);assert.equal(event.outputs[1],event.choice.move);storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;decisions++;
    }else if(event.type==='physical'){
      assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;
    }
  }
  assert.equal(events,row.events);assert.equal(digest.digest('hex'),row.traceSha256);assert.equal(Object.keys(pending).length,0);
  for(const [id,state]of Object.entries(final.state.learners)){
    const old=initial.state.learners[id],charge=state.charge;
    for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,old.banks[route].weights);
    close(charge.incurredEnergy,old.charge.incurredEnergy+(state.work.scalarOperations-old.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
    close(charge.paidEnergy,old.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
  }
  const living=final.world.world.flies;assert.equal(row.endpoint.survivors,living.length);close(row.endpoint.physicalEnergy,living.reduce((sum,fly)=>sum+fly.energy,0));
  for(const arm of ['learned','frozen']){const reference=baseline.acquisition[arm].endpoint;close(row.effects[arm].energy,row.endpoint.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder);assert.equal(row.effects[arm].survivors,row.endpoint.survivors-reference.survivors);}
  rows.push(row);
}
for(const arm of ['learned','frozen']){
  const summary=result.comparisons[arm];close(summary.meanEnergy,rows.reduce((sum,row)=>sum+row.effects[arm].energy,0)/8);
  assert.equal(summary.positiveHistories,rows.filter(row=>row.effects[arm].energy>0).length);assert.equal(summary.survivorDifference,rows.reduce((sum,row)=>sum+row.effects[arm].survivors,0));
}
assert.equal(rows.reduce((sum,row)=>sum+row.endpoint.survivors,0),result.survivors);assert.equal(decisions,receipts);assert.equal(result.qualified,false);
const report={schema:1,passed:true,histories:rows.length,decisions,receipts,scope:'Matched A anchors, 80-operation setup charge, frozen motor inference, trace hashes, reported-work/storage/debt and outcome arithmetic. Not independent physical dynamics or complete low-level operation pricing.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
