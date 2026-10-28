import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';
import {INITIAL_PROGRAM, createModifier, proposeProgram, creditProposal, promoteProgram, restoreModifier, validateProgram} from '../learning/self-modifying.mjs';
import {scoreProgram, comparePrograms} from '../learning/self-modifying-tasks.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const compact = evaluation => ({objective: evaluation.objective, rows: evaluation.rows.map(({perAgent, ...row}) => row)});

export function searchRound(modifier, worlds, budget) {
  const before = restoreModifier(modifier), initial = compact(scoreProgram(modifier.program, worlds));
  let best = {program: structuredClone(modifier.program), score: initial};
  const proposals = [];
  for (let i = 0; i < budget; i++) {
    const parent = structuredClone(best.program), parentScore = best.score;
    const proposal = proposeProgram(modifier, parent), score = compact(scoreProgram(proposal.program, worlds));
    const improvement = parentScore.objective - score.objective;
    creditProposal(modifier, proposal, improvement);
    const selected = score.objective < best.score.objective;
    proposals.push({...proposal, score, developmentImprovement: improvement, selected, expressionNodes: validateProgram(proposal.program)});
    if (selected) best = {program: structuredClone(proposal.program), score};
  }
  return {before, initial, proposals, selectedProgram: best.program, selectedScore: best.score, afterSearch: restoreModifier(modifier)};
}

export function collectWorld(World, seed, environment, reference) {
  const settings = reference.environments[environment === 'fixed' ? 'stable' : 'relocation'];
  const config = {seed, founders: reference.founders, capacity: 240, reproduction: false, mutation: false, ...settings, controller: 'episodic-actor', learning: true, actorParameters: {...reference.actorParameters}, episodicParameters: {...reference.parameters, memoryLearning: true, neuralLearning: true}};
  const world = new World(config), pending = new Map(), windows = [];
  let partial = 0;
  for (let tick = 0; tick < reference.horizonTicks; tick++) {
    const before = world.flies.filter(f => f.id <= 2);
    if (!world.step()) break;
    for (const fly of before) {
      const decision = fly.brain.episodic.lastDecision;
      if (decision?.step === world.tick) {
        assert.ok(!pending.has(fly.id));
        pending.set(fly.id, {agentId: fly.id, tick: world.tick, choice: decision.choice, observation: [...fly.lastInputs], rewards: []});
      }
      const window = pending.get(fly.id);
      if (window) {
        window.rewards.push(fly.reward);
        if (window.rewards.length === 8) { windows.push(window); pending.delete(fly.id); }
      }
      if (!world.flies.includes(fly) && pending.has(fly.id)) { partial++; pending.delete(fly.id); }
    }
  }
  partial += pending.size;
  return {seed, environment, config: world.config, windows, partial, finalSha256: hash(JSON.stringify(world.checkpoint())), metrics: world.metrics()};
}

async function run() {
  const directory = resolve(process.argv[2] || `evidence/self-modification/${randomUUID()}`);
  const developmentDirectory = resolve('evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf');
  const bytes = await readFile(join(developmentDirectory, 'results.json')), historical = JSON.parse(bytes);
  const referenceBytes = await readFile(join(developmentDirectory, 'reference-protocol.json')), reference = JSON.parse(referenceBytes);
  assert.equal(reference.parameters.decisionTicks, 8); assert.equal(reference.horizonTicks, 1800);
  const worldSources = historical.protocol.worldSources;
  for (const [file, sha] of Object.entries(historical.protocol.worldSourceSha256)) assert.equal(hash(await readFile(join(worldSources, file))), sha);
  const {World} = await import(pathToFileURL(join(worldSources, 'engine.mjs')));
  await mkdir(dirname(directory), {recursive: true}); await mkdir(directory); await mkdir(join(directory, 'banks'));
  const sourceSha256 = {};
  for (const file of ['learning/self-modifying.mjs', 'learning/self-modifying-tasks.mjs', 'scripts/self-modification-study.mjs']) {
    const source = await readFile(file), path = join(directory, 'sources', file);
    sourceSha256[file] = hash(source); await mkdir(dirname(path), {recursive: true}); await writeFile(path, source);
  }
  const used = new Set(), seedRegistries = [];
  const inspect = async path => {
    let source;
    try { source = await readFile(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    const data = JSON.parse(source); seedRegistries.push({path, sha256: hash(source)});
    function walk(value, key = '') {
      if (typeof value === 'number' && /^seed$/i.test(key)) used.add(value);
      if (Array.isArray(value) && /seeds$/i.test(key)) for (const seed of value) if (Number.isInteger(seed)) used.add(seed);
      if (value && typeof value === 'object') for (const [name, child] of Object.entries(value)) walk(child, name);
    }
    walk(data);
  };
  for (const root of await readdir('evidence', {withFileTypes: true})) if (root.isDirectory()) {
    const path = join('evidence', root.name); await inspect(join(path, 'protocol.json'));
    for (const entry of await readdir(path, {withFileTypes: true})) if (entry.isDirectory()) await inspect(join(path, entry.name, 'protocol.json'));
  }
  const seeds = [], offset = parseInt(randomUUID().slice(0, 8), 16) >>> 0;
  for (let i = 0; seeds.length < 40; i++) { const seed = ((offset + i * 7919) >>> 0) || 1; if (!used.has(seed) && !seeds.includes(seed)) seeds.push(seed); }
  const developmentSeeds = historical.protocol.seeds.slice(0, 6);
  const protocol = {
    at: new Date().toISOString(), experiment: 'bounded-self-applicable-update-programs', sourceSha256,
    developmentDirectory, developmentSha256: hash(bytes), developmentSeeds,
    referenceSha256: hash(referenceBytes), worldSources, worldSourceSha256: historical.protocol.worldSourceSha256,
    seedRegistries, promotionSeeds: [seeds.slice(0, 8), seeds.slice(8, 16), seeds.slice(16, 24)], finalSeeds: seeds.slice(24),
    rounds: 3, proposalsPerRound: 24, modifierSeed: (parseInt(randomUUID().slice(0, 8), 16) >>> 0) || 1,
    initialProgram: INITIAL_PROGRAM, maxExpressionNodes: 63, maxExpressionDepth: 9,
    splitTick: 900, horizonTicks: 1800, observedAgents: [1, 2], environments: ['fixed', 'relocation'],
    developmentObjective: 'mean of post-B fixed/relocation MSE plus positive A-retention loss; factual normalized discounted eight-tick reward targets',
    promotionAlpha: .05 / 12,
    promotionRule: 'For each arm/round: structural program change, positive improvement of post-B MSE in both environments with paired sign-flip p<=.05/12; useful acquired learning versus zero/reset weights in both at same alpha; no mean retention-loss regression. No retries or seed extension. Fixed and self-applying arms have identical proposals-per-round and maximum instruction bounds, not identical realized instruction costs.',
    finalAlpha: .05 / 6,
    finalRule: 'One untouched final bank. Compare self-applying program with initial rule and equal-proposal-budget fixed proposer. Both require the same two-environment/retention/reset guards at .05/6. At least two accepted self-applied revisions are additionally necessary for a recursive-chain signal. Report each component and actual program-work counts separately.',
    interpretation: 'The lab agent rewrites an executable update expression, not arbitrary source. Its accepted expression also trains its structural-edit preferences. Grammar, search orchestration, sensors, evaluator and tasks remain human designed. Forecast tasks use real fly observations/rewards from unmodified factual worlds; no action-fork labels, online policy control, ecological survival, general intelligence or broad RSI inference. Same-founder learned weights are carried from fixed-food training into moving-food training; earlier-skill test labels never update weights. Fresh banks accept/reject only, and never train the modifier preferences. This is a fixed prospective mechanism screen, not a completion certificate for the RSI goal.'
  };
  await writeFile(join(directory, 'protocol.json'), JSON.stringify(protocol, null, 2) + '\n');
  await writeFile(join(directory, 'reference-protocol.json'), referenceBytes);
  await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'running'}) + '\n');
  console.log(JSON.stringify({directory, phase: 'locked', freshWorlds: seeds.length * 2}));
  const development = historical.rows.filter(row => developmentSeeds.includes(row.seed)).map(row => ({seed: row.seed, environment: row.environment === 'stable' ? 'fixed' : row.environment, windows: row.windows.map(({value, ...window}) => window), finalSha256: row.worldSha256}));
  await writeFile(join(directory, 'development.json'), JSON.stringify(development) + '\n');
  const banks = {}, bankHashes = {};
  for (const [name, bankSeeds] of [...protocol.promotionSeeds.map((s, i) => ['promotion-' + i, s]), ['final', protocol.finalSeeds]]) {
    const worlds = [];
    for (const seed of bankSeeds) for (const environment of protocol.environments) {
      worlds.push(collectWorld(World, seed, environment, reference));
      console.log(JSON.stringify({directory, phase: 'collect', bank: name, worlds: worlds.length, total: bankSeeds.length * 2}));
    }
    const data = JSON.stringify(worlds) + '\n'; await writeFile(join(directory, 'banks', name + '.json'), data); banks[name] = worlds; bankHashes[name] = hash(data);
  }
  const modifiers = {selfApplying: createModifier(protocol.modifierSeed), fixedProposer: createModifier(protocol.modifierSeed, {selfApply: false})}, rounds = [];
  for (let round = 0; round < protocol.rounds; round++) {
    const arms = {};
    for (const [arm, modifier] of Object.entries(modifiers)) {
      const search = searchRound(modifier, development, protocol.proposalsPerRound);
      const candidate = compact(scoreProgram(search.selectedProgram, banks['promotion-' + round]));
      const incumbent = compact(scoreProgram(modifier.program, banks['promotion-' + round]));
      const comparison = comparePrograms(candidate, incumbent, protocol.promotionAlpha);
      const changed = JSON.stringify(search.selectedProgram) !== JSON.stringify(modifier.program), accepted = changed && comparison.passed;
      if (accepted) promoteProgram(modifier, search.selectedProgram, 'promotion-' + round);
      assert.deepEqual(restoreModifier(JSON.parse(JSON.stringify(modifier))), modifier);
      const programUpdateWork = search.proposals.reduce((sum, proposal) => sum + proposal.expressionNodes * development.reduce((count, world) => count + world.windows.filter(w => w.tick + 7 < protocol.splitTick).length, 0) * 20, 0);
      arms[arm] = {search, candidate, incumbent, comparison, changed, accepted, programUpdateWork, modifier: structuredClone(modifier)};
      console.log(JSON.stringify({directory, phase: 'round', round, arm, accepted, changed, promotions: modifier.promotions.length, objective: search.selectedScore.objective}));
    }
    rounds.push({round, arms});
    await writeFile(join(directory, 'progress.json'), JSON.stringify({protocol, bankHashes, rounds}) + '\n');
  }
  const final = Object.fromEntries([...Object.entries(modifiers).map(([arm, modifier]) => [arm, compact(scoreProgram(modifier.program, banks.final))]), ['initial', compact(scoreProgram(INITIAL_PROGRAM, banks.final))]]);
  const finalComparisons = {versusInitial: comparePrograms(final.selfApplying, final.initial, protocol.finalAlpha), versusFixedProposer: comparePrograms(final.selfApplying, final.fixedProposer, protocol.finalAlpha)};
  const recursiveChainObserved = modifiers.selfApplying.promotions.length >= 2;
  const boundedMechanismPassed = recursiveChainObserved && Object.values(finalComparisons).every(c => c.passed);
  for (const [file, sha] of Object.entries(sourceSha256)) assert.equal(hash(await readFile(file)), sha);
  const result = {protocol, bankHashes, rounds, final, finalComparisons, modifiers, recursiveChainObserved, boundedMechanismPassed, broadRSIDemonstrated: false, livePolicyChanged: false, completedAt: new Date().toISOString()};
  await writeFile(join(directory, 'results.json'), JSON.stringify(result) + '\n');
  await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'complete'}) + '\n');
  console.log(JSON.stringify({directory, phase: 'complete', promotions: Object.fromEntries(Object.entries(modifiers).map(([k, m]) => [k, m.promotions.length])), finalComparisons, recursiveChainObserved, boundedMechanismPassed}, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await run();
