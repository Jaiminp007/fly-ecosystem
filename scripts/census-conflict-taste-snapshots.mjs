import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {diagnosticScores} from '../learning/taste-checkpoint-diagnostic.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),study=join(root,'evidence/adjacent-conflict-development'),base=join(study,'20261026-v2'),output=join(root,'evidence/conflict-taste-snapshots/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),inputs={},records=[];
for(const history of protocol.histories){const location=protocol.reusedSeeds.includes(history.seed)?'20261026-v1':'20261026-v2';
  for(const arm of protocol.arms){const anchors={};for(const phase of ['A','B','C','D']){const path=join(study,location,'anchors',history.seed+'-'+arm+'-'+phase+'.json'),data=readFileSync(path);inputs[history.seed+'-'+arm+'-'+phase]={path:path.slice(root.length).replaceAll('\\','/'),sha256:hash(data)};anchors[phase]=JSON.parse(data);}
    const book=anchors.D.state.codebook;for(const phase of ['A','B','C'])assert.deepEqual(anchors[phase].state.codebook,book);
    for(const fly of anchors.D.world.world.flies){const states=Object.fromEntries(['A','B','C','D'].map(phase=>[phase,anchors[phase].state.learners[fly.id]]));
      const examples=Object.fromEntries(['A','B','C','D'].map((phase,index,array)=>[phase,states[phase].tasteExamples-(index?states[array[index-1]].tasteExamples:0)]));assert.ok(Object.values(examples).every(value=>Number.isSafeInteger(value)&&value>=0));
      const scores=Object.fromEntries(['A','B','C','D'].map(model=>[model,Object.fromEntries(['A','B'].map(family=>[family,diagnosticScores(states[model].taste.weights,book[family])]))]));records.push({seed:history.seed,arm,id:fly.id,examples,scores});
    }
  }
}
const summary={};for(const arm of protocol.arms){const items=records.filter(record=>record.arm===arm);assert.ok(items.length);summary[arm]={survivors:items.length,examples:Object.fromEntries(['A','B','C','D'].map(phase=>[phase,items.reduce((sum,record)=>sum+record.examples[phase],0)/items.length])),
  scores:Object.fromEntries(['A','B','C','D'].map(model=>[model,Object.fromEntries(['A','B'].map(family=>[family,Object.fromEntries(['separation','logLoss','accuracy'].map(metric=>[metric,items.reduce((sum,record)=>sum+record.scores[model][family][metric],0)/items.length]))]))]))};}
const report={schema:1,studyProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),inputs,summary,records,scope:'Outcome-selected D survivors; evaluator-only labels and balanced cue scoring, not training or physical effects.'};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
