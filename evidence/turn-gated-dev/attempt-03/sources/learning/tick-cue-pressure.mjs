import assert from 'node:assert/strict';
import {digest} from './intervention-study.mjs';
import {runTickCueProbe} from './tick-cue-experiment.mjs';

export const TICK_PRESSURE_SPECS = Object.freeze([
  ['A','A'],['A','B'],['A','C'],['A','reset'],['B','A'],['B','B'],['B','reset']
].map(([family,version]) => Object.freeze({family,version})));
export const TICK_PRESSURE_FRACTION = .05;

// Observer-only paired weight reinstatement. No synthetic gradients, corruption,
// new training data, phase input, or probe reward may enter a continuing learner.
export function runTickPressureBattery(atC, seeds, founders, options = {}) {
  const probeOptions = role => ({...options,emit: event => options.emit?.({role,event})});
  const before = digest(atC), probes = TICK_PRESSURE_SPECS.map(spec => ({
    ...spec,result: runTickCueProbe(atC,spec,seeds[spec.family],founders,probeOptions(`${spec.family}:${spec.version}`))
  }));
  const sham = runTickCueProbe(structuredClone(atC),{family: 'A',version: 'A'},seeds.A,founders,probeOptions('sham'));
  assert.deepEqual(sham,probes[0].result,'Copy/reinstall sham changed the outcome');
  assert.equal(digest(atC),before,'Pressure probes changed their training source');
  for (const family of ['A','B']) {
    const hashes = probes.filter(row => row.family === family).map(row => row.result.startWorldSha256);
    assert.equal(new Set(hashes).size,1,'Pressure interventions need identical physical starts');
  }
  return {schema: 1,kind: 'tick-functional-pressure-battery',sourceCheckpointSha256: before,
    seeds: structuredClone(seeds),founders,probes,sham};
}

// These are raw per-history effects, not a study result or a qualification gate.
// A future frozen scorer must test all of them, with its full multiplicity family.
export function tickPressureEffects(battery) {
  assert.equal(battery.schema,1); assert.equal(battery.kind,'tick-functional-pressure-battery');
  assert.ok(Number.isSafeInteger(battery.founders) && battery.founders >= 2);
  assert.deepEqual(battery.probes.map(({family,version}) => ({family,version})),TICK_PRESSURE_SPECS);
  for (const probe of battery.probes) {
    const result = probe.result;
    assert.equal(result.family,probe.family); assert.equal(result.version,probe.version);
    assert.equal(result.founders,battery.founders); assert.equal(result.resourceSeed,battery.seeds[probe.family]);
    assert.ok(Number.isFinite(result.value));
    assert.ok(Number.isFinite(result.resetInitializationEnergyPerFounder) && result.resetInitializationEnergyPerFounder >= 0);
    if (probe.version !== 'reset') assert.equal(result.resetInitializationEnergyPerFounder,0);
  }
  assert.deepEqual(battery.sham,battery.probes[0].result);
  const get = (family,version) => battery.probes.find(row => row.family === family && row.version === version).result;
  const value = (family,version) => {
    const result = get(family,version);
    return result.value+result.resetInitializationEnergyPerFounder;
  };
  const netFood = (family,version) => {
    const result = get(family,version);
    // Common starting totals cancel. A fully extinct/absent pair has no intake.
    return result.endpoint ? (result.endpoint.totals.beneficialEaten-result.endpoint.totals.toxinDamage)/battery.founders : 0;
  };
  for (const family of ['A','B']) assert.equal(new Set(battery.probes.filter(row => row.family === family)
    .map(row => row.result.startWorldSha256)).size,1);
  const aSkill = value('A','A')-value('A','reset');
  return {aSkillWithoutResetConstruction: aSkill,
    bSkillWithoutResetConstruction: value('B','B')-value('B','reset'),
    bAcquisition: value('B','B')-value('B','A'),
    aInterference: value('A','A')-value('A','B')-TICK_PRESSURE_FRACTION*aSkill,
    aNetFoodInterference: netFood('A','A')-netFood('A','B'),
    aFinalRetention: value('A','C')-.95*value('A','A')-.05*value('A','reset')};
}
