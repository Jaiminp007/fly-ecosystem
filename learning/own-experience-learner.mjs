// Empty-at-birth, per-body continuing learner. It cannot consume fork labels.
// This is an experimental substrate, not a qualified controller.
import assert from 'node:assert/strict';
import {createWeightedOutcome, updateWeightedOutcome, predictWeightedOutcome, restoreWeightedOutcome} from './policy-aware-outcome.mjs';
import {advanceRng, CHANNELS} from './intervention-study.mjs';

const inputWithAction = (x, action) => [...x, action, ...x.slice(1).map(v => v * action)];
function ownInput(state, observation) {
  assert.equal(observation.length, 17);
  assert.ok(observation.every(v => Number.isFinite(v) && Math.abs(v) <= 1));
  const x = [1, ...CHANNELS.map(i => observation[i])];
  if (state.config.representation === 'history') {
    for (let i = state.history.length; i < 3; i++) x.push(...Array(10).fill(0));
    for (const prior of state.history) x.push(...CHANNELS.map(i => prior.observation[i] / 3), prior.choice / 3);
  }
  return x;
}
export function createOwnLearner(agentId, seed, options = {}) {
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0);
  assert.ok(Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
  const config = {capacity: 64, horizon: 256, representation: 'current', mode: 'conditional', exploration: .1, ...options};
  assert.ok(['current', 'history'].includes(config.representation));
  assert.ok(['conditional', 'ipw-contrast'].includes(config.mode));
  assert.ok([8, 256].includes(config.horizon));
  assert.ok(config.exploration >= .1 && config.exploration <= .5);
  const base = config.representation === 'history' ? 40 : 10;
  return {schema: 1, kind: 'continuing-own-experience-learner', agentId, config, rngState: seed,
    estimator: createWeightedOutcome(config.mode === 'conditional' ? base * 2 : base, config.capacity), history: [], pending: [],
    lastDecisionTick: 0, lastObservedTick: 0, decisions: 0, completed: 0, terminalLabels: 0, acquisition: true, dead: false, inferenceCoordinates: 0};
}
export function chooseOwnAction(state, own) {
  assert.equal(own.agentId, state.agentId, 'Another body cannot supply learner experience');
  assert.ok(!state.dead && Number.isInteger(own.tick) && own.tick > state.lastDecisionTick);
  assert.equal(own.tick, state.lastObservedTick + 1, 'Decision must precede its own current transition');
  assert.ok(own.energy >= 0 && own.energy <= 120);
  if (state.lastDecisionTick) assert.equal(own.tick - state.lastDecisionTick, 8);
  const x = ownInput(state, own.observation), contrast = state.config.mode === 'ipw-contrast';
  const difference = contrast ? predictWeightedOutcome(state.estimator, x) * (2 / state.config.exploration)
    : predictWeightedOutcome(state.estimator, inputWithAction(x, 1)) - predictWeightedOutcome(state.estimator, inputWithAction(x, -1));
  state.inferenceCoordinates += state.estimator.records.length * state.estimator.dimensions * (contrast ? 1 : 2);
  const first = advanceRng(state.rngState), second = advanceRng(first); state.rngState = second;
  const greedy = difference === 0 ? .5 : +(difference > 0), randomized = first / 4294967296 < state.config.exploration || greedy === .5;
  const choice = randomized ? (second / 4294967296 < .5 ? -1 : 1) : greedy ? 1 : -1;
  const fast = state.config.exploration / 2 + (1 - state.config.exploration) * greedy;
  if (state.acquisition) state.pending.push({agentId: state.agentId, tick: own.tick, completionTick: own.tick + state.config.horizon - 1, initialEnergy: own.energy, input: x, choice, probability: choice > 0 ? fast : 1 - fast});
  state.history.push({observation: [...own.observation], choice}); if (state.history.length > 3) state.history.shift();
  state.lastDecisionTick = own.tick; state.decisions++;
  return choice;
}
export function observeOwnEnergy(state, {agentId, tick, energy, terminal = false}) {
  assert.equal(agentId, state.agentId, 'Another body cannot supply learner experience');
  assert.ok(!state.dead && Number.isInteger(tick) && tick > state.lastObservedTick && energy >= 0 && energy <= 120);
  assert.equal(tick, state.lastObservedTick + 1, 'Missing own transition feedback');
  assert.ok(!terminal || energy === 0, 'Dead-body endpoint must use zero usable energy');
  const ready = state.pending.filter(p => terminal || p.completionTick <= tick);
  for (const p of ready) {
    // Nonterminal observations are required at every world step, so a label
    // must mature at its actual endpoint, not some later observation.
    if (!terminal) assert.equal(p.completionTick, tick);
    const target = (energy - p.initialEnergy) / 120;
    const contrast = state.config.mode === 'ipw-contrast', value = contrast ? p.choice * target / p.probability / (2 / state.config.exploration) : target;
    const input = contrast ? p.input : inputWithAction(p.input, p.choice);
    updateWeightedOutcome(state.estimator, input, value, 1, {agentId, tick: p.tick, observedAt: tick, choice: p.choice, probability: p.probability, initialEnergy: p.initialEnergy, observedEnergy: energy, terminal, actualHorizon: tick - p.tick + 1});
    state.completed++; if (terminal) state.terminalLabels++;
  }
  state.pending = terminal ? [] : state.pending.filter(p => p.completionTick > tick);
  state.lastObservedTick = tick; state.dead = terminal;
  return {completed: ready.length, terminal};
}
export function freezeOwnAcquisition(state) { state.acquisition = false; state.pending = []; }
export function resetOwnAcquiredState(state) {
  state.estimator = createWeightedOutcome(state.estimator.dimensions, state.config.capacity);
  state.history = []; state.pending = []; state.completed = 0; state.terminalLabels = 0;
}
export function restoreOwnLearner(value) {
  assert.equal(value?.schema, 1); assert.equal(value.kind, 'continuing-own-experience-learner');
  const expected = createOwnLearner(value.agentId, value.rngState, value.config);
  const estimator = restoreWeightedOutcome(value.estimator);
  assert.equal(estimator.dimensions, expected.estimator.dimensions); assert.equal(estimator.capacity, expected.estimator.capacity);
  assert.equal(estimator.seen, value.completed);
  for (const r of estimator.records) {
    const e = r.evidence;
    assert.equal(e.agentId, value.agentId, 'Stored experience belongs to another body');
    assert.ok([-1, 1].includes(e.choice) && e.probability >= value.config.exploration / 2 - 1e-12 && e.probability <= 1);
    assert.equal(e.actualHorizon, e.observedAt - e.tick + 1);
    assert.ok(e.actualHorizon > 0 && (e.terminal ? e.observedEnergy === 0 : e.actualHorizon === value.config.horizon));
    const target = (e.observedEnergy - e.initialEnergy) / 120;
    const expectedTarget = value.config.mode === 'ipw-contrast' ? e.choice * target / e.probability / (2 / value.config.exploration) : target;
    assert.ok(Math.abs(r.target - expectedTarget) < 1e-12, 'Stored target does not match own observed energy');
  }
  assert.ok(value.history.length <= 3 && value.pending.length <= value.config.horizon / 8);
  assert.ok(typeof value.acquisition === 'boolean' && typeof value.dead === 'boolean');
  assert.ok(!value.dead || value.pending.length === 0);
  for (const p of value.pending) { assert.equal(p.agentId, value.agentId); assert.equal(p.completionTick, p.tick + value.config.horizon - 1); assert.ok(p.completionTick > value.lastObservedTick && [-1, 1].includes(p.choice)); }
  return structuredClone(value);
}
