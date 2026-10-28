import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../learning/intervention-study.mjs';
import {ValueCueExperiment,VALUE_CUE_ARMS,VALUE_CUE_PROBES,runValueCueProbe} from '../learning/value-cue-experiment.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export function valueWorldSourceHashes(){
  const sources={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(name&&!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(sources,name))return;
    const bytes=readFileSync(path);sources[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/value-cue-engineering.mjs','scripts/audit-value-cue.py','scripts/audit-tick-value.py',
    'scripts/audit-tick-cue.py','scripts/audit-tick-actor-critic.py','tests/value-cue-audit.test.mjs'])visit(resolve(root,name));
  return Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b,'en')));
}
function prepare(run,profile){
  for(const [index,fly]of run.world.flies.entries()){
    Object.assign(fly,{energy:120,x:100+400*index,y:100,age:0});Object.assign(fly.genome.traits,{speed:0,metabolism:0,lifespan:1000});
  }
  for(const patch of run.world.food)Object.assign(patch,{amount:0,regrowth:0});
  if(profile==='mixed'||profile==='low'){
    Object.assign(run.world.food[0],{x:100,y:100,amount:profile==='low'?.01:.8,capacity:1,cueId:1,cue:[1,-1,1,-1],valence:1});
    Object.assign(run.world.food[1],{x:profile==='low'?130:100,y:profile==='low'?100:101,amount:.8,capacity:1,cueId:2,cue:[-1,1,-1,1],valence:-1});
  }
  if(profile==='extinct')for(const fly of run.world.flies)fly.genome.traits.lifespan=.01;
  if(profile==='partial')run.world.flies[0].genome.traits.lifespan=.01;
  run.world.initialEnergy=run.world.energy();run.startingEnergy=240;
}
export function valueWorldEngineeringRecord(){
  const config={history:{seed:251201,cueSeed:251202,resourceSeeds:[251203,251204,251205,251206],shuffleSeed:251207,nullSeed:251208},
    reference:{founders:2,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}},
    pricing:{operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)}};
  const cases=[],collect=(name,arm,profile,ticks)=>{
    const events=[],run=new ValueCueExperiment({...config,arm,emit:event=>events.push(event)});prepare(run,profile);
    const initialCheckpoint=run.checkpoint(false);run.advance(ticks);
    const row={name,arm,profile,ticks,initialCheckpoint,events,finalCheckpoint:run.checkpoint(),endpoint:run.endpoint()};cases.push(row);return row;
  };
  for(const arm of VALUE_CUE_ARMS)collect(`short-${arm}`,arm,'quiet',4);
  collect('mixed-intake','acceptCruise','mixed',3);collect('low-contact','candidate','low',3);
  const extinct=collect('age-extinction','candidate','extinct',1),partial=collect('partial-mortality','candidate','partial',2),
    phase=collect('phase-candidate','candidate','quiet',1792);
  collect('phase-frozen','frozen','quiet',1025);collect('phase-reset','reset','quiet',1025);
  const probes=[],probe=(parent,checkpoint,spec,role='probe')=>{
    const events=[],result=runValueCueProbe(checkpoint,spec,251209,2,{ticks:2,emit:event=>events.push(event)});
    probes.push({parent,role,spec,ticks:2,resourceSeed:251209,events,result});
  };
  for(const spec of VALUE_CUE_PROBES)probe(phase.name,phase.finalCheckpoint.atC,spec);
  probe(phase.name,phase.finalCheckpoint.atC,{family:'A',version:'A'},'sham');
  for(const source of [partial,extinct])for(const version of ['C','reset','accept','acceptStationary'])probe(source.name,source.finalCheckpoint,{family:'transfer',version});
  probe('absent-end-C',null,{family:'A',version:'C'});
  return JSON.parse(JSON.stringify({schema:1,kind:'value-cue-world-engineering',sources:valueWorldSourceHashes(),config,cases,probes,
    scope:'Named artificial world/probe engineering fixtures only; not performance histories, acquired skills, pressure qualification or RSI.'}));
}
export function replayValueWorld(record){
  assert.deepEqual(record.sources,valueWorldSourceHashes());assert.equal(JSON.stringify(record),JSON.stringify(valueWorldEngineeringRecord()),'Exact value-world event/checkpoint/probe replay');
  return {schema:1,passed:true,exactJsonReplay:true,cases:record.cases.length,probes:record.probes.length,node:process.version,platform:process.platform};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length===2&&args[0]==='--output')writeFileSync(args[1],JSON.stringify(valueWorldEngineeringRecord())+'\n',{flag:'wx'});
  else{assert.ok(args.length===4&&args[0]==='--replay'&&args[2]==='--output');writeFileSync(args[3],JSON.stringify(replayValueWorld(JSON.parse(readFileSync(args[1]))),null,2)+'\n',{flag:'wx'});}
}
