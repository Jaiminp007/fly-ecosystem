// One body, no fork labels: decision-level Expected SARSA(lambda), with
// task-blind recent/reservoir transition rehearsal. Experimental only.
import assert from 'node:assert/strict';
import {advanceRng, CHANNELS} from './intervention-study.mjs';
export const SARSA_DIMENSIONS = 40;
export const SARSA_DEFAULTS = Object.freeze({epsilon: .1, lambda: .9, horizon: 256, updateRate: .05, replayRate: .01, capacity: 64, recent: 16});
function vector(x) { assert.ok(Array.isArray(x) && x.length === SARSA_DIMENSIONS && x.every(v => Number.isFinite(v) && Math.abs(v) <= 1)); }
function draw(state, key) { state[key] = advanceRng(state[key]); return state[key] / 4294967296; }

export function createSarsaBody(agentId, seed, options = {}) {
  const config = {...SARSA_DEFAULTS, ...options};
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0 && Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
  for (const key of Object.keys(options)) assert.ok(Object.hasOwn(SARSA_DEFAULTS, key));
  assert.ok(config.epsilon >= .05 && config.epsilon <= .5 && config.lambda >= 0 && config.lambda <= 1 && config.horizon === 256);
  assert.ok(config.updateRate > 0 && config.updateRate <= .2 && config.replayRate >= 0 && config.replayRate <= .2);
  assert.ok(config.capacity === 64 && config.recent === 16);
  return {schema: 1, kind: 'own-expected-sarsa-replay', agentId, config, weights: Array.from({length: 2}, () => Array(SARSA_DIMENSIONS).fill(0)),
    eligibility: Array.from({length: 2}, () => Array(SARSA_DIMENSIONS).fill(0)), history: [], pending: null, recent: [], older: [], olderSeen: 0,
    rngState: seed, retentionRngState: (seed ^ 0x9e3779b9) >>> 0 || 1, replayRngState: (seed ^ 0xa511e9b3) >>> 0 || 1,
    decisions: 0, transitions: 0, replayUpdates: 0, lastDecisionTick: 0, lastObservedTick: 0, acquisition: true, dead: false,
    work: {scalarOperations: 0, liveUpdates: 0, replayUpdates: 0}, charge: {operationsBilled: 0, outstandingEnergy: 0, incurredEnergy: 0, paidEnergy: 0, storageBytes: 0}};
}
export function sarsaFeatures(state, observation) {
  assert.ok(Array.isArray(observation) && observation.length === 17 && observation.every(v => Number.isFinite(v) && Math.abs(v) <= 1));
  const raw = [1, ...CHANNELS.map(i => observation[i])];
  for (let i = state.history.length; i < 3; i++) raw.push(...Array(10).fill(0));
  for (const h of state.history) raw.push(...CHANNELS.map(i => h.observation[i] / 3), h.choice / 3);
  const norm = Math.max(1, Math.sqrt(raw.reduce((s, v) => s + v * v, 0)));
  state.work.scalarOperations += raw.length * 4;
  return raw.map(v => v / norm);
}
export function sarsaValues(state, phi) {
  vector(phi); state.work.scalarOperations += SARSA_DIMENSIONS * 4;
  const q = state.weights.map(w => w.reduce((sum, value, i) => sum + value * phi[i], 0));
  assert.ok(q.every(Number.isFinite)); return q;
}
export function expectedSarsaValue(state, phi) {
  const q = sarsaValues(state, phi);
  return (1 - state.config.epsilon) * Math.max(...q) + state.config.epsilon * (q[0] + q[1]) / 2;
}
function checkTransition(state, t) {
  assert.equal(t.agentId, state.agentId, 'Replay cannot cross body identities');
  vector(t.phi); vector(t.nextPhi);
  assert.ok([-1, 1].includes(t.action) && Number.isFinite(t.reward));
  assert.ok(Number.isInteger(t.tick) && t.tick > 0 && Number.isInteger(t.duration) && t.duration > 0 && t.duration <= 8);
  assert.ok(typeof t.terminal === 'boolean');
}
function target(state, t) { return t.reward + (t.terminal ? 0 : Math.exp(-t.duration / state.config.horizon) * expectedSarsaValue(state, t.nextPhi)); }
function remember(state, transition) {
  state.recent.push(structuredClone(transition));
  if (state.recent.length <= state.config.recent) return;
  const displaced = state.recent.shift(), room = state.config.capacity - state.config.recent;
  state.olderSeen++;
  if (state.older.length < room) state.older.push(displaced);
  else { const index = Math.floor(draw(state, 'retentionRngState') * state.olderSeen); if (index < room) state.older[index] = displaced; }
}
export function learnSarsaTransition(state, transition, {replay = true} = {}) {
  checkTransition(state, transition); assert.ok(state.acquisition && !state.dead);
  const action = transition.action > 0 ? 1 : 0, predicted = sarsaValues(state, transition.phi)[action], delta = target(state, transition) - predicted;
  const decay = Math.exp(-transition.duration / state.config.horizon) * state.config.lambda;
  for (let a = 0; a < 2; a++) for (let j = 0; j < SARSA_DIMENSIONS; j++) {
    state.eligibility[a][j] = decay * state.eligibility[a][j] + (a === action ? transition.phi[j] : 0);
    state.weights[a][j] += state.config.updateRate * delta * state.eligibility[a][j];
  }
  state.work.scalarOperations += SARSA_DIMENSIONS * 2 * 5; state.work.liveUpdates++; state.transitions++;
  remember(state, {...transition, experience: state.transitions});
  if (replay) {
    const memory = [...state.older, ...state.recent], selected = memory[Math.floor(draw(state, 'replayRngState') * memory.length)];
    const a = selected.action > 0 ? 1 : 0, error = target(state, selected) - sarsaValues(state, selected.phi)[a];
    // Replay is a fresh one-step semi-gradient update. Online traces must not
    // propagate through unrelated historical records.
    for (let j = 0; j < SARSA_DIMENSIONS; j++) state.weights[a][j] += state.config.replayRate * error * selected.phi[j];
    state.work.scalarOperations += SARSA_DIMENSIONS * 3; state.work.replayUpdates++; state.replayUpdates++;
  }
  assert.ok(state.weights.flat().every(Number.isFinite));
  if (transition.terminal) for (const trace of state.eligibility) trace.fill(0);
  return {delta};
}
export function chooseSarsaAction(state, own) {
  assert.equal(own.agentId, state.agentId); assert.ok(!state.dead);
  assert.equal(own.tick, state.lastObservedTick + 1);
  if (state.lastDecisionTick) assert.equal(own.tick - state.lastDecisionTick, 8);
  const phi = sarsaFeatures(state, own.observation);
  if (state.pending && state.acquisition) {
    const p = state.pending;
    learnSarsaTransition(state, {agentId: state.agentId, tick: p.tick, duration: own.tick - p.tick, phi: p.phi, action: p.action,
      reward: (own.energy - p.initialEnergy) / 120, nextPhi: phi, terminal: false, initialEnergy: p.initialEnergy, finalEnergy: own.energy});
  }
  const q = sarsaValues(state, phi), first = draw(state, 'rngState'), second = draw(state, 'rngState');
  const choice = first < state.config.epsilon || q[0] === q[1] ? (second < .5 ? -1 : 1) : q[1] > q[0] ? 1 : -1;
  state.pending = state.acquisition ? {tick: own.tick, phi, action: choice, initialEnergy: own.energy} : null;
  state.history.push({observation: [...own.observation], choice}); if (state.history.length > 3) state.history.shift();
  state.decisions++; state.lastDecisionTick = own.tick;
  return choice;
}
export function observeSarsaBody(state, {agentId, tick, energy, terminal = false}) {
  assert.equal(agentId, state.agentId); assert.ok(!state.dead); assert.equal(tick, state.lastObservedTick + 1);
  assert.ok(Number.isFinite(energy));
  if (terminal && state.pending && state.acquisition) {
    const p = state.pending;
    learnSarsaTransition(state, {agentId, tick: p.tick, duration: tick - p.tick + 1, phi: p.phi, action: p.action,
      reward: (energy - p.initialEnergy) / 120, nextPhi: Array(SARSA_DIMENSIONS).fill(0), terminal: true, initialEnergy: p.initialEnergy, finalEnergy: energy});
  }
  state.lastObservedTick = tick;
  if (terminal) { state.pending = null; state.dead = true; }
}
export function freezeSarsaBody(state) { state.acquisition = false; state.pending = null; for (const trace of state.eligibility) trace.fill(0); }
export function resetSarsaAcquired(state) {
  for (const row of state.weights) row.fill(0); for (const row of state.eligibility) row.fill(0);
  state.history = []; state.pending = null; state.recent = []; state.older = []; state.olderSeen = 0;
  // Lifetime counters and all random streams persist across reset.
}
export function restoreSarsaBody(value) {
  assert.equal(value?.schema, 1); assert.equal(value.kind, 'own-expected-sarsa-replay');
  createSarsaBody(value.agentId, value.rngState, value.config);
  for (const rows of [value.weights, value.eligibility]) { assert.equal(rows.length, 2); for (const row of rows) assert.ok(Array.isArray(row) && row.length === SARSA_DIMENSIONS && row.every(Number.isFinite)); }
  assert.ok(value.recent.length <= value.config.recent && value.older.length <= value.config.capacity - value.config.recent && value.history.length <= 3);
  const records = [...value.older, ...value.recent];
  assert.equal(new Set(records.map(r => r.experience)).size, records.length);
  for (const t of records) { checkTransition(value, t); assert.ok(t.experience <= value.transitions); }
  assert.ok(value.work.liveUpdates === value.transitions && value.work.replayUpdates === value.replayUpdates);
  assert.ok(value.charge.outstandingEnergy >= 0);
  return structuredClone(value);
}
