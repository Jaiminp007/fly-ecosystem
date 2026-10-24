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
import {MB_CONTRASTS, validateMushroomProtocol, simulateMushroomHistory, validateMushroomRow, scoreMushroomRows} from '../learning/mushroom-development.mjs';
import {collectRegisteredSeeds} from './sarsa-development.mjs';
import {verifySarsaSources, writeExclusive} from './sarsa-screen.mjs';

async function initialize(directory, python) {
  await mkdir(dirname(directory), {recursive: true});
  await mkdir(directory, {recursive: false});
  const manifestBytes = await readFile('handoff/evidence-manifest.json'), manifest = JSON.parse(manifestBytes);
  for (const item of manifest.files) assert.equal(digest(await readFile(item.path)), item.sha256, `Verify archived input first: ${item.path}`);
  const referenceFile = 'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/reference-protocol.json';
  const referenceBytes = await readFile(referenceFile), reference = JSON.parse(referenceBytes);
  const sourceFiles = ['engine.mjs', 'challenges.mjs', 'scripts/mushroom-development.mjs', 'scripts/sarsa-development.mjs', 'scripts/sarsa-screen.mjs',
    'scripts/audit-mushroom-development.py', 'scripts/audit-mushroom-body.py', 'scripts/audit-sarsa-development.py', 'scripts/audit-sarsa-screen.py',
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
  const protocol = {schema: 1, experiment: 'mushroom-policy-embodied-development-v1', createdAt: new Date().toISOString(),
    archiveManifestSha256: digest(manifestBytes), sourceSha256, seedRegistries, engineeringSources, excludedSeeds: [...excluded].sort((a, b) => a - b),
    developmentHistories: histories.slice(0, 8), confirmationHistories: histories.slice(8),
    referenceFile, referenceSha256: digest(referenceBytes), reference: {founders: reference.founders, parameters: reference.parameters, actorParameters: reference.actorParameters},
    arms: SARSA_ARMS, probes: SARSA_PROBES, phases: CONTINUAL_PHASES, contrasts: MB_CONTRASTS,
    pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17},
    programs: {candidate: 'mushroom-policy-v1', fastOnly: 'mushroom-fast-only-v1', linear: 'linear-sarsa-v1', reflex: 'feeding-reflex-v1'},
    critical: critical.simultaneous, descriptiveCritical: critical.descriptive, alphaPerTest: .05 / 13, minimumDopamineFraction: .5,
    budget: {developmentWorlds: 224, confirmationWorlds: 304, totalWorlds: 528,
      totalCollectionWorldSteps: 8 * (10 * 1792 + 18 * 256) + 16 * (10 * 1792 + 9 * 256),
      explanation: 'Candidate seven main arms plus a matched fast-only plasticity control, preceding linear learner and fixed reflex. Development includes candidate and fast-only probes; confirmation includes candidate probes only. Fixed ceiling: 528 worlds, 503808 collection world-steps. Audits are repeat computation, not independent scientific histories.'},
    hypothesis: 'One mushroom-body-inspired direct stochastic policy, not a biological connectome model. Fixed 64-cell sparse random sensory expansion, eight winner cells, 40 permitted current/history inputs; no phase ID or privileged resource facts. Policy probability is .05+.9*sigmoid of fast+slow readouts. Own matured eight-tick net-energy/120 reward, running reward baseline, clipped dopamine-like centered signal, policy-score eligibility, fast synaptic decay and local mass transfer into stable slow synapses. No TD bootstrap, action-value targets, counterfactual labels or transition replay. Fixed rate .1, dopamine scale .01, baseline rate .05, eligibility lambda .9/horizon128, fast horizon512, consolidation .02. Fast-only control sets consolidation to zero with all other state/pricing retained. Every history must have at least half its updates with nonzero dopamine and positive slow transfer. This is one human-proposed hypothesis.',
    accounting: 'Price each body full canonical state: fixed sparse sensory connectivity, both weight compartments, eligibility, history, pending transition, bounded 16-record factual recorder, RNG, baseline, diagnostics and counters. Charge actual explicit projection generation, sparse winner computation, policy inference, gradient, decay and consolidation arithmetic. Historical records are never used for training. Original byte-second/scalar-work model prices remain fixed; report CPU and wall separately. No probe feedback.',
    developmentRule: 'Eight fresh independent histories; advance this unchanged candidate only if all twelve required energy means are positive, all nine survival guard means nonnegative, and all plasticity activity gates pass. Require separate A/B initial skills and separate 95%-advantage retention as before. Any failure closes confirmation; no tuning, resampling, extension, alternative method or promotion on this bank.',
    confirmationRule: 'Only after development passes and both full physical and independent numerical audits pass, collect sixteen reserved fresh histories using unchanged captured source/configuration. Require positive simultaneous Student-t lower bounds AND exact paired sign-flip p<=.05/13 for all twelve required contrasts, plus the same survival and activity guards. Normal seed-mean/symmetric-effect assumptions apply. Survival guards are observed mean screens, not proven noninferiority.',
    probeRule: 'Keep all original nine 256-tick read-only A/B/C probes. Candidate and fast-only each receive them in development; only candidate in confirmation. Use within-program matched end-C physical states and synchronized policy streams, unseen family seeds and all original founders including deaths. Freeze both weight compartments, fast decay, baseline and consolidation during probes; no feedback returns.',
    preservation: 'Original intervention, fixed linear Expected SARSA, local tile development and bounded Retrace development all retain their failed scientific gates. Exclude all prior registered seeds including every unused confirmation reserve. No old bank supplies confirmation or algorithm selection. Existing task/resource schedule and energy reward remain unchanged to isolate this new learning mechanism.',
    boundary: 'A mushroom or embodied-skill pass would still not demonstrate persistent autonomous algorithm revision, improvement over copied-improvement controls, improved subsequent search, ecological readiness, or RSI.'};
  validateMushroomProtocol(protocol); await writeExclusive(join(directory, 'protocol.json'), protocol);
  console.log(JSON.stringify({initialized: directory, budget: protocol.budget, registeredSeedFiles: seedRegistries.length, excludedSeeds: excluded.size, developmentHistories: 8, reservedConfirmationHistories: 16}));
}

async function loadProtocol(directory) {
  const bytes = await readFile(join(directory, 'protocol.json')), p = JSON.parse(bytes);
  validateMushroomProtocol(p); await verifySarsaSources(directory, p);
  assert.equal(digest(await readFile(join(directory, 'evidence-manifest.json'))), p.archiveManifestSha256, 'Captured archive manifest identity');
  return {bytes, p};
}
async function readRows(directory, p, phase) {
  const histories = phase === 'development' ? p.developmentHistories : p.confirmationHistories, rows = [];
  for (const history of histories) rows.push(JSON.parse(await readFile(join(directory, phase, 'rows', `${history.seed}.json`))));
  rows.forEach((row, i) => validateMushroomRow(row, histories[i], p, phase)); return rows;
}
async function main() {
  const [command, input, phase = 'development', python = process.platform === 'win32' ? '.venv-research/Scripts/python.exe' : '.venv-research/bin/python'] = process.argv.slice(2);
  assert.ok(input && ['init', 'collect', 'score', 'audit'].includes(command)); const directory = resolve(input);
  if (command === 'init') return initialize(directory, phase === 'development' ? python : phase);
  assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/mushroom-development.mjs')).href, 'Run the immutable captured entrypoint');
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
      try { const old = JSON.parse(await readFile(rowPath)); validateMushroomRow(old, history, p, phase); assert.equal(old.protocolSha256, hashProtocol); assert.equal(digest(await readFile(tracePath)), old.numericsSha256); continue; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const start = performance.now(), cpu = process.cpuUsage(), fd = openSync(tracePath, 'wx'), hash = createHash('sha256'); let row;
      try { row = simulateMushroomHistory(p, history, phase, event => { const line = JSON.stringify(event) + '\n'; writeSync(fd, line); hash.update(line); }); }
      finally { closeSync(fd); }
      validateMushroomRow(row, history, p, phase);
      const runtime = {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu), node: process.version, platform: process.platform};
      await writeExclusive(rowPath, {...row, protocolSha256: hashProtocol, numericsSha256: hash.digest('hex'), runtime});
      console.log(JSON.stringify({phase, seed: history.seed, ...runtime}));
    }
  } else if (command === 'score') {
    const rows = await readRows(directory, p, phase), scored = scoreMushroomRows(rows, p, phase);
    await writeExclusive(join(folder, 'results.json'), {...scored, protocolSha256: hashProtocol,
      rowSha256: await Promise.all(histories.map(async history => digest(await readFile(join(folder, 'rows', `${history.seed}.json`)))))});
    console.log(JSON.stringify({promising: scored.promising, qualified: scored.qualified,
      comparisons: scored.comparisons.map(c => ({id: c.id, mean: c.mean, lower: c.simultaneousLower, passed: c.developmentalPositive}))}));
  } else {
    const rows = await readRows(directory, p, phase), resultBytes = await readFile(join(folder, 'results.json'));
    const {protocolSha256, rowSha256, ...scored} = JSON.parse(resultBytes); assert.equal(protocolSha256, hashProtocol);
    const expected = scoreMushroomRows(rows, p, phase); assert.deepEqual(scored, expected);
    const start = performance.now(), cpu = process.cpuUsage();
    for (const [i, history] of histories.entries()) {
      const hash = createHash('sha256'), mushroomed = simulateMushroomHistory(p, history, phase, event => hash.update(JSON.stringify(event) + '\n'));
      const {runtime, protocolSha256: rowProtocol, numericsSha256, ...original} = rows[i];
      assert.equal(rowProtocol, hashProtocol); assert.equal(hash.digest('hex'), numericsSha256);
      assert.equal(digest(await readFile(join(folder, 'numerics', `${history.seed}.jsonl`))), numericsSha256);
      assert.deepEqual(JSON.parse(JSON.stringify(mushroomed)), original); console.log(JSON.stringify({phase, coldReplayed: history.seed, completed: i + 1}));
    }
    await writeExclusive(join(folder, 'physical-audit.json'), {schema: 1, passed: true, phase, protocolSha256: hashProtocol, resultsSha256: digest(resultBytes), histories: histories.length,
      mainWorlds: histories.length * 10, probes: histories.length * (phase === 'development' ? 18 : 9), plasticityActivityPassed: expected.plasticityActivity.filter(v => v.passed).length,
      runtime: {wallSeconds: (performance.now() - start) / 1000, cpuMicroseconds: process.cpuUsage(cpu)}});
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
