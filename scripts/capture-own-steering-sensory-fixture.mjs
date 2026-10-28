import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OwnSteeringExperiment} from '../learning/own-steering-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/own-steering-fixture/20261026-v4');
mkdirSync(join(root,'evidence/own-steering-fixture'),{recursive:true});mkdirSync(output,{recursive:false});
const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const names=['scripts/capture-own-steering-sensory-fixture.mjs','learning/own-steering.mjs','learning/own-steering-experiment.mjs'];
const hashes=Object.fromEntries(names.map(name=>[name,createHash('sha256').update(readFileSync(join(root,name))).digest('hex')]));
const manifest={schema:1,history,founders:4,ticks:80,arms:['learned','native','guarded'],sourceSha256:hashes,scope:'Synthetic implementation fixture, not research performance or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
for(const steeringMode of manifest.arms){
  const events=[],run=new OwnSteeringExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',auditSnapshots:true,steeringMode,emit:event=>events.push(structuredClone(event))});
  run.world.flies[0].genome.traits.lifespan=.01;
  const start=run.checkpoint(false);run.advance(manifest.ticks);const final=run.checkpoint(false);
  assert.ok(final.state.learners[1].steering.dead);
  const trace=events.map(event=>JSON.stringify(event)).join('\n')+'\n';
  writeFileSync(join(output,steeringMode+'.jsonl'),trace,{flag:'wx'});
  writeFileSync(join(output,steeringMode+'-start.json'),JSON.stringify(start),{flag:'wx'});
  writeFileSync(join(output,steeringMode+'-final.json'),JSON.stringify(final),{flag:'wx'});
  console.log(JSON.stringify({steeringMode,events:events.length,traceSha256:createHash('sha256').update(trace).digest('hex')}));
}
