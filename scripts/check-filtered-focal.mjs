import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/filtered-focal-diagnosis/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const protocol=read(join(base,'protocol.json')),result=read(join(base,'results.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
let decisions=0,receipts=0;
for(const selected of protocol.cases){
  const source=protocol.inputs.find(input=>input.history.seed===selected.seed);
  for(const field of ['anchor','bare'])assert.equal(hash(readFileSync(join(root,source[field]))),source[field+'Sha256']);
  for(const arm of ['guarded','native'])assert.equal(hash(readFileSync(join(root,'evidence/filtered-overlap/20261026-v1/finals',selected.seed+'-'+arm+'.json'))),source.finalSha256[arm]);
  for(const background of protocol.backgrounds){
    const label=selected.seed+'-'+selected.id+'-background-'+background;
    const row=read(join(base,'rows',label+'.json')),final=read(join(base,'finals',label+'.json'));
    assert.equal(row.focalMode,background==='guarded'?'native':'guarded');
    for(const state of Object.values(final.state.controllers))assert.equal(state.mode,Number(state.agentId===selected.id?background==='native':background==='guarded'));
    const focal=final.world.world.flies.find(fly=>fly.id===selected.id);
    assert.equal(row.focalAlive,!!focal);assert.equal(row.focalEnergy,focal?.energy??0);
    assert.equal(row.endpoint.survivors,final.world.world.flies.length);
    const trace=createReadStream(join(base,'traces',label+'.jsonl')),hasher=createHash('sha256'),pending=new Map();
    trace.on('data',chunk=>hasher.update(chunk));
    for await(const line of createInterface({input:trace,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'){assert.ok(!pending.has(event.id));pending.set(event.id,event.tick);decisions++;}
      else{assert.equal(event.type,'physical');assert.equal(pending.get(event.agentId),event.tick);pending.delete(event.agentId);receipts++;}
    }
    assert.equal(pending.size,0);assert.equal(hasher.digest('hex'),row.traceSha256);
    const saved=result.cases.find(item=>item.seed===selected.seed&&item.id===selected.id).interventions.find(item=>item.background===background);
    assert.equal(saved.alive,row.focalAlive);assert.equal(saved.energy,row.focalEnergy);assert.equal(saved.totalSurvivors,row.endpoint.survivors);
  }
}
assert.equal(decisions,receipts);
const report={schema:1,passed:true,cases:protocol.cases.length,interventions:protocol.cases.length*protocol.backgrounds.length,decisions,receipts,
  scope:'Independently verifies input and source hashes, intervention schedules, final modes, trace hashes, decision/receipt pairing and reported survival. Does not independently replay physics or reconstruct all costs.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
