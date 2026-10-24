import test from 'node:test';
import assert from 'node:assert/strict';
import {nominalBinaryPolicy, verifyBinaryPolicyDraws} from '../learning/behavior-policy.mjs';

test('nominal probability includes exploration and ties, using the actual decision score', () => {
  const decision = {choice: 1, reason: 'retrieval', retrieval: {negative: {estimate: -.2}, positive: {estimate: .1}}};
  const p = nominalBinaryPolicy(decision, .1);
  assert.equal(p.fast, .05 + .9); assert.equal(p.slow, 1 - p.fast);
  const explored = nominalBinaryPolicy({...decision, choice: -1, reason: 'exploration'}, .1);
  assert.equal(explored.chosenProbability, p.slow); assert.equal(explored.explicitExploration, true);
  const tied = nominalBinaryPolicy({...decision, reason: 'tie', retrieval: {negative: {estimate: .1}, positive: {estimate: .1}}}, .1);
  assert.equal(tied.fast, .5); assert.equal(tied.randomized, true);
  const risk = nominalBinaryPolicy({...decision, choice: -1, retrieval: {negative: {estimate: -.2, score: .2}, positive: {estimate: .1, score: -.1}}}, .1);
  assert.equal(risk.greedyPositive, 0);
  assert.throws(() => nominalBinaryPolicy({...decision, choice: -1}, .1), /Inconsistent/);
});

test('exact draw replay detects altered RNG state, choice and reason without changing the observation', () => {
  const advance = value => { let x = value; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return x >>> 0; };
  for (const seed of [1, 17, 1071, 98151]) {
    const first = advance(seed), after = advance(first), reason = first / 4294967296 < .1 ? 'exploration' : 'retrieval';
    const choice = reason === 'exploration' ? (after / 4294967296 < .5 ? -1 : 1) : 1;
    const d = {choice, reason, retrieval: {negative: {estimate: 0}, positive: {estimate: .2}}}, before = JSON.stringify(d);
    assert.ok(verifyBinaryPolicyDraws(seed, after, d, .1).exactDrawReplay);
    assert.equal(JSON.stringify(d), before);
    assert.throws(() => verifyBinaryPolicyDraws(seed, advance(after), d, .1), /mismatch/);
  }
});
