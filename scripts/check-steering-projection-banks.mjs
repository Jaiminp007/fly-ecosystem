import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/steering-projection-development/20261026-v1'),base=join(root,'evidence/steering-projection-drift/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),original=read(join(source,'protocol.json')),arms={};
for(const arm of original.arms){const counts={survivors:0,absentBankChangedBC:0,absentBankChangedCD:0,sharedChangedCD:0};
  for(const history of original.histories){const row=read(join(base,history.seed+'.json')),anchors={};for(const phase of ['B','C','D']){const bytes=readFileSync(join(source,'anchors',history.seed+'-'+arm+'-'+phase+'.json.gz'));assert.equal(hash(bytes),row.arms[arm].anchorHashes[phase]);anchors[phase]=JSON.parse(gunzipSync(bytes).toString());}
    for(const fly of anchors.D.world.world.flies){const before=anchors.B.state.learners[fly.id].steering,middle=anchors.C.state.learners[fly.id].steering,after=anchors.D.state.learners[fly.id].steering;counts.survivors++;
      counts.absentBankChangedBC+=Number(JSON.stringify(before.contextWeights[0])!==JSON.stringify(middle.contextWeights[0]));counts.absentBankChangedCD+=Number(JSON.stringify(middle.contextWeights[0])!==JSON.stringify(after.contextWeights[0]));counts.sharedChangedCD+=Number(JSON.stringify(middle.weights)!==JSON.stringify(after.weights));}
  }arms[arm]=counts;
}
const report={schema:1,arms,checkerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Hashed checkpoint parameter comparison, not a causal decomposition.'};writeFileSync(join(base,'bank-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
