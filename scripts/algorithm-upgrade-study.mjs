import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID, createHash} from 'node:crypto';
import {createKernelLearner, updateKernel, migrateKernel, restoreKernelLearner} from '../learning/kernel-learner.mjs';
import {selectAlgorithmUpgrade, scoreAlgorithmUpgrade, compareAlgorithmUpgrade, UPGRADE_PROGRAMS} from '../learning/algorithm-upgrade.mjs';
import {collectWorld} from './self-modification-study.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const directory = resolve(process.argv[2] || `evidence/algorithm-upgrade/${randomUUID()}`);
await mkdir(dirname(directory), {recursive: true}); await mkdir(directory);
const referenceDirectory = resolve('evidence/self-modification/a5f74db8-2b02-4ae5-a8dd-17c8c416c2d3');
const priorBytes = await readFile(join(referenceDirectory, 'protocol.json')), prior = JSON.parse(priorBytes);
const referenceBytes = await readFile(join(referenceDirectory, 'reference-protocol.json')), reference = JSON.parse(referenceBytes);
const developmentBytes = await readFile(join(referenceDirectory, 'development.json')), development = JSON.parse(developmentBytes);
const diagnosticDirectory = resolve('evidence/forecast-capacity/f1592535-e14c-4699-809f-11a066d2510c'), diagnosticBytes = await readFile(join(diagnosticDirectory, 'results.json'));
for (const [file, sha] of Object.entries(prior.worldSourceSha256)) assert.equal(hash(await readFile(join(prior.worldSources, file))), sha);
const sourceSha256 = {};
for (const file of ['learning/kernel-learner.mjs', 'learning/algorithm-upgrade.mjs', 'learning/self-modifying-tasks.mjs', 'learning/self-modifying.mjs', 'scripts/algorithm-upgrade-study.mjs', 'scripts/self-modification-study.mjs']) {
  const bytes = await readFile(file), path = join(directory, 'sources', file); sourceSha256[file] = hash(bytes);
  await mkdir(dirname(path), {recursive: true}); await writeFile(path, bytes);
}
const used = new Set(), registries = [];
const inspect = async path => {
  let bytes; try { bytes = await readFile(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  registries.push({path, sha256: hash(bytes)});
  function walk(value, key = '') {
    if (typeof value === 'number' && /^seed$/i.test(key)) used.add(value);
    if (Array.isArray(value) && /seeds$/i.test(key)) for (const seed of value) if (Number.isInteger(seed)) used.add(seed);
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
  }
  walk(JSON.parse(bytes));
};
for (const root of await readdir('evidence', {withFileTypes: true})) if (root.isDirectory()) {
  const path = join('evidence', root.name); await inspect(join(path, 'protocol.json'));
  for (const entry of await readdir(path, {withFileTypes: true})) if (entry.isDirectory()) await inspect(join(path, entry.name, 'protocol.json'));
}
const seeds = [], offset = parseInt(randomUUID().slice(0, 8), 16) >>> 0;
for (let i = 0; seeds.length < 16; i++) { const seed = ((offset + i * 7919) >>> 0) || 1; if (!used.has(seed) && !seeds.includes(seed)) seeds.push(seed); }
const protocol = {
  at: new Date().toISOString(), experiment: 'fresh-algorithm-migration-screen', referenceDirectory, priorProtocolSha256: hash(priorBytes),
  referenceSha256: hash(referenceBytes), developmentSha256: hash(developmentBytes), diagnosticDirectory, diagnosticSha256: hash(diagnosticBytes),
  sourceSha256, worldSources: prior.worldSources, worldSourceSha256: prior.worldSourceSha256, seedRegistries: registries, seeds,
  programs: UPGRADE_PROGRAMS, capacity: 256, regularization: .1, stepSize: .2, splitTick: 900, horizonTicks: 1800, observedAgents: [1, 2],
  selectionRule: 'Choose maximum minimum relative post-B MSE improvement in fixed and relocating-food development worlds; ties keep earlier program order. Select exactly once before fresh worlds. All grammar choices are evaluated at the same declared sample counts, with realized work disclosed.',
  gate: 'Selected program must differ from incumbent. Positive mean improvements and one-sided paired sign-flip p<=.05/4 for BOTH post-B environment errors and BOTH acquired-vs-reset advantages; nonnegative mean old-skill retention through migration and subsequent B learning. One fixed sample, no retry, extension, candidate reselection or ecological promotion.',
  alpha: .05 / 4,
  selfApplication: 'The selector records its own development program-evaluation outcomes as preference-learning examples. If the fresh gate passes, it autonomously replaces the forecasting program AND migrates its own preference learner to that same executable program, reconstructing solely from retained proposal experiences. The fixed-preference control keeps its initial learning algorithm and the exact same proposal facts. Exhaustive development selection makes this a mechanism comparison, not evidence that self-application improves search productivity.',
  interpretation: 'A separately locked forecast-algorithm revision study, not a repeat of the failed expression study. Architecture choices were informed by post-hoc archived-world diagnostics; only these new seeds are prospective evidence. A learner trains on its own A experience under the incumbent, changes algorithm by replaying its own retained factual records, then learns B without clearing them. No action-fork labels, pooled founder facts, habitat changes, future labels during training or test-query updates. Retained forecasting skill is not embodied survival or broad continual cognition. Even a pass demonstrates a bounded algorithmic migration, not the full RSI objective.'
};
await writeFile(join(directory, 'protocol.json'), JSON.stringify(protocol, null, 2) + '\n');
await writeFile(join(directory, 'reference-protocol.json'), referenceBytes); await writeFile(join(directory, 'development.json'), developmentBytes);
await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'running'}) + '\n');
const selection = selectAlgorithmUpgrade(development);
await writeFile(join(directory, 'locked-selection.json'), JSON.stringify(selection) + '\n');
console.log(JSON.stringify({directory, phase: 'locked-selection', program: selection.selectedProgram, developmentObjective: selection.selectedObjective}));
const preference = createKernelLearner(4), preferenceInputs = [];
for (const [index, candidate] of selection.candidates.entries()) {
  const input = UPGRADE_PROGRAMS.map((_, i) => +(index === i)), target = Math.max(-1, Math.min(1, candidate.objective));
  updateKernel(preference, input, target); preferenceInputs.push({input, target});
}
const {World} = await import(pathToFileURL(join(prior.worldSources, 'engine.mjs'))), worlds = [];
for (const seed of seeds) for (const environment of ['fixed', 'relocation']) {
  worlds.push(collectWorld(World, seed, environment, reference));
  console.log(JSON.stringify({directory, phase: 'collect', worlds: worlds.length, total: seeds.length * 2}));
}
const worldBytes = JSON.stringify(worlds) + '\n'; await writeFile(join(directory, 'worlds.json'), worldBytes);
const candidate = scoreAlgorithmUpgrade(selection.selectedProgram, worlds, {capture: true}), incumbent = scoreAlgorithmUpgrade(UPGRADE_PROGRAMS[0], worlds, {capture: true});
const comparison = compareAlgorithmUpgrade(candidate, incumbent, protocol.alpha);
const changed = JSON.stringify(selection.selectedProgram) !== JSON.stringify(UPGRADE_PROGRAMS[0]), accepted = changed && comparison.passed;
const selfAppliedPreference = accepted ? migrateKernel(preference, selection.selectedProgram) : structuredClone(preference), fixedPreference = structuredClone(preference);
assert.deepEqual(selfAppliedPreference.records, fixedPreference.records);
assert.deepEqual(restoreKernelLearner(JSON.parse(JSON.stringify(selfAppliedPreference))), selfAppliedPreference);
const result = {protocol, selection, worldsSha256: hash(worldBytes), candidate, incumbent, comparison, changed, accepted,
  preferenceFacts: preferenceInputs, originalPreference: preference, selfAppliedPreference, fixedPreference,
  recursiveProductivityDemonstrated: false, embodiedQualification: false, broadRSIDemonstrated: false, livePolicyChanged: false, completedAt: new Date().toISOString()};
for (const [file, sha] of Object.entries(sourceSha256)) assert.equal(hash(await readFile(file)), sha);
await writeFile(join(directory, 'results.json'), JSON.stringify(result) + '\n');
await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'complete'}) + '\n');
console.log(JSON.stringify({directory, phase: 'complete', accepted, changed, program: selection.selectedProgram, comparison: comparison.metrics, recursiveProductivityDemonstrated: false}, null, 2));
