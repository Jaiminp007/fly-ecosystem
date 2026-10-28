import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
const protocol=read(join(base,'protocol.json'));assert.equal(hash(readFileSync(join(root,protocol.bankPath))),protocol.bankSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
let decisions=0,receipts=0;const rows=[];
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json'));
  for(const [label,trace]of Object.entries(row.traces)){
    const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pricing=initial.state.pricing;
    const storage={},paid={},pending={},counts={};let events=0;
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;
        storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        if(event.steering){
          assert.equal(event.own.agentId,event.id);assert.equal(event.own.tick,event.tick);assert.ok(event.steering.action===0||event.available);
          assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
          const count=counts[event.id]??={decisions:0,available:0,native:0,midpoint:0,present:[0,0,0],absent:[0,0,0]};
          count.decisions++;count.available+=Number(event.available);count[event.steering.action?'midpoint':'native']++;count[event.choice.route][event.choice.action]++;
        }
        decisions++;
      }else if(event.type==='physical'){
        assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;
      }
    }
    assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);assert.equal(Object.keys(pending).length,0);assert.deepEqual(counts,trace.counts);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);
      assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(final.state.probe&&state.steering){assert.deepEqual(state.steering.weights,prior.steering.weights);for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);assert.deepEqual(state.taste.weights,prior.taste.weights);}
    }
  }
  rows.push({seed:history.seed,traces:Object.keys(row.traces).length});
}
assert.equal(decisions,receipts);
const report={schema:1,passed:true,decisions,receipts,rows,scope:'Trace hashes, executed commands, support, frozen probe weights and reported-work/storage/payment ledgers. Not an independent physical simulation, full replay-update reconstruction or low-level operation audit.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
