import test from 'node:test';
import assert from 'node:assert/strict';
import {createMushroomBody, createFastMushroomBody, learnMushroomTransition, mushroomFeatures, mushroomPolicy} from '../learning/mushroom-body.mjs';
import {SarsaExperiment, SARSA_ARMS, SARSA_PROBES, runSarsaProbe} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {simulateMushroomHistory} from '../learning/mushroom-development.mjs';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const reference = {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}};
const pricing = {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17};
const h = {seed: 83, resourceSeeds: [901, 902, 903, 904], probeSeeds: {A: 10001, B: 10002, C: 10003}};

test('sparse dopamine policy updates chosen-action preference and transfers weight without changing its total', () => {
  const s = createMushroomBody(1, 41), fast = createFastMushroomBody(1, 41);
  const phi = mushroomFeatures(s, Array(17).fill(.2)); assert.equal(phi.filter(v => v !== 0).length, 8);
  assert.equal(mushroomPolicy(s, phi).probability, .5);
  const tr = {agentId: 1, tick: 1, duration: 8, phi, nextPhi: phi, action: 1, reward: .01, gradientFactor: .45, probability: .5, initialEnergy: 50, finalEnergy: 51.2, terminal: false};
  learnMushroomTransition(s, tr); learnMushroomTransition(fast, tr);
  assert.ok(mushroomPolicy(s, phi).probability > .5);
  assert.ok(s.weights[1].some(v => v > 0)); assert.ok(fast.weights[1].every(v => v === 0));
  for (let j = 0; j < 64; j++) assert.ok(Math.abs(s.weights[0][j] + s.weights[1][j] - fast.weights[0][j]) < 1e-12);
  const negative = createMushroomBody(1, 41); learnMushroomTransition(negative, {...tr, reward: -.01, finalEnergy: 48.8});
  assert.ok(mushroomPolicy(negative, phi).probability < .5);
  assert.equal(s.replayUpdates, 0); assert.equal(s.plasticityDiagnostics.updates, 1);
});

test('mushroom circuit checkpoint, freeze/reset, and both synaptic compartments survive read-only probes', () => {
  const config = {...h, reference, pricing, arm: 'candidate', learnerProgram: 'mushroom-policy-v1'};
  const run = new SarsaExperiment(config); run.advance(700); const copy = SarsaExperiment.restore(run.checkpoint());
  run.advance(1092); copy.advance(1092); assert.deepEqual(copy.checkpoint(), run.checkpoint());
  const before = run.checkpoint(), a = runSarsaProbe(run.atC, {family: 'B', version: 'B'}, 10001, 4), b = runSarsaProbe(run.atC, {family: 'B', version: 'C'}, 10001, 4);
  assert.equal(a.startWorldSha256, b.startWorldSha256); assert.deepEqual(run.checkpoint(), before); assert.ok(b.learnedWeightsUnchanged);
  const reset = new SarsaExperiment({...config, arm: 'reset'}); reset.advance(513);
  assert.ok(Object.values(reset.learners).every(s => s.rewardBaseline === 0 && s.weights.flat().every(v => v === 0) && s.recent.length === 0 && s.transitions > 0));
});

test('Python independently reconstructs every sparse policy update and both control streams', t => {
  if (!process.env.SARSA_AUDIT_PYTHON) return t.skip('Set SARSA_AUDIT_PYTHON for the independent checker');
  const events = [], p = {reference, pricing, arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES};
  const row = simulateMushroomHistory(p, h, 'development', e => events.push(JSON.stringify(e)));
  assert.ok(row.programs.candidate.arms.candidate.learners.every(s => s.plasticityDiagnostics.transfers > 0));
  const directory = mkdtempSync(join(tmpdir(), 'mushroom-independent-'));
  try {
    const trace = join(directory, 'trace.jsonl'); writeFileSync(trace, events.join('\n') + '\n');
    const code = ["import runpy,sys,warnings,gc", "from pathlib import Path", "mb=runpy.run_path(sys.argv[1])", "helper=runpy.run_path(sys.argv[2])", "dev=runpy.run_path(sys.argv[3])", "path=Path(sys.argv[4])",
      "with warnings.catch_warnings(record=True) as caught:", "    warnings.simplefilter('always')", "    assert mb['audit_trace'](path,83,'candidate')['learnerBodies']==16", "    assert mb['audit_trace'](path,83,'fastOnly')['learnerBodies']==4", "    assert helper['audit_trace'](path,83,'linear')['learnerBodies']==4", "    dev['audit_reflex'](path,83)", "    gc.collect()", "assert not caught,[str(w.message) for w in caught]"].join('\n');
    const result = spawnSync(process.env.SARSA_AUDIT_PYTHON, ['-c', code,
      fileURLToPath(new URL('../scripts/audit-mushroom-body.py', import.meta.url)), fileURLToPath(new URL('../scripts/audit-sarsa-screen.py', import.meta.url)),
      fileURLToPath(new URL('../scripts/audit-sarsa-development.py', import.meta.url)), trace], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr + result.stdout);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
