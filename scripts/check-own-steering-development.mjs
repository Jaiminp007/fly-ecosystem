import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json'));assert.equal(hash(readFileSync(join(root,protocol.bankPath))),protocol.bankSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OwnSteeringExperiment}=await import(pathToFileURL(join(base,'sources/learning/own-steering-experiment.mjs')).href);
const {CoverageExperiment}=await import(pathToFileURL(join(base,'sources/learning/coverage-experiment.mjs')).href);
let decisions=0,receipts=0,ancestry=0;const rows=[];
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json')),anchors={};
  for(const phase of row.anchorPhases)anchors[phase]=read(join(base,'anchors',history.seed+'-'+phase+'.json'));
  for(const [earlier,later]of [['A','B'],['B','C']])if(anchors[earlier]&&anchors[later]){
    const replay=OwnSteeringExperiment.restore(anchors[earlier]);replay.advance(anchors[later].world.world.tick-anchors[earlier].world.world.tick);
    assert.deepEqual(replay.checkpoint(false),anchors[later]);ancestry++;
  }
  for(const [label,expected]of Object.entries(row.traces)){
    const final=read(join(base,'finals',label+'.json'));let initial;
    if(label.includes('-acquire-')){
      const arm=label.split('-acquire-')[1];initial=new OwnSteeringExperiment({history,acquisitionGeometry:'continual',steeringMode:arm}).checkpoint(false);
    }else{
      const [phase,mode]=label.split('-probe-')[1].split(/-(.+)/),anchor=anchors.C;
      if(mode==='native-full')initial=CoverageExperiment.fork({...structuredClone(anchor),kind:'coverage-world'},{phase,seed:history.probeSeeds[phase],mode:'native-full'}).checkpoint(false);
      else initial=OwnSteeringExperiment.fork(anchor,{phase,seed:history.probeSeeds[phase],mode:mode==='reset'?'reset':'current',modelAnchor:mode==='earlier'?anchors[phase]:null,steeringMode:['native','guarded'].includes(mode)?mode:'learned'}).checkpoint(false);
      assert.equal(hash(JSON.stringify(initial.world)),row.probes[phase+'-'+mode].startWorldSha256);
    }
    const states=final.state.learners,old=initial.state.learners,pricing=final.state.pricing,paid={},storage={},pending={},counts={};
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;
        storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        if(event.steering){
          assert.equal(event.own.agentId,event.id);assert.equal(event.own.tick,event.tick);
          assert.ok(event.steering.action===0||event.available);assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
          const count=counts[event.id]??={decisions:0,available:0,native:0,midpoint:0};count.decisions++;count.available+=Number(event.available);count[event.steering.action?'midpoint':'native']++;
        }
        decisions++;
      }else if(event.type==='physical'){
        assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;
      }
    }
    assert.equal(events,expected.events);assert.equal(digest.digest('hex'),expected.sha256);assert.equal(Object.keys(pending).length,0);
    for(const [id,state]of Object.entries(states)){
      const prior=old[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);
      assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(final.state.probe&&state.steering){assert.deepEqual(state.steering.weights,prior.steering.weights);assert.deepEqual(state.weights,prior.weights);assert.deepEqual(state.taste.weights,prior.taste.weights);}
    }
    if(label.includes('-acquire-'))assert.deepEqual(counts,row.acquisition[label.split('-acquire-')[1]].counts);
    else assert.deepEqual(counts,row.probes[label.split('-probe-')[1]].counts);
  }
  rows.push({seed:history.seed,traces:Object.keys(row.traces).length,anchors:row.anchorPhases});
}
assert.equal(decisions,receipts);
const report={schema:1,passed:true,decisions,receipts,ancestryReplays:ancestry,rows,scope:'Captured-source checkpoint ancestry replay; all trace hashes, action support, frozen weights and reported-work/storage/payment ledgers. Does not independently reconstruct all work increments, sensing or physics.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
