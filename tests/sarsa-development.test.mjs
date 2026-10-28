import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {simulateLocalHistory, validateLocalRow, scoreLocalRows, LOCAL_CONTRASTS} from '../learning/sarsa-development.mjs';
import {SARSA_ARMS, SARSA_PROBES} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {collectRegisteredSeeds} from '../scripts/sarsa-development.mjs';

const h = {seed: 83, resourceSeeds: [901, 902, 903, 904], probeSeeds: {A: 10001, B: 10002, C: 10003}};
const p = {reference: {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}},
  pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17}, arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES,
  contrasts: LOCAL_CONTRASTS, alphaPerTest: .05 / 12, critical: {development: 3, confirmation: 3}, descriptiveCritical: {development: 2, confirmation: 2}};

test('seed exclusion includes nested family names beneath seed containers', () => {
  const seeds = new Set(); collectRegisteredSeeds({seed: 91, seedArray: [92], histories: [{seed: 93, resourceSeeds: [94], probeSeeds: {A: 95, B: 96}}], unrelatedNumber: 100}, seeds);
  assert.deepEqual([...seeds].sort((a, b) => a - b), [91, 92, 93, 94, 95, 96]);
});

test('development records two real learners and a separately disclosed, priced fixed reflex', () => {
  const events = [], row = simulateLocalHistory(p, h, 'development', e => events.push(JSON.stringify(e))); validateLocalRow(row, h, p, 'development');
  assert.equal(Object.keys(row.programs.tile.arms).length, 7); assert.equal(Object.keys(row.programs.linear.arms).length, 1);
  assert.equal(row.programs.tile.probes.length + row.programs.linear.probes.length, 18);
  assert.ok(Object.values(row.reflex.learners).every(s => s.work.scalarOperations === s.decisions && s.transitions === 0));
  assert.ok(row.reflex.endpoint.incurredEnergy > 0);
  assert.throws(() => validateLocalRow({...row, seed: 84}, h, p, 'development'));
  assert.throws(() => validateLocalRow({...row, programs: {tile: row.programs.linear, linear: row.programs.tile}}, h, p, 'development'));
  if (process.env.SARSA_AUDIT_PYTHON) {
    const directory = mkdtempSync(join(tmpdir(), 'local-development-'));
    try {
      const path = join(directory, 'trace.jsonl'); writeFileSync(path, events.join('\n') + '\n');
      const code = ["import runpy,sys,warnings,gc", "from pathlib import Path", "m=runpy.run_path(sys.argv[1])", "path=Path(sys.argv[2])",
        "with warnings.catch_warnings(record=True) as captured:", "    warnings.simplefilter('always')",
        "    m['helper']['audit_trace'](path,83,'tile')", "    m['helper']['audit_trace'](path,83,'linear')", "    m['audit_reflex'](path,83)",
        "    gc.collect()", "assert not captured, [str(w.message) for w in captured]"].join('\n');
      const result = spawnSync(process.env.SARSA_AUDIT_PYTHON, ['-c', code, fileURLToPath(new URL('../scripts/audit-sarsa-development.py', import.meta.url)), path], {encoding: 'utf8'});
      assert.equal(result.status, 0, result.stderr + result.stdout);
    } finally { rmSync(directory, {recursive: true, force: true}); }
  }
});

// Fabricated arithmetic fixtures, not independent scientific histories.
function fixture(seed, phase) {
  const history = {...h, seed}, endpoint = value => ({founders: 4, tick: 1792, survivors: 4, survival: 1, budgetAdjustedEnergyPerFounder: value});
  const probeValue = {A: {A: 1, C: 1, reset: 0}, B: {A: 0, B: 1, C: 1, reset: 0}, C: {B: 0, C: 1}};
  const program = linear => ({seed, founders: 4, resourceSeeds: h.resourceSeeds, probeSeeds: h.probeSeeds,
    arms: Object.fromEntries((linear ? ['candidate'] : SARSA_ARMS).map(arm => [arm, {arm, seed, endpoint: endpoint(arm === 'candidate' ? linear ? 1 : 2 : 0), phases: CONTINUAL_PHASES.map(v => ({phase: v.id}))}])),
    probes: linear && phase === 'confirmation' ? [] : SARSA_PROBES.map(v => ({...v, resourceSeed: h.probeSeeds[v.family], founders: 4, value: probeValue[v.family][v.version]}))});
  return {history, row: {seed, phase, resourceSeeds: h.resourceSeeds, probeSeeds: h.probeSeeds, programs: {tile: program(false), linear: program(true)}, reflex: {endpoint: endpoint(0)}}};
}
test('development success cannot count as qualification; each retained skill and survival remain separate gates', () => {
  const dev = Array.from({length: 8}, (_, i) => fixture(2001 + i, 'development'));
  const policy = {...p, developmentHistories: dev.map(v => v.history)};
  const result = scoreLocalRows(dev.map(v => v.row), policy, 'development');
  assert.equal(result.promising, true); assert.equal(result.qualified, false);
  const confirm = Array.from({length: 16}, (_, i) => fixture(3001 + i, 'confirmation'));
  const cp = {...p, confirmationHistories: confirm.map(v => v.history)};
  assert.equal(scoreLocalRows(confirm.map(v => v.row), cp, 'confirmation').qualified, true);
  for (const v of confirm) v.row.programs.tile.probes.find(r => r.family === 'B' && r.version === 'C').value = .9;
  assert.equal(scoreLocalRows(confirm.map(v => v.row), cp, 'confirmation').qualified, false);
  for (const v of dev) v.row.programs.tile.arms.candidate.endpoint.survival = .75;
  assert.equal(scoreLocalRows(dev.map(v => v.row), policy, 'development').promising, false);
});
