import test from 'node:test';
import assert from 'node:assert/strict';
import {SarsaExperiment, billSarsaWork, encodedStateBytes, runSarsaProbe} from '../learning/sarsa-experiment.mjs';
import {createSarsaBody} from '../learning/sarsa-body.mjs';
const reference = {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}};
const pricing = {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17};
const config = {seed: 83, resourceSeeds: [901, 902, 903, 904], arm: 'candidate', reference, pricing};

test('complete experiment restores resources, traces, replay, earlier snapshots and paid/unpaid charges together', () => {
  const original = new SarsaExperiment(config); original.advance(700);
  assert.ok(original.savedModels.A); assert.ok(original.resource.shifts > 0);
  assert.equal(original.world.config.episodicParameters.memoryLearning, false);
  assert.equal(original.world.config.episodicParameters.neuralLearning, false);
  const checkpoint = original.checkpoint(), copy = SarsaExperiment.restore(JSON.parse(JSON.stringify(checkpoint)));
  original.advance(1_000); copy.advance(1_000);
  assert.ok(original.atC);
  assert.deepEqual(copy.checkpoint(), original.checkpoint());
  assert.ok(original.endpoint().paidEnergy > 0);
  close(original.endpoint().incurredEnergy - original.endpoint().paidEnergy, original.endpoint().outstandingEnergy);
  assert.ok(Math.abs(original.endpoint().accountingResidual) < 1e-7);
});

test('retention probes share physical states and all founder denominators while keeping acquisition frozen', () => {
  const run = new SarsaExperiment(config); run.advance(1536);
  const checkpoint = run.checkpoint();
  const early = runSarsaProbe(run.atC, {family: 'A', version: 'A'}, 10001, reference.founders);
  const late = runSarsaProbe(run.atC, {family: 'A', version: 'C'}, 10001, reference.founders);
  assert.equal(early.startWorldSha256, late.startWorldSha256);
  assert.equal(early.founders, reference.founders); assert.equal(late.founders, reference.founders);
  assert.ok(early.learnedWeightsUnchanged && late.learnedWeightsUnchanged);
  assert.deepEqual(run.checkpoint(), checkpoint);
  assert.equal(runSarsaProbe(null, {family: 'A', version: 'C'}, 10001, reference.founders).value, 0);
});
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} / ${b}`);

test('prices are mandatory and encoded state includes both replay features and optimizer state', () => {
  assert.throws(() => new SarsaExperiment({...config, pricing: undefined}), /mandatory/);
  const state = createSarsaBody(1, 41), before = encodedStateBytes(state);
  state.work.scalarOperations += 170;
  billSarsaWork(state, pricing);
  close(state.charge.outstandingEnergy, 170 * pricing.operationEnergy);
  billSarsaWork(state, pricing); close(state.charge.outstandingEnergy, 170 * pricing.operationEnergy);
  state.history.push({observation: Array(17).fill(0), choice: 1}); assert.ok(encodedStateBytes(state) > before);
});

test('frozen acquisition and reset preserve physical history but implement different memory interventions', () => {
  const frozen = new SarsaExperiment({...config, arm: 'frozen'}), reset = new SarsaExperiment({...config, arm: 'reset'});
  frozen.advance(512); reset.advance(512);
  frozen.step(); reset.step();
  assert.ok(Object.values(frozen.learners).every(s => !s.acquisition && s.recent.length > 0));
  assert.ok(Object.values(reset.learners).every(s => s.acquisition && s.recent.length === 0 && s.older.length === 0));
  assert.equal(frozen.world.tick, reset.world.tick);
});
