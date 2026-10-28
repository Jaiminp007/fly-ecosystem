import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/taste-steering-crossover/20261026-v1'),base=join(root,'evidence/steering-target-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(source,'protocol.json'));
const {OdorRoutedExperiment}=await import(pathToFileURL(join(source,'sources/learning/odor-routed-experiment.mjs')).href),records=[];
for(const input of protocol.inputs){
  const anchors={};for(const phase of ['A','B']){const bytes=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(bytes),input.anchors[phase].sha256);anchors[phase]=JSON.parse(bytes);}
  const seed=input.history.seed,row=read(join(source,'rows',seed+'.json'));
  for(const phase of ['A','B']){
    const label=seed+'-'+phase+'-AA',run=OdorRoutedExperiment.restore(read(join(source,'starts',label+'.json'))),seen={},stats=Object.fromEntries(['A','B'].map(model=>[model,{goodCount:0,badCount:0,goodSum:0,badSum:0}]));
    const original=run.world.sensors.bind(run.world);Object.defineProperty(run.world,'sensors',{enumerable:false,configurable:true,value:(fly,index,agents,challenge)=>original(fly,{nearby:(body,radius)=>{const patches=index.nearby(body,radius);seen[fly.id]=patches;return patches;}},agents,challenge)});
    const digest=createHash('sha256');run.attach(event=>{
      digest.update(JSON.stringify(event)+'\n');if(event.type!=='decision'||!event.available)return;
      const visible=seen[event.id].filter(patch=>patch.amount>.06);
      for(const index of event.recommendation.pair){const patch=visible[index],entry=run.codebook[phase].find(item=>item.bits.every((bit,position)=>bit===patch.cue[position]));assert.ok(entry);
        const bits=patch.cue,phi=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]],good=entry.valence===1;
        for(const model of ['A','B']){const weights=anchors[model].state.learners[event.id].taste.weights;let dot=0;for(let offset=0;offset<11;offset++)dot+=weights[offset]*phi[offset];const probability=.05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11)));
          stats[model][good?'goodCount':'badCount']++;stats[model][good?'goodSum':'badSum']+=probability;}
      }
    });
    const endpoint=run.advance(protocol.ticks);run.attach(null);assert.deepEqual(endpoint,row.phases[phase].arms.AA.endpoint);assert.equal(digest.digest('hex'),row.phases[phase].arms.AA.trace.sha256);records.push({seed,phase,stats});
  }
}
const summary=Object.fromEntries(['A','B'].map(phase=>[phase,Object.fromEntries(['A','B'].map(model=>{const sum={goodCount:0,badCount:0,goodSum:0,badSum:0};
  for(const record of records.filter(value=>value.phase===phase))for(const key of Object.keys(sum))sum[key]+=record.stats[model][key];return [model,{...sum,goodMean:sum.goodSum/sum.goodCount,badMean:sum.badSum/sum.badCount}];}))]));
const report={schema:1,scope:'Post-outcome same-observation scoring of saved A/B taste weights against evaluator-only target labels; no physical intervention or paid sensor.',inputProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),records,summary};
writeFileSync(join(base,'taste-snapshots.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({summary}));
