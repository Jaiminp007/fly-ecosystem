import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnLearner, chooseOwnAction, observeOwnEnergy, restoreOwnLearner, freezeOwnAcquisition, resetOwnAcquiredState} from '../learning/own-experience-learner.mjs';

function advance(state, from, to) {
  for (let tick = from; tick <= to; tick++) {
    const observation = Array(17).fill(0); observation[0] = Math.sin(tick / 10); observation[4] = (70 + tick / 100) / 120;
    if ((tick - 1) % 8 === 0) chooseOwnAction(state, {agentId: 1, tick, energy: 70 + (tick - 1) / 100, observation});
    observeOwnEnergy(state, {agentId: 1, tick, energy: 70 + tick / 100});
  }
}

test('own-body labels mature at their actual horizon and memory eviction preserves exact continuation', () => {
  const state = createOwnLearner(1, 41, {capacity: 16, horizon: 8, representation: 'history'});
  advance(state, 1, 7); assert.equal(state.completed, 0);
  advance(state, 8, 160); assert.equal(state.completed, 20); assert.equal(state.estimator.records.length, 16);
  const copy = restoreOwnLearner(JSON.parse(JSON.stringify(state)));
  advance(state, 161, 208); advance(copy, 161, 208);
  assert.deepEqual(copy, state);
  assert.throws(() => observeOwnEnergy(state, {agentId: 2, tick: 209, energy: 70}), /Another body/);
  const foreign = structuredClone(state); foreign.estimator.records[0].evidence.agentId = 2;
  assert.throws(() => restoreOwnLearner(foreign), /another body/);
  assert.throws(() => observeOwnEnergy(state, {agentId: 1, tick: 210, energy: 70}), /Missing own transition/);
});

test('death completes partial own windows at zero energy instead of discarding them', () => {
  const state = createOwnLearner(1, 41);
  advance(state, 1, 10); assert.equal(state.completed, 0);
  observeOwnEnergy(state, {agentId: 1, tick: 11, energy: 0, terminal: true});
  assert.equal(state.completed, 2); assert.equal(state.terminalLabels, 2); assert.equal(state.pending.length, 0);
  assert.ok(state.estimator.records.every(r => r.target < 0 && r.evidence.terminal));
  assert.deepEqual(restoreOwnLearner(JSON.parse(JSON.stringify(state))), state);
  assert.throws(() => chooseOwnAction(state, {agentId: 1, tick: 17, energy: 0, observation: Array(17).fill(0)}));
});

test('freeze and acquired reset are distinct interventions; frozen models accept no later labels', () => {
  const state = createOwnLearner(1, 41, {horizon: 8, mode: 'ipw-contrast'});
  advance(state, 1, 32); const old = structuredClone(state.estimator);
  freezeOwnAcquisition(state); advance(state, 33, 64);
  assert.deepEqual(state.estimator, old);
  const rng = state.rngState; resetOwnAcquiredState(state);
  assert.equal(state.estimator.seen, 0); assert.equal(state.rngState, rng); assert.equal(state.agentId, 1);
});
