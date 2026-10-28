import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const directory = resolve(process.argv[2] || ''), hash = x => createHash('sha256').update(x).digest('hex');
const load = async file => JSON.parse(await readFile(join(directory, file)));
const p = await load('protocol.json'), r = await load('results.json');
assert.deepEqual(r.protocol, p);
for (const [file, sha] of Object.entries(p.sourceSha256)) assert.equal(hash(await readFile(join(directory, 'sources', file))), sha);
for (const [file, sha] of Object.entries(p.worldSourceSha256)) assert.equal(hash(await readFile(join(p.worldSources, file))), sha);
assert.equal(hash(await readFile(join(p.developmentDirectory, 'results.json'))), p.developmentSha256);
assert.equal(hash(await readFile(join(directory, 'reference-protocol.json'))), p.referenceSha256);
const allSeeds = [...p.promotionSeeds.flat(), ...p.finalSeeds];
assert.equal(allSeeds.length, 40); assert.equal(new Set(allSeeds).size, allSeeds.length);
assert.ok(allSeeds.every(seed => !p.developmentSeeds.includes(seed)));
for (const registry of p.seedRegistries) {
  const bytes = await readFile(registry.path); assert.equal(hash(bytes), registry.sha256);
  function walk(value, key = '') {
    if (typeof value === 'number' && /^seed$/i.test(key)) assert.ok(!allSeeds.includes(value));
    if (Array.isArray(value) && /seeds$/i.test(key)) for (const seed of value) if (Number.isInteger(seed)) assert.ok(!allSeeds.includes(seed));
    if (value && typeof value === 'object') for (const [name, child] of Object.entries(value)) walk(child, name);
  }
  walk(JSON.parse(bytes));
}
assert.equal(p.rounds, 3); assert.equal(p.proposalsPerRound, 24); assert.equal(p.splitTick, 900); assert.equal(p.horizonTicks, 1800);
assert.equal(p.promotionAlpha, .05 / 12); assert.equal(p.finalAlpha, .05 / 6);
const api = await import(pathToFileURL(join(directory, 'sources/learning/self-modifying.mjs')));
const tasks = await import(pathToFileURL(join(directory, 'sources/learning/self-modifying-tasks.mjs')));
const runner = await import(pathToFileURL(join(directory, 'sources/scripts/self-modification-study.mjs')));
const historical = JSON.parse(await readFile(join(p.developmentDirectory, 'results.json')));
const development = await load('development.json');
assert.deepEqual(development, historical.rows.filter(row => p.developmentSeeds.includes(row.seed)).map(row => ({seed: row.seed, environment: row.environment === 'stable' ? 'fixed' : row.environment, windows: row.windows.map(({value, ...window}) => window), finalSha256: row.worldSha256})));
const banks = {};
let factualWindows = 0;
for (const [name, seeds] of [...p.promotionSeeds.map((s, i) => ['promotion-' + i, s]), ['final', p.finalSeeds]]) {
  const bytes = await readFile(join(directory, 'banks', name + '.json')); assert.equal(hash(bytes), r.bankHashes[name]);
  const worlds = JSON.parse(bytes); banks[name] = worlds;
  assert.equal(worlds.length, seeds.length * 2);
  assert.equal(new Set(worlds.map(w => w.seed + ':' + w.environment)).size, worlds.length);
  for (const world of worlds) {
    assert.ok(seeds.includes(world.seed) && p.environments.includes(world.environment));
    assert.equal(world.config.seed, world.seed); assert.equal(world.config.reproduction, false); assert.equal(world.config.mutation, false);
    assert.equal(world.metrics.tick, p.horizonTicks);
    const last = new Map();
    for (const window of world.windows) {
      assert.ok(p.observedAgents.includes(window.agentId));
      assert.equal(window.tick % 8, 1); assert.ok(window.tick + 7 <= p.horizonTicks);
      assert.ok(window.tick > (last.get(window.agentId) || 0)); last.set(window.agentId, window.tick);
      const example = tasks.outcomeExample(window);
      assert.equal(example.input.length, 20); assert.ok(Math.abs(example.target) <= 1);
      // Independently reconstruct the factual reward target and features.
      const weights = window.rewards.map((_, i) => .99 ** i);
      const expected = window.rewards.reduce((sum, value, i) => sum + value * weights[i], 0) / weights.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(example.target - expected) < 1e-12);
      factualWindows++;
    }
  }
}

function independentPaired(values) {
  const total = values.reduce((a, b) => a + b, 0); let extreme = 0, count = 0;
  function branch(i, sum) { if (i === values.length) { count++; if (sum >= total - 1e-12) extreme++; } else { branch(i + 1, sum + values[i]); branch(i + 1, sum - values[i]); } }
  branch(0, 0);
  return {mean: total / values.length, pOneSided: extreme / count, n: values.length, assumption: 'symmetric independent seed-level paired effects'};
}
function verifyComparison(candidate, incumbent, comparison, alpha) {
  assert.equal(comparison.alpha, alpha);
  const fields = {a: ['aAfter', 'aAfter'], b: ['bAfter', 'bAfter'], retention: ['retentionChange', 'retentionChange']};
  const paired = candidate.rows.map((row, i) => {
    const old = incumbent.rows[i]; assert.equal(row.seed, old.seed);
    return {seed: row.seed, ...Object.fromEntries(Object.entries(fields).map(([key, [a, b]]) => [key, old[b] - row[a]])), aLearning: row.aReset - row.aAfter, bLearning: row.bReset - row.bAfter};
  });
  assert.deepEqual(comparison.paired, paired);
  for (const key of ['a', 'b', 'retention', 'aLearning', 'bLearning']) assert.deepEqual(comparison.metrics[key], independentPaired(paired.map(row => row[key])));
  assert.equal(comparison.passed, ['a', 'b', 'aLearning', 'bLearning'].every(key => comparison.metrics[key].mean > 0 && comparison.metrics[key].pOneSided <= alpha) && comparison.metrics.retention.mean >= 0);
}

const modifiers = {selfApplying: api.createModifier(p.modifierSeed), fixedProposer: api.createModifier(p.modifierSeed, {selfApply: false})};
let proposalCount = 0;
for (const [round, recorded] of r.rounds.entries()) {
  assert.equal(recorded.round, round);
  for (const [arm, modifier] of Object.entries(modifiers)) {
    const old = recorded.arms[arm], search = runner.searchRound(modifier, development, p.proposalsPerRound);
    assert.deepEqual(search, old.search); proposalCount += search.proposals.length;
    const worlds = banks['promotion-' + round], candidate = runner.compact(tasks.scoreProgram(search.selectedProgram, worlds)), incumbent = runner.compact(tasks.scoreProgram(modifier.program, worlds));
    assert.deepEqual(candidate, old.candidate); assert.deepEqual(incumbent, old.incumbent);
    verifyComparison(candidate, incumbent, old.comparison, p.promotionAlpha);
    const changed = JSON.stringify(search.selectedProgram) !== JSON.stringify(modifier.program), accepted = changed && old.comparison.passed;
    assert.equal(old.changed, changed); assert.equal(old.accepted, accepted);
    if (accepted) api.promoteProgram(modifier, search.selectedProgram, 'promotion-' + round);
    assert.deepEqual(modifier, old.modifier); assert.deepEqual(api.restoreModifier(modifier), modifier);
    const work = search.proposals.reduce((sum, proposal) => sum + api.validateProgram(proposal.program) * development.reduce((count, world) => count + world.windows.filter(w => w.tick + 7 < p.splitTick).length, 0) * 20, 0);
    assert.equal(old.programUpdateWork, work);
    console.log(JSON.stringify({directory, checkedRound: round, arm, accepted}));
  }
}
assert.equal(r.rounds.length, p.rounds); assert.deepEqual(r.modifiers, modifiers);
for (const [arm, modifier] of Object.entries(modifiers)) assert.deepEqual(r.final[arm], runner.compact(tasks.scoreProgram(modifier.program, banks.final)));
assert.deepEqual(r.final.initial, runner.compact(tasks.scoreProgram(api.INITIAL_PROGRAM, banks.final)));
verifyComparison(r.final.selfApplying, r.final.initial, r.finalComparisons.versusInitial, p.finalAlpha);
verifyComparison(r.final.selfApplying, r.final.fixedProposer, r.finalComparisons.versusFixedProposer, p.finalAlpha);
assert.equal(r.recursiveChainObserved, modifiers.selfApplying.promotions.length >= 2);
assert.equal(r.boundedMechanismPassed, r.recursiveChainObserved && Object.values(r.finalComparisons).every(c => c.passed));
assert.equal(r.broadRSIDemonstrated, false); assert.equal(r.livePolicyChanged, false);

const {World} = await import(pathToFileURL(join(p.worldSources, 'engine.mjs'))), reference = await load('reference-protocol.json'), physicalReplays = [];
for (const [name, worlds] of Object.entries(banks)) for (const world of worlds.filter(w => w.seed === worlds[0].seed)) {
  assert.deepEqual(runner.collectWorld(World, world.seed, world.environment, reference), world);
  physicalReplays.push({bank: name, seed: world.seed, environment: world.environment, finalSha256: world.finalSha256, exactWindowsAndWorld: true});
}
// Exercise evidence rejection without changing the recorded result.
const altered = structuredClone(r.finalComparisons.versusInitial); altered.metrics.a.mean += .01;
assert.throws(() => verifyComparison(r.final.selfApplying, r.final.initial, altered, p.finalAlpha));
const source = await readFile(new URL(import.meta.url)); await writeFile(join(directory, 'audit-source.mjs'), source);
const audit = {at: new Date().toISOString(), auditorSha256: hash(source), sourceAndSeedRegistriesVerified: true, freshWorlds: Object.values(banks).reduce((sum, worlds) => sum + worlds.length, 0), factualWindows, proposalsReplayed: proposalCount, allProgramScoresAndGatesReplayed: true, physicalReplays, alteredComparisonRejected: true, boundedMechanismPassed: r.boundedMechanismPassed, limitations: ['Physical cold replay covers the first seed of each bank in both environments, not every world.', 'Forecasting and retained forecast skill do not demonstrate embodied decision quality or survival.', 'Sign-flip tests assume symmetric independent seed-level paired effects.', 'Equal proposal counts and maximum expression bounds do not imply equal realized instruction work.', 'The grammar and evaluator are fixed; broad RSI is unestablished.']};
await writeFile(join(directory, 'audit.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify(audit, null, 2));
