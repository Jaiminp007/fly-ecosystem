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
import {REPLAY_CONTRASTS, validateReplayProtocol, simulateReplayHistory, validateReplayRow, scoreReplayRows} from '../learning/replay-development.mjs';
import {collectRegisteredSeeds} from './sarsa-development.mjs';
import {verifySarsaSources, writeExclusive} from './sarsa-screen.mjs';

async function initialize(directory, python) {
  await mkdir(dirname(directory), {recursive: true});
  await mkdir(directory, {recursive: false});
  const manifestBytes = await readFile('handoff/evidence-manifest.json'), manifest = JSON.parse(manifestBytes);
  for (const item of manifest.files) assert.equal(digest(await readFile(item.path)), item.sha256, `Verify archived input first: ${item.path}`);
  const referenceFile = 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/reference-protocol.json';
  const referenceBytes = await readFile(referenceFile), reference = JSON.parse(referenceBytes);
  const sourceFiles = ['engine.mjs', 'challenges.mjs', 'scripts/replay-development.mjs', 'scripts/sarsa-development.mjs', 'scripts/sarsa-screen.mjs',
    'scripts/audit-replay-development.py', 'scripts/audit-sarsa-development.py', 'scripts/audit-sarsa-screen.py',
    ...(await readdir('learning')).filter(name => name.endsWith('.mjs')).map(name => `learning/${name}`)];
  const sourceSha256 = {};
  for (const file of sourceFiles) {
    const bytes = await readFile(file), target = join(directory, 'sources', file);
    sourceSha256[file] = digest(bytes); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes, {flag: 'wx'});
  }
  await writeFile(join(directory, 'evidence-manifest.json'), manifestBytes, {flag: 'wx'});

  const excluded = new Set([41]), seedRegistries = [], engineeringSources = [];
  async function scan(path) {
    for (const entry of await readdir(path, {withFileTypes: true})) {
      const file = join(path, entry.name);
      if (entry.isDirectory() && !['sources', 'registries', 'engineering'].includes(entry.name)) await scan(file);
      else if (entry.isFile() && entry.name === 'protocol.json') {
        const bytes = await readFile(file), portable = file.replaceAll('\\', '/');
        collectRegisteredSeeds(JSON.parse(bytes), excluded);
        seedRegistries.push({path: portable, sha256: digest(bytes)});
        const target = join(directory, 'registries', file); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes, {flag: 'wx'});
      }
    }
  }
  await scan('evidence');
  for (const file of (await readdir('tests')).filter(name => name.endsWith('.mjs')).sort()) {
    const bytes = await readFile(join('tests', file));
    for (const match of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)) {
      const value = Number(match[0].replaceAll('_', '')); if (Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff) excluded.add(value);
    }
    engineeringSources.push({path: `tests/${file}`, sha256: digest(bytes)});
    await mkdir(join(directory, 'engineering'), {recursive: true}); await writeFile(join(directory, 'engineering', file), bytes, {flag: 'wx'});
  }
  const used = new Set(excluded), fresh = () => { let seed; do { seed = randomBytes(4).readUInt32BE(); } while (!seed || used.has(seed)); used.add(seed); return seed; };
  const histories = Array.from({length: 24}, () => ({seed: fresh(), resourceSeeds: Array.from({length: 4}, fresh), probeSeeds: {A: fresh(), B: fresh(), C: fresh()}}));
  const critical = JSON.parse(execFileSync(python, ['-c', 'import json; from scipy.stats import t; print(json.dumps({"simultaneous":{k:float(t.ppf(1-.05/13,n-1)) for k,n in [("development",8),("confirmation",16)]},"descriptive":{k:float(t.ppf(.975,n-1)) for k,n in [("development",8),("confirmation",16)]}}))'], {encoding: 'utf8'}));
  const protocol = {schema: 1, experiment: 'bounded-retrace-embodied-development-v1', createdAt: new Date().toISOString(),
    archiveManifestSha256: digest(manifestBytes), sourceSha256, seedRegistries, engineeringSources, excludedSeeds: [...excluded].sort((a, b) => a - b),
    developmentHistories: histories.slice(0, 8), confirmationHistories: histories.slice(8),
    referenceFile, referenceSha256: digest(referenceBytes), reference: {founders: reference.founders, parameters: reference.parameters, actorParameters: reference.actorParameters},
    arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES, contrasts: REPLAY_CONTRASTS,
    pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17},
    programs: {candidate: 'linear-retrace-v1', oneStep: 'linear-replay-one-step-v1', linear: 'linear-sarsa-v1', reflex: 'feeding-reflex-v1'},
    critical: critical.simultaneous, descriptiveCritical: critical.descriptive, alphaPerTest: .05 / 13, minimumMultiStepFraction: .1,
    budget: {developmentWorlds: 224, confirmationWorlds: 304, totalWorlds: 528,
      totalCollectionWorldSteps: 8 * (10 * 1792 + 18 * 256) + 16 * (10 * 1792 + 9 * 256),
      explanation: 'One fixed replay candidate is paired with a one-step replay control sharing its buffer, transition metadata, behavior-probability recording, and price model. Candidate also receives all original arms, the preceding linear learner, and the fixed reflex. Development runs candidate plus one-step probes; confirmation omits the one-step probes. The added matched program yields 528 total main/probe worlds and 503808 collection world-steps. Cold physical and numerical audits are repeat computation, not independent scientific units.'},
    hypothesis: 'Keep the original 40 linear features, Expected SARSA(lambda=.9), epsilon=.1, gamma=exp(-duration/256), live rate .05, replay rate .01, and 16 recent plus 48 reservoir records. Change only replay: after each matured live transition, uniformly sample one retained anchor and form a capped forward Retrace-style correction over up to 16 contiguous, already-matured records from the same body. Join only consecutive experience numbers whose ticks and stored feature vectors agree exactly; stop at terminal, missing/gapped/mismatched record or horizon. Each next-action ratio uses the current epsilon-greedy target probability divided by the nominal behavior probability logged at that historical choice, clipped above at 1, multiplied by gamma and .9. Apply one semi-gradient update at the sampled anchor; do not backpropagate through online traces or update unrelated records. One-step control has replay coefficient zero and otherwise uses the same added metadata and machinery. Require at least 10% of candidate replay updates to contain multiple records in every history. This is one fixed human-proposed temporal-credit hypothesis, not a search over replay variants.',
    accounting: 'Factual transition contents, saved behavior probability, model, traces, buffers, pending state, diagnostics and counters are canonical persistent state and storage-priced. Count feature/value work, retention/replay draws, index construction/lookups, feature equality checks, policy ratios, coefficient arithmetic and the one anchor gradient. Recorded model energy uses declared operation and byte-second prices; wall and CPU time are separately measured and do not stand in for embodied cost. Evaluator recording and probes do not train the main body.',
    developmentRule: 'Use eight fresh independent histories. Advance this exact candidate only if all twelve required contrast means are strictly positive, all nine mean survival guards are nonnegative, and every history meets the prespecified multi-step activity minimum. The optional online-trace comparison is descriptive. Development is not qualification. If any gate fails, never open the reserved confirmation bank, tune, resample, extend or substitute another replay variant on this bank.',
    confirmationRule: 'Only after all development physical and independent numeric audits pass and the development rule passes, collect the sixteen reserved fresh histories with identical captured sources and settings. Require positive simultaneous Student-t lower bounds and exact paired sign-flip p<=.05/13 for each required contrast, all nine nonnegative observed mean survival guards, and the activity minimum in every history. A/B initial skill and each skill retention remain separate required contrasts. Survival screens are not a noninferiority claim.',
    probeRule: 'Retain all original nine 256-tick read-only A/B/C skill and retention probes on unseen resource seeds. Candidate bodies and within-program matched states/RNG remain paired; all original founders including deaths remain denominators; probes do not feed learning. The one-step program receives the same nine development probes so its skill effects are directly interpretable; confirmation uses only candidate probes.',
    preservation: 'Earlier locked intervention and fixed Expected SARSA screens failed their reported gates. The local-tile development screen also failed. Their protocols, sources, failed contrasts, and all unused reserves remain excluded from this fresh bank. The one-step matched control is a research comparator, not evidence of improvement.',
    boundary: 'A replay or embodied-skill pass would still not demonstrate persistent autonomous algorithm revision, improvement over copied-improvement controls, improved subsequent search, ecological readiness, or RSI.'};
  validateReplayProtocol(protocol); await writeExclusive(join(directory, 'protocol.json'), protocol);
  console.log(JSON.stringify({initialized: directory, budget: protocol.budget, registeredSeedFiles: seedRegistries.length, excludedSeeds: excluded.size, developmentHistories: 8, reservedConfirmationHistories: 16}));
}

async function loadProtocol(directory) {
  const bytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(bytes);
  validateReplayProtocol(p); await verifySarsaSources(directory, p);
  assert.equal(digest(await readFile(join(directory, 'evidence-manifest.json'))), p.archiveManifestSha256, 'Captured archive manifest identity');
  return {bytes, p};
}
async function readRows(directory, p, phase) {
  const histories = phase === 'development' ? p.developmentHistories : p.confirmationHistories, rows = [];
  for (const history of histories) rows.push(JSON.parse(await readFile(join(directory, phase, 'rows', `${history.seed}.json`))));
  rows.forEach((row, i) => validateReplayRow(row, histories[i], p, phase)); return rows;
}
async function main() {
  const [command, input, phase = 'development', python = process.platform === 'win32' ? '.venv-research/Scripts/python.exe' : '.venv-research/bin/python'] = process.argv.slice(2);
  assert.ok(input && ['init', 'collect', 'score', 'audit'].includes(command)); const directory = resolve(input);
  if (command === 'init') return initialize(directory, phase === 'development' ? python : phase);
  assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/replay-development.mjs')).href, 'Run the immutable captured entrypoint');
  assert.ok(['development', 'confirmation'].includes(phase));
  const {bytes, p} = await loadProtocol(directory), hashProtocol = digest(bytes), folder = join(directory, phase);
  const histories = phase === 'development' ? p.developmentHistories : p.confirmationHistories;
  if (command === 'collect') {
    if (phase === 'confirmation') {
      const resultsBytes = await readFile(join(directory, 'development/results.json')), results = JSON.parse(resultsBytes);
      assert.equal(results.promising, true, 'Development gate failed; the reserve remains closed');
      for (const name of ['physical-audit.json', 'numeric-audit.json']) {
        const audit = JSON.parse(await readFile(join(directory, 'development', name)));
        assert.equal(audit.passed, true); assert.equal(audit.protocolSha256, hashProtocol); assert.equal(audit.resultsSha256, digest(resultsBytes));
      }
    }
    await mkdir(join(folder, 'rows'), {recursive: true}); await mkdir(join(folder, 'numerics'), {recursive: true});
    for (const history of histories) {
      const rowPath = join(folder, 'rows', `${history.seed}.json`), tracePath = join(folder, 'numerics', `${history.seed}.jsonl`);
      try { const old = JSON.parse(await readFile(rowPath)); validateReplayRow(old, history, p, phase); assert.equal(old.protocolSha256, hashProtocol); assert.equal(digest(await readFile(tracePath)), old.numericsSha256); continue; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const start = performance.now(), cpu = process.cpuUsage(), fd = openSync(tracePath, 'wx'), hash = createHash('sha256'); let row;
      try { row = simulateReplayHistory(p, history, phase, event => { const line = JSON.stringify(event) + '\n'; writeSync(fd, line); hash.update(line); }); }
      finally { closeSync(fd); }
      validateReplayRow(row, history, p, phase);
      const runtime = {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu), node: process.version, platform: process.platform};
      await writeExclusive(rowPath, {...row, protocolSha256: hashProtocol, numericsSha256: hash.digest('hex'), runtime});
      console.log(JSON.stringify({phase, seed: history.seed, ...runtime}));
    }
  } else if (command === 'score') {
    const rows = await readRows(directory, p, phase), scored = scoreReplayRows(rows, p, phase);
    await writeExclusive(join(folder, 'results.json'), {...scored, protocolSha256: hashProtocol,
      rowSha256: await Promise.all(histories.map(async history => digest(await readFile(join(folder, 'rows', `${history.seed}.json`)))))});
    console.log(JSON.stringify({promising: scored.promising, qualified: scored.qualified,
      comparisons: scored.comparisons.map(c => ({id: c.id, mean: c.mean, lower: c.simultaneousLower, passed: c.developmentalPositive}))}));
  } else {
    const rows = await readRows(directory, p, phase), resultBytes = await readFile(join(folder, 'results.json'));
    const {protocolSha256, rowSha256, ...scored} = JSON.parse(resultBytes); assert.equal(protocolSha256, hashProtocol);
    const expected = scoreReplayRows(rows, p, phase); assert.deepEqual(scored, expected);
    const start = performance.now(), cpu = process.cpuUsage();
    for (const [i, history] of histories.entries()) {
      const hash = createHash('sha256'), replayed = simulateReplayHistory(p, history, phase, event => hash.update(JSON.stringify(event) + '\n'));
      const {runtime, protocolSha256: rowProtocol, numericsSha256, ...original} = rows[i];
      assert.equal(rowProtocol, hashProtocol); assert.equal(hash.digest('hex'), numericsSha256);
      assert.equal(digest(await readFile(join(folder, 'numerics', `${history.seed}.jsonl`))), numericsSha256);
      assert.deepEqual(replayed, original); console.log(JSON.stringify({phase, coldReplayed: history.seed, completed: i + 1}));
    }
    await writeExclusive(join(folder, 'physical-audit.json'), {schema: 1, passed: true, phase, protocolSha256: hashProtocol, resultsSha256: digest(resultBytes), histories: histories.length,
      mainWorlds: histories.length * 10, probes: histories.length * (phase === 'development' ? 18 : 9), replayActivityPassed: expected.replayActivity.filter(v => v.passed).length,
      runtime: {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu)}});
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
