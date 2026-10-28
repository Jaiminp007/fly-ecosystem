import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {simulateSarsaHistory, validateSarsaRow, sarsaEffects, SARSA_CONTRASTS} from '../learning/sarsa-screen.mjs';
import {SARSA_ARMS, SARSA_PROBES, SarsaExperiment} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';

const reference = {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}};
const pricing = {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17};
const h = {seed: 83, resourceSeeds: [901, 902, 903, 904], probeSeeds: {A: 10001, B: 10002, C: 10003}};
const p = {reference, pricing, arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES};

function withDecisionTickDeath(callback) {
  const step = SarsaExperiment.prototype.step;
  SarsaExperiment.prototype.step = function() {
    if (this.world.tick === 0) this.world.flies[0].genome.traits.lifespan = .85;
    return step.call(this);
  };
  try { return callback(); } finally { SarsaExperiment.prototype.step = step; }
}

test('fixed screen covers seven arms/nine common-body probes and rejects wrong identities', () => {
  const row = simulateSarsaHistory(p, h);
  validateSarsaRow(row, h, p);
  assert.equal(row.probes.length, 9); assert.equal(Object.keys(row.arms).length, 7);
  assert.throws(() => validateSarsaRow({...row, seed: 84}, h, p));
  assert.throws(() => validateSarsaRow({...row, probes: row.probes.slice(1)}, h, p));
  assert.throws(() => validateSarsaRow({...row, arms: {...row.arms, candidate: row.arms.fast}}, h, p));
  const contrast = SARSA_CONTRASTS.find(c => c.id === 'A-retention');
  const probe = version => row.probes.find(r => r.family === 'A' && r.version === version).value;
  assert.ok(Math.abs(sarsaEffects(row, contrast) - ((probe('C') - probe('reset')) - .95 * (probe('A') - probe('reset')))) < 1e-10);
});

test('terminal computation debt remains billed even when the last body cannot pay', () => {
  const run = new SarsaExperiment({seed: h.seed, resourceSeeds: h.resourceSeeds, arm: 'candidate', reference, pricing: {...pricing, operationEnergy: 100}});
  for (const f of run.world.flies) f.genome.traits.lifespan = 0;
  run.step();
  assert.equal(run.world.flies.length, 0);
  assert.ok(Object.values(run.learners).every(s => s.dead && s.work.liveUpdates === 1 && s.charge.operationsBilled === s.work.scalarOperations));
  const ep = run.endpoint();
  assert.ok(ep.outstandingEnergy > 0);
  assert.ok(Math.abs(ep.budgetAdjustedEnergyPerFounder - ep.grossEnergyPerFounder + ep.outstandingEnergy / reference.founders) < 1e-7);
});

test('death on a decision tick records both the previous update and the one-tick terminal update', () => {
  const events = [];
  withDecisionTickDeath(() => simulateSarsaHistory(p, h, e => events.push(structuredClone(e))));
  const event = events.find(e => e.type === 'experience' && e.arm === 'candidate' && e.agentId === 1 && e.tick === 9);
  assert.equal(event.transitions.length, 2);
  assert.deepEqual(event.transitions.map(t => [t.tick, t.duration, t.terminal]), [[1, 8, false], [9, 1, true]]);
  assert.ok(event.decision);
});

test('independent Python learner reproduces factual screen decisions, traces, resets and replay', {skip: !process.env.SARSA_AUDIT_PYTHON}, () => {
  const directory = mkdtempSync(join(tmpdir(), 'sarsa-screen-audit-'));
  try {
    const events = [];
    withDecisionTickDeath(() => simulateSarsaHistory(p, h, event => events.push(JSON.stringify(event))));
    const path = join(directory, 'trace.jsonl'); writeFileSync(path, events.join('\n') + '\n');
    const auditor = fileURLToPath(new URL('../scripts/audit-sarsa-screen.py', import.meta.url));
    const code = ["import runpy, sys, warnings, gc", "from pathlib import Path", "m=runpy.run_path(sys.argv[1])",
      "with warnings.catch_warnings(record=True) as captured:", "    warnings.simplefilter('always')",
      "    report=m['audit_trace'](Path(sys.argv[2]),83)", "    gc.collect()", "assert not captured, [str(w.message) for w in captured]", "print(report)"].join('\n');
    const result = spawnSync(process.env.SARSA_AUDIT_PYTHON, ['-c', code, auditor, path], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr + result.stdout);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
