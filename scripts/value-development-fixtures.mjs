// Named artificial fixtures. These seeds, rows and worlds are excluded from
// the future performance bank and never establish scientific qualification.
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {TICK_VALUE_DEFAULTS} from '../learning/tick-value.mjs';
import {VALUE_CUE_ARMS} from '../learning/value-cue-experiment.mjs';
import {VALUE_REFERENCE,VALUE_STUDY_PROBES,VALUE_CONTRASTS,VALUE_SURVIVAL,VALUE_BUDGET} from '../learning/value-development.mjs';
import {ValueCueExperiment} from '../learning/value-cue-experiment.mjs';
import {collectValueHistory,scoreValueRows} from '../learning/value-development.mjs';
import {createCompressedTape,valueSourceHashes} from './value-development.mjs';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export function valueFixtureProtocol() {
  let seed=252001; const next=() => seed++;
  const histories=Array.from({length: 24},() => ({seed: next(),cueSeed: next(),resourceSeeds: Array.from({length: 4},next),
    shuffleSeed: next(),nullSeed: next(),probeSeeds: {A: next(),B: next(),C: next(),transfer: next()}}));
  return {schema: 1,experiment: 'fixed-contact-value-development-v1',learner: structuredClone(TICK_VALUE_DEFAULTS),
    phases: structuredClone(CONTINUAL_PHASES),reference: structuredClone(VALUE_REFERENCE),
    pricing: {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)},
    developmentHistories: histories.slice(0,8),confirmationHistories: histories.slice(8),excludedSeeds: [],
    arms: [...VALUE_CUE_ARMS],probes: structuredClone(VALUE_STUDY_PROBES),contrasts: structuredClone(VALUE_CONTRASTS),survival: structuredClone(VALUE_SURVIVAL),
    budget: structuredClone(VALUE_BUDGET),critical: {development: 4.238770203539164,confirmation: 3.4139428948703276},
    equivalenceCritical: {development: 4.819268672375525,confirmation: 3.751997055155257},
    descriptiveCritical: {development: 2.364624251592784,confirmation: 2.1314495455597755},
    alphaPerTest: .05/26,nullMargin: .5,interferenceFraction: .05,retentionFraction: .95,resetConstructionNeutral: true,requireNonempty:true};
}
export function valueSyntheticRows(p,phase) {
  return p[`${phase}Histories`].map(history => {
    const endpoint=value => ({tick: 1792,founders: 24,survivors: 24,survival: 1,budgetAdjustedEnergyPerFounder: value,
      accountingResidual: 0,totals: {beneficialEaten: value*24,toxinDamage: 0}});
    const arms=Object.fromEntries(p.arms.map(arm => [arm,{arm,endpoint: endpoint(arm==='candidate' ? 100 : 0),
      phases: CONTINUAL_PHASES.map(v => ({phase: v.id})),finalSha256: 'a'.repeat(64),initialWorldSha256: 'b'.repeat(64),
      activity: arm==='candidate' ? {founders: 24,decisions: 2400,updates: 2300,activeFounders: 24,passed: true} : null}]));
    const values={'A:A': 10,'A:B': 7,'A:C': 10,'A:reset': 0,'B:A': 0,'B:B': 10,'B:C': 10,'B:reset': 0,
      'C:B': 0,'C:C': 10,'transfer:A': 0,'transfer:C': 10,'transfer:reset': 0,'transfer:accept': 0,'transfer:acceptStationary': 0};
    const probes=p.probes.map(spec => ({...spec,resourceSeed: history.probeSeeds[spec.family],founders: 24,survivors: 24,survival: 1,
      value: values[`${spec.family}:${spec.version}`],resetInitializationEnergyPerFounder: 0,resetInitializationOperations:0,
      skippedAllDead: false,startWorldSha256: spec.family,endpoint: endpoint(values[`${spec.family}:${spec.version}`]),
      acquisitionDisabled: true,learnedWeightsUnchanged: true,inferenceOnlyCompaction:true}));
    return {schema: 1,history,phase,arms,probes,sham: structuredClone(probes[0]),endCCheckpointSha256: 'c'.repeat(64)};
  });
}

export function valueStudyFixtureHistory(profile,emit){
  assert.ok(['full','partial','extinct'].includes(profile));
  const p=valueFixtureProtocol();p.reference.founders=2;
  const history={seed:252401,cueSeed:252402,resourceSeeds:[252403,252404,252405,252406],shuffleSeed:252407,nullSeed:252408,
    probeSeeds:{A:252409,B:252410,C:252411,transfer:252412}};
  const row=collectValueHistory(p,history,'development',emit,config=>{
    const run=new ValueCueExperiment(config);
    for(const[index,fly]of run.world.flies.entries()){
      Object.assign(fly,{energy:120,x:100+400*index,y:100,age:0});
      Object.assign(fly.genome.traits,{speed:0,metabolism:0,lifespan:profile==='extinct'||profile==='partial'&&index===0?.01:1000});
    }
    for(const patch of run.world.food)Object.assign(patch,{x:950,y:600,amount:0,regrowth:0});
    run.world.initialEnergy=run.world.energy();run.startingEnergy=240;return run;
  });
  return {profile,p,history,row};
}
export function valueStudyInferenceFixtures(){
  const p=valueFixtureProtocol();return{p,banks:['development','confirmation'].map(phase=>{
    const rows=valueSyntheticRows(p,phase);return{phase,rows,result:scoreValueRows(rows,p,phase)};
  })};
}
export function writeValueDevelopmentFixture(directory){
  mkdirSync(directory);const physical=[];
  for(const profile of ['full','partial','extinct']){
    const tapeName=`events-${profile}.jsonl.gz`,tape=createCompressedTape(join(directory,tapeName),VALUE_BUDGET);
    let data,hashes;try{data=valueStudyFixtureHistory(profile,tape.emit);hashes=tape.close();}catch(e){tape.abort();throw e;}
    physical.push({...data,tape:tapeName,row:{...data.row,...hashes}});
  }
  const fixture={schema:1,kind:'value-study-engineering',sources:valueSourceHashes(),physical,inference:valueStudyInferenceFixtures(),
    scope:'Artificial full/partial/extinct collector worlds plus invented statistical tables. No performance bank or qualification.'};
  writeFileSync(join(directory,'fixture.json'),JSON.stringify(fixture)+'\n',{flag:'wx'});return fixture;
}
export function replayValueDevelopmentFixture(directory){
  const fixture=JSON.parse(readFileSync(join(directory,'fixture.json')));assert.deepEqual(fixture.sources,valueSourceHashes());
  for(const source of fixture.physical){
    const hash=createHash('sha256'),physical=valueStudyFixtureHistory(source.profile,event=>hash.update(JSON.stringify(event)+'\n'));
    const{numericsSha256,uncompressedSha256,uncompressedBytes,compressedBytes,...row}=source.row;
    assert.equal(hash.digest('hex'),uncompressedSha256);
    assert.deepEqual(JSON.parse(JSON.stringify(physical)),{profile:source.profile,p:source.p,history:source.history,row});
  }
  assert.deepEqual(valueStudyInferenceFixtures(),fixture.inference);
  return{schema:1,passed:true,exactEventAndRowReplay:true,mainWorlds:51,probeSpecs:48,node:process.version,platform:process.platform};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const[command,path,flag,output]=process.argv.slice(2),directory=resolve(path);
  if(command==='--output')writeValueDevelopmentFixture(directory);
  else{assert.ok(command==='--replay'&&flag==='--output');writeFileSync(output,JSON.stringify(replayValueDevelopmentFixture(directory),null,2)+'\n',{flag:'wx'});}
}
