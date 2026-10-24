import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {digest} from '../learning/intervention-study.mjs';
import {validateSarsaProtocol, simulateSarsaHistory, scoreSarsaScreen} from '../learning/sarsa-screen.mjs';
import {verifySarsaSources, readSarsaRows, writeExclusive} from './sarsa-screen.mjs';

const directory = resolve(process.argv[2] || ''); assert.ok(process.argv[2]);
assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/audit-sarsa-screen.mjs')).href, 'Execute the captured auditor');
const pBytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(pBytes);
validateSarsaProtocol(p); await verifySarsaSources(directory, p);
const rows = await readSarsaRows(directory, p), start = performance.now(), cpu = process.cpuUsage();
let mainWorlds = 0, probes = 0;
for (const [i, h] of p.histories.entries()) {
  const hash = createHash('sha256'), regenerated = simulateSarsaHistory(p, h, event => hash.update(JSON.stringify(event) + '\n'));
  const {runtime, protocolSha256, numericsSha256, ...original} = rows[i];
  assert.equal(protocolSha256, digest(pBytes));
  assert.equal(numericsSha256, digest(await readFile(join(directory, 'numerics', `${h.seed}.jsonl`))));
  assert.equal(hash.digest('hex'), numericsSha256, 'Factual decisions/updates differ on cold replay');
  assert.deepEqual(regenerated, original, `Cold physical/learner/probe replay differs: ${h.seed}`);
  mainWorlds += p.arms.length; probes += p.probes.length;
  console.log(JSON.stringify({coldReplayedHistory: h.seed, mainWorlds, probes}));
}
const resultBytes = await readFile(join(directory, 'results.json')), result = JSON.parse(resultBytes), scored = scoreSarsaScreen(rows, p);
const {protocolSha256, rowSha256, ...reported} = result; assert.deepEqual(scored, reported); assert.equal(protocolSha256, digest(pBytes));
assert.deepEqual(rowSha256, await Promise.all(p.histories.map(async h => digest(await readFile(join(directory, 'rows', `${h.seed}.json`))))));
await writeExclusive(join(directory, 'audit.json'), {schema: 1, passed: true, protocolSha256, resultsSha256: digest(resultBytes), mainWorlds, probes,
  coverage: 'Every registered history, arm, founder, phase checkpoint, factual update, probe, endpoint, contrast and gate cold-replayed from captured sources.',
  runtime: {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu), node: process.version, platform: process.platform}});
