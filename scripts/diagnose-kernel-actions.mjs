// Post-hoc action-ranking check on previously audited forks. It cannot
// qualify a new controller or re-label the original failed action study.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {createKernelLearner, updateKernel, predictKernel} from '../learning/kernel-learner.mjs';
import {outcomeExample, pairedSignFlip} from '../learning/self-modifying-tasks.mjs';
const referenceDirectory = resolve(process.argv[2] || 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf'), directory = resolve(process.argv[3] || `evidence/kernel-action-diagnosis/${randomUUID()}`);
await mkdir(directory, {recursive: true});
const hash = bytes => createHash('sha256').update(bytes).digest('hex'), bytes = await readFile(join(referenceDirectory, 'results.json')), old = JSON.parse(bytes);
const sourceSha256 = {};
for (const file of ['learning/kernel-learner.mjs', 'learning/self-modifying-tasks.mjs', 'learning/self-modifying.mjs', 'scripts/diagnose-kernel-actions.mjs']) sourceSha256[file] = hash(await readFile(file));
const programs = [{kernel: 'rbf', update: 'gradient'}, {kernel: 'laplacian', update: 'ridge'}];
const protocol = {at: new Date().toISOString(), experiment: 'post-hoc-kernel-action-ranking', referenceDirectory, referenceSha256: hash(bytes), sourceSha256, programs, interpretation: 'Exploratory reuse of old audited physical action forks. Each predictor receives only the target founder\'s factual windows completed by the query tick, and never receives future action-fork labels. Unexecuted slow/fast queries use the same recorded sensory observation. Physical effect labels score rankings only. No new sample, qualification gate, promotion, or rescue of the old failed study.'};
await writeFile(join(directory, 'protocol.json'), JSON.stringify(protocol, null, 2) + '\n');
const channels = [0, 1, 2, 3, 4, 10, 11, 12, 13], sign = x => Math.abs(x) < 1e-9 ? 0 : Math.sign(x), mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const rows = [];
for (const world of old.rows) {
  const cases = [];
  for (const recorded of world.plans) {
    const factual = world.windows.filter(w => w.agentId === recorded.agentId && w.tick + 7 <= recorded.tick).sort((a, b) => a.tick - b.tick);
    const models = [];
    for (const program of programs) {
      const state = createKernelLearner(20, program);
      for (const window of factual) { const example = outcomeExample(window); updateKernel(state, example.input, example.target); }
      const before = hash(JSON.stringify(state));
      const forecast = choice => { const sensed = channels.map(i => recorded.query[i]); return predictKernel(state, [1, ...sensed, choice, ...sensed.map(x => x * choice)]); };
      const slow = forecast(-1), fast = forecast(1); assert.equal(hash(JSON.stringify(state)), before);
      models.push({program, slow, fast, difference: fast - slow, gain: sign(fast - slow) * recorded.actualDifference / 2, seen: state.seen, latestFactualEndTick: factual.at(-1).tick + 7, stateSha256: before});
    }
    cases.push({tick: recorded.tick, agentId: recorded.agentId, actualDifference: recorded.actualDifference, incumbentGain: recorded.incumbentGain, originalOptionGain: recorded.gain, slowGain: -recorded.actualDifference / 2, fastGain: recorded.actualDifference / 2, models, usedForTraining: false, usedForControl: false});
  }
  rows.push({seed: world.seed, environment: world.environment, cases});
}
const summary = Object.fromEntries([...new Set(rows.map(row => row.environment))].map(environment => {
  const selected = rows.filter(row => row.environment === environment);
  const comparisons = Object.fromEntries(['rbf', 'incumbent', 'slow', 'fast', 'zero'].map(control => [control, pairedSignFlip(selected.map(row => mean(row.cases.map(c => c.models[1].gain - (control === 'rbf' ? c.models[0].gain : control === 'incumbent' ? c.incumbentGain : control === 'slow' ? c.slowGain : control === 'fast' ? c.fastGain : 0)))))]));
  return [environment, {cases: selected.reduce((sum, row) => sum + row.cases.length, 0), meanLaplacianGain: mean(selected.map(row => mean(row.cases.map(c => c.models[1].gain)))), comparisons}];
}));
const result = {protocol, rows, summary, qualification: false, originalActionGateUnchanged: true};
await writeFile(join(directory, 'results.json'), JSON.stringify(result) + '\n'); console.log(JSON.stringify({directory, summary}, null, 2));
