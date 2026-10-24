import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {World} from '../engine.mjs';

const profiles = [];
for (const founders of [24, 120, 240]) {
  const world = new World({seed: 71, founders, capacity: 500, learning: false, mutation: false,
    seasonal: false, nutrient: 3, challenges: 'off'});
  const start = performance.now();
  world.advance(100);
  const stepMilliseconds = (performance.now() - start) / 100;
  const frame = JSON.stringify(world.frame()).length;
  const snapshot = JSON.stringify(world.snapshot()).length;
  const checkpoint = JSON.stringify(world.checkpoint()).length;
  profiles.push({founders, livingAfter100Ticks: world.flies.length,
    meanStepMilliseconds: stepMilliseconds, frameJsonBytes: Buffer.byteLength(JSON.stringify(world.frame())),
    fullSnapshotJsonBytes: Buffer.byteLength(JSON.stringify(world.snapshot())),
    checkpointJsonBytes: Buffer.byteLength(JSON.stringify(world.checkpoint())),
    heapUsedBytes: process.memoryUsage().heapUsed, rssBytes: process.memoryUsage().rss,
    accountingError: world.metrics().accountingError, internalLengthChecks: {frame, snapshot, checkpoint}});
}
const sourceSha256 = createHash('sha256').update(await readFile(new URL('../engine.mjs', import.meta.url))).digest('hex');
const maleCnsReference = JSON.parse(await readFile(new URL('../evidence/malecns-memory-assay.json', import.meta.url)));
const report = {runtime: process.version, platform: process.platform, arch: process.arch,
  sourceSha256, protocol: 'Single local Node process; 100 ticks per independently initialized seeded world; learning, mutation, and seasonality disabled to reduce run-to-run work variation. Timings are a local baseline, not a portable capacity promise.', profiles,
  maleCnsReference: {...maleCnsReference, source: 'evidence/malecns-memory-assay.json',
    note: 'Existing local peak-RSS assay; not rerun in this profiling pass.'}};
const directory = new URL('../evidence/platform-profile/', import.meta.url);
await mkdir(directory, {recursive: true});
await writeFile(new URL('results.json', directory), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
