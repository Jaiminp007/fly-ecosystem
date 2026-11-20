// Abstract mushroom-body-inspired direct policy plasticity, not a connectome model.
import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {sarsaFeatures} from './sarsa-body.mjs';

export const MB_DEFAULTS = Object.freeze({mechanism: 'sparse-dopamine-policy-v1', cells: 64, active: 8, fanIn: 6,
  projectionSeed: 0x4d42a11, epsilon: .1, lambda: .9, traceHorizon: 128, fastHorizon: 512,
  updateRate: .1, dopamineScale: .01, baselineRate: .05, consolidationRate: .02, capacity: 16});
const clip = (x, bound) => Math.max(-bound, Math.min(bound, x));
export function mushroomProjection() {
  let rng = MB_DEFAULTS.projectionSeed, operations = 0;
  const projection = Array.from({length: 64}, () => {
    const indices = [];
    while (indices.length < 6) {
      rng = advanceRng(rng); const index = 1 + Math.floor(rng / 4294967296 * 39); operations += 3;
      let seen = false; for (const old of indices) { operations++; if (old === index) { seen = true; break; } }
      if (!seen) indices.push(index);
    }
    return indices;
  });
  return {projection, operations};
}
export function createMushroomBody(agentId, seed, options = {}) {
  const config = {...MB_DEFAULTS, ...options};
  for (const key of Object.keys(options)) assert.ok(Object.hasOwn(MB_DEFAULTS, key));
  for (const key of Object.keys(MB_DEFAULTS)) if (!['lambda', 'consolidationRate'].includes(key)) assert.equal(config[key], MB_DEFAULTS[key]);
  assert.ok([0, .9].includes(config.lambda) && [0, .02].includes(config.consolidationRate));
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0 && Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
  const {projection, operations} = mushroomProjection();
  return {schema: 1, kind: 'own-mushroom-policy', agentId, config, projection,
    weights: Array.from({length: 2}, () => Array(64).fill(0)), eligibility: [Array(64).fill(0)], rewardBaseline: 0,
    history: [], pending: null, recent: [], older: [], olderSeen: 0,
    rngState: seed, retentionRngState: (seed ^ 0x9e3779b9) >>> 0 || 1, replayRngState: (seed ^ 0xa511e9b3) >>> 0 || 1,
    decisions: 0, transitions: 0, replayUpdates: 0, lastDecisionTick: 0, lastObservedTick: 0, acquisition: true, dead: false,
    plasticityDiagnostics: {updates: 0, nonzeroDopamine: 0, transfers: 0, absoluteTransfer: 0},
    work: {scalarOperations: operations, liveUpdates: 0, replayUpdates: 0},
    charge: {operationsBilled: 0, outstandingEnergy: 0, incurredEnergy: 0, paidEnergy: 0, storageBytes: 0}};
}
export function createFastMushroomBody(id, seed, options = {}) {
  if (Object.hasOwn(options, 'consolidationRate')) assert.equal(options.consolidationRate, 0);
  return createMushroomBody(id, seed, {...options, consolidationRate: 0});
}
export function mushroomFeatures(s, observation) {
  const sensory = sarsaFeatures(s, observation), scores = s.projection.map(indices => {
    let sum = 0; for (const index of indices) { sum += sensory[index]; s.work.scalarOperations++; } return sum;
  });
  const selected = new Set(), phi = Array(64).fill(0);
  for (let k = 0; k < 8; k++) {
    let best = -1;
    for (let j = 0; j < 64; j++) {
      s.work.scalarOperations += 2;
      if (!selected.has(j) && (best < 0 || scores[j] > scores[best])) best = j;
    }
    selected.add(best); phi[best] = 1 / Math.sqrt(8); s.work.scalarOperations += 3;
  }
  return phi;
}
export function mushroomPolicy(s, phi) {
  let logit = 0;
  for (let j = 0; j < 64; j++) { logit += (s.weights[0][j] + s.weights[1][j]) * phi[j]; s.work.scalarOperations += 3; }
  const sigmoid = 1 / (1 + Math.exp(-logit)), probability = .05 + .9 * sigmoid;
  const slope = .9 * sigmoid * (1 - sigmoid) / (probability * (1 - probability));
  s.work.scalarOperations += 14; return {probability, slope};
}
export function learnMushroomTransition(s, tr) {
  assert.equal(tr.agentId, s.agentId); assert.ok(s.acquisition && !s.dead);
  assert.ok(tr.duration > 0 && tr.duration <= 8 && Number.isFinite(tr.gradientFactor));
  assert.ok(tr.phi.length === 64 && tr.phi.filter(v => v !== 0).length === 8);
  const dopamine = clip((tr.reward - s.rewardBaseline) / s.config.dopamineScale, 1);
  const decay = Math.exp(-tr.duration / s.config.traceHorizon) * s.config.lambda;
  const fastDecay = Math.exp(-tr.duration / s.config.fastHorizon);
  for (let j = 0; j < 64; j++) {
    s.eligibility[0][j] = decay * s.eligibility[0][j] + tr.gradientFactor * tr.phi[j];
    s.weights[0][j] = clip(fastDecay * s.weights[0][j] + s.config.updateRate * dopamine * s.eligibility[0][j], 2);
    s.work.scalarOperations += 9;
    if (tr.phi[j] !== 0) {
      const transfer = s.config.consolidationRate * s.weights[0][j], before = s.weights[1][j];
      s.weights[1][j] = clip(before + transfer, 2); const accepted = s.weights[1][j] - before;
      s.weights[0][j] -= accepted;
      if (accepted !== 0) { s.plasticityDiagnostics.transfers++; s.plasticityDiagnostics.absoluteTransfer += Math.abs(accepted); }
      s.work.scalarOperations += 10;
    }
  }
  s.rewardBaseline += s.config.baselineRate * (tr.reward - s.rewardBaseline);
  s.transitions++; s.work.liveUpdates++; s.plasticityDiagnostics.updates++;
  s.plasticityDiagnostics.nonzeroDopamine += +(dopamine !== 0); s.work.scalarOperations += 20;
  s.recent.push({...structuredClone(tr), experience: s.transitions}); if (s.recent.length > 16) s.recent.shift();
  if (tr.terminal) s.eligibility[0].fill(0);
}
export function chooseMushroomAction(s, own) {
  assert.equal(own.agentId, s.agentId); assert.ok(!s.dead); assert.equal(own.tick, s.lastObservedTick + 1);
  if (s.lastDecisionTick) assert.equal(own.tick - s.lastDecisionTick, 8);
  const phi = mushroomFeatures(s, own.observation);
  if (s.pending && s.acquisition) {
    const p = s.pending;
    learnMushroomTransition(s, {...p, agentId: s.agentId, duration: own.tick - p.tick, nextPhi: phi,
      reward: (own.energy - p.initialEnergy) / 120, finalEnergy: own.energy, terminal: false});
  }
  const {probability, slope} = mushroomPolicy(s, phi); s.rngState = advanceRng(s.rngState);
  const choice = s.rngState / 4294967296 < probability ? 1 : -1;
  const gradientFactor = ((choice > 0 ? 1 : 0) - probability) * slope; s.work.scalarOperations += 5;
  s.pending = s.acquisition ? {tick: own.tick, phi, action: choice, probability, gradientFactor, initialEnergy: own.energy} : null;
  s.history.push({observation: [...own.observation], choice}); if (s.history.length > 3) s.history.shift();
  s.decisions++; s.lastDecisionTick = own.tick; return choice;
}
export function observeMushroomBody(s, {agentId, tick, energy, terminal = false}) {
  assert.equal(agentId, s.agentId); assert.ok(!s.dead); assert.equal(tick, s.lastObservedTick + 1); assert.ok(Number.isFinite(energy));
  if (terminal && s.pending && s.acquisition) {
    const p = s.pending;
    learnMushroomTransition(s, {...p, agentId, duration: tick - p.tick + 1, nextPhi: Array(64).fill(0),
      reward: (energy - p.initialEnergy) / 120, finalEnergy: energy, terminal: true});
  }
  s.lastObservedTick = tick; if (terminal) { s.pending = null; s.dead = true; }
}
export function freezeMushroomBody(s) { s.acquisition = false; s.pending = null; s.eligibility[0].fill(0); }
export function resetMushroomBody(s) {
  for (const row of s.weights) row.fill(0); s.eligibility[0].fill(0); s.rewardBaseline = 0;
  s.history = []; s.pending = null; s.recent = []; s.older = []; s.olderSeen = 0;
}
export function restoreMushroomBody(s) {
  assert.equal(s.kind, 'own-mushroom-policy'); assert.equal(s.schema, 1); const initial = createMushroomBody(s.agentId, s.rngState, s.config);
  assert.deepEqual(s.projection, initial.projection); assert.equal(s.weights.length, 2); assert.equal(s.eligibility.length, 1);
  for (const row of [...s.weights, ...s.eligibility]) assert.ok(row.length === 64 && row.every(Number.isFinite));
  assert.ok(Number.isFinite(s.rewardBaseline) && s.recent.length <= 16 && s.older.length === 0 && s.history.length <= 3);
  assert.equal(s.work.liveUpdates, s.transitions); assert.equal(s.work.replayUpdates, 0); assert.equal(s.replayUpdates, 0);
  assert.equal(s.plasticityDiagnostics.updates, s.transitions); assert.ok(s.charge.outstandingEnergy >= 0);
  for (const tr of s.recent) { assert.equal(tr.agentId, s.agentId); assert.ok(tr.experience <= s.transitions); }
  return structuredClone(s);
}
