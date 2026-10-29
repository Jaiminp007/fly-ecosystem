// New fixed embodied hypothesis: local nonlinear state features, unchanged
// Expected-SARSA/recent-reservoir credit mechanism. No task labels or oracle.
import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';

export const TILE_SIZE = 256;
export const TILE_DEFAULTS = Object.freeze({representation: 'local-tiles-v1', epsilon: .1, lambda: .9, horizon: 256, updateRate: .05, replayRate: .01, capacity: 64, recent: 16});
const draw = (s, key) => { s[key] = advanceRng(s[key]); return s[key] / 4294967296; };
function vector(phi, allowEmpty = false) {
  assert.ok(Array.isArray(phi) && (allowEmpty || phi.length > 0) && phi.length <= 16);
  let previous = -1;
  for (const [i, value] of phi) { assert.ok(Number.isInteger(i) && i > previous && i < TILE_SIZE && Number.isFinite(value) && value > 0 && value <= 1); previous = i; }
}
export function createTileBody(agentId, seed, options = {}) {
  const config = {...TILE_DEFAULTS, ...options};
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0 && Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
  for (const key of Object.keys(options)) assert.ok(Object.hasOwn(TILE_DEFAULTS, key));
  assert.equal(config.representation, TILE_DEFAULTS.representation);
  assert.ok(config.epsilon === .1 && [0, .9].includes(config.lambda) && config.horizon === 256 && config.updateRate === .05 && config.replayRate === .01 && config.capacity === 64 && config.recent === 16);
  return {schema: 1, kind: 'own-tile-expected-sarsa-replay', agentId, config,
    weights: Array.from({length: 2}, () => Array(TILE_SIZE).fill(0)), eligibility: Array.from({length: 2}, () => Array(TILE_SIZE).fill(0)),
    history: [], pending: null, recent: [], older: [], olderSeen: 0,
    rngState: seed, retentionRngState: (seed ^ 0x9e3779b9) >>> 0 || 1, replayRngState: (seed ^ 0xa511e9b3) >>> 0 || 1,
    decisions: 0, transitions: 0, replayUpdates: 0, lastDecisionTick: 0, lastObservedTick: 0, acquisition: true, dead: false,
    work: {scalarOperations: 0, liveUpdates: 0, replayUpdates: 0}, charge: {operationsBilled: 0, outstandingEnergy: 0, incurredEnergy: 0, paidEnergy: 0, storageBytes: 0}};
}
export function tileFeatures(s, observation) {
  assert.ok(Array.isArray(observation) && observation.length === 17 && observation.every(v => Number.isFinite(v) && Math.abs(v) <= 1));
  const old = s.history.at(-1), n = s.history.length;
  const average = channel => n ? s.history.reduce((sum, h) => sum + h.observation[channel], 0) / n : observation[channel];
  // Four disclosed sensor/history conjunctions. No coordinates, phase, time,
  // privileged food amounts, other bodies' facts or future labels are inputs.
  const groups = [
    [(observation[0] + 1) / 2, observation[3], observation[4], observation[13]],
    [observation[1], observation[2], observation[10], observation[11]],
    [observation[3], average(3), (observation[3] - (old?.observation[3] ?? observation[3]) + 1) / 2, ((old?.choice ?? 0) + 1) / 2],
    [observation[4], average(4), average(13), observation[12]]
  ];
  // Model counters: history reductions/divisions, coordinate arithmetic,
  // quantization, FNV byte operations, collision counts and normalization.
  s.work.scalarOperations += 3 * (n + 1) + 12;
  const counts = new Map();
  for (let group = 0; group < 4; group++) for (let tiling = 0; tiling < 4; tiling++) {
    const cells = groups[group].map((v, d) => {
      assert.ok(v >= 0 && v <= 1);
      s.work.scalarOperations += 4;
      return Math.floor(v * 4 + ((tiling * (2 * d + 1)) % 4) / 4);
    });
    const key = `${group}:${tiling}:${cells.join(',')}`;
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) { hash = Math.imul(hash ^ key.charCodeAt(i), 16777619) >>> 0; s.work.scalarOperations += 3; }
    const index = hash % TILE_SIZE;
    counts.set(index, (counts.get(index) || 0) + 1); s.work.scalarOperations += 2;
  }
  const ordered = [...counts].sort((a, b) => a[0] - b[0]);
  const norm = Math.sqrt(ordered.reduce((sum, [, v]) => sum + v * v, 0));
  s.work.scalarOperations += ordered.length * 3 + 1;
  return ordered.map(([index, count]) => [index, count / norm]);
}
export function tileValues(s, phi) {
  vector(phi); s.work.scalarOperations += phi.length * 4;
  const q = s.weights.map(row => phi.reduce((sum, [i, v]) => sum + row[i] * v, 0));
  assert.ok(q.every(Number.isFinite)); return q;
}
function target(s, tr) {
  if (tr.terminal) return tr.reward;
  const q = tileValues(s, tr.nextPhi);
  return tr.reward + Math.exp(-tr.duration / 256) * ((1 - s.config.epsilon) * Math.max(...q) + s.config.epsilon * (q[0] + q[1]) / 2);
}
export function learnTileTransition(s, tr, {replay = true} = {}) {
  assert.equal(tr.agentId, s.agentId); vector(tr.phi); vector(tr.nextPhi, tr.terminal);
  assert.ok(s.acquisition && !s.dead && [-1, 1].includes(tr.action) && Number.isFinite(tr.reward));
  assert.ok(Number.isInteger(tr.duration) && tr.duration > 0 && tr.duration <= 8 && typeof tr.terminal === 'boolean');
  assert.ok(Number.isInteger(tr.tick) && tr.tick > 0);
  const a = +(tr.action > 0), predicted = tileValues(s, tr.phi)[a], delta = target(s, tr) - predicted;
  const dense = Array(TILE_SIZE).fill(0); for (const [i, v] of tr.phi) dense[i] = v;
  const decay = Math.exp(-tr.duration / 256) * s.config.lambda;
  for (let action = 0; action < 2; action++) for (let j = 0; j < TILE_SIZE; j++) {
    s.eligibility[action][j] = decay * s.eligibility[action][j] + (action === a ? dense[j] : 0);
    s.weights[action][j] += s.config.updateRate * delta * s.eligibility[action][j];
  }
  s.work.scalarOperations += TILE_SIZE * 2 * 5; s.work.liveUpdates++; s.transitions++;
  s.recent.push(structuredClone({...tr, experience: s.transitions}));
  if (s.recent.length > 16) {
    const displaced = s.recent.shift(); s.olderSeen++;
    if (s.older.length < 48) s.older.push(displaced);
    else { const index = Math.floor(draw(s, 'retentionRngState') * s.olderSeen); if (index < 48) s.older[index] = displaced; }
  }
  if (replay) {
    const memory = [...s.older, ...s.recent], selected = memory[Math.floor(draw(s, 'replayRngState') * memory.length)];
    const action = +(selected.action > 0), error = target(s, selected) - tileValues(s, selected.phi)[action];
    for (const [i, v] of selected.phi) s.weights[action][i] += s.config.replayRate * error * v;
    s.work.scalarOperations += selected.phi.length * 3; s.work.replayUpdates++; s.replayUpdates++;
  }
  assert.ok(s.weights.flat().every(Number.isFinite));
  if (tr.terminal) for (const row of s.eligibility) row.fill(0);
  return {delta};
}
export function chooseTileAction(s, own) {
  assert.equal(own.agentId, s.agentId); assert.ok(!s.dead); assert.equal(own.tick, s.lastObservedTick + 1);
  if (s.lastDecisionTick) assert.equal(own.tick - s.lastDecisionTick, 8);
  const phi = tileFeatures(s, own.observation);
  if (s.pending && s.acquisition) {
    const p = s.pending;
    learnTileTransition(s, {agentId: s.agentId, tick: p.tick, duration: own.tick - p.tick, phi: p.phi, action: p.action,
      reward: (own.energy - p.initialEnergy) / 120, nextPhi: phi, terminal: false, initialEnergy: p.initialEnergy, finalEnergy: own.energy});
  }
  const q = tileValues(s, phi), first = draw(s, 'rngState'), second = draw(s, 'rngState');
  const choice = first < .1 || q[0] === q[1] ? (second < .5 ? -1 : 1) : q[1] > q[0] ? 1 : -1;
  s.pending = s.acquisition ? {tick: own.tick, phi, action: choice, initialEnergy: own.energy} : null;
  s.history.push({observation: [...own.observation], choice}); if (s.history.length > 3) s.history.shift();
  s.decisions++; s.lastDecisionTick = own.tick; return choice;
}
export function observeTileBody(s, {agentId, tick, energy, terminal = false}) {
  assert.equal(agentId, s.agentId); assert.ok(!s.dead); assert.equal(tick, s.lastObservedTick + 1); assert.ok(Number.isFinite(energy));
  if (terminal && s.pending && s.acquisition) {
    const p = s.pending;
    learnTileTransition(s, {agentId, tick: p.tick, duration: tick - p.tick + 1, phi: p.phi, action: p.action,
      reward: (energy - p.initialEnergy) / 120, nextPhi: [], terminal: true, initialEnergy: p.initialEnergy, finalEnergy: energy});
  }
  s.lastObservedTick = tick; if (terminal) { s.pending = null; s.dead = true; }
}
export function freezeTileBody(s) { s.acquisition = false; s.pending = null; for (const row of s.eligibility) row.fill(0); }
export function resetTileAcquired(s) {
  for (const row of s.weights) row.fill(0); for (const row of s.eligibility) row.fill(0);
  s.history = []; s.pending = null; s.recent = []; s.older = []; s.olderSeen = 0;
}
export function restoreTileBody(s) {
  assert.equal(s?.schema, 1); assert.equal(s.kind, 'own-tile-expected-sarsa-replay'); createTileBody(s.agentId, s.rngState, s.config);
  for (const rows of [s.weights, s.eligibility]) { assert.equal(rows.length, 2); for (const row of rows) assert.ok(row.length === TILE_SIZE && row.every(Number.isFinite)); }
  assert.ok(s.recent.length <= 16 && s.older.length <= 48 && s.history.length <= 3 && s.charge.outstandingEnergy >= 0);
  const records = [...s.older, ...s.recent]; assert.equal(new Set(records.map(tr => tr.experience)).size, records.length);
  for (const tr of records) { assert.equal(tr.agentId, s.agentId); vector(tr.phi); vector(tr.nextPhi, tr.terminal); assert.ok(tr.experience <= s.transitions); }
  assert.equal(s.work.liveUpdates, s.transitions); assert.equal(s.work.replayUpdates, s.replayUpdates);
  return structuredClone(s);
}
