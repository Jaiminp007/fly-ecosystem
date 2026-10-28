import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,writeSync,statfsSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {freezeCoverageBody} from '../learning/coverage-sarsa.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-balanced-replay-development/20261026-v1'),output=join(root,'evidence/balanced-contact-stop/20261026-v1');
assert.ok(!existsSync(output));const disk=statfsSync(root);assert.ok(Number(disk.bavail)*Number(disk.bsize)>=1024**3);mkdirSync(output,{recursive:true});
const sha=data=>createHash('sha256').update(data).digest('hex'),read=path=>JSON.parse(readFileSync(path,'utf8')),development=read(join(source,'protocol.json')),sources={};
function visit(path){const name=relative(root,path).replaceAll('\\','/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=sha(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const path of ['scripts/balanced-contact-stop.mjs','tests/balanced-contact-stop.test.mjs','docs/BALANCED_CONTACT_STOP_PLAN.md'])visit(join(root,path));
const write=(path,value,compressed=false)=>{mkdirSync(dirname(path),{recursive:true});const data=Buffer.from(JSON.stringify(value,null,2)+'\n');writeFileSync(path,compressed?gzipSync(data,{level:9}):data,{flag:'wx'});};
const protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),histories:development.histories,arms:['shadow','stop'],sourceSha256:sources,scope:'Matched B-only compiled stopping development intervention on reused histories, not an acquired skill or qualification.'};write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function tape(label,run,ticks){const disk=statfsSync(output);assert.ok(Number(disk.bavail)*Number(disk.bsize)>=100*1024*1024);const start=run.checkpoint(false);write(join(output,'starts',label+'.json.gz'),start,true);const target=join(output,'traces',label+'.jsonl.gz');mkdirSync(dirname(target),{recursive:true});const fd=openSync(target,'wx'),digest=createHash('sha256');let lines=[],size=0,events=0;const flush=()=>{if(lines.length){writeSync(fd,gzipSync(lines.join('')));lines=[];size=0;}};
  run.attach(event=>{const line=JSON.stringify(event)+'\n';lines.push(line);size+=Buffer.byteLength(line);digest.update(line);events++;if(size>=131072)flush();});let endpoint;try{endpoint=run.advance(ticks);flush();}finally{run.attach(null);closeSync(fd);}write(join(output,'finals',label+'.json.gz'),run.checkpoint(false),true);return {endpoint,startWorldSha256:sha(JSON.stringify(start.world)),trace:{sha256:digest.digest('hex'),events}};
}
const rows=[];
for(const history of protocol.histories){const anchorBytes=readFileSync(join(source,'anchors',history.seed+'-rbase-A.json.gz')),anchor=JSON.parse(gunzipSync(anchorBytes)),row={seed:history.seed,anchorSha256:sha(anchorBytes),arms:{},traces:{}};
  for(const arm of protocol.arms){const run=OdorRoutedExperiment.restore(anchor),anchors={A:anchor},acquisition={};for(const fly of run.world.flies){const state=run.learners[fly.id];for(const motor of Object.values(state.banks)){const before=motor.work.scalarOperations;freezeCoverageBody(motor);state.work.scalarOperations+=motor.work.scalarOperations-before;}state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
    for(const [phase,ticks]of [['B',512],['C',512],['D',256]]){run.contactStop=phase==='B'?arm:'shadow';const label=history.seed+'-'+arm+'-acquire-'+phase,result=tape(label,run,ticks);row.traces[label]=result.trace;acquisition[phase]=result.endpoint;if(!run.world.flies.length||run.world.tick!==({B:1024,C:1536,D:1792})[phase])break;anchors[phase]=run.checkpoint(false);write(join(output,'anchors',history.seed+'-'+arm+'-'+phase+'.json.gz'),anchors[phase],true);}
    const probes={};if(anchors.D){const specs=[...['A','B'].flatMap(phase=>['A','B','current','reset'].map(mode=>({phase,mode}))),...['current','reset','native','guarded','native-full'].map(mode=>({phase:'transfer',mode}))];for(const spec of specs){const key=spec.phase+'-'+spec.mode,label=history.seed+'-'+arm+'-probe-'+key;let probe;if(spec.mode==='native-full')probe=CoverageExperiment.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase:spec.phase,seed:history.probeSeeds[spec.phase],mode:'native-full'});else probe=OdorRoutedExperiment.fork(anchors.D,{phase:spec.phase,seed:history.probeSeeds[spec.phase],mode:spec.mode==='reset'?'reset':'current',modelAnchor:['A','B'].includes(spec.mode)?anchors[spec.mode]:null,steeringMode:['native','guarded'].includes(spec.mode)?spec.mode:'learned',compactFrozen:true});const result=tape(label,probe,256);row.traces[label]=result.trace;probes[key]={endpoint:result.endpoint,startWorldSha256:result.startWorldSha256};}for(const phase of ['A','B','transfer']){const worlds=Object.entries(probes).filter(([key])=>key.startsWith(phase+'-')).map(([,value])=>value.startWorldSha256);assert.ok(worlds.every(value=>value===worlds[0]));}}
    row.arms[arm]={acquisition,probes,anchors:Object.keys(anchors)};
  }write(join(output,'rows',history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:history.seed,survivors:Object.fromEntries(protocol.arms.map(arm=>[arm,row.arms[arm].acquisition.D?.survivors??null]))}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(sha(readFileSync(join(root,name))),digest);write(join(output,'collection.json'),{schema:1,complete:true,histories:rows.length,scope:protocol.scope});
