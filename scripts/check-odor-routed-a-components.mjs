import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-motor-freeze/20261026-v1'),development=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-a-components/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(output,'protocol.json')),result=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),protocol.priorProtocolSha256);assert.equal(hash(readFileSync(join(base,'results.json'))),protocol.priorResultsSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(output,'sources',name))),expected);
let decisions=0,receipts=0;const rows=[];
for(const input of protocol.inputs){
  const seed=input.history.seed,paths={A:join(development,'anchors',seed+'-A.json'),D:join(base,'finals',seed+'.json')};
  for(const [name,path]of Object.entries(paths))assert.equal(hash(readFileSync(path)),input.sha256[name]);
  const anchors={A:read(paths.A),D:read(paths.D)},row=read(join(output,'rows',seed+'.json'));rows.push(row);let sharedWorld=null;
  for(const arm of protocol.arms){
    const label=seed+'-'+arm.name,initial=read(join(output,'starts',label+'.json')),final=read(join(output,'finals',label+'.json')),entry=row.probes[arm.name],pricing=initial.state.pricing;
    const worldHash=hash(JSON.stringify(initial.world));assert.equal(worldHash,entry.startWorldSha256);if(sharedWorld===null)sharedWorld=worldHash;else assert.equal(worldHash,sharedWorld);
    assert.equal(hash(JSON.stringify(final)),entry.finalSha256);close(initial.state.startingDebt,Object.values(anchors.D.state.learners).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0));
    for(const fly of initial.world.world.flies){
      const id=fly.id,state=initial.state.learners[id],baseState=anchors.D.state.learners[id],earlier=anchors.A.state.learners[id];assert.ok(!state.acquisition&&!state.steering.acquisition);
      const setup=arm.reset?398:212;assert.equal(state.work.scalarOperations-baseState.work.scalarOperations,setup);close(state.charge.outstandingEnergy,baseState.charge.outstandingEnergy+setup*pricing.operationEnergy);
      for(const route of ['present','absent']){
        assert.deepEqual(baseState.banks[route].weights,earlier.banks[route].weights);assert.ok(!state.banks[route].acquisition);
        if(arm.reset)assert.ok(state.banks[route].weights.flat().every(value=>value===0));else assert.deepEqual(state.banks[route].weights,baseState.banks[route].weights);
      }
      if(arm.reset){assert.ok(state.taste.weights.every(value=>value===0));assert.ok(state.steering.weights.flat().every(value=>value===0));}
      else{assert.deepEqual(state.taste.weights,anchors[arm.taste].state.learners[id].taste.weights);assert.deepEqual(state.steering.weights,anchors[arm.steering].state.learners[id].steering.weights);}
    }
    const storage={},paid={},pending={},stream=createReadStream(join(output,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;const state=initial.state.learners[event.id],own=event.own,raw=own.raw,route=own.odorPresent?'present':'absent';assert.equal(event.choice.route,route);
        const phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,own.contactPresent?raw[13]*.25:0];
        const values=state.banks[route].weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*phi[index],0));let action=2;for(let index=1;index>=0;index--)if(values[index]>values[action])action=index;
        assert.equal(event.choice.action,action);assert.equal(event.outputs[1],event.choice.move);
        const scores=state.steering.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*event.features[index],0));
        assert.equal(event.steering.action,Number(event.available&&scores[1]>scores[0]));
        const cue=[1,...own.cue];for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)cue.push(own.cue[first]*own.cue[second]);
        const logit=Math.log(3)+state.taste.weights.reduce((sum,weight,index)=>sum+weight*cue[index],0)/Math.sqrt(11),probability=own.odorPresent?.05+.9/(1+Math.exp(-logit)):1;
        close(event.choice.feedProbability,probability);storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(events,row.traces[label].events);assert.equal(digest.digest('hex'),row.traces[label].sha256);assert.equal(Object.keys(pending).length,0);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);
      assert.deepEqual(state.taste.weights,prior.taste.weights);assert.deepEqual(state.steering.weights,prior.steering.weights);
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
    }
    const endpoint=entry.endpoint;assert.equal(endpoint.survivors,final.world.world.flies.length);close(endpoint.physicalEnergy,final.world.world.flies.reduce((sum,fly)=>sum+fly.energy,0));
    close(endpoint.budgetAdjustedEnergyPerFounder,(endpoint.physicalEnergy-endpoint.startingEnergy-endpoint.outstandingEnergy+endpoint.startingDebt)/endpoint.founders);
  }
}
const summaries={};for(const arm of protocol.arms){const meanEnergy=rows.reduce((sum,row)=>sum+row.probes[arm.name].endpoint.budgetAdjustedEnergyPerFounder,0)/8,survivors=rows.reduce((sum,row)=>sum+row.probes[arm.name].endpoint.survivors,0);
  close(result.summaries[arm.name].meanEnergy,meanEnergy);assert.equal(result.summaries[arm.name].survivors,survivors);summaries[arm.name]=meanEnergy;}
for(const [key,value]of Object.entries({AAminusDD:summaries.AA-summaries.DD,ADminusDD:summaries.AD-summaries.DD,DAminusDD:summaries.DA-summaries.DD,interaction:summaries.AA-summaries.AD-summaries.DA+summaries.DD}))close(result.contrasts[key],value);
const saved=summaries.AA-summaries.reset,current=summaries.DD-summaries.reset;close(result.descriptiveRetention.savedAdvantage,saved);close(result.descriptiveRetention.currentAdvantage,current);
if(saved>0)close(result.descriptiveRetention.ratio,current/saved);else assert.equal(result.descriptiveRetention.ratio,null);
assert.equal(decisions,receipts);assert.equal(result.qualified,false);
const report={schema:1,passed:true,histories:rows.length,decisions,receipts,scope:'Matched world hashes, own component provenance, frozen inference, setup work, reported-work/storage/debt and aggregate arithmetic. Not independent physical dynamics or full operation reconstruction.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
