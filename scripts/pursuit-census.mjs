import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {dirname,join,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {TasteExperiment,runTasteProbe} from '../evidence/taste-development/attempt-15-progress/sources/learning/taste-experiment.mjs';
import {World} from '../evidence/taste-development/attempt-15-progress/sources/engine.mjs';
import {billSarsaWork} from '../evidence/taste-development/attempt-15-progress/sources/learning/sarsa-experiment.mjs';
import {digest} from '../learning/intervention-study.mjs';
import {PursuitCensus,observePursuit,summarizePursuit} from '../learning/pursuit-census.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/taste-development/attempt-15-progress');
const output=join(root,'evidence/pursuit-census/20261025-v1');assert.ok(!existsSync(output));
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const write=(name,value)=>{mkdirSync(dirname(name),{recursive:true});writeFileSync(name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const attempt=read(join(input,'attempt.json')),bank=read(join(input,'protocol.json')),sources={};
for(const [name,expected]of Object.entries(attempt.sourceSha256))assert.equal(digest(readFileSync(join(input,'sources',name))),expected);
const visit=name=>{
  const key=relative(root,name).split(sep).join('/');assert.ok(!key.startsWith('../'));if(Object.hasOwn(sources,key))return;
  const bytes=readFileSync(name);sources[key]=digest(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(name),match[1]));
};
for(const name of ['scripts/pursuit-census.mjs','tests/pursuit-census.test.mjs','docs/PURSUIT_CENSUS_DESIGN.md'])visit(join(root,name));
const inputs=bank.histories.map(history=>({history,anchorSha256:digest(readFileSync(join(input,'anchors',history.seed+'-C.json'))),
  rowSha256:digest(readFileSync(join(input,'rows',history.seed+'.json'))),bareRowSha256:digest(readFileSync(join(root,'evidence/escape-commitment/20261025-v1/rows',history.seed+'.json')))}));
const protocol={schema:1,kind:'factual-acquisition-and-native-full-pursuit-census',createdAt:new Date().toISOString(),inputs,sourceSha256:sources,
  originalAttemptSha256:digest(readFileSync(join(input,'attempt.json'))),design:'All episodes and observations; no intervention, threshold search or new learning.',qualified:false};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const source of inputs){
  const history=source.history,seed=history.seed,original=read(join(input,'rows',seed+'.json')),anchor=read(join(input,'anchors',seed+'-C.json'));
  const path=join(output,'steps',seed+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),hash=createHash('sha256');
  const emit=record=>{const line=JSON.stringify(record)+'\n';writeSync(fd,line);hash.update(line);};
  let acquisition,transfer,probe;
  try{
    acquisition=new PursuitCensus(emit);
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:attempt.learnerOptions,cruiseSpeed:attempt.cruiseSpeed});
    observePursuit(run.world,acquisition,()=>['A','B','C','return-A'][run.phaseIndex]);run.advance(attempt.ticks);
    assert.deepEqual(run.endpoint(),original.arms.candidate.endpoint);assert.deepEqual(run.atC,anchor);
    acquisition.finishAll();transfer=new PursuitCensus(emit);
    const before=World.prototype.step;
    World.prototype.step=function(controller){
      Object.defineProperty(this,'step',{value:before,writable:true,configurable:true,enumerable:false});
      observePursuit(this,transfer,()=> 'transfer');return this.step(controller);
    };
    try{
      const fixed=structuredClone(anchor);fixed.state.cruiseSpeed=1;
      for(const state of Object.values(fixed.state.learners))billSarsaWork(state,fixed.state.pricing);
      probe=runTasteProbe(fixed,{family:'transfer',version:'acceptCruise',seed:history.probeSeeds.transfer});
    }finally{World.prototype.step=before;}
    const preserved=read(join(root,'evidence/escape-commitment/20261025-v1/rows',seed+'.json')).arms['bare-full'];assert.deepEqual(probe,preserved);
    transfer.finishAll();
  }finally{closeSync(fd);}
  const survivors=new Set(anchor.world.world.flies.map(fly=>fly.id)),episodes=[...acquisition.episodes,...transfer.episodes];
  const phases=Object.fromEntries(['A','B','C','return-A','transfer'].map(phase=>[phase,{
    all:summarizePursuit(episodes.filter(episode=>episode.phase===phase)),
    endCSurvivors:summarizePursuit(episodes.filter(episode=>episode.phase===phase&&survivors.has(episode.id)))}]));
  const founders=Object.fromEntries(anchor.state.founderIds.map(id=>[id,{aliveAtEndC:survivors.has(id),phases:Object.fromEntries(['A','B','C','transfer'].map(phase=>[phase,summarizePursuit(episodes.filter(episode=>episode.id===id&&episode.phase===phase))]))}]));
  const row={seed,founders:24,endCSurvivors:[...survivors],exactAcquisitionEndpoint:true,exactEndCAnchor:true,exactBareFullProbe:true,stepsSha256:hash.digest('hex'),phases,bodies:founders};
  write(join(output,'episodes',seed+'.json'),episodes);write(join(output,'rows',seed+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed,phases:Object.fromEntries(Object.entries(phases).map(([name,value])=>[name,value.all]))}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),expected);
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,histories:rows.length,qualified:false,exactReplay:true,
  phases:Object.fromEntries(['A','B','C','return-A','transfer'].map(phase=>[phase,Object.fromEntries(['ticks','targetedTicks','deepInteriorTicks','zeroIntakeTargetedTicks','intake','physicalCosts','movementCosts','rejectedMoves','boundaryClips'].map(name=>[name,rows.reduce((sum,row)=>sum+row.phases[phase].all[name],0)]))])),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},scope:'Observer-only factual exposure, not learned headroom, qualification or RSI.'};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
