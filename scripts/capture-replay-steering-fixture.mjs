import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/replay-steering-fixture/20261026-v1');
mkdirSync(join(root,'evidence/replay-steering-fixture'),{recursive:true});mkdirSync(output,{recursive:false});
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value)+'\n',{flag:'wx'});};
const hash=value=>createHash('sha256').update(value).digest('hex'),sources={};
function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const data=readFileSync(path);sources[name]=hash(data);const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data,{flag:'wx'});
  if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/capture-replay-steering-fixture.mjs','scripts/check-replay-steering-fixture.mjs','scripts/check-odor-routed-fixture.mjs','scripts/check-odor-routed-learning.mjs','tests/replay-steering-readback.test.mjs','docs/STEERING_REPLAY_DESIGN.md'])visit(join(root,name));
const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const protocol={schema:1,history,founders:4,phaseTicks:40,arms:['learned','native','guarded'],sourceSha256:sources,
  scope:'Artificial shortened phase transition and lifespan for engineering audit, not developmental outcomes or qualification.'};
write(join(output,'protocol.json'),protocol);let commonWorld=null;
for(const steeringMode of protocol.arms){
  const fd=openSync(join(output,steeringMode+'.jsonl'),'wx'),digest=createHash('sha256');let events=0;
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'replay',auditSnapshots:true,steeringMode,
    emit:event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;}});
  run.world.flies[0].genome.traits.lifespan=.01;const start=run.checkpoint(false),worldHash=hash(JSON.stringify(start.world));
  if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);
  let midpoint,final;
  try{run.advance(protocol.phaseTicks);midpoint=run.checkpoint(false);run.phaseIndex=2;run.phaseEnd=run.world.tick;run.advance(protocol.phaseTicks);final=run.checkpoint(false);}finally{closeSync(fd);}
  assert.equal(final.state.phaseIndex,3);assert.ok(final.state.learners[1].dead);
  const replay=OdorRoutedExperiment.restore(start);replay.advance(protocol.phaseTicks);assert.deepEqual(replay.checkpoint(false),midpoint);
  replay.phaseIndex=2;replay.phaseEnd=replay.world.tick;replay.advance(protocol.phaseTicks);assert.deepEqual(replay.checkpoint(false),final);
  write(join(output,steeringMode+'-start.json'),start);write(join(output,steeringMode+'-midpoint.json'),midpoint);write(join(output,steeringMode+'-final.json'),final);
  console.log(JSON.stringify({steeringMode,events,traceSha256:digest.digest('hex'),worldHash}));
}
