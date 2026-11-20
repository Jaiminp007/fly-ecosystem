// One fixed temporal-credit hypothesis. Live Expected SARSA is unchanged;
// replay uses only contiguous, already-matured own transitions with logged mu.
import assert from 'node:assert/strict';
import {createSarsaBody, SARSA_DEFAULTS, SARSA_DIMENSIONS, sarsaFeatures, sarsaValues, learnSarsaTransition, freezeSarsaBody, resetSarsaAcquired, restoreSarsaBody} from './sarsa-body.mjs';
import {advanceRng} from './intervention-study.mjs';

export function actionProbability(q, action, epsilon = .1) {
  assert.ok(q.length === 2 && q.every(Number.isFinite) && [-1, 1].includes(action));
  if (q[0] === q[1]) return .5;
  return (q[1] > q[0] ? 1 : -1) === action ? 1 - epsilon / 2 : epsilon / 2;
}
function probability(p) { assert.ok([.05, .5, .95].includes(p), 'Missing/invalid logged nominal behavior probability'); }
function draw(s, key) { s[key] = advanceRng(s[key]); return s[key] / 4294967296; }
export function createRetraceBody(agentId, seed, options = {}) {
  const allowed = {...SARSA_DEFAULTS, replayAlgorithm: 'bounded-retrace-v1', replayLambda: .9, replayHorizon: 16};
  for (const key of Object.keys(options)) assert.ok(Object.hasOwn(allowed, key));
  const config = {...allowed, ...options};
  assert.equal(config.replayAlgorithm, 'bounded-retrace-v1'); assert.equal(config.replayHorizon, 16);
  assert.ok([0, .9].includes(config.replayLambda) && [0, .9].includes(config.lambda));
  for (const key of ['epsilon', 'horizon', 'updateRate', 'replayRate', 'capacity', 'recent']) assert.equal(config[key], SARSA_DEFAULTS[key]);
  const base = Object.fromEntries(Object.keys(SARSA_DEFAULTS).map(key => [key, config[key]]));
  const s = createSarsaBody(agentId, seed, base);
  s.kind = 'own-bounded-retrace-sarsa'; s.config = config;
  s.replayDiagnostics = {updates: 0, terms: 0, multiStepUpdates: 0, maxSteps: 0};
  return s;
}
export function createOneStepReplayBody(agentId, seed, options = {}) {
  if (Object.hasOwn(options, 'replayLambda')) assert.equal(options.replayLambda, 0);
  return createRetraceBody(agentId, seed, {...options, replayLambda: 0});
}
export function replayCorrection(s, selected) {
  const memory = [...s.older, ...s.recent], index = new Map();
  for (const tr of memory) { assert.equal(tr.agentId, s.agentId); probability(tr.behaviorProbability); assert.ok(!index.has(tr.experience)); index.set(tr.experience, tr); }
  s.work.scalarOperations += memory.length;
  assert.equal(index.get(selected.experience), selected);
  let tr = selected, q = sarsaValues(s, tr.phi), coefficient = 1, correction = 0, steps = 0;
  while (true) {
    const gamma = Math.exp(-tr.duration / s.config.horizon), nextQ = tr.terminal ? null : sarsaValues(s, tr.nextPhi);
    const future = tr.terminal ? 0 : gamma * ((1 - s.config.epsilon) * Math.max(...nextQ) + s.config.epsilon * (nextQ[0] + nextQ[1]) / 2);
    correction += coefficient * (tr.reward + future - q[tr.action > 0 ? 1 : 0]);
    steps++; s.work.scalarOperations += 14;
    if (tr.terminal || steps === s.config.replayHorizon || s.config.replayLambda === 0) break;
    const next = index.get(tr.experience + 1);
    s.work.scalarOperations += 3;
    if (!next || next.tick !== tr.tick + tr.duration) break;
    let same = true;
    for (let j = 0; j < SARSA_DIMENSIONS; j++) { s.work.scalarOperations++; if (tr.nextPhi[j] !== next.phi[j]) { same = false; break; } }
    if (!same) break;
    const pi = actionProbability(nextQ, next.action, s.config.epsilon);
    coefficient *= gamma * s.config.replayLambda * Math.min(1, pi / next.behaviorProbability);
    s.work.scalarOperations += 8;
    q = nextQ; tr = next;
  }
  assert.ok(Number.isFinite(correction)); return {correction, steps};
}
export function learnRetraceTransition(s, tr, {replay = true} = {}) {
  probability(tr.behaviorProbability);
  const result = learnSarsaTransition(s, tr, {replay: false});
  if (replay) {
    const memory = [...s.older, ...s.recent], selected = memory[Math.floor(draw(s, 'replayRngState') * memory.length)];
    s.work.scalarOperations += 2;
    const {correction, steps} = replayCorrection(s, selected), action = selected.action > 0 ? 1 : 0;
    for (let j = 0; j < SARSA_DIMENSIONS; j++) s.weights[action][j] += s.config.replayRate * correction * selected.phi[j];
    s.work.scalarOperations += SARSA_DIMENSIONS * 3 + 4;
    s.work.replayUpdates++; s.replayUpdates++;
    s.replayDiagnostics.updates++; s.replayDiagnostics.terms += steps;
    s.replayDiagnostics.multiStepUpdates += +(steps > 1); s.replayDiagnostics.maxSteps = Math.max(s.replayDiagnostics.maxSteps, steps);
  }
  assert.ok(s.weights.flat().every(Number.isFinite)); return result;
}
export function chooseRetraceAction(s, own) {
  assert.equal(own.agentId, s.agentId); assert.ok(!s.dead); assert.equal(own.tick, s.lastObservedTick + 1);
  if (s.lastDecisionTick) assert.equal(own.tick - s.lastDecisionTick, 8);
  const phi = sarsaFeatures(s, own.observation);
  if (s.pending && s.acquisition) {
    const p = s.pending;
    learnRetraceTransition(s, {agentId: s.agentId, tick: p.tick, duration: own.tick - p.tick, phi: p.phi, action: p.action,
      reward: (own.energy - p.initialEnergy) / 120, nextPhi: phi, terminal: false, initialEnergy: p.initialEnergy, finalEnergy: own.energy, behaviorProbability: p.behaviorProbability});
  }
  const q = sarsaValues(s, phi), first = draw(s, 'rngState'), second = draw(s, 'rngState');
  const choice = first < s.config.epsilon || q[0] === q[1] ? (second < .5 ? -1 : 1) : q[1] > q[0] ? 1 : -1;
  const mu = actionProbability(q, choice, s.config.epsilon); s.work.scalarOperations += 3;
  s.pending = s.acquisition ? {tick: own.tick, phi, action: choice, initialEnergy: own.energy, behaviorProbability: mu} : null;
  s.history.push({observation: [...own.observation], choice}); if (s.history.length > 3) s.history.shift();
  s.decisions++; s.lastDecisionTick = own.tick; return choice;
}
export function observeRetraceBody(s, {agentId, tick, energy, terminal = false}) {
  assert.equal(agentId, s.agentId); assert.ok(!s.dead); assert.equal(tick, s.lastObservedTick + 1); assert.ok(Number.isFinite(energy));
  if (terminal && s.pending && s.acquisition) {
    const p = s.pending;
    learnRetraceTransition(s, {agentId, tick: p.tick, duration: tick - p.tick + 1, phi: p.phi, action: p.action, reward: (energy - p.initialEnergy) / 120,
      nextPhi: Array(SARSA_DIMENSIONS).fill(0), terminal: true, initialEnergy: p.initialEnergy, finalEnergy: energy, behaviorProbability: p.behaviorProbability});
  }
  s.lastObservedTick = tick; if (terminal) { s.pending = null; s.dead = true; }
}
export const freezeRetraceBody = freezeSarsaBody;
export const resetRetraceAcquired = resetSarsaAcquired;
export function restoreRetraceBody(s) {
  assert.equal(s.kind, 'own-bounded-retrace-sarsa'); createRetraceBody(s.agentId, s.rngState, s.config);
  const base = Object.fromEntries(Object.keys(SARSA_DEFAULTS).map(key => [key, s.config[key]]));
  restoreSarsaBody({...s, kind: 'own-expected-sarsa-replay', config: base});
  for (const tr of [...s.older, ...s.recent]) probability(tr.behaviorProbability);
  if (s.pending) probability(s.pending.behaviorProbability);
  const d = s.replayDiagnostics; assert.equal(d.updates, s.replayUpdates); assert.ok(d.terms >= d.updates && d.terms <= d.updates * 16 && d.multiStepUpdates <= d.updates && d.maxSteps <= 16);
  return structuredClone(s);
}
