import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/conflict-taste-snapshots/20261026-v1'),study=join(root,'evidence/adjacent-conflict-development/20261026-v2');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-12),result=read(join(base,'results.json'));
assert.equal(hash(readFileSync(join(study,'protocol.json'))),result.studyProtocolSha256);assert.equal(hash(readFileSync(join(root,'scripts/census-conflict-taste-snapshots.mjs'))),result.scriptSha256);let evaluations=0;
for(const record of result.records){const anchors={};for(const phase of ['A','B','C','D']){const entry=result.inputs[record.seed+'-'+record.arm+'-'+phase],data=readFileSync(join(root,entry.path));assert.equal(hash(data),entry.sha256);anchors[phase]=JSON.parse(data);}
  assert.ok(anchors.D.world.world.flies.some(fly=>fly.id===record.id));
  for(const [index,model]of ['A','B','C','D'].entries()){
    const state=anchors[model].state.learners[record.id],previous=index?anchors[['A','B','C','D'][index-1]].state.learners[record.id].tasteExamples:0;assert.equal(record.examples[model],state.tasteExamples-previous);
    for(const family of ['A','B']){let good=0,bad=0,goodCount=0,badCount=0,loss=0,correct=0;
      for(const cue of anchors.D.state.codebook[family]){const bits=cue.bits,vector=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]];let dot=0;for(let position=0;position<11;position++)dot+=state.taste.weights[position]*vector[position];
        const probability=.05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11))),positive=cue.valence>0;if(positive){good+=probability;goodCount++;}else{bad+=probability;badCount++;}loss-=Math.log(positive?probability:1-probability);correct+=Number((probability>.5)===positive);evaluations++;}
      const actual=record.scores[model][family];close(actual.separation,good/goodCount-bad/badCount);close(actual.logLoss,loss/4);close(actual.accuracy,correct/4);
    }
  }
}
for(const arm of ['observe','filter']){const items=result.records.filter(record=>record.arm===arm),summary=result.summary[arm];assert.equal(items.length,summary.survivors);for(const phase of ['A','B','C','D'])close(summary.examples[phase],items.reduce((sum,record)=>sum+record.examples[phase],0)/items.length);
  for(const model of ['A','B','C','D'])for(const family of ['A','B'])for(const metric of ['separation','logLoss','accuracy'])close(summary.scores[model][family][metric],items.reduce((sum,record)=>sum+record.scores[model][family][metric],0)/items.length);}
const report={schema:1,passed:true,founders:result.records.length,evaluations,scope:'Independent checkpoint hashes, example counts and cue-score arithmetic; not independent physical dynamics.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
