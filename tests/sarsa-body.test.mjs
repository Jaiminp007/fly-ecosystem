import test from 'node:test';
import assert from 'node:assert/strict';
import {createSarsaBody, learnSarsaTransition, chooseSarsaAction, observeSarsaBody, restoreSarsaBody, freezeSarsaBody, SARSA_DIMENSIONS} from '../learning/sarsa-body.mjs';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} / ${b}`);
const basis = i => Array.from({length: SARSA_DIMENSIONS}, (_, j) => +(i === j));
const transition = (tick, action, reward, phi = basis(0), nextPhi = basis(1), terminal = false) => ({agentId: 1, tick, duration: 8, action, reward, phi, nextPhi, terminal});

test('eligibility propagates later terminal reward backward; lambda zero removes that contribution', () => {
  for (const lambda of [0, .9]) {
    const state = createSarsaBody(1, 41, {lambda, updateRate: .1, replayRate: 0});
    learnSarsaTransition(state, transition(1, -1, .1), {replay: false});
    close(state.weights[0][0], .01);
    learnSarsaTransition(state, transition(9, 1, .2, basis(1), basis(0), true), {replay: false});
    close(state.weights[0][0], .01 + .1 * .2 * Math.exp(-8 / 256) * lambda);
    close(state.weights[1][1], .02);
    assert.ok(state.eligibility.flat().every(v => v === 0));
  }
});

test('replay has a bounded recent/reservoir partition and never replays eligibility traces', () => {
  const state = createSarsaBody(1, 41), withoutReplay = createSarsaBody(1, 41);
  for (let i = 0; i < 200; i++) {
    const t = transition(i * 8 + 1, i % 2 ? -1 : 1, .001);
    learnSarsaTransition(state, t); learnSarsaTransition(withoutReplay, t, {replay: false});
  }
  assert.equal(state.recent.length, 16); assert.equal(state.older.length, 48); assert.equal(state.olderSeen, 184);
  assert.deepEqual(state.recent.map(r => r.experience), Array.from({length: 16}, (_, i) => 185 + i));
  assert.ok(state.older.every(r => r.experience < 185));
  assert.deepEqual(state.eligibility, withoutReplay.eligibility);
  assert.equal(state.replayUpdates, 200);
  assert.throws(() => learnSarsaTransition(state, {...transition(1601, 1, 0), agentId: 2}), /body identities/);
});

function experience(state, start, end) {
  for (let tick = start; tick <= end; tick++) {
    if ((tick - 1) % 8 === 0) chooseSarsaAction(state, {agentId: 1, tick, energy: 70 + (tick - 1) / 100, observation: Array(17).fill(.1)});
    observeSarsaBody(state, {agentId: 1, tick, energy: 70 + tick / 100});
  }
}
test('joint learner state preserves policy, traces, replay and counters through JSON continuation and freeze', () => {
  const state = createSarsaBody(1, 41); experience(state, 1, 640);
  const copy = restoreSarsaBody(JSON.parse(JSON.stringify(state)));
  experience(state, 641, 704); experience(copy, 641, 704); assert.deepEqual(copy, state);
  freezeSarsaBody(state); const weights = structuredClone(state.weights), replay = structuredClone(state.recent);
  experience(state, 705, 736); assert.deepEqual(state.weights, weights); assert.deepEqual(state.recent, replay);
});
