import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const directory = resolve(process.argv[2] || ''), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async file => JSON.parse(await readFile(join(directory, file)));
const p = await load('protocol.json'), r = await load('results.json');
assert.deepEqual(r.protocol, p); assert.equal(p.experiment, 'prospective-budgeted-recursive-search');
assert.equal(p.historyCount, 16); assert.equal(p.warmTasksPerHistory, 6); assert.equal(p.proposalsPerArm, 3); assert.equal(p.alpha, .05 / 10);
assert.deepEqual(p.arms, ['self', 'fixed', 'random', 'static', 'reset']);
assert.equal(p.histories.length, p.historyCount); assert.equal(r.rows.length, p.historyCount);
const seeds = p.histories.flatMap(history => [...history.warmSeeds, history.targetSeed]); assert.equal(new Set(seeds).size, seeds.length);
for (const [file, sha] of Object.entries(p.sourceSha256)) assert.equal(hash(await readFile(join(directory, 'sources', file))), sha);
for (const [file, sha] of Object.entries(p.worldSourceSha256)) assert.equal(hash(await readFile(join(p.worldSources, file))), sha);
assert.equal(hash(await readFile(join(p.upgradeDirectory, 'results.json'))), p.upgradeResultsSha256);
assert.equal(hash(await readFile(join(p.upgradeDirectory, 'audit.json'))), p.upgradeAuditSha256);
assert.equal(hash(await readFile(join(directory, 'reference-protocol.json'))), p.referenceSha256);
for (const registry of p.seedRegistries) {
  const bytes = await readFile(registry.path); assert.equal(hash(bytes), registry.sha256);
  function walk(value, key = '') {
    if (typeof value === 'number' && /seed$/i.test(key)) assert.ok(!seeds.includes(value));
    if (Array.isArray(value) && /seeds$/i.test(key)) for (const seed of value.flat(Infinity)) if (Number.isInteger(seed)) assert.ok(!seeds.includes(seed));
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
  }
  walk(JSON.parse(bytes));
}
const runner = await import(pathToFileURL(join(directory, 'sources/scripts/recursive-search-study.mjs')));
const search = await import(pathToFileURL(join(directory, 'sources/learning/revision-search.mjs')));
const collector = await import(pathToFileURL(join(directory, 'sources/scripts/self-modification-study.mjs')));
const {World} = await import(pathToFileURL(join(p.worldSources, 'engine.mjs'))), reference = await load('reference-protocol.json');
const physicalReplays = [];
let totalWorlds = 0, factualWindows = 0, logicalQueries = 0, checkpointReplays = 0, oracleExtraPrograms = 0;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, 'Numerical mismatch');
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
for (const [index, history] of p.histories.entries()) {
  const recorded = r.rows[index]; assert.equal(recorded.index, index); assert.deepEqual(recorded.warmSeeds, history.warmSeeds); assert.equal(recorded.targetSeed, history.targetSeed); assert.equal(recorded.modifierSeed, history.modifierSeed);
  const bytes = await readFile(join(directory, 'histories', String(index), 'worlds.json')); assert.equal(hash(bytes), recorded.worldsSha256);
  const worlds = JSON.parse(bytes); totalWorlds += worlds.length;
  assert.equal(worlds.length, (p.warmTasksPerHistory + 1) * 2); assert.equal(new Set(worlds.map(w => w.seed + ':' + w.environment)).size, worlds.length);
  for (const world of worlds) {
    assert.ok([...history.warmSeeds, history.targetSeed].includes(world.seed)); assert.ok(['fixed', 'relocation'].includes(world.environment));
    assert.equal(world.config.seed, world.seed); assert.equal(world.config.reproduction, false); assert.equal(world.config.mutation, false);
    factualWindows += world.windows.length;
    // Every fresh target pair plus the first warm pair is cold-replayed.
    if (world.seed === history.targetSeed || world.seed === history.warmSeeds[0]) {
      assert.deepEqual(collector.collectWorld(World, world.seed, world.environment, reference), world);
      physicalReplays.push({history: index, seed: world.seed, environment: world.environment, finalSha256: world.finalSha256});
    }
  }
  const target = worlds.filter(w => w.seed === history.targetSeed), fixed = target.find(w => w.environment === 'fixed');
  const prior = fixed.windows.filter(w => [1, 2].includes(w.agentId) && w.tick + 7 < p.splitTick);
  const discount = Array.from({length: 8}, (_, i) => .99 ** i), mass = discount.reduce((a, b) => a + b, 0);
  const rewards = prior.map(w => w.rewards.reduce((sum, value, i) => sum + value * discount[i], 0) / mass), m = mean(rewards);
  const context = [1, Math.max(-1, Math.min(1, m / .1)), Math.max(-1, Math.min(1, Math.sqrt(mean(rewards.map(x => (x - m) ** 2))) / .2)), ...[3, 4, 13, 10, 11].map(channel => mean(prior.map(w => w.observation[channel])))];
  context.forEach((value, i) => near(value, recorded.context[i]));
  const replay = await runner.runSearchHistory(worlds.filter(w => history.warmSeeds.includes(w.seed)), target, history.modifierSeed, {onLocked: async locked => assert.deepEqual(locked, await load('histories/' + index + '/locked-choices.json'))});
  const {index: oldIndex, worldsSha256: oldHash, ...old} = recorded; assert.deepEqual(replay, old);
  assert.equal(recorded.teaching.facts.length, p.warmTasksPerHistory * p.programs.length);
  for (const arm of p.arms) {
    const session = recorded.sessions[arm]; assert.equal(session.queries.length, p.proposalsPerArm); assert.equal(recorded.logicalQueriesPerArm[arm], p.proposalsPerArm);
    assert.equal(new Set(session.queries.map(q => search.programId(q.program))).size, p.proposalsPerArm);
    assert.ok(session.queries.every(q => search.programId(q.program) !== search.programId(p.incumbent)));
    for (const query of session.queries) {
      assert.deepEqual(Object.keys(query.validation).sort(), ['a', 'aBefore', 'b', 'program', 'resetA', 'resetB', 'rows'].sort());
      const baseline = session.baseline, v = query.validation;
      const expected = Math.max(-1, Math.min(1, Math.min((baseline.a - v.a) / Math.max(1e-8, baseline.a), (baseline.b - v.b) / Math.max(1e-8, baseline.b), (v.aBefore - v.a) / Math.max(1e-8, v.aBefore))));
      near(query.observed.target, expected);
    }
    assert.ok(recorded.checkpointReplays[arm].exact); checkpointReplays++; logicalQueries += session.queries.length;
  }
  assert.equal(recorded.uniqueValidationPrograms, p.programs.length); assert.equal(recorded.oracle.usedForTraining, false); assert.equal(recorded.oracle.usedBySearchPolicy, false);
  oracleExtraPrograms += recorded.oracleExtraValidationPrograms;
  console.log(JSON.stringify({directory, historiesReplayed: index + 1, total: p.historyCount, coldWorlds: physicalReplays.length}));
}
assert.deepEqual(r.summary, runner.summarizeSearch(r.rows, p.alpha));
function independentSignFlip(values) {
  const observed = values.reduce((a, b) => a + b, 0); let total = 0, greater = 0;
  function branch(i, sum) { if (i === values.length) { total++; if (sum >= observed - 1e-12) greater++; } else { branch(i + 1, sum + values[i]); branch(i + 1, sum - values[i]); } }
  branch(0, 0); return {mean: observed / values.length, pOneSided: greater / total, n: values.length, assumption: 'symmetric independent seed-level paired effects'};
}
const loss = x => (x.a + x.b) / 2;
for (const arm of p.arms.filter(arm => arm !== 'self')) assert.deepEqual(r.summary.searchEffects[arm], independentSignFlip(r.rows.map(row => loss(row.final[arm]) - loss(row.final.self))));
for (const key of ['a', 'b', 'resetA', 'resetB', 'retention', 'modifierRecall']) {
  const values = r.rows.map(row => key === 'a' || key === 'b' ? row.baselineFinal[key] - row.final.self[key] : key === 'resetA' ? row.final.self.resetA - row.final.self.a : key === 'resetB' ? row.final.self.resetB - row.final.self.b : key === 'retention' ? row.final.self.aBefore - row.final.self.a : row.originalRecall - row.recall.self);
  assert.deepEqual(r.summary.skillEffects[key], independentSignFlip(values));
}
const primary = [...Object.values(r.summary.searchEffects), ...['a', 'b', 'resetA', 'resetB'].map(key => r.summary.skillEffects[key])];
const passed = primary.every(m => m.mean > 0 && m.pOneSided <= p.alpha) && r.summary.skillEffects.retention.mean >= 0 && r.summary.skillEffects.modifierRecall.mean >= 0;
assert.equal(r.summary.passed, passed); assert.equal(r.recursiveSearchQualified, passed); assert.equal(r.embodiedQualification, false); assert.equal(r.broadRSIDemonstrated, false); assert.equal(r.livePolicyChanged, false);
const altered = structuredClone(r.summary.searchEffects.fixed); altered.mean += .01;
assert.throws(() => assert.deepEqual(altered, independentSignFlip(r.rows.map(row => loss(row.final.fixed) - loss(row.final.self)))));
const source = await readFile(new URL(import.meta.url)); await writeFile(join(directory, 'audit-source.mjs'), source);
const audit = {at: new Date().toISOString(), auditorSha256: hash(source), allSourceAndSeedRegistriesVerified: true, allHistoriesReplayed: r.rows.length, freshWorlds: totalWorlds, completedFactualWindows: factualWindows, coldWorldsReplayed: physicalReplays.length, physicalReplays, logicalPolicyQueriesVerified: logicalQueries, exactCheckpointReplays: checkpointReplays, oracleExtraValidationPrograms: oracleExtraPrograms, allChoicesScoresAndGatesReplayed: true, alteredEvidenceRejected: true, recursiveSearchQualified: passed, limitations: ['Cold physical replay covers every target pair and the first warm pair per history; remaining warm worlds are checked by fingerprints and deterministic learner replay, not cold physical replay.', 'The fixed kernel library, task profile, orchestration and validation rules are human designed.', 'Equal logical query counts do not imply equal arithmetic or wall-clock cost.', 'Prior-fact recall is a narrow modifier-retention probe, not broad skill retention.', 'Forecast search is not embodied action, survival or general RSI.']};
await writeFile(join(directory, 'audit.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({...audit, physicalReplays: audit.physicalReplays.length}, null, 2));
