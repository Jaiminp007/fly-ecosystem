import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {openSync, writeSync, closeSync} from 'node:fs';
import {join, resolve, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes, createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {SARSA_ARMS, SARSA_PROBES} from '../learning/sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {SARSA_CONTRASTS, validateSarsaProtocol, simulateSarsaHistory, validateSarsaRow, scoreSarsaScreen} from '../learning/sarsa-screen.mjs';

export const writeExclusive = (path, data) => writeFile(path, JSON.stringify(data, null, 2) + '\n', {flag: 'wx'});
export async function verifySarsaSources(directory, p) {
  for (const [path, sha256] of Object.entries(p.sourceSha256)) assert.equal(digest(await readFile(join(directory, 'sources', path))), sha256, path);
  for (const r of p.seedRegistries) assert.equal(digest(await readFile(join(directory, 'registries', r.path))), r.sha256, r.path);
  for (const r of p.engineeringSources) assert.equal(digest(await readFile(join(directory, 'engineering', r.path.slice('tests/'.length)))), r.sha256, r.path);
}
async function initialize(directory, python) {
  const evidence = await readFile('handoff/evidence-manifest.json');
  // Verify restored inputs before using them to exclude historical seeds.
  const manifest = JSON.parse(evidence);
  for (const r of manifest.files) assert.equal(digest(await readFile(r.path)), r.sha256, `Restore/verify evidence first: ${r.path}`);
  await mkdir(dirname(directory), {recursive: true});
  await mkdir(directory, {recursive: false});
  const referenceFile = 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/reference-protocol.json';
  const referenceBytes = await readFile(referenceFile), reference = JSON.parse(referenceBytes);
  const sourceFiles = ['engine.mjs', 'challenges.mjs', 'scripts/sarsa-screen.mjs', 'scripts/audit-sarsa-screen.mjs', 'scripts/audit-sarsa-screen.py',
    ...(await readdir('learning')).filter(f => f.endsWith('.mjs')).map(f => `learning/${f}`)];
  const sourceSha256 = {};
  for (const file of sourceFiles) {
    const bytes = await readFile(file), target = join(directory, 'sources', file);
    sourceSha256[file] = digest(bytes); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes, {flag: 'wx'});
  }
  const excluded = new Set([41]), seedRegistries = [];
  const visit = (value, key = '') => {
    if (Array.isArray(value)) { for (const v of value) if (/seed/i.test(key) && Number.isInteger(v)) excluded.add(v); else if (v && typeof v === 'object') visit(v, key); }
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) {
      if (/seed/i.test(k) && Number.isInteger(v)) excluded.add(v); else if (v && typeof v === 'object') visit(v, /seed/i.test(key) ? key : k);
    }
  };
  const registries = manifest.files.filter(r => /protocol\.json$/.test(r.path));
  for (const r of registries) {
    const bytes = await readFile(r.path); visit(JSON.parse(bytes)); seedRegistries.push({path: r.path, sha256: digest(bytes)});
    const target = join(directory, 'registries', r.path); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes, {flag: 'wx'});
  }
  const engineeringSources = [];
  for (const file of (await readdir('tests')).filter(f => f.endsWith('.mjs')).sort()) {
    const bytes = await readFile(join('tests', file)), text = bytes.toString();
    // Conservative exclusion of every integer literal, including resource/test
    // seeds. This intentionally excludes more than just seed arguments.
    for (const match of text.matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)) {
      const value = Number(match[0].replaceAll('_', '')); if (Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff) excluded.add(value);
    }
    engineeringSources.push({path: `tests/${file}`, sha256: digest(bytes)});
    await mkdir(join(directory, 'engineering'), {recursive: true}); await writeFile(join(directory, 'engineering', file), bytes, {flag: 'wx'});
  }
  const used = new Set(excluded), fresh = () => { let s; do { s = randomBytes(4).readUInt32BE(); } while (!s || used.has(s)); used.add(s); return s; };
  const histories = Array.from({length: 16}, () => ({seed: fresh(), resourceSeeds: Array.from({length: 4}, fresh), probeSeeds: {A: fresh(), B: fresh(), C: fresh()}}));
  const critical = JSON.parse(execFileSync(python, ['-c', 'import json; from scipy.stats import t; print(json.dumps([float(t.ppf(1-.05/10,15)),float(t.ppf(.975,15))]))'], {encoding: 'utf8'}));
  const protocol = {schema: 1, experiment: 'fixed-expected-sarsa-embodied-screen', createdAt: new Date().toISOString(),
    referenceFile, referenceSha256: digest(referenceBytes), reference: {founders: reference.founders, parameters: reference.parameters, actorParameters: reference.actorParameters},
    archiveManifestSha256: digest(evidence), sourceSha256, seedRegistries, engineeringSources, excludedSeeds: [...excluded].sort((a, b) => a - b), histories,
    arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES, contrasts: SARSA_CONTRASTS,
    pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17},
    alphaPerTest: .05 / 10, critical: critical[0], descriptiveCritical: critical[1],
    budget: {mainWorlds: 112, probeWorlds: 144, totalWorlds: 256, maximumWorldSteps: 112 * 1792 + 144 * 256,
      decision: 'Before outcomes, adopt nine probes/history (144) to retain every required acquisition/skill/reset contrast. This exceeds the suggested 128 probe cap by 16, while remaining at the earlier 256-world combined ceiling. No development performance runs or candidate selection.'},
    endpoint: 'All 24 original founders. (Sum usable survivor energy - initial energy - outstanding external work debt)/24. Death contributes zero usable energy; no replacement. Costs paid in-world already reduce usable energy. Probe endpoints use common end-C body initial energy and prospective costs. Entirely extinct candidate histories receive nine zero probe contrasts without resurrection.',
    accounting: 'Canonical encoded learner state includes parameters/traces/history/replay/RNG/counters/pending and bill fields. Float64 scalars; explicit UTF-8/container lengths. Storage rate calibrated to the prior 17-float record price; scalar work to the prior 17-channel lookup price. These are declared model prices, not heap bytes, biological metabolism or measured CPU. Price actual executed counters, keep late/terminal debt. Legacy native charges remain disclosed. Recording/checkpointing/probe evaluation are external evaluator work, separately timed and never train a main learner.',
    inference: 'Independent seed histories (n=16), not founders/probes. Ten prespecified linear contrasts share Bonferroni family alpha=.05, including optional trace attribution. Require strictly positive one-sided Student-t simultaneous bounds and exact paired sign-flip p<=.005. Normal seed-mean and symmetric paired-effect assumptions apply. A/B retention contrasts are current-reset - .95*(earlier-reset); first require each earlier-reset skill positive. Separate per-skill tests; no pooling skills. Six survival guards require nonnegative observed mean candidate-control survival, with descriptive 95% intervals; this is not demonstrated survival noninferiority or benefit.',
    learner: 'Fixed speed-only Expected SARSA(lambda=.9), epsilon=.1, gamma=exp(-duration/256), live rate=.05, replay=.01, 16 recent+48 reservoir transitions. Actual own eight-tick transitions, energy/120 reward. Current+3 own decisions; channels [0,1,2,3,4,10,11,12,13], older channels/actions scaled /3, whole vector unit-normalized. Replay one-step targets, no replay trace propagation. No phase ID/fork labels/cross-founder facts. Lambda0 changes only lambda. Snapshots at 512/1024/1536 contain only matured updates; the final decision transition matures at the next decision unless death ends it. Reset at B/C drops pending transitions; no reset of bodies or RNG.',
    probesRule: 'Nine 256-tick read-only probes on common end-C candidate bodies, same unseen family seed and synchronized policy RNG. Clear transient history/pending/traces, freeze acquisition, keep all founders including deaths. Saved A/B/current C/reset have the declared comparisons. Reset also removes replay while old saved buffers remain storage-priced. Probe feedback never returns. C is lower renewal, not assumed immediate scarcity; record inventory, eaten food and delivered regrowth.',
    failureRule: 'Any of nine required energy/skill/retention contrasts or six survival guards fails => candidate fails. Never tune/reselect/extend on this bank. Optional lambda0 success supports trace contribution only. A pass supplies a bounded embodied substrate, not autonomous algorithm revision, ecological deployment or RSI.',
    execution: 'All collect/score/audit commands must execute captured entrypoints, verify the complete captured import graph, verify registered row/arm/probe identities and preserve exclusive output files. Per-history wall and process CPU, source/protocol hashes and all failures retained.'};
  validateSarsaProtocol(protocol); await writeExclusive(join(directory, 'protocol.json'), protocol);
  console.log(JSON.stringify({directory, initialized: true, budget: protocol.budget, seedRegistries: seedRegistries.length, excludedSeeds: excluded.size}));
}
export async function readSarsaRows(directory, p) {
  validateSarsaProtocol(p); const rows = [];
  for (const h of p.histories) { const row = JSON.parse(await readFile(join(directory, 'rows', `${h.seed}.json`))); validateSarsaRow(row, h, p); rows.push(row); }
  return rows;
}
async function main() {
  const [command, input, python = process.platform === 'win32' ? '.venv-research/Scripts/python.exe' : '.venv-research/bin/python'] = process.argv.slice(2);
  assert.ok(input && ['init', 'collect', 'score'].includes(command), 'init|collect|score DIRECTORY [PYTHON]'); const directory = resolve(input);
  if (command === 'init') return initialize(directory, python);
  assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/sarsa-screen.mjs')).href, 'Execute the captured runner');
  const bytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(bytes); validateSarsaProtocol(p); await verifySarsaSources(directory, p);
  if (command === 'collect') {
    await mkdir(join(directory, 'rows'), {recursive: true}); await mkdir(join(directory, 'numerics'), {recursive: true});
    for (const h of p.histories) {
      const rowPath = join(directory, 'rows', `${h.seed}.json`);
      try { const old = JSON.parse(await readFile(rowPath)); validateSarsaRow(old, h, p); assert.equal(old.protocolSha256, digest(bytes)); assert.equal(digest(await readFile(join(directory, 'numerics', `${h.seed}.jsonl`))), old.numericsSha256); continue; } catch (e) { if (e.code !== 'ENOENT') throw e; }
      const start = performance.now(), cpu = process.cpuUsage(), fd = openSync(join(directory, 'numerics', `${h.seed}.jsonl`), 'wx'), hash = createHash('sha256');
      let row;
      try { row = simulateSarsaHistory(p, h, event => { const line = JSON.stringify(event) + '\n'; writeSync(fd, line); hash.update(line); }); } finally { closeSync(fd); }
      validateSarsaRow(row, h, p);
      const runtime = {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu), node: process.version, platform: process.platform};
      await writeExclusive(rowPath, {...row, protocolSha256: digest(bytes), numericsSha256: hash.digest('hex'), runtime});
      console.log(JSON.stringify({seed: h.seed, completedArms: 7, scheduledProbes: 9, ...runtime}));
    }
  } else {
    const rows = await readSarsaRows(directory, p), result = scoreSarsaScreen(rows, p);
    await writeExclusive(join(directory, 'results.json'), {...result, protocolSha256: digest(bytes), rowSha256: await Promise.all(p.histories.map(async h => digest(await readFile(join(directory, 'rows', `${h.seed}.json`)))))});
    console.log(JSON.stringify({qualified: result.qualified, comparisons: result.comparisons.map(c => ({id: c.id, mean: c.mean, lower: c.simultaneousLower, passed: c.passed}))}));
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
