import assert from 'node:assert/strict';
import {readFile, writeFile, readdir, mkdir} from 'node:fs/promises';
import {openSync, closeSync, writeSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash, randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {SARSA_ARMS, SARSA_PROBES} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {LOCAL_CONTRASTS, validateLocalProtocol, simulateLocalHistory, validateLocalRow, scoreLocalRows} from '../learning/sarsa-development.mjs';
import {verifySarsaSources, writeExclusive} from './sarsa-screen.mjs';

export function collectRegisteredSeeds(v, excluded, key = '') {
  if (Array.isArray(v)) for (const n of v) {
    if (/seed/i.test(key) && Number.isInteger(n)) excluded.add(n);
    else if (n && typeof n === 'object') collectRegisteredSeeds(n, excluded, key);
  }
  else if (v && typeof v === 'object') for (const [k, n] of Object.entries(v)) {
    if ((/seed/i.test(k) || /seed/i.test(key)) && Number.isInteger(n)) excluded.add(n);
    else if (n && typeof n === 'object') collectRegisteredSeeds(n, excluded, /seed/i.test(key) ? key : k);
  }
}

async function initialize(directory, python) {
  await mkdir(dirname(directory), {recursive: true}); await mkdir(directory, {recursive: false});
  const sourceFiles = ['engine.mjs', 'challenges.mjs', 'scripts/sarsa-development.mjs', 'scripts/sarsa-screen.mjs', 'scripts/audit-sarsa-development.py', 'scripts/audit-sarsa-screen.py',
    ...(await readdir('learning')).filter(f => f.endsWith('.mjs')).map(f => `learning/${f}`)];
  const sourceSha256 = {};
  for (const file of sourceFiles) { const b = await readFile(file), target = join(directory, 'sources', file); sourceSha256[file] = digest(b); await mkdir(dirname(target), {recursive: true}); await writeFile(target, b, {flag: 'wx'}); }
  const excluded = new Set([41]), seedRegistries = [], engineeringSources = [];
  async function scan(path) {
    for (const entry of await readdir(path, {withFileTypes: true})) {
      const file = join(path, entry.name);
      if (entry.isDirectory() && !['sources', 'registries', 'engineering'].includes(entry.name)) await scan(file);
      else if (entry.isFile() && entry.name === 'protocol.json') {
        const b = await readFile(file); collectRegisteredSeeds(JSON.parse(b), excluded); const portable = file.replaceAll('\\', '/'); seedRegistries.push({path: portable, sha256: digest(b)});
        const target = join(directory, 'registries', file); await mkdir(dirname(target), {recursive: true}); await writeFile(target, b, {flag: 'wx'});
      }
    }
  }
  await scan('evidence');
  for (const name of (await readdir('tests')).filter(f => f.endsWith('.mjs')).sort()) {
    const b = await readFile(join('tests', name));
    for (const m of b.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)) { const n = Number(m[0].replaceAll('_', '')); if (Number.isSafeInteger(n) && n > 0 && n <= 0xffffffff) excluded.add(n); }
    engineeringSources.push({path: `tests/${name}`, sha256: digest(b)}); await mkdir(join(directory, 'engineering'), {recursive: true}); await writeFile(join(directory, 'engineering', name), b, {flag: 'wx'});
  }
  const used = new Set(excluded), fresh = () => { let seed; do { seed = randomBytes(4).readUInt32BE(); } while (!seed || used.has(seed)); used.add(seed); return seed; };
  const histories = Array.from({length: 24}, () => ({seed: fresh(), resourceSeeds: Array.from({length: 4}, fresh), probeSeeds: {A: fresh(), B: fresh(), C: fresh()}}));
  const referenceFile = 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/reference-protocol.json', referenceBytes = await readFile(referenceFile), reference = JSON.parse(referenceBytes);
  const critical = JSON.parse(execFileSync(python, ['-c', 'import json; from scipy.stats import t; print(json.dumps({"simultaneous":{k:float(t.ppf(1-.05/12,n-1)) for k,n in [("development",8),("confirmation",16)]},"descriptive":{k:float(t.ppf(.975,n-1)) for k,n in [("development",8),("confirmation",16)]}}))'], {encoding: 'utf8'}));
  const p = {schema: 1, experiment: 'local-tile-embodied-development-v1', createdAt: new Date().toISOString(), sourceSha256, seedRegistries, engineeringSources,
    excludedSeeds: [...excluded].sort((a, b) => a - b), developmentHistories: histories.slice(0, 8), confirmationHistories: histories.slice(8),
    referenceFile, referenceSha256: digest(referenceBytes), reference: {founders: reference.founders, parameters: reference.parameters, actorParameters: reference.actorParameters},
    arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES, contrasts: LOCAL_CONTRASTS, critical: critical.simultaneous, descriptiveCritical: critical.descriptive, alphaPerTest: .05 / 12,
    pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17},
    programs: {candidate: 'tile-sarsa-v1', previous: 'linear-sarsa-v1', reactiveReference: 'feeding-reflex-v1'},
    budget: {developmentWorlds: 216, confirmationWorlds: 288, totalWorlds: 504, totalCollectionWorldSteps: 8 * (9 * 1792 + 18 * 256) + 16 * (9 * 1792 + 9 * 256),
      explanation: 'Development: per history seven tile main arms, one previous-linear main, one fixed reflex main, nine tile plus nine linear probes. Confirmation: the same nine main worlds, nine tile probes only. Total 504 whole-sequence/probe worlds below a declared 512-world ceiling. Audits are separately timed repeat computation, never new independent scientific units.'},
    hypothesis: 'One new nonlinear local sensor/history representation, not another kernel-library search. Same Expected SARSA(.9)/epsilon .1/discount exp(-duration/256), live .05/replay .01, 16 recent plus 48 reservoir factual transitions. Four predetermined 4D sensor/history conjunction groups, four offset tilings/group, four bins/coordinate, FNV32 hashing into 256 parameters per action. Hash collisions aggregate and the sparse vector has unit L2 norm. No phase/age/clock/coordinates/privileged food quantities. Parameter/trace state and all sparse records are storage-priced; hashing, features, live/replay arithmetic have recorded work prices. This is a human-proposed candidate, not autonomous algorithm revision.',
    developmentRule: 'Eight new seed histories. Advance only this exact candidate if every one of eleven required contrast MEANS is strictly positive and all eight survival-guard means are nonnegative. Descriptive simultaneous bounds/p-values are reported, but this development screen is not qualification. Also compare old linear skill effects descriptively using physically shared incumbent/constant rows; do not mislabel tile frozen/reset controls as matched linear ablations. Any failure means no confirmation, tuning, resampling or alternative candidate on this bank.',
    confirmationRule: 'After all development physical and independent numeric audits pass and developmentRule passes, collect the sixteen reserved fresh histories with unchanged source/configuration. Require positive simultaneous Student-t lower bounds AND exact paired sign-flip p<=.05/12 for all eleven required contrasts, and eight nonnegative observed mean survival guards. The twelfth comparison is optional trace attribution. Independent histories are units; normal seed-mean and symmetric paired-effect assumptions apply. A/B initial-skill-over-reset and separate 95%-advantage retention remain required. Survival guards are observed-mean screens, not a survival benefit/noninferiority demonstration. A failure remains failed; no held-out tuning or expansion.',
    preservation: 'Previous intervention and original linear SARSA qualification remain failed. Their held-out outcomes supply no parameter selection or fresh confirmation. Default linear experiment exact continuation matches its archived implementation on an engineering seed. All old source/evidence hashes remain untouched.',
    probesRule: 'Same continuing bodies/resources/schedule as the original screen. All founders remain denominators, including deaths. Read-only probes use each program own end-C bodies, within-program matched physical states/RNG and unseen resource seeds. No probe feedback returns to training. Nine probes preserve A/B initial-skill, acquisition and separate retention contrasts. C means lower renewal, not assumed instantaneous scarcity.',
    reflexRule: 'Fixed previously disclosed feeding reflex: slow if current last-food receptor >0, otherwise fast. No training, task ID or future information. One modeled comparison operation/decision and canonical persistent controller/accounting state are charged. It is a strong human reference, never a learned/recursive result.',
    endpoint: '(Usable survivor energy - initial energy - outstanding external work debt)/all original founders. Paid work already reduces physical energy. Original phase-transition, late/terminal billing, saved-model maturity and frozen/reset semantics retained.',
    boundary: 'No ecological promotion or RSI claim follows development. Even a confirmation pass supplies only the bounded embodied substrate. Persistent algorithm revisions, copied-improvement control and causal subsequent search-productivity benefit remain separate obligations.'};
  validateLocalProtocol(p); await writeExclusive(join(directory, 'protocol.json'), p);
  console.log(JSON.stringify({initialized: directory, budget: p.budget, registries: seedRegistries.length, excludedSeeds: excluded.size, development: 8, reservedConfirmation: 16}));
}

export async function readLocalRows(directory, p, phase) {
  const hs = phase === 'development' ? p.developmentHistories : p.confirmationHistories, rows = [];
  for (const h of hs) { const r = JSON.parse(await readFile(join(directory, phase, 'rows', `${h.seed}.json`))); validateLocalRow(r, h, p, phase); rows.push(r); }
  return rows;
}
async function main() {
  const [command, input, phase = 'development', python = process.platform === 'win32' ? '.venv-research/Scripts/python.exe' : '.venv-research/bin/python'] = process.argv.slice(2);
  assert.ok(input && ['init', 'collect', 'score', 'audit'].includes(command)); const directory = resolve(input);
  if (command === 'init') return initialize(directory, phase === 'development' ? python : phase);
  assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/sarsa-development.mjs')).href, 'Execute the captured entrypoint');
  assert.ok(['development', 'confirmation'].includes(phase));
  const bytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(bytes); validateLocalProtocol(p); await verifySarsaSources(directory, p);
  const folder = join(directory, phase), hs = phase === 'development' ? p.developmentHistories : p.confirmationHistories;
  if (command === 'collect') {
    if (phase === 'confirmation') {
      const resultsBytes = await readFile(join(directory, 'development/results.json')), result = JSON.parse(resultsBytes);
      assert.equal(result.promising, true, 'Development failed; confirmation is forbidden');
      for (const file of ['physical-audit.json', 'numeric-audit.json']) { const audit = JSON.parse(await readFile(join(directory, 'development', file))); assert.equal(audit.passed, true); assert.equal(audit.protocolSha256, digest(bytes)); assert.equal(audit.resultsSha256, digest(resultsBytes)); }
    }
    await mkdir(join(folder, 'rows'), {recursive: true}); await mkdir(join(folder, 'numerics'), {recursive: true});
    for (const h of hs) {
      const target = join(folder, 'rows', `${h.seed}.json`);
      try { const old = JSON.parse(await readFile(target)); validateLocalRow(old, h, p, phase); assert.equal(old.protocolSha256, digest(bytes)); assert.equal(old.numericsSha256, digest(await readFile(join(folder, 'numerics', `${h.seed}.jsonl`)))); continue; } catch (e) { if (e.code !== 'ENOENT') throw e; }
      const start = performance.now(), cpu = process.cpuUsage(), fd = openSync(join(folder, 'numerics', `${h.seed}.jsonl`), 'wx'), hash = createHash('sha256'); let row;
      try { row = simulateLocalHistory(p, h, phase, e => { const text = JSON.stringify(e) + '\n'; writeSync(fd, text); hash.update(text); }); } finally { closeSync(fd); }
      validateLocalRow(row, h, p, phase);
      const runtime = {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu), node: process.version, platform: process.platform};
      await writeExclusive(target, {...row, protocolSha256: digest(bytes), numericsSha256: hash.digest('hex'), runtime}); console.log(JSON.stringify({phase, seed: h.seed, ...runtime}));
    }
  } else {
    const rows = await readLocalRows(directory, p, phase), scored = scoreLocalRows(rows, p, phase);
    if (command === 'score') {
      await writeExclusive(join(folder, 'results.json'), {...scored, protocolSha256: digest(bytes)}); console.log(JSON.stringify(scored));
    } else {
      const start = performance.now(), cpu = process.cpuUsage();
      for (const [i, h] of hs.entries()) {
        const hash = createHash('sha256'), regenerated = simulateLocalHistory(p, h, phase, e => hash.update(JSON.stringify(e) + '\n'));
        const {runtime, protocolSha256, numericsSha256, ...old} = rows[i]; assert.equal(protocolSha256, digest(bytes));
        assert.equal(hash.digest('hex'), numericsSha256); assert.equal(digest(await readFile(join(folder, 'numerics', `${h.seed}.jsonl`))), numericsSha256); assert.deepEqual(regenerated, old);
        console.log(JSON.stringify({phase, coldReplayed: h.seed, completed: i + 1}));
      }
      const resultBytes = await readFile(join(folder, 'results.json')), {protocolSha256, ...original} = JSON.parse(resultBytes); assert.equal(protocolSha256, digest(bytes)); assert.deepEqual(scored, original);
      await writeExclusive(join(folder, 'physical-audit.json'), {schema: 1, passed: true, phase, protocolSha256, resultsSha256: digest(resultBytes),
        histories: hs.length, mainWorlds: hs.length * 9, probes: hs.length * (phase === 'development' ? 18 : 9),
        runtime: {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu)}});
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
