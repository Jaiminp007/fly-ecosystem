import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/decoupled-transfer-stage/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
let survivors=0,unchangedAbsentBanks=0,changedSharedModels=0,decisions=0;
for(const input of protocol.inputs){
  const anchors={};for(const phase of ['B','C','D']){const data=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(data),input.anchors[phase].sha256);anchors[phase]=JSON.parse(data);}
  for(const fly of anchors.D.world.world.flies){
    const before=anchors.B.state.learners[fly.id].steering,after=anchors.C.state.learners[fly.id].steering;survivors++;
    if(JSON.stringify(before.contextWeights[0])===JSON.stringify(after.contextWeights[0]))unchangedAbsentBanks++;
    if(JSON.stringify(before.weights)!==JSON.stringify(after.weights))changedSharedModels++;
  }
  const row=read(join(base,'rows',input.history.seed+'.json'));
  for(const arm of protocol.arms){
    const digest=createHash('sha256'),stream=createReadStream(join(base,'traces',input.history.seed+'-transfer-'+arm+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;if(event.type!=='decision')continue;
      assert.deepEqual(event.own.cue,[0,0,0,0]);assert.equal(event.choice.route,'absent');decisions++;
    }
    assert.equal(events,row.phases.transfer.arms[arm].trace.events);assert.equal(digest.digest('hex'),row.phases.transfer.arms[arm].trace.sha256);
  }
}
const report={schema:1,passed:true,survivors,unchangedAbsentBanks,changedSharedModels,decisions,scope:'Own-cue transfer trace and checkpoint parameter comparison; does not independently simulate dynamics or prove the direction of any component effect.'};
writeFileSync(join(base,'route-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
