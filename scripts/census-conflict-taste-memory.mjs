import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/conflict-taste-snapshots/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),snapshot=read(join(base,'results.json'));
const records=[],summary={};for(const arm of ['observe','filter']){summary[arm]={};for(const phase of ['A','B','C','D'])summary[arm][phase]=Object.fromEntries(['A','B','C'].map(family=>[family,{count:0,disagreements:0}]));}
for(const founder of snapshot.records)for(const phase of ['A','B','C','D']){
  const input=snapshot.inputs[founder.seed+'-'+founder.arm+'-'+phase],data=readFileSync(join(root,input.path));assert.equal(hash(data),input.sha256);const anchor=JSON.parse(data),state=anchor.state.learners[founder.id],counts=Object.fromEntries(['A','B','C'].map(family=>[family,{count:0,disagreements:0}]));
  for(const sample of state.taste.memory){const bits=sample.phi.slice(1,5),matches=Object.entries(anchor.state.codebook).flatMap(([family,entries])=>entries.filter(entry=>entry.bits.every((value,index)=>value===bits[index])).map(entry=>({family,entry})));
    assert.equal(matches.length,1);const {family,entry}=matches[0],disagreement=Number(sample.target!==Number(entry.valence===1));counts[family].count++;counts[family].disagreements+=disagreement;summary[founder.arm][phase][family].count++;summary[founder.arm][phase][family].disagreements+=disagreement;}
  records.push({seed:founder.seed,arm:founder.arm,id:founder.id,phase,seen:state.taste.seen,counts});
}
const report={schema:1,snapshotSha256:hash(readFileSync(join(base,'results.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Retained factual reservoir composition on outcome-selected survivors, not a replay-update census or causal proof.',records,summary};
writeFileSync(join(base,'memory.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
