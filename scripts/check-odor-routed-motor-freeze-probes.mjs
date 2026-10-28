import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-motor-freeze/20261026-v1'),development=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-motor-freeze-probes/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(output,'protocol.json')),result=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),protocol.priorProtocolSha256);assert.equal(hash(readFileSync(join(base,'results.json'))),protocol.priorResultsSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(output,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(output,'sources/learning/odor-routed-experiment.mjs')).href);
let decisions=0,receipts=0,replays=0;const rows=[];
for(const input of protocol.inputs){
  const seed=input.history.seed,paths={A:join(development,'anchors',seed+'-A.json'),start:join(base,'starts',seed+'.json'),D:join(base,'finals',seed+'.json')};
  for(const [name,path]of Object.entries(paths))assert.equal(hash(readFileSync(path)),input.sha256[name]);
  const anchors={A:read(paths.A),D:read(paths.D)},replay=OdorRoutedExperiment.restore(read(paths.start));
  for(const [phase,ticks,tick]of [['B',512,1024],['C',512,1536]]){replay.advance(ticks);if(replay.world.tick===tick){anchors[phase]=read(join(output,'anchors',seed+'-'+phase+'.json'));assert.deepEqual(replay.checkpoint(false),anchors[phase]);replays++;}}
  replay.advance(256);assert.deepEqual(replay.checkpoint(false),anchors.D);replays++;
  const row=read(join(output,'rows',seed+'.json'));rows.push(row);
  for(const [label,spec]of Object.entries(row.traces)){
    const key=label.slice(String(seed).length+1),phase=key.split('-')[0],mode=key.slice(phase.length+1),entry=row.probes[key];
    const initial=read(join(output,'starts',label+'.json')),final=read(join(output,'finals',label+'.json'));
    assert.equal(hash(JSON.stringify(initial.world)),entry.startWorldSha256);assert.equal(hash(JSON.stringify(final)),entry.finalSha256);
    const old=initial.state.learners,states=final.state.learners,pricing=final.state.pricing,paid={},storage={},pending={};
    if(mode!=='native-full')for(const fly of initial.world.world.flies){
      const body=old[fly.id],original=anchors.D.state.learners[fly.id],source=mode==='earlier'?anchors[phase].state.learners[fly.id]:original;
      assert.ok(!body.acquisition&&!body.steering.acquisition);assert.equal(body.work.scalarOperations-original.work.scalarOperations,mode==='reset'?371:185);
      for(const route of ['present','absent'])if(mode==='reset')assert.ok(body.banks[route].weights.flat().every(value=>value===0));else assert.deepEqual(body.banks[route].weights,source.banks[route].weights);
    }
    const stream=createReadStream(join(output,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        if(event.steering){
          assert.equal(event.choice.route,event.own.odorPresent?'present':'absent');assert.ok(event.steering.action===0||event.available);
          const raw=event.own.raw,phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),event.own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,event.own.contactPresent?raw[13]*.25:0];
          const values=old[event.id].banks[event.choice.route].weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*phi[index],0));let action=2;
          for(let index=1;index>=0;index--)if(values[index]>values[action])action=index;assert.equal(event.choice.action,action);
        }
        decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(events,spec.events);assert.equal(digest.digest('hex'),spec.sha256);assert.equal(Object.keys(pending).length,0);
    for(const [id,state]of Object.entries(states)){
      const prior=old[id],charge=state.charge;close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(state.banks){for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);assert.deepEqual(state.taste.weights,prior.taste.weights);assert.deepEqual(state.steering.weights,prior.steering.weights);}
    }
    const endpoint=entry.endpoint,living=final.world.world.flies;assert.equal(endpoint.survivors,living.length);close(endpoint.physicalEnergy,living.reduce((sum,fly)=>sum+fly.energy,0));
    close(endpoint.budgetAdjustedEnergyPerFounder,(endpoint.physicalEnergy-endpoint.startingEnergy-endpoint.outstandingEnergy+endpoint.startingDebt)/endpoint.founders);
  }
  for(const mode of ['reset','native','guarded','native-full']){
    const current=row.probes['transfer-current']?.endpoint,control=row.probes['transfer-'+mode]?.endpoint,effect=row.effects[mode];
    if(!current||!control){assert.equal(effect,null);continue;}close(effect.energy,current.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder);assert.equal(effect.survivors,current.survivors-control.survivors);
  }
  console.log(JSON.stringify({seed,probes:Object.keys(row.traces).length}));
}
for(const mode of ['reset','native','guarded','native-full']){
  const values=rows.map(row=>row.effects[mode]),actual=result.comparisons[mode],complete=values.every(Boolean);assert.equal(actual.complete,complete);
  assert.equal(actual.positiveHistories,values.filter(value=>value&&value.energy>0).length);
  if(complete){close(actual.meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/8);assert.equal(actual.survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));}
}
for(const phase of ['A','B']){
  const values=rows.map(row=>[row.probes[phase+'-earlier']?.endpoint,row.probes[phase+'-current']?.endpoint,row.probes[phase+'-reset']?.endpoint]),actual=result.retention[phase];
  const complete=values.every(value=>value.every(Boolean));assert.equal(actual.complete,complete);
  if(complete){const saved=values.reduce((sum,value)=>sum+value[0].budgetAdjustedEnergyPerFounder-value[2].budgetAdjustedEnergyPerFounder,0)/8,current=values.reduce((sum,value)=>sum+value[1].budgetAdjustedEnergyPerFounder-value[2].budgetAdjustedEnergyPerFounder,0)/8;
    close(actual.savedAdvantage,saved);close(actual.currentAdvantage,current);if(saved>0)close(actual.ratio,current/saved);else assert.equal(actual.ratio,null);}
}
assert.equal(decisions,receipts);assert.equal(result.qualified,false);
const report={schema:1,passed:true,histories:rows.length,decisions,receipts,ancestryReplays:replays,scope:'Captured-source checkpoint replay, saved/reset routed weights, frozen inference, trace hashes and reported-work/storage/payment ledgers; not independent physics or full operation reconstruction.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
