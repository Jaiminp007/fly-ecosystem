import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {diagnosticFeatures,diagnosticScores} from '../learning/taste-checkpoint-diagnostic.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/cue-shared-development/20261026-v1'),output=join(root,'evidence/taste-checkpoint-diagnostic/20261026-v1');
assert.ok(!existsSync(output));const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const protocol=read(join(input,'protocol.json')),records=[],inputs={};
for(const history of protocol.histories){
  const anchors={};for(const phase of ['A','B','C','D']){const path=join(input,'anchors',history.seed+'-cue-shared-'+phase+'.json'),data=readFileSync(path);inputs[history.seed+'-'+phase]=hash(data);anchors[phase]=JSON.parse(data);}
  const book=anchors.D.state.codebook;for(const phase of ['A','B','C'])assert.deepEqual(anchors[phase].state.codebook,book);
  for(const fly of anchors.D.world.world.flies){
    const states=Object.fromEntries(['A','B','C','D'].map(phase=>[phase,anchors[phase].state.learners[fly.id]]));
    assert.ok(Object.values(states).every(state=>state&&!state.dead));
    const examples=Object.fromEntries(['A','B','C','D'].map((phase,index,array)=>[phase,states[phase].tasteExamples-(index?states[array[index-1]].tasteExamples:0)]));
    assert.ok(Object.values(examples).every(count=>Number.isSafeInteger(count)&&count>=0));
    const scores=Object.fromEntries(['A','B','C','D'].map(model=>[model,Object.fromEntries(['A','B','C'].map(family=>[family,diagnosticScores(states[model].taste.weights,book[family])]))]));
    const memory=Object.fromEntries(['A','B','C'].map(family=>[family,{count:0,disagreements:0}]));
    for(const record of states.D.taste.memory){
      const matches=Object.entries(book).flatMap(([family,cues])=>cues.filter(cue=>JSON.stringify(diagnosticFeatures(cue.bits))===JSON.stringify(record.phi)).map(cue=>({family,cue})));
      assert.equal(matches.length,1);const match=matches[0];memory[match.family].count++;memory[match.family].disagreements+=Number(record.target!==Number(match.cue.valence===1));
    }
    records.push({history:history.seed,id:fly.id,examples,scores,memory});
  }
}
assert.equal(protocol.histories.length,8);assert.ok(records.length>0);
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
const histories=protocol.histories.map(history=>{const subset=records.filter(record=>record.history===history.seed);return {seed:history.seed,survivors:subset.length,meanExamples:Object.fromEntries(['A','B','C','D'].map(phase=>[phase,mean(subset.map(record=>record.examples[phase]))])),
  scores:Object.fromEntries(['A','B','C','D'].map(model=>[model,Object.fromEntries(['A','B','C'].map(family=>[family,Object.fromEntries(['separation','logLoss','accuracy'].map(metric=>[metric,mean(subset.map(record=>record.scores[model][family][metric]))]))]))]))};});
const summary={schema:1,scope:'Retrospective diagnostic on outcome-selected D survivors; codebook labels are evaluator-only and balanced-cue scores are not physical outcomes or training labels.',survivors:records.length,inputs,histories,
  meanExamples:Object.fromEntries(['A','B','C','D'].map(phase=>[phase,mean(records.map(record=>record.examples[phase]))])),
  scores:Object.fromEntries(['A','B','C','D'].map(model=>[model,Object.fromEntries(['A','B','C'].map(family=>[family,Object.fromEntries(['separation','logLoss','accuracy'].map(metric=>[metric,mean(records.map(record=>record.scores[model][family][metric]))]))]))])),
  memory:Object.fromEntries(['A','B','C'].map(family=>[family,{count:records.reduce((sum,record)=>sum+record.memory[family].count,0),disagreements:records.reduce((sum,record)=>sum+record.memory[family].disagreements,0)}])),records};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...summary,records:undefined,histories:undefined}));
