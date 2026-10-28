import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest, MODES, REPRESENTATIONS, mean, collectInterventionWorld, fitDiagnosticModel, evaluateModel, predictDiagnostic, choiceValue} from '../learning/intervention-study.mjs';
import {pairedSignFlip} from '../learning/self-modifying-tasks.mjs';

const write = async (path, value) => { await writeFile(path, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'}); };
export async function verifySources(directory, protocol) {
  for (const [file, sha] of Object.entries(protocol.sourceSha256)) assert.equal(digest(await readFile(join(directory, 'sources', file))), sha, file);
}
async function initialize(directory) {
  await mkdir(directory, {recursive: false});
  const referenceFile = 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/reference-protocol.json';
  const referenceBytes = await readFile(referenceFile), reference = JSON.parse(referenceBytes);
  const sourceFiles = ['engine.mjs', 'challenges.mjs', 'scripts/intervention-study.mjs', 'scripts/audit-intervention-study.mjs', 'scripts/audit-intervention-numerics.py',
    ...(await readdir('learning')).filter(f => f.endsWith('.mjs')).map(f => `learning/${f}`)];
  const sourceSha256 = {};
  for (const file of sourceFiles) { const bytes = await readFile(file), target = join(directory, 'sources', file); sourceSha256[file] = digest(bytes); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes); }
  const used = new Set(), seedRegistries = [];
  async function registry(path) {
    let bytes; try { bytes = await readFile(path); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
    const data = JSON.parse(bytes); seedRegistries.push({path, sha256: digest(bytes)});
    const visit = (value, key = '') => {
      if (Array.isArray(value)) { if (/seed/i.test(key)) for (const n of value) if (Number.isInteger(n)) used.add(n); for (const v of value) if (v && typeof v === 'object') visit(v); }
      else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { if (/seed/i.test(k) && Number.isInteger(v)) used.add(v); else if (typeof v === 'object') visit(v, k); }
    }; visit(data);
  }
  for (const root of await readdir('evidence', {withFileTypes: true})) if (root.isDirectory()) {
    await registry(join('evidence', root.name, 'protocol.json'));
    for (const entry of await readdir(join('evidence', root.name), {withFileTypes: true})) if (entry.isDirectory()) await registry(join('evidence', root.name, entry.name, 'protocol.json'));
  }
  const seeds = []; while (seeds.length < 24) { const seed = randomBytes(4).readUInt32BE(); if (seed && seed !== 41 && !used.has(seed) && !seeds.includes(seed)) seeds.push(seed); }
  const alphaPerTest = .05 / 12;
  const critical = JSON.parse(execFileSync('python3', ['-c', 'import json; from scipy.stats import t; print(json.dumps({"simultaneous":float(t.ppf(1-.05/12,15)),"descriptive":float(t.ppf(.975,15))}))'], {encoding: 'utf8'}));
  const protocol = {schema: 1, experiment: 'assignment-history-horizon-intervention', at: new Date().toISOString(),
    referenceFile, referenceSha256: digest(referenceBytes), reference: {founders: reference.founders, parameters: reference.parameters, actorParameters: reference.actorParameters, environments: reference.environments},
    sourceSha256, seedRegistries, previouslyRegisteredSeeds: used.size, developmentSeeds: seeds.slice(0, 8), trainingSeeds: seeds.slice(0, 4), selectionSeeds: seeds.slice(4, 8), heldoutSeeds: seeds.slice(8),
    assignmentSeed: randomBytes(16).toString('hex'), excludedEngineeringSeeds: [41], agents: [1, 2], checkpointTicks: Array.from({length: 16}, (_, i) => 256 + 80 * i), horizons: [8, 256], primaryHorizon: 256,
    capacity: 128, modes: MODES, representations: REPRESENTATIONS, critical, alphaPerTest, uniformNoninferiorityMarginEnergy: .1,
    endpoint: 'Mean final target-agent energy change after one forced speed interval and incumbent continuation; death = zero terminal energy; scheduled checkpoints after death contribute zero for every policy. Tie forecasts use an equal action mixture.',
    selection: 'Fit frozen pooled diagnostic models on four training seed pairs. Rank observational/IPW/direct-IPW/DR/explicit-exploration candidates at horizon 256 by worst mean gain over incumbent greedy and both constant first actions across the two environments on four distinct selection seed pairs. Lexical tie break. Uniform/paired/matched-uniform references cannot be selected. Lock chosen identity and all model hashes before held-out collection. No held-out updates.',
    controls: 'Same checkpoint distribution and estimator class. Uniform uses independent SHA-256 fair-action assignment; paired exposes two labels at alternating training checkpoints. Both ordinary and paired full fits consume at most 128 labels. Explicit exploration excludes ties; matched-uniform uses the exact same checkpoint subset. History includes only the preceding three own decision observations/actions. History scaling is part of the representation package.',
    inference: 'Independent seed pairs; 16 held-out units per environment. Twelve prespecified one-sided comparisons share Bonferroni family alpha .05: six action-value comparisons, four bias-mechanism contrasts and two uniform noninferiority contrasts. Require positive Student-t lower bounds AND paired sign-flip p <= alpha per test. Student-t assumes approximately normal independent seed means; sign-flip assumes symmetric paired effects. Intervals are conditional on the one fitted development bank and assignment realization, not replicated training-procedure uncertainty.',
    gates: 'Action diagnostic passes only if selected candidate beats incumbent greedy, constant first slow and constant first fast in BOTH environments. Advance weighting research only for IPW/DR candidate plus all six follow-up screen comparisons: uniform > observational, candidate > observational, and candidate no worse than uniform by .1 energy, in both environments. A passing screen motivates further investigation; it does not identify systematic propensity bias. Contrast/DR comparisons also change target/model structure and use one fitted-bank realization. Otherwise no weighting advancement. No ecological promotion, embodied-learning qualification, or RSI claim follows even if gates pass.',
    boundary: 'Human-designed pooled fork diagnostic. Constant controls force only the first eight-tick speed interval, not whole-life constant policies. Future learning follows incumbent; counterfactual labels never train a live body. No adaptive sample extension or reuse of acceptance labels.'};
  await write(join(directory, 'protocol.json'), protocol);
  console.log(JSON.stringify({directory, phase: 'initialized', developmentPairs: protocol.developmentSeeds.length, heldoutPairs: protocol.heldoutSeeds.length, plannedForkSteps: seeds.length * Object.keys(reference.environments).length * protocol.agents.length * protocol.checkpointTicks.length * 2 * 256}));
}
async function collect(directory, phase, protocol) {
  const seeds = phase === 'development' ? protocol.developmentSeeds : protocol.heldoutSeeds;
  if (phase === 'heldout') { const lock = JSON.parse(await readFile(join(directory, 'locked-selection.json'))); assert.equal(lock.protocolSha256, digest(await readFile(join(directory, 'protocol.json')))); assert.equal(lock.modelsSha256, digest(await readFile(join(directory, 'models.json')))); }
  const {World} = await import(pathToFileURL(join(directory, 'sources/engine.mjs')));
  const folder = join(directory, phase); await mkdir(folder, {recursive: true});
  for (const seed of seeds) for (const environment of Object.keys(protocol.reference.environments)) {
    const path = join(folder, `${seed}-${environment}.json`);
    try { validateRowIdentity(JSON.parse(await readFile(path)), seed, environment, protocol); console.log(JSON.stringify({seed, environment, phase, preserved: true})); continue; } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const start = performance.now(), row = collectInterventionWorld(World, protocol, seed, environment);
    await write(path, row);
    console.log(JSON.stringify({seed, environment, phase, cases: row.cases.length, forkWorldSteps: row.forkWorldSteps, seconds: (performance.now() - start) / 1000}));
  }
}
export async function readRows(directory, phase, protocol) {
  const seeds = phase === 'development' ? protocol.developmentSeeds : protocol.heldoutSeeds, rows = [];
  assert.equal(new Set(seeds).size, seeds.length, 'Duplicate registered statistical units');
  for (const seed of seeds) for (const environment of Object.keys(protocol.reference.environments)) {
    const row = JSON.parse(await readFile(join(directory, phase, `${seed}-${environment}.json`)));
    validateRowIdentity(row, seed, environment, protocol);
    rows.push(row);
  }
  return rows;
}
export function validateRowIdentity(row, seed, environment, protocol) {
  assert.equal(row.seed, seed, 'Row seed differs from registered filename');
  assert.equal(row.environment, environment, 'Row environment differs from registered filename');
  const schedule = protocol.checkpointTicks.flatMap(tick => protocol.agents.map(agentId => ({seed, environment, tick, agentId})));
  assert.equal(row.cases.length, schedule.length, 'Incomplete scheduled denominator');
  for (const [i, c] of row.cases.entries()) for (const [key, expected] of Object.entries(schedule[i])) assert.equal(c[key], expected, `Case ${key} differs from registered schedule`);
}
export function fitModels(rows, protocol) {
  const models = {};
  for (const environment of Object.keys(protocol.reference.environments)) {
    const cases = rows.filter(r => r.environment === environment && protocol.trainingSeeds.includes(r.seed)).flatMap(r => r.cases);
    for (const horizon of protocol.horizons) for (const representation of protocol.representations) for (const mode of protocol.modes) {
      const key = `${environment}:${horizon}:${representation}:${mode}`;
      models[key] = fitDiagnosticModel(cases, mode, representation, horizon, protocol.capacity);
    }
  }
  return models;
}
export function selectModel(rows, models, protocol) {
  const candidates = [];
  for (const representation of protocol.representations) for (const mode of ['observational', 'ipw', 'ipw-contrast', 'dr-contrast', 'explicit-exploration']) {
    const gains = [];
    for (const environment of Object.keys(protocol.reference.environments)) {
      const scores = evaluateModel(models[`${environment}:${protocol.primaryHorizon}:${representation}:${mode}`], rows.filter(r => r.environment === environment && protocol.selectionSeeds.includes(r.seed)), protocol.primaryHorizon);
      for (const control of ['incumbent', 'slow', 'fast']) gains.push(mean(scores.map(r => r.value - r[control])));
    }
    candidates.push({representation, mode, worstGain: Math.min(...gains), allGains: gains});
  }
  candidates.sort((a, b) => b.worstGain - a.worstGain || `${a.representation}:${a.mode}`.localeCompare(`${b.representation}:${b.mode}`));
  return {selected: {representation: candidates[0].representation, mode: candidates[0].mode}, candidates};
}
async function lock(directory, protocol) {
  const rows = await readRows(directory, 'development', protocol), models = fitModels(rows, protocol), selection = selectModel(rows, models, protocol);
  await write(join(directory, 'models.json'), models);
  const locked = {...selection, at: new Date().toISOString(), protocolSha256: digest(await readFile(join(directory, 'protocol.json'))), modelsSha256: digest(await readFile(join(directory, 'models.json'))), modelHashes: Object.fromEntries(Object.entries(models).map(([key, model]) => [key, digest(model)])),
    modelCosts: Object.fromEntries(Object.entries(models).map(([key, model]) => [key, {serializedBytes: Buffer.byteLength(JSON.stringify(model)), labels: model.labels, storedRecords: model.estimator.records.length + (model.nuisance?.records.length ?? 0), trainingWork: {estimator: model.estimator.work, nuisance: model.nuisance?.work ?? null}}])),
    developmentRowHashes: rows.map(row => ({seed: row.seed, environment: row.environment, sha256: digest(row)}))};
  await write(join(directory, 'locked-selection.json'), locked); console.log(JSON.stringify({directory, phase: 'locked', ...selection}));
}
export function bound(values, critical, alpha, margin = 0) {
  const average = mean(values), n = values.length;
  assert.equal(n, 16);
  const se = Math.sqrt(values.reduce((s, v) => s + (v - average) ** 2, 0) / (n - 1) / n), lower = average - critical * se;
  const signFlip = pairedSignFlip(values.map(v => v + margin));
  return {mean: average, se, n, lower, margin, pOneSided: signFlip.pOneSided, passed: lower > -margin && signFlip.pOneSided <= alpha};
}
export function scoreHeldout(rows, models, selected, protocol) {
  const tests = {}, diagnostic = {}, outcomes = {};
  for (const environment of Object.keys(protocol.reference.environments)) {
    const selectedRows = rows.filter(r => r.environment === environment), horizon = protocol.primaryHorizon;
    const model = models[`${environment}:${horizon}:${selected.representation}:${selected.mode}`], scores = evaluateModel(model, selectedRows, horizon);
    const uniform = evaluateModel(models[`${environment}:${horizon}:${selected.representation}:uniform`], selectedRows, horizon);
    const observational = evaluateModel(models[`${environment}:${horizon}:${selected.representation}:observational`], selectedRows, horizon);
    for (const control of ['incumbent', 'slow', 'fast']) tests[`${environment}:action:${control}`] = bound(scores.map(r => r.value - r[control]), protocol.critical.simultaneous, protocol.alphaPerTest);
    tests[`${environment}:mechanism:uniform-over-observational`] = bound(uniform.map((r, i) => r.value - observational[i].value), protocol.critical.simultaneous, protocol.alphaPerTest);
    tests[`${environment}:mechanism:selected-over-observational`] = bound(scores.map((r, i) => r.value - observational[i].value), protocol.critical.simultaneous, protocol.alphaPerTest);
    tests[`${environment}:mechanism:selected-vs-uniform`] = bound(scores.map((r, i) => r.value - uniform[i].value), protocol.critical.simultaneous, protocol.alphaPerTest, protocol.uniformNoninferiorityMarginEnergy);
    outcomes[environment] = scores;
    for (const h of protocol.horizons) for (const representation of protocol.representations) for (const mode of protocol.modes) {
      const key = `${environment}:${h}:${representation}:${mode}`, evaluated = evaluateModel(models[key], selectedRows, h);
      diagnostic[key] = {meanValue: mean(evaluated.map(r => r.value)), regret: mean(evaluated.map(r => r.oracle - r.value)), labels: models[key].labels, checkpoints: models[key].checkpoints};
    }
  }
  const actionPassed = Object.entries(tests).filter(([k]) => k.includes(':action:')).every(([, v]) => v.passed);
  const mechanismPassed = Object.entries(tests).filter(([k]) => k.includes(':mechanism:')).every(([, v]) => v.passed);
  const active = rows.flatMap(r => r.cases).filter(c => !c.alreadyDead);
  const horizonDisagreement = mean(active.map(c => +((Math.sign(c.arms.fast[8].energyChange - c.arms.slow[8].energyChange)) !== Math.sign(c.arms.fast[256].energyChange - c.arms.slow[256].energyChange))));
  return {selected, tests, outcomes, diagnostic, actionPassed, mechanismPassed, advanceWeighting: actionPassed && mechanismPassed && ['ipw', 'ipw-contrast', 'dr-contrast'].includes(selected.mode),
    mechanismInterpretation: 'A passing screen motivates further investigation; it does not identify systematic propensity bias. Contrast/DR comparisons also vary target/model structure. Inference is conditional on a single fitted bank and assignment realization.',
    scheduledCases: rows.reduce((n, r) => n + r.cases.length, 0), alreadyDeadCases: rows.reduce((n, r) => n + r.cases.filter(c => c.alreadyDead).length, 0), shortLongSignDisagreement: horizonDisagreement,
    terminalBranchCounts: Object.fromEntries(protocol.horizons.map(h => [h, active.reduce((n, c) => n + +!c.arms.slow[h].alive + +!c.arms.fast[h].alive, 0)])),
    embodiedQualification: false, recursiveImprovement: false};
}
async function evaluate(directory, protocol) {
  const lock = JSON.parse(await readFile(join(directory, 'locked-selection.json'))), modelBytes = await readFile(join(directory, 'models.json'));
  assert.equal(digest(modelBytes), lock.modelsSha256);
  const rows = await readRows(directory, 'heldout', protocol), results = scoreHeldout(rows, JSON.parse(modelBytes), lock.selected, protocol);
  await write(join(directory, 'results.json'), {protocolSha256: digest(await readFile(join(directory, 'protocol.json'))), lockSha256: digest(await readFile(join(directory, 'locked-selection.json'))), completedAt: new Date().toISOString(), ...results});
  console.log(JSON.stringify({directory, ...results, diagnostic: undefined, outcomes: undefined}, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, arg] = process.argv.slice(2); assert.ok(['init', 'development', 'lock', 'heldout', 'evaluate'].includes(command)); assert.ok(arg);
  const directory = resolve(arg);
  if (command === 'init') await initialize(directory);
  else {
    assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/intervention-study.mjs')).href, 'Run the captured source runner inside DIRECTORY/sources/scripts after initialization');
    const protocol = JSON.parse(await readFile(join(directory, 'protocol.json'))); await verifySources(directory, protocol);
    if (['development', 'heldout'].includes(command)) await collect(directory, command, protocol);
    if (command === 'lock') await lock(directory, protocol);
    if (command === 'evaluate') await evaluate(directory, protocol);
  }
}
