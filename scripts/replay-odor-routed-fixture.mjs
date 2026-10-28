import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href),rows=[];
for(const arm of protocol.arms){
  const start=read(join(base,arm+'-start.json')),middle=read(join(base,arm+'-midpoint.json')),final=read(join(base,arm+'-final.json'));
  const run=OdorRoutedExperiment.restore(start);run.advance(protocol.phaseTicks);assert.deepEqual(run.checkpoint(false),middle);
  run.phaseIndex=2;run.phaseEnd=run.world.tick;run.advance(protocol.phaseTicks);assert.deepEqual(run.checkpoint(false),final);
  rows.push({arm,startTick:start.world.world.tick,midpointTick:middle.world.world.tick,finalTick:final.world.world.tick});
}
const report={schema:1,passed:true,rows,scope:'Captured-source exact replay of synthetic short cue and odor-free phases; not independent physics.'};
writeFileSync(join(base,'replay.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
