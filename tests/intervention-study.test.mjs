import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {restoreWeightedOutcome} from '../learning/policy-aware-outcome.mjs';
import {collectInterventionWorld, features, fitDiagnosticModel, predictDiagnostic, choiceValue, independentChoice} from '../learning/intervention-study.mjs';
import {validateRowIdentity} from '../scripts/intervention-study.mjs';
const reference = {founders: 4, environments: {stable: {nutrient: .4, ecology: 'baseline', challenges: 'off', seasonal: false}}, actorParameters: {},
  parameters: {decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99, exploration: .1, actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, featureMode: 'mixed'}};
const protocol = {reference, agents: [1, 2], checkpointTicks: [24, 40], horizons: [8, 16], assignmentSeed: 'unit-test-assignment'};

test('forks preserve complete factual continuation; queries contain pre-decision own history', () => {
  const row = collectInterventionWorld(World, protocol, 41, 'stable');
  assert.equal(row.cases.length, 4);
  const baseline = new World({seed: 41, founders: 4, capacity: 240, reproduction: false, mutation: false, ...reference.environments.stable, controller: 'episodic-actor', learning: true, actorParameters: {}, episodicParameters: reference.parameters});
  for (const c of row.cases) {
    assert.ok(c.exactFactualContinuation);
    assert.equal(c.history.length, 3);
    assert.equal(features(c.observation, c.history, 'current').length, 10);
    assert.equal(features(c.observation, c.history, 'history').length, 40);
    assert.equal(c.uniformChoice, independentChoice(protocol.assignmentSeed, c.seed, c.environment, c.tick, c.agentId));
    while (baseline.tick < c.tick + 1) baseline.step();
    assert.deepEqual(c.observation, baseline.flies.find(f => f.id === c.agentId).lastInputs);
  }
});

test('terminal action branches keep dead energy at zero; scheduled dead founders remain in denominator', () => {
  class ShortLifeWorld extends World {
    constructor(config) { super(config); for (const fly of this.flies) fly.genome.traits.lifespan = 2.8; }
  }
  const row = collectInterventionWorld(ShortLifeWorld, protocol, 41, 'stable');
  assert.equal(row.cases.length, 4);
  for (const c of row.cases.filter(c => !c.alreadyDead)) {
    assert.equal(c.arms.fast[8].alive, false);
    assert.equal(c.arms.slow[16].energyChange, -c.initialEnergy);
  }
  assert.equal(row.cases.filter(c => c.alreadyDead).length, 2);
  assert.equal(choiceValue(row.cases[2], 1, 16), 0);
});

test('matched-label budgets and prequential DR fit retain provenance and exact acquired state', () => {
  const row = collectInterventionWorld(World, protocol, 41, 'stable');
  const cases = Array.from({length: 32}, (_, i) => ({...structuredClone(row.cases[i % 4]), tick: i + 1}));
  for (const mode of ['observational', 'ipw', 'dr-contrast', 'uniform', 'paired', 'explicit-exploration', 'matched-uniform']) {
    for (const representation of ['current', 'history']) {
      const model = fitDiagnosticModel(cases, mode, representation, 16, 32);
      assert.ok(model.labels <= 32);
      if (['paired', 'observational', 'uniform'].includes(mode)) assert.equal(model.labels, 32);
      if (mode === 'paired') {
        assert.equal(model.checkpoints, 16);
        const counts = Object.groupBy(model.estimator.records, r => r.evidence.agentId);
        assert.equal(counts[1].length, counts[2].length);
      }
      assert.deepEqual(restoreWeightedOutcome(JSON.parse(JSON.stringify(model.estimator))), model.estimator);
      assert.ok(Number.isFinite(predictDiagnostic(model, cases[0])));
      if (model.nuisance) for (const [i, record] of model.estimator.records.entries()) assert.equal(record.evidence.nuisanceBeforeLabels, Math.max(0, i - 16 + 1));
    }
  }
  assert.throws(() => features(Array(17).fill(0), [], 'history'));
});

test('row validation rejects repeated worlds under other registered filenames and altered denominators', () => {
  const row = {seed: 41, environment: 'stable', cases: protocol.checkpointTicks.flatMap(tick => protocol.agents.map(agentId => ({seed: 41, environment: 'stable', tick, agentId})))};
  validateRowIdentity(row, 41, 'stable', protocol);
  assert.throws(() => validateRowIdentity(row, 42, 'stable', protocol), /registered filename/);
  const altered = structuredClone(row); altered.cases[1] = structuredClone(altered.cases[0]);
  assert.throws(() => validateRowIdentity(altered, 41, 'stable', protocol), /registered schedule/);
  assert.throws(() => validateRowIdentity({...row, cases: row.cases.slice(1)}, 41, 'stable', protocol), /denominator/);
});
