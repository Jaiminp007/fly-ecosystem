import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/conflict-taste-snapshots/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),snapshot=read(join(base,'results.json')),result=read(join(base,'memory.json'));
assert.equal(hash(readFileSync(join(base,'results.json'))),result.snapshotSha256);assert.equal(hash(readFileSync(join(root,'scripts/census-conflict-taste-memory.mjs'))),result.scriptSha256);let memories=0;
for(const record of result.records){const input=snapshot.inputs[record.seed+'-'+record.arm+'-'+record.phase],bytes=readFileSync(join(root,input.path));assert.equal(hash(bytes),input.sha256);const anchor=JSON.parse(bytes),state=anchor.state.learners[record.id],counts=Object.fromEntries(['A','B','C'].map(family=>[family,{count:0,disagreements:0}]));assert.equal(record.seen,state.taste.seen);
  for(const item of state.taste.memory){let match=null;for(const family of ['A','B','C'])for(const cue of anchor.state.codebook[family])if(cue.bits.every((value,index)=>value===item.phi[index+1])){assert.equal(match,null);match={family,cue};}
    assert.ok(match);counts[match.family].count++;counts[match.family].disagreements+=Number(item.target!==Number(match.cue.valence>0));memories++;}
  assert.deepEqual(record.counts,counts);
}
for(const arm of ['observe','filter'])for(const phase of ['A','B','C','D'])for(const family of ['A','B','C'])for(const key of ['count','disagreements'])assert.equal(result.summary[arm][phase][family][key],result.records.filter(record=>record.arm===arm&&record.phase===phase).reduce((sum,record)=>sum+record.counts[family][key],0));
const report={schema:1,passed:true,checkpoints:result.records.length,memories,scope:'Independent retained-memory mapping and aggregation; not a census of replayed updates or causal evidence.'};
writeFileSync(join(base,'memory-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
