import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';
const directory = resolve(process.argv[2] || ''), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async file => JSON.parse(await readFile(join(directory, file)));
const r = await load('results.json'), p = await load('protocol.json'); assert.deepEqual(r.protocol, p);
assert.equal(p.experiment, 'exact-trajectory-nominal-policy-recovery');
const referenceBytes = await readFile(join(p.referenceDirectory, 'results.json')), old = JSON.parse(referenceBytes);
assert.equal(hash(referenceBytes), p.referenceSha256);
assert.equal(hash(await readFile(join(directory, 'reference-protocol.json'))), p.referenceProtocolSha256);
for (const [file, sha] of Object.entries(p.sourceSha256)) assert.equal(hash(await readFile(join(directory, file))), sha);
for (const [file, sha] of Object.entries(p.worldSourceSha256)) assert.equal(hash(await readFile(join(p.worldSources, file))), sha);
assert.equal(r.rows.length, old.rows.length);
// Independent uint32 arithmetic uses BigInt masks instead of the collector's
// signed-JavaScript bitwise implementation.
const advance = value => { let x = BigInt(value), mask = (1n << 32n) - 1n; x = (x ^ (x << 13n)) & mask; x ^= x >> 17n; x = (x ^ (x << 5n)) & mask; return Number(x); };
const counts = {exploration: 0, tie: 0, retrieval: 0}; let decisions = 0, windows = 0, randomized = 0, explored = 0, minimum = Infinity, maxWeight = 0;
for (const row of r.rows) {
  const previous = old.rows.find(x => x.seed === row.seed && x.environment === row.environment); assert.ok(previous);
  assert.equal(row.finalWorldSha256, previous.worldSha256); assert.equal(row.exactFactualWindowsAndWorld, true);
  assert.deepEqual(row.windows.map(({policy, ...window}) => window), previous.windows.map(({value, ...window}) => window));
  const byDecision = new Map();
  for (const d of row.decisionAudits) {
    assert.ok(p.observedAgents.includes(d.agentId));
    const first = advance(d.beforeRng), second = advance(first), explore = first / 4294967296, choice = second / 4294967296;
    assert.equal(d.afterRng, second); assert.equal(d.explorationDraw, explore); assert.equal(d.choiceDraw, choice);
    const greedyPositive = d.positiveScore === d.negativeScore ? .5 : +(d.positiveScore > d.negativeScore), reason = explore < p.exploration ? 'exploration' : greedyPositive === .5 ? 'tie' : 'retrieval';
    const actual = reason === 'retrieval' ? (greedyPositive > .5 ? 1 : -1) : choice < .5 ? -1 : 1;
    assert.equal(d.choice, actual); assert.equal(d.policy.reason, reason); assert.equal(d.policy.greedyPositive, greedyPositive);
    const fast = p.exploration / 2 + (1 - p.exploration) * greedyPositive, probability = d.choice > 0 ? fast : 1 - fast;
    assert.equal(d.policy.fast, fast); assert.equal(d.policy.slow, 1 - fast); assert.equal(d.policy.chosenProbability, probability);
    assert.equal(d.policy.randomized, reason === 'exploration' || reason === 'tie'); assert.equal(d.policy.explicitExploration, reason === 'exploration');
    assert.ok(d.exactDrawReplay); counts[reason]++; decisions++;
    const key = d.agentId + ':' + d.tick; assert.ok(!byDecision.has(key)); byDecision.set(key, d);
  }
  for (const w of row.windows) {
    const d = byDecision.get(w.agentId + ':' + w.tick); assert.ok(d); assert.equal(w.choice, d.choice); assert.deepEqual(w.policy, d.policy);
    windows++; randomized += +w.policy.randomized; explored += +w.policy.explicitExploration; minimum = Math.min(minimum, w.policy.chosenProbability); maxWeight = Math.max(maxWeight, .5 / w.policy.chosenProbability);
  }
}
const summary = {worlds: r.rows.length, decisions, completedWindows: windows, exactDrawReplays: decisions, reasonCounts: counts, randomizedCompletedWindows: randomized, explicitExplorationWindows: explored, minimumChosenProbability: minimum, maximumInverseUniformWeight: maxWeight};
assert.deepEqual(summary, r.summary); assert.equal(r.qualification, false);
const source = await readFile(new URL(import.meta.url)); await writeFile(join(directory, 'audit-source.mjs'), source);
const audit = {at: new Date().toISOString(), auditorSha256: hash(source), sourceAndReferenceFingerprintsVerified: true, independentlyReconstructedDecisions: decisions, matchedOriginalFactualWindows: windows, matchedOriginalWorldHashes: r.rows.length, summary, limitations: ['The collector physically replayed each original world; this independent audit reconstructs probabilities and RNG arithmetic, not a second physical replay.', 'Probabilities are the nominal epsilon-greedy model; pseudorandom determinism and these checks do not establish causal identification.', 'No policy-aware estimator or live policy was qualified.']};
await writeFile(join(directory, 'audit.json'), JSON.stringify(audit, null, 2) + '\n'); console.log(JSON.stringify(audit, null, 2));
