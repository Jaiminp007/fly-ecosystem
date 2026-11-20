// Offline action-effect learning from completed own-experience windows.
// Propensities are nominal sampler probabilities. None of these estimators
// alone guarantees causal identification or a safe controller upgrade.
import {kernelValue} from './kernel-learner.mjs';
import {outcomeExample} from './self-modifying-tasks.mjs';
const clip = x => Math.max(-1, Math.min(1, x));
const canonical = value => JSON.parse(JSON.stringify(value));
export const POLICY_AWARE_MODES = Object.freeze(['observational', 'ipw', 'randomized', 'ipw-contrast', 'dr-contrast']);
const program = Object.freeze({kernel: 'laplacian', update: 'ridge'});
function vector(state, input) { if (!Array.isArray(input) || input.length !== state.dimensions || input.some(x => !Number.isFinite(x) || Math.abs(x) > 1)) throw Error('Invalid weighted learner input'); }

export function createWeightedOutcome(dimensions, capacity = 256) {
  if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > 128 || !Number.isInteger(capacity) || capacity < 16 || capacity > 256) throw Error('Invalid weighted learner bounds');
  return {schema: 1, kind: 'heteroscedastic-kernel-ridge', dimensions, capacity, regularization: .1, program: {...program}, seen: 0, records: [], inverse: [], coefficients: [], work: {kernelCoordinates: 0, matrixProducts: 0, updates: 0}};
}
function kernel(state, x, y) { state.work.kernelCoordinates += state.dimensions; return kernelValue(program, x, y); }
export function predictWeightedOutcome(state, input) {
  vector(state, input);
  return clip(state.records.reduce((sum, record, i) => sum + state.coefficients[i] * kernelValue(program, record.input, input), 0));
}
export function updateWeightedOutcome(state, input, target, weight = 1, evidence = {}) {
  vector(state, input);
  if (!Number.isFinite(target) || Math.abs(target) > 1 || !Number.isFinite(weight) || weight <= 0 || weight > 100 + 1e-9) throw Error('Invalid weighted target/support');
  if (state.records.length === state.capacity) {
    const q = state.inverse, pivot = q[0][0]; if (!(pivot > 0)) throw Error('Invalid weighted inverse downdate');
    state.records.shift(); state.inverse = q.slice(1).map((row, i) => row.slice(1).map((v, j) => v - q[i + 1][0] * q[0][j + 1] / pivot));
    state.work.matrixProducts += state.inverse.length ** 2;
  }
  const n = state.records.length, k = state.records.map(record => kernel(state, record.input, input)), v = state.inverse.map(row => row.reduce((sum, value, j) => sum + value * k[j], 0));
  const denominator = kernel(state, input, input) + state.regularization / weight - k.reduce((sum, value, j) => sum + value * v[j], 0);
  if (!Number.isFinite(denominator) || denominator < 1e-10) throw Error('Unstable weighted inverse update');
  state.inverse = state.inverse.map((row, i) => [...row.map((value, j) => value + v[i] * v[j] / denominator), v[i] === 0 ? 0 : -v[i] / denominator]);
  state.inverse.push([...v.map(value => value === 0 ? 0 : -value / denominator), 1 / denominator]);
  state.records.push({input: input.map(x => x === 0 ? 0 : x), target: target === 0 ? 0 : target, weight, experience: state.seen + 1, evidence: canonical(evidence)});
  state.coefficients = state.inverse.map(row => row.reduce((sum, value, j) => sum + value * state.records[j].target, 0));
  if (state.coefficients.some(x => !Number.isFinite(x))) throw Error('Nonfinite weighted fit');
  state.seen++; state.work.updates++; state.work.matrixProducts += 2 * n * n + (n + 1) ** 2;
}

export function restoreWeightedOutcome(value) {
  if (value?.schema !== 1 || value.kind !== 'heteroscedastic-kernel-ridge' || !Number.isSafeInteger(value.seen) || value.seen < 0) throw Error('Invalid weighted checkpoint');
  const expected = createWeightedOutcome(value.dimensions, value.capacity), n = Math.min(value.seen, value.capacity);
  if (value.regularization !== expected.regularization || JSON.stringify(value.program) !== JSON.stringify(expected.program) || !Array.isArray(value.records) || value.records.length !== n || !Array.isArray(value.inverse) || value.inverse.length !== n || !Array.isArray(value.coefficients) || value.coefficients.length !== n) throw Error('Weighted optimizer identity mismatch');
  for (const [i, record] of value.records.entries()) {
    vector(value, record.input);
    if (!Number.isFinite(record.target) || Math.abs(record.target) > 1 || !Number.isFinite(record.weight) || record.weight <= 0 || record.weight > 100 + 1e-9 || record.experience !== value.seen - n + i + 1) throw Error('Invalid weighted factual record');
  }
  for (const [i, row] of value.inverse.entries()) {
    if (!Array.isArray(row) || row.length !== n || row.some((x, j) => !Number.isFinite(x) || Math.abs(x - value.inverse[j]?.[i]) > 1e-5) || !(row[i] > 0)) throw Error('Invalid weighted inverse');
    const coefficient = row.reduce((sum, x, j) => sum + x * value.records[j].target, 0);
    if (!Number.isFinite(value.coefficients[i]) || Math.abs(coefficient - value.coefficients[i]) > 1e-6) throw Error('Invalid weighted coefficients');
  }
  const gram = value.records.map((a, i) => value.records.map((b, j) => kernelValue(program, a.input, b.input) + (i === j ? value.regularization / a.weight : 0)));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let product = 0; for (let k = 0; k < n; k++) product += value.inverse[i][k] * gram[k][j];
    if (Math.abs(product - +(i === j)) > 1e-5) throw Error('Weighted inverse does not match recorded support');
  }
  if (!value.work || Object.values(value.work).some(x => !Number.isSafeInteger(x) || x < 0) || value.work.updates !== value.seen) throw Error('Invalid weighted work counters');
  return structuredClone(value);
}

export function createPolicyAwareOutcome(mode = 'observational', exploration = .1) {
  if (!POLICY_AWARE_MODES.includes(mode) || !Number.isFinite(exploration) || exploration < .01 || exploration > .5) throw Error('Invalid policy-aware configuration');
  const contrast = mode.endsWith('contrast');
  return {schema: 1, kind: 'policy-aware-action-outcome', mode, exploration, ownerId: null, lastTick: 0, seen: 0, accepted: 0, targetScale: mode === 'dr-contrast' ? 2 + 4 / exploration : mode === 'ipw-contrast' ? 2 / exploration : 1, estimator: createWeightedOutcome(contrast ? 10 : 20), nuisance: mode === 'dr-contrast' ? createWeightedOutcome(20) : null};
}

function validatePolicy(window, exploration) {
  const p = window.policy;
  if (p?.schema !== 1 || p.kind !== 'nominal-binary-epsilon-greedy' || p.exploration !== exploration || ![0, .5, 1].includes(p.greedyPositive) || !['exploration', 'tie', 'retrieval'].includes(p.reason)) throw Error('Invalid source policy identity');
  const fast = exploration / 2 + (1 - exploration) * p.greedyPositive, chosen = window.choice > 0 ? fast : 1 - fast;
  if (![p.fast, p.slow, p.chosenProbability].every(Number.isFinite) || Math.abs(p.fast - fast) > 1e-12 || Math.abs(p.slow - (1 - fast)) > 1e-12 || Math.abs(chosen - p.chosenProbability) > 1e-12 || chosen <= 0 || p.randomized !== (p.reason === 'exploration' || p.reason === 'tie') || p.explicitExploration !== (p.reason === 'exploration') || p.reason === 'tie' && p.greedyPositive !== .5 || p.reason === 'retrieval' && (p.greedyPositive === .5 || window.choice !== (p.greedyPositive ? 1 : -1))) throw Error('Inconsistent source policy probability');
  return chosen;
}
function hypotheticalInput(observation, choice) {
  const sensed = [0, 1, 2, 3, 4, 10, 11, 12, 13].map(i => observation[i]);
  return [1, ...sensed, choice, ...sensed.map(x => x * choice)];
}
export function learnPolicyAwareOutcome(state, window) {
  const {input, target} = outcomeExample(window), probability = validatePolicy(window, state.exploration);
  if (!Number.isInteger(window.agentId) || window.agentId < 1 || state.ownerId !== null && state.ownerId !== window.agentId || !Number.isSafeInteger(window.tick) || window.tick <= state.lastTick) throw Error('Invalid own-experience chronology');
  state.ownerId = window.agentId; state.lastTick = window.tick;
  state.seen++;
  if (state.mode === 'randomized' && !window.policy.randomized) return {accepted: false};
  let learnedTarget = target, weight = state.mode === 'ipw' ? .5 / probability : 1, features = input;
  const evidence = {tick: window.tick, choice: window.choice, observedTarget: target, propensity: probability, reason: window.policy.reason, policy: window.policy};
  if (state.mode.endsWith('contrast')) {
    features = input.slice(0, 10);
    let contrast = window.choice * target / probability;
    if (state.mode === 'dr-contrast') {
      const slow = predictWeightedOutcome(state.nuisance, hypotheticalInput(window.observation, -1)), fast = predictWeightedOutcome(state.nuisance, hypotheticalInput(window.observation, 1));
      contrast = fast - slow + window.choice * (target - (window.choice > 0 ? fast : slow)) / probability;
      evidence.nuisance = {slow, fast, seenBeforeLabel: state.nuisance.seen};
    }
    if (Math.abs(contrast) > state.targetScale + 1e-9) throw Error('Contrast target exceeds its declared overlap bound');
    learnedTarget = clip(contrast / state.targetScale); evidence.contrast = contrast; evidence.scale = state.targetScale;
  }
  updateWeightedOutcome(state.estimator, features, learnedTarget, weight, evidence);
  if (state.nuisance) updateWeightedOutcome(state.nuisance, input, target, 1, {tick: window.tick, choice: window.choice});
  state.accepted++;
  return {accepted: true, target: learnedTarget, weight};
}

export function predictPolicyAwareEffect(state, observation) {
  if (!Array.isArray(observation) || observation.length !== 17 || observation.some(x => !Number.isFinite(x) || Math.abs(x) > 1)) throw Error('Invalid effect query');
  if (state.mode.endsWith('contrast')) return {kind: 'direct-contrast', difference: predictWeightedOutcome(state.estimator, hypotheticalInput(observation, 1).slice(0, 10)) * state.targetScale, accepted: state.accepted};
  const slow = predictWeightedOutcome(state.estimator, hypotheticalInput(observation, -1)), fast = predictWeightedOutcome(state.estimator, hypotheticalInput(observation, 1));
  return {kind: 'conditional-outcomes', slow, fast, difference: fast - slow, accepted: state.accepted};
}

export function restorePolicyAwareOutcome(value) {
  const expected = createPolicyAwareOutcome(value?.mode, value?.exploration);
  if (value?.schema !== expected.schema || value.kind !== expected.kind || value.targetScale !== expected.targetScale || !Number.isSafeInteger(value.seen) || !Number.isSafeInteger(value.accepted) || value.accepted < 0 || value.seen < value.accepted) throw Error('Invalid policy-aware state identity');
  const estimator = restoreWeightedOutcome(value.estimator);
  if (estimator.dimensions !== expected.estimator.dimensions || estimator.seen !== value.accepted || value.mode !== 'randomized' && value.seen !== value.accepted) throw Error('Policy-aware acquired-count mismatch');
  if (value.seen === 0 ? value.ownerId !== null || value.lastTick !== 0 : !Number.isInteger(value.ownerId) || value.ownerId < 1 || !Number.isSafeInteger(value.lastTick) || value.lastTick < 1) throw Error('Invalid own-experience owner');
  let lastTick = 0;
  for (const record of estimator.records) {
    const e = record.evidence;
    if (!Number.isSafeInteger(e?.tick) || e.tick <= lastTick || e.tick > value.lastTick || ![-1, 1].includes(e.choice) || !Number.isFinite(e.observedTarget) || Math.abs(e.observedTarget) > 1 || e.reason !== e.policy?.reason) throw Error('Invalid policy-aware factual provenance');
    lastTick = e.tick;
    const probability = validatePolicy({choice: e.choice, policy: e.policy}, value.exploration);
    if (Math.abs(probability - e.propensity) > 1e-12) throw Error('Invalid stored action probability');
    if (value.mode === 'randomized' && !e.policy.randomized) throw Error('Nonrandomized record in randomized learner');
    if (!value.mode.endsWith('contrast')) {
      if (Math.abs(record.target - e.observedTarget) > 1e-12 || Math.abs(record.weight - (value.mode === 'ipw' ? .5 / probability : 1)) > 1e-9) throw Error('Policy-aware weighting identity mismatch');
    } else {
      let contrast = e.choice * e.observedTarget / probability;
      if (value.mode === 'dr-contrast') {
        const n = e.nuisance;
        if (!n || !Number.isFinite(n.slow) || !Number.isFinite(n.fast) || Math.abs(n.slow) > 1 || Math.abs(n.fast) > 1 || n.seenBeforeLabel !== record.experience - 1) throw Error('Invalid prequential nuisance provenance');
        contrast = n.fast - n.slow + e.choice * (e.observedTarget - (e.choice > 0 ? n.fast : n.slow)) / probability;
      }
      if (record.weight !== 1 || e.scale !== value.targetScale || Math.abs(e.contrast - contrast) > 1e-9 || Math.abs(record.target - clip(contrast / value.targetScale)) > 1e-12) throw Error('Policy-aware contrast identity mismatch');
    }
  }
  if (expected.nuisance) { const nuisance = restoreWeightedOutcome(value.nuisance); if (nuisance.dimensions !== 20 || nuisance.seen !== value.seen) throw Error('Invalid prequential nuisance count'); }
  else if (value.nuisance !== null) throw Error('Unexpected nuisance learner');
  return structuredClone(value);
}
