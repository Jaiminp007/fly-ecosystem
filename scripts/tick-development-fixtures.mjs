// Named artificial fixtures. These seeds, rows and worlds are excluded from
// the future performance bank and never establish scientific qualification.
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {TICK_AC_DEFAULTS} from '../learning/tick-actor-critic.mjs';
import {TickCueExperiment,TICK_CUE_ARMS} from '../learning/tick-cue-experiment.mjs';
import {TICK_STUDY_PROBES,TICK_CONTRASTS,TICK_SURVIVAL,TICK_BUDGET,collectTickHistory,scoreTickRows} from '../learning/tick-development.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCompressedTape,tickSourceHashes} from './tick-development.mjs';

export function tickFixtureProtocol() {
  let seed=250001; const next=() => seed++;
  const histories=Array.from({length: 24},() => ({seed: next(),cueSeed: next(),resourceSeeds: Array.from({length: 4},next),
    shuffleSeed: next(),nullSeed: next(),probeSeeds: {A: next(),B: next(),C: next(),transfer: next()}}));
  return {schema: 1,experiment: 'fixed-tick-actor-critic-development-v1',learner: structuredClone(TICK_AC_DEFAULTS),
    phases: structuredClone(CONTINUAL_PHASES),reference: {founders: 24,actorParameters: {},parameters: {actuator: 'move',moveMode: 'levels',
      slowSpeed: .15,fastSpeed: .5,decisionTicks: 8,creditTicks: 8,returnMode: 'td',discount: .99}},
    pricing: {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)},
    developmentHistories: histories.slice(0,8),confirmationHistories: histories.slice(8),excludedSeeds: [],
    arms: [...TICK_CUE_ARMS],probes: structuredClone(TICK_STUDY_PROBES),contrasts: structuredClone(TICK_CONTRASTS),survival: structuredClone(TICK_SURVIVAL),
    budget: structuredClone(TICK_BUDGET),critical: {development: 4.104811556134623,confirmation: 3.33251758941787},
    equivalenceCritical: {development: 4.675521402382426,confirmation: 3.6704185640854523},
    descriptiveCritical: {development: 2.364624251592784,confirmation: 2.1314495455597755},
    alphaPerTest: .05/22,nullMargin: .5,interferenceFraction: .05,retentionFraction: .95,resetConstructionNeutral: true};
}
export function tickSyntheticRows(p,phase) {
  return p[`${phase}Histories`].map(history => {
    const endpoint=value => ({tick: 1792,founders: 24,survivors: 24,survival: 1,budgetAdjustedEnergyPerFounder: value,
      accountingResidual: 0,totals: {beneficialEaten: value*24,toxinDamage: 0}});
    const arms=Object.fromEntries(p.arms.map(arm => [arm,{arm,endpoint: endpoint(arm==='candidate' ? 100 : 0),
      phases: CONTINUAL_PHASES.map(v => ({phase: v.id})),finalSha256: 'a'.repeat(64),initialWorldSha256: 'b'.repeat(64),
      activity: arm==='candidate' ? {founders: 24,decisions: 2400,updates: 2300,activeFounders: 24,passed: true} : null}]));
    const values={'A:A': 10,'A:B': 7,'A:C': 10,'A:reset': 0,'B:A': 0,'B:B': 10,'B:C': 10,'B:reset': 0,
      'C:B': 0,'C:C': 10,'transfer:A': 0,'transfer:C': 10,'transfer:reset': 0,'transfer:accept': 0,'transfer:acceptStationary': 0};
    const probes=p.probes.map(spec => ({...spec,resourceSeed: history.probeSeeds[spec.family],founders: 24,survivors: 24,survival: 1,
      value: values[`${spec.family}:${spec.version}`],resetInitializationEnergyPerFounder: spec.version==='reset' ? .001 : 0,
      skippedAllDead: false,startWorldSha256: spec.family,endpoint: endpoint(values[`${spec.family}:${spec.version}`]),
      acquisitionDisabled: true,learnedWeightsUnchanged: true}));
    return {schema: 1,history,phase,arms,probes,sham: structuredClone(probes[0]),endCCheckpointSha256: 'c'.repeat(64)};
  });
}
export function tickStudyFixtureHistory(emit) {
  const p=tickFixtureProtocol(); p.reference.founders=2;
  const history={seed: 250401,cueSeed: 250402,resourceSeeds: [250403,250404,250405,250406],shuffleSeed: 250407,nullSeed: 250408,
    probeSeeds: {A: 250409,B: 250410,C: 250411,transfer: 250412}};
  const row=collectTickHistory(p,history,'development',emit,config => {
    const run=new TickCueExperiment(config);
    for (const [index,fly] of run.world.flies.entries()) {
      Object.assign(fly,{energy: 120,x: 100+400*index,y: 100,age: 0});
      Object.assign(fly.genome.traits,{speed: 0,metabolism: 0,lifespan: 1000});
    }
    for (const patch of run.world.food) Object.assign(patch,{x: 950,y: 600,amount: 0,regrowth: 0});
    run.world.initialEnergy=run.world.energy(); run.startingEnergy=240; return run;
  });
  return {p,history,row};
}
export function tickInferenceFixtures() {
  const p=tickFixtureProtocol();
  return {p,banks: ['development','confirmation'].map(phase => {const rows=tickSyntheticRows(p,phase); return {phase,rows,result: scoreTickRows(rows,p,phase)};})};
}

export function writeTickDevelopmentFixture(directory) {
  mkdirSync(directory);
  const tape=createCompressedTape(join(directory,'events.jsonl.gz'),TICK_BUDGET);
  let physical,hashes;
  try {physical=tickStudyFixtureHistory(tape.emit); hashes=tape.close();} catch (e) {tape.abort(); throw e;}
  const fixture={schema: 1,kind: 'tick-study-engineering',sources: tickSourceHashes(),
    scope: 'Artificial two-founder motionless long-lived world plus invented statistical tables. No performance result or qualified learner.',
    physical: {...physical,row: {...physical.row,...hashes}},inference: tickInferenceFixtures()};
  writeFileSync(join(directory,'fixture.json'),JSON.stringify(fixture)+'\n',{flag: 'wx'});
  return fixture;
}

export function replayTickDevelopmentFixture(directory) {
  const fixture=JSON.parse(readFileSync(join(directory,'fixture.json'),'utf8'));
  assert.deepEqual(fixture.sources,tickSourceHashes());
  const hash=createHash('sha256'),physical=tickStudyFixtureHistory(event => hash.update(JSON.stringify(event)+'\n'));
  const {numericsSha256,uncompressedSha256,uncompressedBytes,compressedBytes,...row}=fixture.physical.row;
  assert.equal(hash.digest('hex'),uncompressedSha256);
  assert.deepEqual(JSON.parse(JSON.stringify(physical)),{...fixture.physical,row});
  assert.deepEqual(tickInferenceFixtures(),fixture.inference);
  return {schema: 1,passed: true,exactEventAndRowReplay: true,mainWorlds: 13,probes: 16,node: process.version,platform: process.platform};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [command,path,flag,output]=process.argv.slice(2),directory=resolve(path);
  if (command==='--output') writeTickDevelopmentFixture(directory);
  else {assert.ok(command==='--replay' && flag==='--output'); writeFileSync(output,JSON.stringify(replayTickDevelopmentFixture(directory),null,2)+'\n',{flag: 'wx'});}
}
