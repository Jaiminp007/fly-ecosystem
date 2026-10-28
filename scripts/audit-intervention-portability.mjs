// Descriptive strict-difference diagnosis of ONE registered historical world.
// This never changes the historical audit gate or treats a tolerance as a pass.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const [input, destination] = process.argv.slice(2); assert.ok(input && destination);
const directory = resolve(input), output = resolve(destination), sha = b => createHash('sha256').update(b).digest('hex');
const pBytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(pBytes);
for (const [name, hash] of Object.entries(p.sourceSha256)) assert.equal(sha(await readFile(join(directory, 'sources', name))), hash, name);
const {World} = await import(pathToFileURL(join(directory, 'sources/engine.mjs')));
const {collectInterventionWorld} = await import(pathToFileURL(join(directory, 'sources/learning/intervention-study.mjs')));
const seed = p.developmentSeeds[0], environment = Object.keys(p.reference.environments)[0];
const recordedPath = join(directory, 'development', `${seed}-${environment}.json`), originalBytes = await readFile(recordedPath), recorded = JSON.parse(originalBytes);
assert.equal(recorded.seed, seed); assert.equal(recorded.environment, environment);
const start = performance.now(), actual = collectInterventionWorld(World, p, seed, environment);
const counts = {numbersCompared: 0, numericDifferences: 0, signedZeroDifferences: 0, hashDifferences: 0, otherDifferences: 0}, largest = [];
let maximumAbsoluteDifference = 0;
function compare(a, b, path = '') {
  if (typeof a === 'number' && typeof b === 'number') {
    counts.numbersCompared++;
    if (Object.is(a, b)) return;
    if (a === 0 && b === 0) { counts.signedZeroDifferences++; return; }
    const difference = Math.abs(a - b); counts.numericDifferences++; maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, difference);
    largest.push({path, actual: a, recorded: b, absoluteDifference: difference}); largest.sort((x, y) => y.absoluteDifference - x.absoluteDifference); if (largest.length > 20) largest.pop();
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) { counts.otherDifferences++; return; }
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const key of keys) compare(a[key], b[key], path ? `${path}.${key}` : key);
    return;
  }
  if (a !== b) { if (/Sha256$/.test(path)) counts.hashDifferences++; else counts.otherDifferences++; }
}
compare(actual, recorded);
await mkdir(output, {recursive: false});
await writeFile(join(output, 'regenerated-world.json'), JSON.stringify(actual, null, 2) + '\n', {flag: 'wx'});
const report = {schema: 1, sourceSha256: sha(await readFile(fileURLToPath(import.meta.url))), protocolSha256: sha(pBytes), recordedArtifactSha256: sha(originalBytes),
  seed, environment, cases: actual.cases.length, forkWorldSteps: actual.forkWorldSteps, runtime: {node: process.version, versions: process.versions, platform: process.platform, arch: process.arch, wallSeconds: (performance.now() - start) / 1000},
  counts, maximumAbsoluteDifference, largest, strictlyIdentical: Object.entries(counts).filter(([key]) => key !== 'numbersCompared').every(([, value]) => value === 0),
  boundary: 'One prespecified first development world, same frozen graph/seed/outcomes. Descriptive comparison only; historical strict cold-audit failure remains unless the full registered bank passes unchanged. No numerical tolerance, source correction or scientific gate is substituted.'};
await writeFile(join(output, 'comparison.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(report));
