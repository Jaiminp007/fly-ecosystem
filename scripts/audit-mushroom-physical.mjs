// Supplemental exact-JSON audit. Preserve the original signed-zero failure.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
export function compareRecordedRow(actual, recorded) {
  assert.equal(JSON.stringify(actual), JSON.stringify(recorded), 'Exact recorded JSON row mismatch');
  let signedZeros = 0;
  const visit = (a, b) => {
    if (typeof a === 'number') { if (Object.is(a, -0) && Object.is(b, 0)) signedZeros++; }
    else if (a && typeof a === 'object') for (const key of Object.keys(a)) visit(a[key], b[key]);
  };
  visit(actual, recorded); return signedZeros;
}
async function main() {
  const [input, phase, output] = process.argv.slice(2), directory = resolve(input);
  assert.ok(['development', 'confirmation'].includes(phase));
  const {digest} = await import(pathToFileURL(join(directory, 'sources/learning/intervention-study.mjs')));
  const {verifySarsaSources} = await import(pathToFileURL(join(directory, 'sources/scripts/sarsa-screen.mjs')));
  const {validateMushroomProtocol, simulateMushroomHistory, validateMushroomRow, scoreMushroomRows} = await import(pathToFileURL(join(directory, 'sources/learning/mushroom-development.mjs')));
  const protocolBytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(protocolBytes);
  validateMushroomProtocol(p); await verifySarsaSources(directory, p);
  const folder = join(directory, phase), histories = p[`${phase}Histories`], rows = [], zeroRows = [];
  const start = performance.now(), cpu = process.cpuUsage();
  for (const history of histories) {
    const row = JSON.parse(await readFile(join(folder, 'rows', `${history.seed}.json`)));
    validateMushroomRow(row, history, p, phase); rows.push(row);
    const {runtime, protocolSha256, numericsSha256, ...recorded} = row;
    assert.equal(protocolSha256, digest(protocolBytes));
    const hash = createHash('sha256'), actual = simulateMushroomHistory(p, history, phase, event => hash.update(JSON.stringify(event) + '\n'));
    assert.equal(hash.digest('hex'), numericsSha256);
    assert.equal(digest(await readFile(join(folder, 'numerics', `${history.seed}.jsonl`))), numericsSha256);
    const signedZeroEntries = compareRecordedRow(actual, recorded);
    zeroRows.push({seed: history.seed, signedZeroEntries});
    console.log(JSON.stringify({coldReplayed: history.seed, signedZeroEntries, completed: rows.length}));
  }
  const resultBytes = await readFile(join(folder, 'results.json')), {protocolSha256, rowSha256, ...result} = JSON.parse(resultBytes);
  assert.equal(protocolSha256, digest(protocolBytes));
  for (const [i, h] of histories.entries()) assert.equal(rowSha256[i], digest(await readFile(join(folder, 'rows', `${h.seed}.json`))));
  compareRecordedRow(scoreMushroomRows(rows, p, phase), result);
  const report = {schema: 1, passed: true, phase, protocolSha256, resultsSha256: digest(resultBytes), histories: histories.length,
    mainWorlds: histories.length * 10, probes: histories.length * (phase === 'development' ? 18 : 9),
    comparison: 'Exact JSON equality and exact factual trace hashes without numeric tolerance. Original raw-object equality failed on signed zeros; strict failure and original source are preserved.',
    signedZeroRows: zeroRows, signedZeroEntries: zeroRows.reduce((s, v) => s + v.signedZeroEntries, 0),
    auditorSha256: digest(await readFile(new URL(import.meta.url))),
    runtime: {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu)}};
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify(report));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
