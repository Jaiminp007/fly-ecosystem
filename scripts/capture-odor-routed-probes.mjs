import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/odor-routed-fixture/20261026-v1'),output=join(root,'evidence/odor-routed-probe-fixture/20261026-v1');
mkdirSync(join(root,'evidence/odor-routed-probe-fixture'),{recursive:true});mkdirSync(output,{recursive:false});
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value)+'\n',{flag:'wx'});};
const inputProtocol=read(join(input,'protocol.json'));
for(const [name,expected]of Object.entries(inputProtocol.sourceSha256))assert.equal(hash(readFileSync(join(root,name))),expected);
const sources={};function visit(path){
  const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const content=readFileSync(path);sources[name]=hash(content);const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,content,{flag:'wx'});
  if(/\.m?js$/.test(name))for(const match of content.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));
}
for(const name of ['scripts/capture-odor-routed-probes.mjs','docs/ODOR_ROUTED_MOTOR_DESIGN.md'])visit(join(root,name));
const cases=[{label:'A-current',phase:'A',mode:'current'},{label:'A-earlier',phase:'A',mode:'current',earlier:true},{label:'A-reset',phase:'A',mode:'reset'},
  {label:'transfer-current',phase:'transfer',mode:'current'},{label:'transfer-reset',phase:'transfer',mode:'reset'},
  {label:'transfer-native',phase:'transfer',mode:'current',steeringMode:'native'},{label:'transfer-guarded',phase:'transfer',mode:'current',steeringMode:'guarded'}];
const earlierPath=join(input,'learned-midpoint.json'),laterPath=join(input,'learned-final.json'),earlier=read(earlierPath),later=read(laterPath);
const protocol={schema:1,cases,seed:1004137408,ticks:30,sourceSha256:sources,earlierSha256:hash(readFileSync(earlierPath)),laterSha256:hash(readFileSync(laterPath)),
  scope:'Synthetic shortened acquisition and frozen probes; not developmental performance or qualification.'};
write(join(output,'protocol.json'),protocol);const worldHashes={};
for(const item of cases){
  const path=join(output,item.label+'.jsonl'),fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
  const run=OdorRoutedExperiment.fork(later,{phase:item.phase,seed:protocol.seed,mode:item.mode,modelAnchor:item.earlier?earlier:null,steeringMode:item.steeringMode??null,
    emit:event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;}});
  const start=run.checkpoint(false),worldHash=hash(JSON.stringify(start.world));
  if(worldHashes[item.phase])assert.equal(worldHash,worldHashes[item.phase]);else worldHashes[item.phase]=worldHash;
  let final;try{run.advance(protocol.ticks);final=run.checkpoint(false);}finally{closeSync(fd);}
  write(join(output,item.label+'-start.json'),start);write(join(output,item.label+'-final.json'),final);
  console.log(JSON.stringify({label:item.label,events,traceSha256:digest.digest('hex'),worldHash}));
}
