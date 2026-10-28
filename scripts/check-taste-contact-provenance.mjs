import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/taste-contact-provenance/20261026-v1'),source=join(root,'evidence/cue-shared-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),result=read(join(base,'results.json')),manifest=read(join(base,'protocol.json'));
for(const [name,digest]of Object.entries(manifest.sourceHashes))assert.equal(hash(readFileSync(join(root,name))),digest);
assert.equal(hash(readFileSync(join(source,'protocol.json'))),manifest.inputProtocolSha256);
let decisions=0,receipts=0,observations=0,events=0;
const keys=new Set();for(const record of result.records){const key=[record.history,record.id,record.tick].join(':');assert.ok(!keys.has(key));keys.add(key);
  assert.ok(record.patches.length>0&&record.patches.every(patch=>patch.distanceSquared<=225&&patch.amount>=0));
  for(let index=1;index<record.patches.length;index++)assert.ok(record.patches[index-1].distanceSquared<=record.patches[index].distanceSquared);
  assert.deepEqual(record.cue,record.patches[0].cue);assert.equal(record.agrees,record.target===Number(record.patches[0].valence===1));
  assert.equal(record.target,Number(record.receipt.beneficial-record.receipt.toxin>0));
}
for(const seed of manifest.histories){
  const row=read(join(source,'rows',seed+'.json'));
  for(const phase of ['A','B','C']){
    const label=seed+'-cue-shared-acquire-'+phase,selected=result.records.filter(record=>record.history===seed&&record.phase===phase),byKey=new Map(selected.map(record=>[record.id+':'+record.tick,record])),counts=new Map(),digest=createHash('sha256');let traceEvents=0;
    const stream=createReadStream(join(source,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);traceEvents++;let key;
      if(event.type==='decision')key=event.id+':'+event.tick;else if(event.type==='physical')key=event.agentId+':'+event.tick;else if(event.type==='observe')key=event.own.agentId+':'+event.own.tick;
      const record=byKey.get(key);if(!record)continue;const seen=counts.get(key)??new Set();assert.ok(!seen.has(event.type));seen.add(event.type);counts.set(key,seen);
      if(event.type==='decision'){assert.equal(event.choice.move,-1);assert.equal(event.choice.accept,true);assert.equal(event.own.contactPresent,true);assert.equal(event.own.odorPresent,true);assert.deepEqual(event.own.cue,record.cue);decisions++;}
      else if(event.type==='physical'){assert.deepEqual(record.receipt,{beneficial:event.beneficialEaten,harmful:event.harmfulEaten,toxin:event.toxinDamage});receipts++;}
      else if(event.type==='observe'){assert.equal(record.target,Number(event.own.lastFood>0));assert.notEqual(event.own.lastFood,0);observations++;}
    }
    assert.equal(traceEvents,row.traces[label].events);assert.equal(digest.digest('hex'),row.traces[label].sha256);events+=traceEvents;
    for(const record of selected){const seen=counts.get(record.id+':'+record.tick);assert.ok(seen&&seen.size===3);}
  }
}
assert.equal(decisions,result.records.length);assert.equal(receipts,decisions);assert.equal(observations,decisions);
const mismatch=result.records.filter(record=>!record.agrees),mixed=mismatch.filter(record=>record.receipt.beneficial>0&&record.receipt.toxin>0);
assert.equal(result.all.count,decisions);assert.equal(result.all.disagreements,mismatch.length);assert.equal(result.disagree.mixed,mixed.length);
assert.ok(mismatch.every(record=>record.patches.length>1&&record.patches.some(patch=>patch.valence!==record.patches[0].valence)));
const previous=read(join(root,'evidence/taste-checkpoint-diagnostic/20261026-v1/results.json'));
assert.equal(result.retained.length,Object.values(previous.memory).reduce((sum,value)=>sum+value.count,0));
assert.equal(result.retained.filter(item=>!item.agrees).length,Object.values(previous.memory).reduce((sum,value)=>sum+value.disagreements,0));
for(const item of result.retained){assert.ok(keys.has([item.history,item.id,item.tick].join(':')));const record=result.records.find(value=>value.history===item.history&&value.id===item.id&&value.tick===item.tick);assert.equal(item.agrees,record.agrees);}
const report={passed:true,events,decisions,receipts,observations,disagreements:mismatch.length,mixedDisagreements:mixed.length,retained:result.retained.length,retainedDisagreements:result.retained.filter(item=>!item.agrees).length,
  scope:'Original trace hashes, selected decision/receipt/observation linkage and recorded-contact arithmetic; contact snapshots come from captured-source replay, not an independent physics simulation.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
