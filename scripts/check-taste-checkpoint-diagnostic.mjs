import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/taste-checkpoint-diagnostic/20261026-v1'),input=join(root,'evidence/cue-shared-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),result=read(join(base,'results.json'));
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-12,`${left} != ${right}`);let bodies=0,scored=0,memories=0,disagreements=0;
for(const history of result.histories){
  const anchors={};for(const phase of ['A','B','C','D']){const data=readFileSync(join(input,'anchors',history.seed+'-cue-shared-'+phase+'.json'));assert.equal(hash(data),result.inputs[history.seed+'-'+phase]);anchors[phase]=JSON.parse(data);}
  const records=result.records.filter(record=>record.history===history.seed);assert.equal(records.length,anchors.D.world.world.flies.length);assert.equal(records.length,history.survivors);
  for(const fly of anchors.D.world.world.flies){
    const record=records.find(item=>item.id===fly.id);assert.ok(record);bodies++;
    for(const [index,phase]of ['A','B','C','D'].entries()){
      const state=anchors[phase].state.learners[fly.id],previous=index?anchors[['A','B','C','D'][index-1]].state.learners[fly.id].tasteExamples:0;
      assert.equal(record.examples[phase],state.tasteExamples-previous);
      for(const family of ['A','B','C']){
        let good=0,bad=0,loss=0,correct=0,goodCount=0,badCount=0;
        for(const cue of anchors.D.state.codebook[family]){
          const bits=cue.bits,features=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]];
          let dot=0;for(let position=0;position<11;position++)dot+=state.taste.weights[position]*features[position];
          const probability=.05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11))),positive=cue.valence===1;
          if(positive){good+=probability;goodCount++;}else{bad+=probability;badCount++;}
          loss-=Math.log(positive?probability:1-probability);correct+=Number((probability>.5)===positive);scored++;
        }
        const score=record.scores[phase][family];close(score.separation,good/goodCount-bad/badCount);close(score.logLoss,loss/4);close(score.accuracy,correct/4);
      }
    }
    const tally=Object.fromEntries(['A','B','C'].map(family=>[family,{count:0,disagreements:0}]));
    for(const memory of anchors.D.state.learners[fly.id].taste.memory){
      const cue=memory.phi.slice(1,5);let matches=0;
      for(const [family,entries]of Object.entries(anchors.D.state.codebook))for(const entry of entries)if(entry.bits.every((value,index)=>value===cue[index])){tally[family].count++;const mismatch=Number(memory.target!==Number(entry.valence===1));tally[family].disagreements+=mismatch;disagreements+=mismatch;matches++;}
      assert.equal(matches,1);memories++;
    }
    assert.deepEqual(record.memory,tally);
  }
}
assert.equal(bodies,result.survivors);for(const family of ['A','B','C'])for(const key of ['count','disagreements'])assert.equal(result.memory[family][key],result.records.reduce((sum,record)=>sum+record.memory[family][key],0));
for(const model of ['A','B','C','D'])for(const family of ['A','B','C'])for(const metric of ['separation','logLoss','accuracy'])close(result.scores[model][family][metric],result.records.reduce((sum,record)=>sum+record.scores[model][family][metric],0)/bodies);
const sourceSha256=Object.fromEntries(['learning/taste-checkpoint-diagnostic.mjs','scripts/taste-checkpoint-diagnostic.mjs','scripts/check-taste-checkpoint-diagnostic.mjs','tests/taste-checkpoint-diagnostic.test.mjs'].map(name=>[name,hash(readFileSync(join(root,name)))]));
const report={passed:true,bodies,scored,memories,disagreements,sourceSha256,scope:'Independent checkpoint hash, factual-memory mapping, model arithmetic and pooled-summary check; no physical replay or causal inference.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
