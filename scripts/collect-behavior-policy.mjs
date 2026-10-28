import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';
import {verifyBinaryPolicyDraws} from '../learning/behavior-policy.mjs';
export const hash = value => createHash('sha256').update(value).digest('hex');

export function collectBehaviorWorld(World, old, reference) {
  const world = new World({seed: old.seed, founders: reference.founders, capacity: 240, reproduction: false, mutation: false, ...reference.environments[old.environment], controller: 'episodic-actor', learning: true, actorParameters: {...reference.actorParameters}, episodicParameters: {...reference.parameters, memoryLearning: true, neuralLearning: true}});
  const pending = new Map(), windows = [], decisionAudits = [];
  let partial = 0;
  for (let tick = 0; tick < reference.horizonTicks; tick++) {
    const before = world.flies.filter(f => f.id <= 2), rngBefore = new Map(before.map(f => [f.id, f.brain.episodic.memory.rngState]));
    if (!world.step()) break;
    for (const fly of before) {
      const decision = fly.brain.episodic.lastDecision;
      if (decision?.step === world.tick) {
        assert.ok(!pending.has(fly.id));
        const audit = verifyBinaryPolicyDraws(rngBefore.get(fly.id), fly.brain.episodic.memory.rngState, decision, reference.parameters.exploration);
        decisionAudits.push({agentId: fly.id, tick: world.tick, choice: decision.choice, negativeScore: decision.retrieval.negative.score ?? decision.retrieval.negative.estimate, positiveScore: decision.retrieval.positive.score ?? decision.retrieval.positive.estimate, ...audit});
        pending.set(fly.id, {agentId: fly.id, tick: world.tick, choice: decision.choice, observation: [...fly.lastInputs], rewards: [], policy: audit.policy});
      }
      const record = pending.get(fly.id);
      if (record) { record.rewards.push(fly.reward); if (record.rewards.length === reference.parameters.decisionTicks) { windows.push(record); pending.delete(fly.id); } }
      if (!world.flies.includes(fly) && pending.has(fly.id)) { partial++; pending.delete(fly.id); }
    }
  }
  partial += pending.size;
  assert.equal(hash(JSON.stringify(world.checkpoint())), old.worldSha256);
  assert.deepEqual(windows.map(({policy, ...window}) => window), old.windows.map(({value, ...window}) => window));
  const cases = old.plans.map(c => ({tick: c.tick, agentId: c.agentId, query: c.query, effects: c.effects, actualDifference: c.actualDifference, incumbentDifference: c.incumbentDifference, incumbentGain: c.incumbentGain, originalOptionGain: c.gain}));
  return {seed: old.seed, environment: old.environment, windows, decisionAudits, partial, cases, finalWorldSha256: old.worldSha256, exactFactualWindowsAndWorld: true};
}

async function run() {
  const referenceDirectory = resolve(process.argv[2] || 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf'), directory = resolve(process.argv[3] || `evidence/behavior-policy/${randomUUID()}`);
  await mkdir(directory, {recursive: true});
  const bytes = await readFile(join(referenceDirectory, 'results.json')), old = JSON.parse(bytes), referenceBytes = await readFile(join(referenceDirectory, 'reference-protocol.json')), reference = JSON.parse(referenceBytes);
  assert.equal(reference.parameters.decisionTicks, 8); assert.equal(reference.parameters.creditTicks, 8);
  for (const [file, sha] of Object.entries(old.protocol.worldSourceSha256)) assert.equal(hash(await readFile(join(old.protocol.worldSources, file))), sha);
  const sourceSha256 = {};
  for (const file of ['learning/behavior-policy.mjs', 'scripts/collect-behavior-policy.mjs']) { const source = await readFile(file); sourceSha256[file] = hash(source); const path = join(directory, file); await mkdir(resolve(path, '..'), {recursive: true}); await writeFile(path, source); }
  const protocol = {at: new Date().toISOString(), experiment: 'exact-trajectory-nominal-policy-recovery', referenceDirectory, referenceSha256: hash(bytes), referenceProtocolSha256: hash(referenceBytes), worldSources: old.protocol.worldSources, worldSourceSha256: old.protocol.worldSourceSha256, sourceSha256, exploration: reference.parameters.exploration, observedAgents: [1, 2], horizonTicks: reference.horizonTicks,
    interpretation: 'Read-only replay of archived worlds, without policy changes. Verify both actual xorshift draws at every binary decision and reconstruct the nominal epsilon-greedy action probabilities from decision-time saved retrieval scores. They are idealized policy probabilities, not empirical frequencies or causal identification conditional on a fully known deterministic RNG state. Every factual window and complete final world must equal the archived record. Future action-fork labels remain separate scoring data and never enter an action probability.'};
  await writeFile(join(directory, 'protocol.json'), JSON.stringify(protocol, null, 2) + '\n'); await writeFile(join(directory, 'reference-protocol.json'), referenceBytes);
  await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'running'}) + '\n');
  const {World} = await import(pathToFileURL(join(old.protocol.worldSources, 'engine.mjs'))), rows = [];
  try {
    for (const recorded of old.rows) { rows.push(collectBehaviorWorld(World, recorded, reference)); await writeFile(join(directory, 'progress.json'), JSON.stringify({protocol, rows}) + '\n'); console.log(JSON.stringify({directory, worlds: rows.length, total: old.rows.length})); }
    const audits = rows.flatMap(row => row.decisionAudits), complete = rows.flatMap(row => row.windows), counts = Object.fromEntries(['exploration', 'tie', 'retrieval'].map(reason => [reason, audits.filter(a => a.policy.reason === reason).length]));
    const summary = {worlds: rows.length, decisions: audits.length, completedWindows: complete.length, exactDrawReplays: audits.filter(a => a.exactDrawReplay).length, reasonCounts: counts, randomizedCompletedWindows: complete.filter(w => w.policy.randomized).length, explicitExplorationWindows: complete.filter(w => w.policy.explicitExploration).length, minimumChosenProbability: Math.min(...complete.map(w => w.policy.chosenProbability)), maximumInverseUniformWeight: Math.max(...complete.map(w => .5 / w.policy.chosenProbability))};
    const result = {protocol, rows, summary, qualification: false, completedAt: new Date().toISOString()}; await writeFile(join(directory, 'results.json'), JSON.stringify(result) + '\n'); await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'complete'}) + '\n'); console.log(JSON.stringify({directory, summary}, null, 2));
  } catch (error) { await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'failed', error: {name: error.name, message: error.message, stack: error.stack}}, null, 2) + '\n'); throw error; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await run();
