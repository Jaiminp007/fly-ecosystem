import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const directory = resolve(process.argv[2] || ''), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async file => JSON.parse(await readFile(join(directory, file)));
const p = await load('protocol.json'), r = await load('results.json');
assert.deepEqual(r.protocol, p); assert.equal(p.experiment, 'fresh-algorithm-migration-screen');
assert.equal(p.seeds.length, 16); assert.equal(new Set(p.seeds).size, p.seeds.length);
assert.equal(p.alpha, .05 / 4); assert.equal(p.capacity, 256); assert.equal(p.regularization, .1); assert.equal(p.stepSize, .2);
for (const [file, sha] of Object.entries(p.sourceSha256)) assert.equal(hash(await readFile(join(directory, 'sources', file))), sha);
for (const [file, sha] of Object.entries(p.worldSourceSha256)) assert.equal(hash(await readFile(join(p.worldSources, file))), sha);
assert.equal(hash(await readFile(join(p.referenceDirectory, 'protocol.json'))), p.priorProtocolSha256);
assert.equal(hash(await readFile(join(directory, 'reference-protocol.json'))), p.referenceSha256);
assert.equal(hash(await readFile(join(p.diagnosticDirectory, 'results.json'))), p.diagnosticSha256);
const developmentBytes = await readFile(join(directory, 'development.json')); assert.equal(hash(developmentBytes), p.developmentSha256);
for (const registry of p.seedRegistries) {
  const bytes = await readFile(registry.path); assert.equal(hash(bytes), registry.sha256);
  function walk(value, key = '') {
    if (typeof value === 'number' && /^seed$/i.test(key)) assert.ok(!p.seeds.includes(value));
    if (Array.isArray(value) && /seeds$/i.test(key)) for (const seed of value) if (Number.isInteger(seed)) assert.ok(!p.seeds.includes(seed));
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
  }
  walk(JSON.parse(bytes));
}
const api = await import(pathToFileURL(join(directory, 'sources/learning/kernel-learner.mjs')));
const tasks = await import(pathToFileURL(join(directory, 'sources/learning/algorithm-upgrade.mjs')));
const collector = await import(pathToFileURL(join(directory, 'sources/scripts/self-modification-study.mjs')));
const development = JSON.parse(developmentBytes), selection = tasks.selectAlgorithmUpgrade(development);
assert.deepEqual(selection, r.selection); assert.deepEqual(selection, await load('locked-selection.json'));
const objectives = selection.candidates.map(c => Math.min((selection.baseline.meanA - c.score.meanA) / selection.baseline.meanA, (selection.baseline.meanB - c.score.meanB) / selection.baseline.meanB));
assert.deepEqual(objectives, selection.candidates.map(c => c.objective));
const selectedIndex = objectives.indexOf(Math.max(...objectives)); assert.deepEqual(selection.selectedProgram, p.programs[selectedIndex]);
const bytes = await readFile(join(directory, 'worlds.json')); assert.equal(hash(bytes), r.worldsSha256);
const worlds = JSON.parse(bytes); assert.equal(worlds.length, p.seeds.length * 2);
assert.equal(new Set(worlds.map(w => w.seed + ':' + w.environment)).size, worlds.length);
const {World} = await import(pathToFileURL(join(p.worldSources, 'engine.mjs'))), reference = await load('reference-protocol.json');
const physicalReplays = [];
let windows = 0;
for (const recorded of worlds) {
  assert.ok(p.seeds.includes(recorded.seed) && ['fixed', 'relocation'].includes(recorded.environment));
  const replay = collector.collectWorld(World, recorded.seed, recorded.environment, reference);
  assert.deepEqual(replay, recorded);
  windows += recorded.windows.length;
  physicalReplays.push({seed: recorded.seed, environment: recorded.environment, finalSha256: recorded.finalSha256, exactFactualWindowsAndWorld: true});
  console.log(JSON.stringify({directory, physicalReplays: physicalReplays.length, total: worlds.length}));
}
const candidate = tasks.scoreAlgorithmUpgrade(selection.selectedProgram, worlds, {capture: true}), incumbent = tasks.scoreAlgorithmUpgrade(tasks.UPGRADE_PROGRAMS[0], worlds, {capture: true});
// The archived learner retained -0 in feature records; JSON serializes it as
// +0. Disclose/check each difference before comparing serialized state. No
// metric, nonzero value or record identity may be normalized by this rule.
const signedZeroPaths = [];
function verifySerialized(actual, expected, path) {
  assert.equal(typeof actual, typeof expected);
  if (actual && typeof actual === 'object') {
    assert.deepEqual(Object.keys(actual), Object.keys(expected));
    for (const key of Object.keys(actual)) verifySerialized(actual[key], expected[key], path + '.' + key);
  } else if (!Object.is(actual, expected)) {
    assert.ok(actual === 0 && expected === 0 && path.includes('State.records.'), 'Unexpected replay difference at ' + path);
    signedZeroPaths.push(path);
  }
}
verifySerialized(candidate, r.candidate, 'candidate'); verifySerialized(incumbent, r.incumbent, 'incumbent');
assert.deepEqual(JSON.parse(JSON.stringify(candidate)), r.candidate); assert.deepEqual(JSON.parse(JSON.stringify(incumbent)), r.incumbent);

// Independent recursive enumeration and arithmetic, not the study comparator.
function signFlip(values) {
  let greater = 0, total = 0; const sum = values.reduce((a, b) => a + b, 0);
  function branch(i, value) { if (i === values.length) { total++; if (value >= sum - 1e-12) greater++; } else { branch(i + 1, value + values[i]); branch(i + 1, value - values[i]); } }
  branch(0, 0);
  return {mean: sum / values.length, pOneSided: greater / total, n: values.length, assumption: 'symmetric independent seed-level paired effects'};
}
const paired = candidate.rows.map((row, i) => {
  const old = incumbent.rows[i]; assert.equal(row.seed, old.seed);
  return {seed: row.seed, aImprovement: old.aAfter - row.aAfter, bImprovement: old.bAfter - row.bAfter, aLearning: row.aReset - row.aAfter, bLearning: row.bReset - row.bAfter, migrationRetention: row.aBefore - row.aMigrated, totalRetention: row.aBefore - row.aAfter};
});
// Aggregating per-agent differences and subtracting aggregate means can differ
// by one rounding bit; compare all fields at a declared arithmetic tolerance.
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12);
assert.equal(r.comparison.paired.length, paired.length);
for (const [i, row] of paired.entries()) for (const [key, value] of Object.entries(row)) { if (key === 'seed') assert.equal(r.comparison.paired[i][key], value); else near(r.comparison.paired[i][key], value); }
const metrics = Object.fromEntries(Object.keys(paired[0]).filter(key => key !== 'seed').map(key => [key, signFlip(paired.map(row => row[key]))]));
for (const [key, metric] of Object.entries(metrics)) { near(metric.mean, r.comparison.metrics[key].mean); assert.equal(metric.pOneSided, r.comparison.metrics[key].pOneSided); assert.equal(metric.n, r.comparison.metrics[key].n); }
const passed = ['aImprovement', 'bImprovement', 'aLearning', 'bLearning'].every(key => metrics[key].mean > 0 && metrics[key].pOneSided <= p.alpha) && metrics.migrationRetention.mean >= 0 && metrics.totalRetention.mean >= 0;
assert.equal(r.comparison.alpha, p.alpha); assert.equal(r.comparison.passed, passed);
const changed = JSON.stringify(selection.selectedProgram) !== JSON.stringify(p.programs[0]); assert.equal(r.changed, changed); assert.equal(r.accepted, changed && passed);
const preferences = api.createKernelLearner(4), facts = [];
for (const [index, entry] of selection.candidates.entries()) {
  const input = tasks.UPGRADE_PROGRAMS.map((_, i) => +(i === index)), target = Math.max(-1, Math.min(1, objectives[index]));
  api.updateKernel(preferences, input, target); facts.push({input, target});
}
assert.deepEqual(facts, r.preferenceFacts); assert.deepEqual(preferences, r.originalPreference); assert.deepEqual(preferences, r.fixedPreference);
const selfApplied = r.accepted ? api.migrateKernel(preferences, selection.selectedProgram) : structuredClone(preferences);
assert.deepEqual(selfApplied, r.selfAppliedPreference); assert.deepEqual(selfApplied.records, preferences.records);
assert.deepEqual(api.restoreKernelLearner(JSON.parse(JSON.stringify(selfApplied))), selfApplied);
let stateChecks = 0;
for (const evaluation of [candidate, incumbent]) for (const row of evaluation.rows) for (const agent of row.perAgent) for (const key of ['oldState', 'finalState']) if (agent[key]) { assert.deepEqual(api.restoreKernelLearner(agent[key]), agent[key]); stateChecks++; }
assert.equal(r.recursiveProductivityDemonstrated, false); assert.equal(r.embodiedQualification, false); assert.equal(r.broadRSIDemonstrated, false); assert.equal(r.livePolicyChanged, false);
const altered = structuredClone(r); altered.candidate.rows[0].aAfter += .01;
assert.throws(() => assert.deepEqual(candidate, altered.candidate));
const source = await readFile(new URL(import.meta.url)); await writeFile(join(directory, 'audit-source.mjs'), source);
const result = {at: new Date().toISOString(), auditorSha256: hash(source), allSourcesAndSeedRegistriesChecked: true, developmentProgramsReplayed: selection.candidates.length, freshWorldsPhysicallyReplayed: physicalReplays.length, completedFactualWindows: windows, allScoresAndGatesReplayed: true, physicalReplays, capturedStateChecks: stateChecks, preferenceFactsPreserved: true, signedZeroNormalization: {scope: 'Only -0/+0 in archived captured state records, as required by JSON serialization; all nonzero values and metrics must match.', count: signedZeroPaths.length, paths: signedZeroPaths}, alteredEvidenceRejected: true, accepted: r.accepted, recursiveProductivityDemonstrated: false, limitations: ['Only captured founder states receive independent matrix-consistency validation; all forecast scores are nevertheless replayed.', 'Fixed-preference control shares facts but exhaustive selection does not test search productivity.', 'Paired sign-flip tests assume symmetric independent seed-level effects.', 'Forecast retention is not action choice, embodied survival or full RSI.']};
await writeFile(join(directory, 'audit.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({...result, physicalReplays: result.physicalReplays.length}, null, 2));
