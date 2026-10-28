import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OwnSteeringExperiment} from '../learning/own-steering-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/own-steering-probe-fixture/20261026-v1');
mkdirSync(join(root,'evidence/own-steering-probe-fixture'),{recursive:true});mkdirSync(output,{recursive:false});
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value)+'\n',{flag:'wx'});};
const hash=value=>createHash('sha256').update(value).digest('hex'),sources={};
function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=hash(bytes);const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes,{flag:'wx'});
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/capture-own-steering-probes.mjs','docs/OWN_STEERING_DEVELOPMENT_PLAN.md'])visit(join(root,name));
const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const cases=[{label:'A-current',phase:'A',mode:'current'},{label:'A-earlier',phase:'A',mode:'current',earlier:true},{label:'A-reset',phase:'A',mode:'reset'},
  {label:'transfer-current',phase:'transfer',mode:'current'},{label:'transfer-reset',phase:'transfer',mode:'reset'},
  {label:'transfer-native',phase:'transfer',mode:'current',steeringMode:'native'},{label:'transfer-guarded',phase:'transfer',mode:'current',steeringMode:'guarded'}];
const protocol={schema:1,history,sourceSha256:sources,cases,ticks:30,seed:1004137408,scope:'Synthetic frozen-probe engineering fixture, not a development score or qualification.'};
write(join(output,'protocol.json'),protocol);
const run=new OwnSteeringExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',auditSnapshots:true});
run.world.flies[0].genome.traits.lifespan=.01;run.advance(40);const earlier=run.checkpoint(false);run.advance(40);const later=run.checkpoint(false);
const replay=OwnSteeringExperiment.restore(earlier);replay.advance(40);assert.deepEqual(replay.checkpoint(false),later);
write(join(output,'earlier.json'),earlier);write(join(output,'later.json'),later);
const worldHashes={};
for(const item of cases){
  const events=[],probe=OwnSteeringExperiment.fork(later,{phase:item.phase,seed:protocol.seed,mode:item.mode,modelAnchor:item.earlier?earlier:null,steeringMode:item.steeringMode??null,emit:event=>events.push(structuredClone(event))});
  const start=probe.checkpoint(false),worldHash=hash(JSON.stringify(start.world));
  if(worldHashes[item.phase])assert.equal(worldHashes[item.phase],worldHash);else worldHashes[item.phase]=worldHash;
  probe.advance(protocol.ticks);const final=probe.checkpoint(false),tape=events.map(event=>JSON.stringify(event)).join('\n')+'\n';
  write(join(output,item.label+'-start.json'),start);write(join(output,item.label+'-final.json'),final);writeFileSync(join(output,item.label+'.jsonl'),tape,{flag:'wx'});
  console.log(JSON.stringify({label:item.label,events:events.length,traceSha256:hash(tape),worldHash}));
}
