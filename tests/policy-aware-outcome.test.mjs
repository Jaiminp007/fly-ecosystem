import test from 'node:test';
import assert from 'node:assert/strict';
import {createKernelLearner, updateKernel, predictKernel} from '../learning/kernel-learner.mjs';
import {outcomeExample} from '../learning/self-modifying-tasks.mjs';
import {nominalBinaryPolicy} from '../learning/behavior-policy.mjs';
import {createWeightedOutcome, updateWeightedOutcome, predictWeightedOutcome, restoreWeightedOutcome, createPolicyAwareOutcome, learnPolicyAwareOutcome, predictPolicyAwareEffect, restorePolicyAwareOutcome, POLICY_AWARE_MODES} from '../learning/policy-aware-outcome.mjs';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `Mismatch ${a} / ${b}`);
function window(i) {
  const choice = i % 2 ? -1 : 1, observation = Array(17).fill(0);
  observation[0] = Math.sin(i) * .8; observation[3] = .2; observation[4] = .5;
  const decision = {choice, reason: choice < 0 ? 'exploration' : 'retrieval', retrieval: {negative: {estimate: 0}, positive: {estimate: .2}}};
  return {agentId: 1, tick: i * 8 + 1, choice, observation, rewards: Array(8).fill(choice * .3), policy: nominalBinaryPolicy(decision, .1)};
}

test('heteroscedastic inverse fitting matches an analytic weighted mean through capacity eviction', () => {
  const state = createWeightedOutcome(1, 16), kept = [];
  for (let i = 0; i < 25; i++) {
    const target = Math.sin(i) * .4, weight = i % 3 ? .5 : 10;
    kept.push({target, weight}); if (kept.length > state.capacity) kept.shift();
    updateWeightedOutcome(state, [1], target, weight);
    close(predictWeightedOutcome(state, [1]), kept.reduce((s, r) => s + r.weight * r.target, 0) / (.1 + kept.reduce((s, r) => s + r.weight, 0)));
  }
  assert.deepEqual(restoreWeightedOutcome(JSON.parse(JSON.stringify(state))), state);
  const bad = structuredClone(state); bad.records[0].weight *= 2;
  assert.throws(() => restoreWeightedOutcome(bad), /recorded support/);
});

test('unweighted conditional outcomes equal the existing learner; IPW preserves its declared action weights', () => {
  const model = createPolicyAwareOutcome(), reference = createKernelLearner(20, {kernel: 'laplacian', update: 'ridge'}), ipw = createPolicyAwareOutcome('ipw');
  for (let i = 0; i < 12; i++) {
    const w = window(i), example = outcomeExample(w);
    learnPolicyAwareOutcome(model, w); learnPolicyAwareOutcome(ipw, w); updateKernel(reference, example.input, example.target);
    close(predictWeightedOutcome(model.estimator, example.input), predictKernel(reference, example.input));
    close(ipw.estimator.records.at(-1).weight, .5 / w.policy.chosenProbability);
  }
  const mislabeled = structuredClone(model); mislabeled.mode = 'ipw';
  assert.throws(() => restorePolicyAwareOutcome(mislabeled), /weighting identity/);
});

test('randomized filtering and own-agent chronology remain explicit across exact JSON continuation', () => {
  for (const mode of POLICY_AWARE_MODES) {
    const state = createPolicyAwareOutcome(mode);
    for (let i = 0; i < 10; i++) learnPolicyAwareOutcome(state, window(i));
    assert.equal(state.accepted, mode === 'randomized' ? 5 : 10);
    const restored = restorePolicyAwareOutcome(JSON.parse(JSON.stringify(state)));
    for (let i = 10; i < 18; i++) { learnPolicyAwareOutcome(state, window(i)); learnPolicyAwareOutcome(restored, window(i)); }
    assert.deepEqual(restored, state);
    assert.ok(Number.isFinite(predictPolicyAwareEffect(state, window(20).observation).difference));
    assert.throws(() => learnPolicyAwareOutcome(state, {...window(20), agentId: 2}), /own-experience/);
    assert.throws(() => learnPolicyAwareOutcome(state, window(0)), /chronology/);
  }
});

test('contrast targets use known action probability and the nuisance state BEFORE the current label', () => {
  const plain = createPolicyAwareOutcome('ipw-contrast'), dr = createPolicyAwareOutcome('dr-contrast');
  const first = window(0), value = outcomeExample(first).target;
  learnPolicyAwareOutcome(plain, first); learnPolicyAwareOutcome(dr, first);
  close(plain.estimator.records[0].evidence.contrast, value / first.policy.chosenProbability);
  close(dr.estimator.records[0].evidence.contrast, value / first.policy.chosenProbability);
  assert.equal(dr.estimator.records[0].evidence.nuisance.seenBeforeLabel, 0);
  assert.equal(dr.nuisance.seen, 1);
  learnPolicyAwareOutcome(dr, window(1)); assert.equal(dr.estimator.records[1].evidence.nuisance.seenBeforeLabel, 1);
  const bad = structuredClone(dr); bad.estimator.records[1].evidence.nuisance.seenBeforeLabel++;
  assert.throws(() => restorePolicyAwareOutcome(bad), /prequential/);
});
