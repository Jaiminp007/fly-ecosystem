import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {simulateSarsaHistory} from '../learning/sarsa-screen.mjs';
import {SarsaExperiment, SARSA_ARMS, SARSA_PROBES} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';

test('independent Python reconstructs sparse tile features, traces, reservoir/replay and same-tick death', {skip: !process.env.SARSA_AUDIT_PYTHON}, () => {
  const directory = mkdtempSync(join(tmpdir(), 'tile-audit-'));
  const step = SarsaExperiment.prototype.step;
  try {
    SarsaExperiment.prototype.step = function() { if (!this.world.tick) this.world.flies[0].genome.traits.lifespan = .85; return step.call(this); };
    const events = [], reference = {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}};
    simulateSarsaHistory({reference, learnerProgram: 'tile-sarsa-v1', arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES,
      pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17}},
    {seed: 83, resourceSeeds: [901, 902, 903, 904], probeSeeds: {A: 10001, B: 10002, C: 10003}}, e => events.push(JSON.stringify(e)));
    const path = join(directory, 'trace.jsonl'); writeFileSync(path, events.join('\n') + '\n');
    const code = ["import runpy,sys,warnings,gc", "from pathlib import Path", "m=runpy.run_path(sys.argv[1])", "with warnings.catch_warnings(record=True) as captured:",
      "    warnings.simplefilter('always')", "    report=m['audit_trace'](Path(sys.argv[2]),83)", "    gc.collect()", "assert not captured, [str(w.message) for w in captured]", "print(report)"].join('\n');
    const result = spawnSync(process.env.SARSA_AUDIT_PYTHON, ['-c', code, fileURLToPath(new URL('../scripts/audit-sarsa-screen.py', import.meta.url)), path], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr + result.stdout);
  } finally { SarsaExperiment.prototype.step = step; rmSync(directory, {recursive: true, force: true}); }
});
