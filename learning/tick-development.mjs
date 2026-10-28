import assert from 'node:assert/strict';
import {digest} from './intervention-study.mjs';
import {pairedSignFlip} from './self-modifying-tasks.mjs';
import {CONTINUAL_PHASES} from './continual-regimes.mjs';
import {createTickBody,TICK_AC_DEFAULTS} from './tick-actor-critic.mjs';
import {TickCueExperiment,TICK_CUE_ARMS,TICK_CUE_PROBES,TICK_CUE_PRESSURE_PROBES,runTickCueProbe} from './tick-cue-experiment.mjs';
import {TICK_PRESSURE_SPECS,tickPressureEffects} from './tick-cue-pressure.mjs';

const deepFreeze = value => {if (value && typeof value === 'object') {Object.values(value).forEach(deepFreeze); Object.freeze(value);} return value;};
export const TICK_STUDY_PROBES = deepFreeze([...TICK_CUE_PROBES,...TICK_CUE_PRESSURE_PROBES]);
export const TICK_SEQUENCE_CONTROLS = deepFreeze(TICK_CUE_ARMS.filter(arm => !['candidate','nullCandidate','nullBlind'].includes(arm)));
export const TICK_CONTRASTS = deepFreeze([
  ...TICK_SEQUENCE_CONTROLS.map(main => ({id: `sequence-${main}`,main})),
  {id: 'B-acquisition',terms: [['B:B',1],['B:A',-1]]},
  {id: 'C-acquisition',terms: [['C:C',1],['C:B',-1]]},
  {id: 'A-initial-skill',terms: [['A:A',1],['A:reset',-1]]},
  {id: 'B-initial-skill',terms: [['B:B',1],['B:reset',-1]]},
  {id: 'A-retention',terms: [['A:C',1],['A:A',-.95],['A:reset',-.05]]},
  {id: 'B-retention',terms: [['B:C',1],['B:B',-.95],['B:reset',-.05]]},
  ...['reset','accept','acceptStationary'].map(version => ({id: `transfer-${version}`,terms: [['transfer:C',1],[`transfer:${version}`,-1]]})),
  {id: 'functional-interference',pressure: 'aInterference'},
  {id: 'physical-interference',pressure: 'aNetFoodInterference'},
  {id: 'null-equivalence',null: true}
]);
export const TICK_SURVIVAL = deepFreeze([
  ...TICK_SEQUENCE_CONTROLS.map(main => ({id: `sequence-${main}`,main})),
  ...TICK_CONTRASTS.filter(c => c.terms).map(c => ({id: c.id,
    pair: c.id === 'A-retention' ? ['A:C','A:A'] : c.id === 'B-retention' ? ['B:C','B:B'] : c.terms.map(([key]) => key)}))
]);
export const TICK_BUDGET = deepFreeze({developmentWorlds: 232,confirmationWorlds: 464,totalWorlds: 696,
  worldsPerHistory: 29,worldStepsPerHistory: 27392,totalCollectionWorldSteps: 657408,
  maxPolicyScalarOperations: 50000000000,maxCompressedTraceBytesPerHistory: 268435456,
  maxUncompressedTraceBytesPerHistory: 4294967296,maxEvidenceBytes: 8589934592,
  maxCollectionWallSeconds: 43200,maxCollectionCpuMicroseconds: 43200000000,
  maxReplayWallSeconds: 43200,maxReplayCpuMicroseconds: 43200000000,
  maxIndependentAuditWallSeconds: 86400,maxIndependentAuditCpuSeconds: 86400});
const phases = ['development','confirmation'];
export const historySeeds = h => [h.seed,h.cueSeed,...h.resourceSeeds,h.shuffleSeed,h.nullSeed,...Object.values(h.probeSeeds)];
export function validateTickProtocol(p) {
  assert.equal(p.schema,1); assert.equal(p.experiment,'fixed-tick-actor-critic-development-v1');
  assert.deepEqual(p.learner,TICK_AC_DEFAULTS); assert.deepEqual(p.phases,CONTINUAL_PHASES);
  assert.deepEqual(p.arms,TICK_CUE_ARMS); assert.deepEqual(p.probes,TICK_STUDY_PROBES);
  assert.deepEqual(p.contrasts,TICK_CONTRASTS); assert.deepEqual(p.survival,TICK_SURVIVAL);
  assert.equal(p.reference.founders,24); assert.deepEqual(p.budget,TICK_BUDGET);
  assert.deepEqual(p.pricing,{operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)});
  assert.equal(p.developmentHistories.length,8); assert.equal(p.confirmationHistories.length,16);
  const seeds = [...p.developmentHistories,...p.confirmationHistories].flatMap(h => {
    assert.deepEqual(Object.keys(h).sort(),['seed','cueSeed','resourceSeeds','shuffleSeed','nullSeed','probeSeeds'].sort());
    assert.equal(h.resourceSeeds.length,4); assert.deepEqual(Object.keys(h.probeSeeds),['A','B','C','transfer']); return historySeeds(h);
  });
  assert.equal(seeds.length,288); assert.equal(new Set(seeds).size,288);
  assert.ok(seeds.every(seed => Number.isInteger(seed) && seed>0 && seed<=0xffffffff && !p.excludedSeeds.includes(seed)));
  assert.equal(p.alphaPerTest,.05/22); assert.equal(p.nullMargin,.5); assert.equal(p.interferenceFraction,.05);
  assert.equal(p.retentionFraction,.95); assert.equal(p.resetConstructionNeutral,true);
  for (const phase of phases) for (const key of ['critical','equivalenceCritical','descriptiveCritical']) assert.ok(Number.isFinite(p[key][phase]) && p[key][phase]>0);
}

export function tickActivity(learners) {
  const initial = createTickBody(1,1).weights;
  const states = Object.values(learners), active = states.filter(state => state.work.liveUpdates>0 &&
    state.weights.some((weight,index) => Math.abs(weight-initial[index])>1e-12)).length;
  return {founders: states.length,decisions: states.reduce((n,s) => n+s.decisions,0),
    updates: states.reduce((n,s) => n+s.work.liveUpdates,0),activeFounders: active,
    passed: active>=states.length/2};
}

export function simulateTickHistory(p,h,phase,emit = () => {}) {
  return collectTickHistory(p,h,phase,emit,config => new TickCueExperiment(config));
}
// Engineering can supply a named artificial world factory. The performance
// entrypoint above always constructs the unmodified continuing experiment.
export function collectTickHistory(p,h,phase,emit,createRun) {
  const arms = {}; let atC = null;
  for (const arm of p.arms) {
    const run = createRun({history: h,arm,reference: p.reference,pricing: p.pricing,
      emit: event => emit({role: `main:${arm}`,event})});
    const initialCheckpoint = run.checkpoint(false);
    emit({type: 'main-start',arm,checkpoint: initialCheckpoint});
    run.advance(1792);
    const finalCheckpoint = run.checkpoint(), endpoint = run.endpoint();
    emit({type: 'main-end',arm,checkpoint: finalCheckpoint,endpoint});
    arms[arm] = {arm,endpoint,phases: run.phaseRows,finalSha256: digest(finalCheckpoint),
      initialWorldSha256: digest(initialCheckpoint.world),activity: arm === 'candidate' ? tickActivity(run.learners) : null};
    if (arm === 'candidate') atC = run.atC;
  }
  const before = digest(atC), probes = p.probes.map(spec => runTickCueProbe(atC,spec,h.probeSeeds[spec.family],p.reference.founders,
    {emit: event => emit({role: `probe:${spec.family}:${spec.version}`,event})}));
  const sham = runTickCueProbe(structuredClone(atC),{family: 'A',version: 'A'},h.probeSeeds.A,p.reference.founders,
    {emit: event => emit({role: 'sham',event})});
  assert.deepEqual(sham,probes.find(v => v.family === 'A' && v.version === 'A'));
  assert.equal(digest(atC),before);
  const row = {schema: 1,history: structuredClone(h),phase,arms,probes,sham,endCCheckpointSha256: atC ? before : null};
  emit({type: 'history-end',row}); return row;
}

export function validateTickRow(row,h,p,phase) {
  assert.equal(row.schema,1); assert.equal(row.phase,phase); assert.deepEqual(row.history,h);
  assert.deepEqual(Object.keys(row.arms),p.arms);
  for (const arm of p.arms) {
    const r = row.arms[arm],e = r.endpoint;
    assert.equal(r.arm,arm); assert.equal(e.founders,p.reference.founders);
    assert.ok(Number.isSafeInteger(e.survivors) && e.survivors>=0 && e.survivors<=e.founders);
    assert.equal(e.survival,e.survivors/e.founders);
    assert.ok(e.tick === 1792 || e.survivors === 0);
    assert.ok(Number.isFinite(e.budgetAdjustedEnergyPerFounder) && Math.abs(e.accountingResidual)<1e-6);
    assert.deepEqual(r.phases.map(v => v.phase),p.phases.filter((_,i) => p.phases.slice(0,i+1).reduce((n,v) => n+v.ticks,0)<=e.tick).map(v => v.id));
    assert.ok(/^[a-f0-9]{64}$/.test(r.finalSha256) && /^[a-f0-9]{64}$/.test(r.initialWorldSha256));
  }
  const common = p.arms.filter(arm => !['incumbent','nullCandidate','nullBlind'].includes(arm));
  assert.equal(new Set(common.map(arm => row.arms[arm].initialWorldSha256)).size,1);
  assert.equal(row.arms.nullCandidate.initialWorldSha256,row.arms.nullBlind.initialWorldSha256);
  assert.deepEqual(row.probes.map(({family,version}) => ({family,version})),p.probes);
  for (const probe of row.probes) {
    assert.equal(probe.founders,p.reference.founders); assert.equal(probe.resourceSeed,h.probeSeeds[probe.family]);
    assert.ok(Number.isFinite(probe.value) && Number.isFinite(probe.resetInitializationEnergyPerFounder));
    assert.ok(Number.isSafeInteger(probe.survivors) && probe.survivors>=0 && probe.survivors<=probe.founders);
    assert.equal(probe.survival,probe.survivors/probe.founders);
    if (probe.version !== 'reset') assert.equal(probe.resetInitializationEnergyPerFounder,0);
    if (!probe.skippedAllDead) {assert.ok(probe.acquisitionDisabled && probe.learnedWeightsUnchanged); assert.ok(probe.endpoint.tick===1792 || probe.survivors===0);}
    if (row.endCCheckpointSha256 === null) assert.ok(probe.skippedAllDead && probe.value===0 && probe.survivors===0);
  }
  for (const family of ['A','B','C','transfer']) assert.equal(new Set(row.probes.filter(v => v.family===family).map(v => v.startWorldSha256)).size,1);
  assert.deepEqual(row.sham,row.probes.find(v => v.family==='A' && v.version==='A'));
  const activity = row.arms.candidate.activity;
  assert.equal(activity.founders,p.reference.founders);
  assert.ok(Number.isSafeInteger(activity.activeFounders) && activity.activeFounders>=0 && activity.activeFounders<=activity.founders);
  assert.equal(activity.passed,activity.activeFounders>=activity.founders/2);
}
const probe = (row,key) => {const found = row.probes.find(v => `${v.family}:${v.version}`===key); assert.ok(found,key); return found;};
export function tickEffect(row,c) {
  if (c.main) return row.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-row.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder;
  if (c.null) return row.arms.nullCandidate.endpoint.budgetAdjustedEnergyPerFounder-row.arms.nullBlind.endpoint.budgetAdjustedEnergyPerFounder;
  if (c.pressure) return tickPressureEffects({schema: 1,kind: 'tick-functional-pressure-battery',founders: row.arms.candidate.endpoint.founders,
    seeds: {A: row.history.probeSeeds.A,B: row.history.probeSeeds.B},
    probes: TICK_PRESSURE_SPECS.map(spec => ({...spec,result: probe(row,`${spec.family}:${spec.version}`)})),sham: row.sham})[c.pressure];
  return c.terms.reduce((n,[key,w]) => {const r=probe(row,key); return n+w*(r.value+r.resetInitializationEnergyPerFounder);},0);
}
function uncertainty(values,critical) {
  const n=values.length,mean=values.reduce((n,v) => n+v,0)/n;
  const se=Math.sqrt(values.reduce((n,v) => n+(v-mean)**2,0)/(n-1)/n);
  return {mean,se,lower: mean-critical*se,upper: mean+critical*se};
}
export function scoreTickRows(rows,p,phase) {
  assert.ok(phases.includes(phase));
  const histories=p[`${phase}Histories`]; assert.equal(rows.length,histories.length);
  rows.forEach((r,i) => validateTickRow(r,histories[i],p,phase));
  const comparisons=p.contrasts.map(c => {
    const effects=rows.map(row => tickEffect(row,c)), paired=pairedSignFlip(effects),
      stats=uncertainty(effects,p[c.null ? 'equivalenceCritical' : 'critical'][phase]);
    return {...c,effects,...paired,...stats,developmentPass: c.null ? Math.abs(stats.mean)<p.nullMargin : stats.mean>0,
      confirmationPass: c.null ? stats.lower>-p.nullMargin && stats.upper<p.nullMargin : stats.lower>0 && paired.pOneSided<=p.alphaPerTest};
  });
  const survival=p.survival.map(c => {
    const counts=rows.map(row => c.main ? row.arms.candidate.endpoint.survivors-row.arms[c.main].endpoint.survivors :
      probe(row,c.pair[0]).survivors-probe(row,c.pair[1]).survivors);
    const effects=counts.map(n => n/p.reference.founders),stats=uncertainty(effects,p.descriptiveCritical[phase]);
    return {...c,counts,effects,...stats,passed: counts.reduce((n,v) => n+v,0)>=0};
  });
  const activity=rows.map(row => ({seed: row.history.seed,...row.arms.candidate.activity}));
  const common=survival.every(c => c.passed) && activity.every(c => c.passed);
  return {schema: 1,experiment: p.experiment,phase,histories: histories.map(h => h.seed),comparisons,survival,activity,
    promising: phase==='development' ? common && comparisons.every(c => c.developmentPass) : null,
    qualified: phase==='confirmation' && common && comparisons.every(c => c.confirmationPass),
    boundary: 'One human-proposed fixed learner. All gates required; no reselection, sample extension, promotion or RSI claim. Exact tied survival is not a survival benefit.'};
}
