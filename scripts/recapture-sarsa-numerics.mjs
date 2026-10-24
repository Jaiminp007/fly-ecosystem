// Supplemental recording correction only. Replays the original frozen bank;
// never generates fresh seeds, trains a replacement candidate or changes scores.
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {openSync, writeSync, closeSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {digest} from '../learning/intervention-study.mjs';
import {simulateSarsaHistory} from '../learning/sarsa-screen.mjs';
import {verifySarsaSources, readSarsaRows, writeExclusive} from './sarsa-screen.mjs';

const directory = resolve(process.argv[2] || ''); assert.ok(process.argv[2]);
assert.equal(import.meta.url, pathToFileURL(join(directory, 'supplemental/sources/scripts/recapture-sarsa-numerics.mjs')).href);
const pBytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(pBytes);
await verifySarsaSources(directory, p);
const manifest = JSON.parse(await readFile(join(directory, 'supplemental/source-manifest.json')));
for (const [path, expected] of Object.entries(manifest.sourceSha256)) assert.equal(digest(await readFile(join(directory, 'supplemental/sources', path))), expected, path);
const rows = await readSarsaRows(directory, p), start = performance.now(), cpu = process.cpuUsage(), histories = {};
await mkdir(join(directory, 'supplemental/numerics'), {recursive: false});
let doubleUpdateEvents = 0, mainWorlds = 0, probes = 0;
for (const [i, h] of p.histories.entries()) {
  const hash = createHash('sha256'), fd = openSync(join(directory, 'supplemental/numerics', `${h.seed}.jsonl`), 'wx');
  let regenerated;
  try { regenerated = simulateSarsaHistory(p, h, e => {
    if (e.type === 'experience' && e.transitions.length === 2) doubleUpdateEvents++;
    const line = JSON.stringify(e) + '\n'; hash.update(line); writeSync(fd, line);
  }); } finally { closeSync(fd); }
  const {runtime, protocolSha256, numericsSha256, ...original} = rows[i];
  assert.equal(protocolSha256, digest(pBytes)); assert.deepEqual(regenerated, original, 'Recorder correction changed scientific state/results');
  histories[h.seed] = {originalNumericsSha256: numericsSha256, correctedNumericsSha256: hash.digest('hex')};
  mainWorlds += p.arms.length; probes += p.probes.length;
  console.log(JSON.stringify({recapturedHistory: h.seed, mainWorlds, probes, doubleUpdateEvents}));
}
await writeExclusive(join(directory, 'supplemental/audit.json'), {schema: 1, passed: true, protocolSha256: digest(pBytes),
  sourceManifestSha256: digest(await readFile(join(directory, 'supplemental/source-manifest.json'))), histories,
  mainWorlds, probes, doubleUpdateEvents, unchanged: 'Every original main/probe/checkpoint/learner/endpoint row is identical. Only evaluator trace emission changed; no sample extension or score/gate alteration.',
  runtime: {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu)}});
