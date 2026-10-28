import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/taste-contact-provenance/20261026-v1'),data=readFileSync(join(base,'results.json')),result=JSON.parse(data);
const same=record=>record.patches.every(patch=>patch.cue.every((value,index)=>value===record.cue[index]));
const tally=records=>({count:records.length,disagreements:records.filter(record=>!record.agrees).length});
const histories=[...new Set(result.records.map(record=>record.history))].map(seed=>{
  const records=result.records.filter(record=>record.history===seed),homogeneous=records.filter(same),singleton=records.filter(record=>record.patches.length===1);
  return {seed,all:tally(records),homogeneous:tally(homogeneous),singleton:tally(singleton)};
});
assert.equal(histories.length,8);const homogeneous=result.records.filter(same),singleton=result.records.filter(record=>record.patches.length===1);
const report={schema:1,inputSha256:createHash('sha256').update(data).digest('hex'),scope:'Post-hoc hypothetical filtering on observed pre-action cue equality; no learner intervention or cost estimate.',
  all:tally(result.records),homogeneous:tally(homogeneous),singleton:tally(singleton),histories};
writeFileSync(join(base,'cue-census.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
