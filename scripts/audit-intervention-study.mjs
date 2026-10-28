import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {digest, collectInterventionWorld, independentChoice} from '../learning/intervention-study.mjs';
import {verifySources, readRows, fitModels, selectModel, scoreHeldout} from './intervention-study.mjs';

// Full cold physical replay plus separate deterministic learner/scoring replay.
// Independent numerical/statistical arithmetic is in the Python auditor.
const directory = resolve(process.argv[2] || '');
assert.ok(process.argv[2]);
assert.equal(import.meta.url, pathToFileURL(join(directory, 'sources/scripts/audit-intervention-study.mjs')).href, 'Run the captured auditor inside DIRECTORY/sources/scripts');
const protocolBytes = await readFile(join(directory, 'protocol.json')), protocol = JSON.parse(protocolBytes);
await verifySources(directory, protocol);
const lockedBytes = await readFile(join(directory, 'locked-selection.json')), locked = JSON.parse(lockedBytes), modelBytes = await readFile(join(directory, 'models.json')), models = JSON.parse(modelBytes);
assert.equal(locked.protocolSha256, digest(protocolBytes)); assert.equal(locked.modelsSha256, digest(modelBytes));
const development = await readRows(directory, 'development', protocol), heldout = await readRows(directory, 'heldout', protocol), all = [...development, ...heldout];
const seeds = [...protocol.developmentSeeds, ...protocol.heldoutSeeds]; assert.equal(new Set(seeds).size, seeds.length);
for (const registry of protocol.seedRegistries) assert.equal(digest(await readFile(registry.path)), registry.sha256);
const {World} = await import(pathToFileURL(join(directory, 'sources/engine.mjs')));
let cases = 0, forkSteps = 0;
for (const row of all) {
  const regenerated = collectInterventionWorld(World, protocol, row.seed, row.environment);
  assert.deepEqual(regenerated, row);
  for (const c of row.cases) assert.equal(c.uniformChoice, independentChoice(protocol.assignmentSeed, row.seed, row.environment, c.tick, c.agentId));
  cases += row.cases.length; forkSteps += row.forkWorldSteps;
  console.log(JSON.stringify({auditWorld: `${row.seed}:${row.environment}`, cases, forkSteps}));
}
const rebuilt = fitModels(development, protocol);
assert.equal(digest(rebuilt), digest(models));
for (const [key, model] of Object.entries(rebuilt)) assert.equal(digest(model), locked.modelHashes[key]);
assert.deepEqual(selectModel(development, rebuilt, protocol), {selected: locked.selected, candidates: locked.candidates});
const results = JSON.parse(await readFile(join(directory, 'results.json'))), rescored = scoreHeldout(heldout, rebuilt, locked.selected, protocol);
assert.equal(results.protocolSha256, digest(protocolBytes)); assert.equal(results.lockSha256, digest(lockedBytes));
for (const [key, value] of Object.entries(rescored)) assert.deepEqual(value, results[key], key);
const altered = structuredClone(heldout), first = altered[0].cases.find(c => !c.alreadyDead);
assert.ok(first); first.arms.fast[256].energyChange += .5;
assert.notDeepEqual(scoreHeldout(altered, models, locked.selected, protocol), rescored);
const audit = {completedAt: new Date().toISOString(), worldsColdReplayed: all.length, scheduledCases: cases, forkWorldSteps: forkSteps, modelsRebuilt: Object.keys(models).length,
  exactAllPhysicalRows: true, exactAllModelStates: true, exactSelection: true, exactScoresAndGates: true, alteredOutcomeChangesScores: true,
  scope: 'Archived physical sources, initial worlds and every action branch cold replayed; all development fits and seed-level scores replayed. This is reproducibility evidence, not another independent scientific sample.'};
await writeFile(join(directory, 'audit.json'), JSON.stringify(audit, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(audit, null, 2));
