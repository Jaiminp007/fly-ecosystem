import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';
import {collectWorld} from './self-modification-study.mjs';
import {pairedSignFlip} from '../learning/self-modifying-tasks.mjs';
import {prepareRevisionTask, teachRevisionHistory, evaluateRevision, revisionValue, createRevisionSession, stepRevisionSearch, restoreRevisionSession, preferenceRecallError, SEARCH_INCUMBENT, SEARCH_PROGRAMS, programId} from '../learning/revision-search.mjs';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const SEARCH_ARMS = ['self', 'fixed', 'random', 'static', 'reset'];

export async function runSearchHistory(warmWorlds, targetWorlds, modifierSeed, {onLocked = async () => {}} = {}) {
  const warmTasks = [...new Set(warmWorlds.map(w => w.seed))].map(seed => prepareRevisionTask(warmWorlds.filter(w => w.seed === seed)));
  const target = prepareRevisionTask(targetWorlds), teaching = teachRevisionHistory(warmTasks), originalRecall = preferenceRecallError(teaching.learner, teaching.facts);
  const validationCache = new Map(), fetchValidation = program => {
    const id = programId(program);
    if (!validationCache.has(id)) validationCache.set(id, evaluateRevision(target, program));
    return structuredClone(validationCache.get(id));
  };
  const baseline = fetchValidation(SEARCH_INCUMBENT), sessions = {}, checkpointReplays = {};
  for (const arm of SEARCH_ARMS) {
    const session = createRevisionSession(teaching.learner, arm, target.context, baseline, modifierSeed);
    stepRevisionSearch(session, fetchValidation);
    const checkpoint = JSON.parse(JSON.stringify(session)), continued = restoreRevisionSession(checkpoint);
    while (session.queries.length < session.budget) stepRevisionSearch(session, fetchValidation);
    while (continued.queries.length < continued.budget) stepRevisionSearch(continued, fetchValidation);
    assert.deepEqual(continued, session);
    sessions[arm] = session; checkpointReplays[arm] = {fromQueries: checkpoint.queries.length, totalQueries: session.queries.length, exact: true, checkpointSha256: hash(JSON.stringify(checkpoint)), finalSha256: hash(JSON.stringify(session))};
  }
  // Persist every arm's selected program before any final score is computed.
  const locked = Object.fromEntries(SEARCH_ARMS.map(arm => [arm, {selected: sessions[arm].selected, sessionSha256: hash(JSON.stringify(sessions[arm]))}]));
  await onLocked(locked);
  const policyUniqueValidationPrograms = validationCache.size;
  // Diagnostic upper-budget reference, evaluated only AFTER all real choices
  // are locked. Its extra labels never train or inform any policy arm.
  let oracleProgram = SEARCH_INCUMBENT, oracleValidation = baseline;
  for (const program of SEARCH_PROGRAMS) {
    const validation = fetchValidation(program), value = revisionValue(validation, baseline);
    if (value.eligible && validation.a + validation.b < oracleValidation.a + oracleValidation.b) { oracleProgram = program; oracleValidation = validation; }
  }
  for (const arm of SEARCH_ARMS) assert.equal(hash(JSON.stringify(sessions[arm])), locked[arm].sessionSha256);
  const finalCache = new Map(), fetchFinal = program => {
    const id = programId(program);
    if (!finalCache.has(id)) finalCache.set(id, evaluateRevision(target, program, {final: true}));
    return structuredClone(finalCache.get(id));
  };
  const final = Object.fromEntries(SEARCH_ARMS.map(arm => [arm, fetchFinal(sessions[arm].selected)]));
  const baselineFinal = fetchFinal(SEARCH_INCUMBENT);
  const oracle = {program: oracleProgram, validation: oracleValidation, final: fetchFinal(oracleProgram), usedForTraining: false, usedBySearchPolicy: false};
  const recall = Object.fromEntries(SEARCH_ARMS.map(arm => [arm, preferenceRecallError(sessions[arm].learner, teaching.facts)]));
  return {warmSeeds: warmTasks.map(task => task.seed), targetSeed: target.seed, modifierSeed, context: target.context, teaching, originalRecall, locked, sessions, checkpointReplays, final, baselineFinal, oracle, recall, policyUniqueValidationPrograms, oracleExtraValidationPrograms: validationCache.size - policyUniqueValidationPrograms, uniqueValidationPrograms: validationCache.size, uniqueFinalPrograms: finalCache.size, logicalQueriesPerArm: Object.fromEntries(SEARCH_ARMS.map(arm => [arm, sessions[arm].queries.length]))};
}

export function summarizeSearch(rows, alpha) {
  const loss = result => (result.a + result.b) / 2;
  const searchEffects = Object.fromEntries(SEARCH_ARMS.filter(arm => arm !== 'self').map(arm => [arm, pairedSignFlip(rows.map(row => loss(row.final[arm]) - loss(row.final.self)))]));
  const skillEffects = Object.fromEntries(['a', 'b', 'resetA', 'resetB', 'retention', 'modifierRecall'].map(key => [key, pairedSignFlip(rows.map(row => {
    if (key === 'a' || key === 'b') return row.baselineFinal[key] - row.final.self[key];
    if (key === 'resetA') return row.final.self.resetA - row.final.self.a;
    if (key === 'resetB') return row.final.self.resetB - row.final.self.b;
    if (key === 'retention') return row.final.self.aBefore - row.final.self.a;
    return row.originalRecall - row.recall.self;
  }))]));
  const passed = Object.values(searchEffects).every(m => m.mean > 0 && m.pOneSided <= alpha) && ['a', 'b', 'resetA', 'resetB'].every(key => skillEffects[key].mean > 0 && skillEffects[key].pOneSided <= alpha) && skillEffects.retention.mean >= 0 && skillEffects.modifierRecall.mean >= 0;
  const choices = Object.fromEntries(SEARCH_ARMS.map(arm => [arm, {changed: rows.filter(row => programId(row.sessions[arm].selected) !== programId(SEARCH_INCUMBENT)).length, hiddenBothImproved: rows.filter(row => row.final[arm].a < row.baselineFinal.a && row.final[arm].b < row.baselineFinal.b).length, selectedPrograms: Object.fromEntries([...new Set(rows.map(row => programId(row.sessions[arm].selected)))].map(id => [id, rows.filter(row => programId(row.sessions[arm].selected) === id).length]))}]));
  const oracleHeadroom = {validationRevisionAvailable: rows.filter(row => programId(row.oracle.program) !== programId(SEARCH_INCUMBENT)).length, hiddenBothImproved: rows.filter(row => row.oracle.final.a < row.baselineFinal.a && row.oracle.final.b < row.baselineFinal.b).length, scope: 'Exhaustive validation reference computed after every real policy choice was locked; different query budget and never training feedback.'};
  return {alpha, independentHistories: rows.length, searchEffects, skillEffects, choices, oracleHeadroom, passed};
}

async function run() {
  const directory = resolve(process.argv[2] || `evidence/recursive-search/${randomUUID()}`);
  await mkdir(dirname(directory), {recursive: true}); await mkdir(directory); await mkdir(join(directory, 'histories'));
  const upgradeDirectory = resolve('evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865'), upgradeBytes = await readFile(join(upgradeDirectory, 'results.json')), upgrade = JSON.parse(upgradeBytes), upgradeAuditBytes = await readFile(join(upgradeDirectory, 'audit.json'));
  assert.ok(upgrade.accepted && JSON.parse(upgradeAuditBytes).accepted); assert.deepEqual(upgrade.selection.selectedProgram, SEARCH_INCUMBENT);
  const referenceBytes = await readFile(join(upgradeDirectory, 'reference-protocol.json')), reference = JSON.parse(referenceBytes), worldSources = upgrade.protocol.worldSources;
  for (const [file, sha] of Object.entries(upgrade.protocol.worldSourceSha256)) assert.equal(hash(await readFile(join(worldSources, file))), sha);
  const files = ['learning/kernel-learner.mjs', 'learning/revision-search.mjs', 'learning/self-modifying-tasks.mjs', 'learning/self-modifying.mjs', 'scripts/self-modification-study.mjs', 'scripts/recursive-search-study.mjs'], sourceSha256 = {};
  for (const file of files) { const bytes = await readFile(file), target = join(directory, 'sources', file); sourceSha256[file] = hash(bytes); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes); }
  const used = new Set(), seedRegistries = [];
  const inspect = async path => {
    let bytes; try { bytes = await readFile(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    seedRegistries.push({path, sha256: hash(bytes)});
    function walk(value, key = '') {
      if (typeof value === 'number' && /seed$/i.test(key)) used.add(value);
      if (Array.isArray(value) && /seeds$/i.test(key)) for (const seed of value.flat(Infinity)) if (Number.isInteger(seed)) used.add(seed);
      if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
    }
    walk(JSON.parse(bytes));
  };
  for (const root of await readdir('evidence', {withFileTypes: true})) if (root.isDirectory()) { const path = join('evidence', root.name); await inspect(join(path, 'protocol.json')); for (const entry of await readdir(path, {withFileTypes: true})) if (entry.isDirectory()) await inspect(join(path, entry.name, 'protocol.json')); }
  const allSeeds = [], offset = parseInt(randomUUID().slice(0, 8), 16) >>> 0;
  for (let i = 0; allSeeds.length < 112; i++) { const seed = ((offset + i * 7919) >>> 0) || 1; if (!used.has(seed) && !allSeeds.includes(seed)) allSeeds.push(seed); }
  const histories = Array.from({length: 16}, (_, index) => ({index, warmSeeds: allSeeds.slice(index * 7, index * 7 + 6), targetSeed: allSeeds[index * 7 + 6], modifierSeed: (parseInt(hash('revision-search:' + allSeeds[index * 7 + 6]).slice(0, 8), 16) >>> 0) || 1}));
  const protocol = {at: new Date().toISOString(), experiment: 'prospective-budgeted-recursive-search', sourceSha256, upgradeDirectory, upgradeResultsSha256: hash(upgradeBytes), upgradeAuditSha256: hash(upgradeAuditBytes), referenceSha256: hash(referenceBytes), worldSources, worldSourceSha256: upgrade.protocol.worldSourceSha256, seedRegistries,
    histories, programs: SEARCH_PROGRAMS, incumbent: SEARCH_INCUMBENT, arms: SEARCH_ARMS, historyCount: histories.length, warmTasksPerHistory: 6, proposalsPerArm: 3, modifierCapacity: 256, forecastCapacity: 256, splitTick: 900, finalFromTick: 1300, horizonTicks: 1800, alpha: .05 / 10,
    warmup: 'Each independent history has six unique fresh warm task pairs. The original modifier learns all declared programs\' relative worst-component validation improvements from these completed own evaluations. All arms receive identical warm facts; the self arm alone migrates that learned state to the previously validated RBF-gradient algorithm. Reset erases warm facts; random ignores predictions; static ranks conditional-program averages without task context.',
    selection: 'Each arm greedily selects three distinct non-incumbent programs using only its proposal predictions, with shared seeded random tie priorities. It updates only from its own requested validation results. Candidate validation uses windows starting at 900 and ending before 1300, never final windows starting at 1300. Keep the incumbent unless a queried revision improves both validation errors and retains the earlier task; among eligible queries minimize mean validation MSE. Lock every arm before final scoring.',
    gate: 'Positive mean final-score advantage and exact paired sign-flip p<=.05/10 for self versus EACH fixed, random, static, and reset arm; positive significant improvements of both final environment errors versus the forecasting incumbent and both acquired-versus-reset advantages. Nonnegative mean old-task retention and modifier prior-fact recall change. One fixed sample; no tuning, retry, sample extension, final-label training or live-policy promotion. Sign-flip tests assume symmetric independent history-level paired effects.',
    budgets: 'Every arm has the same three logical revision evaluations plus the common incumbent evaluation, and receives the same warm training history. Identical evaluations may be cached by the harness but their labels are exposed only to requesting arms. Separate checkpoint-verification copies repeat already requested queries without providing information to the original. After all real choices are locked, an exhaustive validation oracle separately diagnoses whether this library has available improvement; those extra labels never enter policy state. Realized kernel/matrix work and policy/oracle unique evaluations are recorded; equal query counts are not an equal-runtime claim.',
    interpretation: 'This tests whether the previously accepted learner change helps the modifier choose a subsequent forecast-algorithm revision under a real evaluation limit. Library, feature transforms, validation rules and evaluator remain fixed/human designed. New candidate kernels are PSD sums/products or fixed mathematical kernels shared by all arms. Fresh warm and target worlds across histories are mutually distinct. Forecast retention is not embodied decision quality or survival. A positive result would be a bounded recursive-search mechanism result, not completion of the full RSI objective.'};
  await writeFile(join(directory, 'protocol.json'), JSON.stringify(protocol, null, 2) + '\n'); await writeFile(join(directory, 'reference-protocol.json'), referenceBytes);
  await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'running'}) + '\n');
  console.log(JSON.stringify({directory, phase: 'locked', histories: histories.length, freshWorlds: allSeeds.length * 2}));
  const {World} = await import(pathToFileURL(join(worldSources, 'engine.mjs'))), rows = [];
  try {
    for (const history of histories) {
      const worlds = [];
      for (const seed of [...history.warmSeeds, history.targetSeed]) for (const environment of ['fixed', 'relocation']) { worlds.push(collectWorld(World, seed, environment, reference)); console.log(JSON.stringify({directory, history: history.index, phase: 'collect', worlds: worlds.length, total: (history.warmSeeds.length + 1) * 2})); }
      const path = join(directory, 'histories', String(history.index)); await mkdir(path); const worldBytes = JSON.stringify(worlds) + '\n'; await writeFile(join(path, 'worlds.json'), worldBytes);
      const row = await runSearchHistory(worlds.filter(w => history.warmSeeds.includes(w.seed)), worlds.filter(w => w.seed === history.targetSeed), history.modifierSeed, {onLocked: locked => writeFile(join(path, 'locked-choices.json'), JSON.stringify(locked) + '\n')});
      rows.push({...history, ...row, worldsSha256: hash(worldBytes)}); await writeFile(join(path, 'results.json'), JSON.stringify(rows.at(-1)) + '\n');
      await writeFile(join(directory, 'progress.json'), JSON.stringify({protocol, completed: rows.length, rows}) + '\n');
      console.log(JSON.stringify({directory, phase: 'history-complete', history: history.index, choices: Object.fromEntries(SEARCH_ARMS.map(arm => [arm, programId(row.sessions[arm].selected)]))}));
    }
    const summary = summarizeSearch(rows, protocol.alpha);
    for (const [file, sha] of Object.entries(sourceSha256)) assert.equal(hash(await readFile(file)), sha);
    const result = {protocol, rows, summary, recursiveSearchQualified: summary.passed, embodiedQualification: false, broadRSIDemonstrated: false, livePolicyChanged: false, completedAt: new Date().toISOString()};
    await writeFile(join(directory, 'results.json'), JSON.stringify(result) + '\n'); await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'complete'}) + '\n');
    console.log(JSON.stringify({directory, phase: 'complete', summary}, null, 2));
  } catch (error) {
    await writeFile(join(directory, 'runner.json'), JSON.stringify({pid: process.pid, status: 'failed', error: {name: error.name, message: error.message, stack: error.stack}}, null, 2) + '\n'); throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await run();
