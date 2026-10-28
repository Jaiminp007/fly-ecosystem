import test from 'node:test';
import assert from 'node:assert/strict';
import {createRetraceBody, createOneStepReplayBody, replayCorrection, learnRetraceTransition, restoreRetraceBody, actionProbability} from '../learning/retrace-sarsa-body.mjs';
import {createSarsaBody, learnSarsaTransition} from '../learning/sarsa-body.mjs';
import {SarsaExperiment, runSarsaProbe} from '../learning/sarsa-experiment.mjs';
import {simulateReplayHistory} from '../learning/replay-development.mjs';
import {SARSA_ARMS, SARSA_PROBES} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const phi = index => Array.from({length: 40}, (_, j) => +(index === j));
const tr = (experience, reward, options = {}) => ({agentId: 1, experience, tick: 1 + (experience - 1) * 8, duration: 8, action: 1, reward, phi: phi(experience - 1), nextPhi: phi(experience), terminal: false, behaviorProbability: .5, ...options});
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} / ${b}`);

test('bounded forward replay propagates delayed reward through contiguous own records and clipped policy ratios', () => {
  const s = createRetraceBody(1, 41); s.recent = [tr(1, 0), tr(2, 0), tr(3, 1, {terminal: true, nextPhi: Array(40).fill(0)})];
  const gamma = Math.exp(-8 / 256);
  close(replayCorrection(s, s.recent[0]).correction, (gamma * .9) ** 2);
  assert.equal(replayCorrection(s, s.recent[0]).steps, 3);
  s.recent[1].behaviorProbability = .95;
  close(replayCorrection(s, s.recent[0]).correction, (gamma * .9) ** 2 * (.5 / .95));
  s.recent[1].tick++;
  assert.equal(replayCorrection(s, s.recent[0]).steps, 1);
  s.recent[1].tick--; s.recent[1].phi = phi(9);
  assert.equal(replayCorrection(s, s.recent[0]).steps, 1);
  s.recent[1].agentId = 2;
  assert.throws(() => replayCorrection(s, s.recent[0]));
  s.recent = Array.from({length: 20}, (_, i) => tr(i + 1, 0, {terminal: i === 19, nextPhi: i === 19 ? Array(40).fill(0) : phi(i + 1)}));
  assert.equal(replayCorrection(s, s.recent[0]).steps, 16);
});

test('the independent checker reconstructs Retrace, matched one-step, linear and reflex event streams', t => {
  if (!process.env.SARSA_AUDIT_PYTHON) return t.skip('Set SARSA_AUDIT_PYTHON to run the independent Python replay audit');
  const h = {seed: 83, resourceSeeds: [901, 902, 903, 904], probeSeeds: {A: 10001, B: 10002, C: 10003}};
  const p = {reference: {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}},
    pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17}, arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES};
  const events = [], row = simulateReplayHistory(p, h, 'development', e => events.push(JSON.stringify(e)));
  assert.ok(row.programs.candidate.arms.candidate.learners.some(s => s.replayDiagnostics.multiStepUpdates > 0));
  const directory = mkdtempSync(join(tmpdir(), 'retrace-independent-'));
  try {
    const trace = join(directory, 'trace.jsonl'); writeFileSync(trace, events.join('\n') + '\n');
    const code = ["import runpy,sys,warnings,gc", "from pathlib import Path", "helper=runpy.run_path(sys.argv[1])", "dev=runpy.run_path(sys.argv[2])", "trace=Path(sys.argv[3])",
      "with warnings.catch_warnings(record=True) as caught:", "    warnings.simplefilter('always')", "    assert helper['audit_trace'](trace,83,'candidate')['learnerBodies']==16", "    assert helper['audit_trace'](trace,83,'oneStep')['learnerBodies']==4", "    assert helper['audit_trace'](trace,83,'linear')['learnerBodies']==4", "    dev['audit_reflex'](trace,83)", "    gc.collect()", "assert not caught,[str(w.message) for w in caught]"].join('\n');
    const result = spawnSync(process.env.SARSA_AUDIT_PYTHON, ['-c', code,
      fileURLToPath(new URL('../scripts/audit-sarsa-screen.py', import.meta.url)), fileURLToPath(new URL('../scripts/audit-sarsa-development.py', import.meta.url)), trace], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr + result.stdout);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test('one-step ablation exactly recovers the original arithmetic, RNG and reservoir for a fixed factual stream', () => {
  const original = createSarsaBody(1, 41), matched = createOneStepReplayBody(1, 41);
  for (let i = 1; i <= 200; i++) {
    const t = tr(i, i % 3 ? .001 : -.002, {phi: phi(i % 5), nextPhi: phi((i + 1) % 5), action: i % 2 ? 1 : -1, terminal: i % 50 === 0});
    learnSarsaTransition(original, t); learnRetraceTransition(matched, t);
    assert.deepEqual(matched.weights, original.weights); assert.deepEqual(matched.eligibility, original.eligibility);
  }
  assert.equal(matched.replayRngState, original.replayRngState); assert.equal(matched.retentionRngState, original.retentionRngState);
  assert.deepEqual(matched.older, original.older); assert.deepEqual(matched.recent, original.recent);
  assert.equal(matched.replayDiagnostics.maxSteps, 1); assert.equal(matched.replayDiagnostics.terms, 200);
  assert.deepEqual(restoreRetraceBody(JSON.parse(JSON.stringify(matched))), matched);
});

test('nominal action probabilities handle exploitation, exploration and ties without large replay coefficients', () => {
  assert.equal(actionProbability([1, 2], 1), .95); assert.equal(actionProbability([1, 2], -1), .05); assert.equal(actionProbability([2, 2], 1), .5);
  const s = createRetraceBody(1, 41); s.recent = [tr(1, 0), tr(2, 1, {terminal: true, behaviorProbability: .05, nextPhi: Array(40).fill(0)})];
  close(replayCorrection(s, s.recent[0]).correction, Math.exp(-8 / 256) * .9);
  s.recent[1].behaviorProbability = 0; assert.throws(() => replayCorrection(s, s.recent[0]), /probability/);
});

test('complete retrace bodies preserve continuation, bills, reset/freeze and read-only retention probes', () => {
  const reference = {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}};
  const config = {seed: 83, resourceSeeds: [901, 902, 903, 904], arm: 'candidate', reference, pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17}, learnerProgram: 'linear-retrace-v1'};
  const run = new SarsaExperiment(config); run.advance(700); const copy = SarsaExperiment.restore(run.checkpoint());
  run.advance(1092); copy.advance(1092); assert.deepEqual(run.checkpoint(), copy.checkpoint());
  assert.ok(Object.values(run.learners).every(s => s.replayDiagnostics.multiStepUpdates > 0 && s.replayDiagnostics.maxSteps <= 16));
  const before = run.checkpoint(), early = runSarsaProbe(run.atC, {family: 'B', version: 'B'}, 10001, 4), late = runSarsaProbe(run.atC, {family: 'B', version: 'C'}, 10001, 4);
  assert.equal(early.startWorldSha256, late.startWorldSha256); assert.deepEqual(run.checkpoint(), before); assert.ok(late.learnedWeightsUnchanged);
  const reset = new SarsaExperiment({...config, arm: 'reset'}); reset.advance(513);
  assert.ok(Object.values(reset.learners).every(s => s.recent.length === 0 && s.older.length === 0 && s.transitions > 0 && s.replayDiagnostics.updates > 0));
});
