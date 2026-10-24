// Offline budgeted revision selection. Neither this policy nor its preference
// learner receives the final scoring windows. No World import or file access.
import {createHash} from 'node:crypto';
import {KERNEL_PROGRAM_NAMES, createKernelLearner, predictKernel, updateKernel, migrateKernel, restoreKernelLearner} from './kernel-learner.mjs';
import {outcomeExample} from './self-modifying-tasks.mjs';
const mean = x => x.reduce((a, b) => a + b, 0) / x.length;
const clip = x => Math.max(-1, Math.min(1, x));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const SEARCH_PROGRAMS = Object.freeze(KERNEL_PROGRAM_NAMES.flatMap(kernel => ['gradient', 'ridge'].map(update => ({kernel, update}))));
export const SEARCH_INCUMBENT = Object.freeze({kernel: 'rbf', update: 'gradient'});
export const programId = program => program.kernel + ':' + program.update;
const incumbentId = programId(SEARCH_INCUMBENT);
const idToProgram = id => SEARCH_PROGRAMS.find(program => programId(program) === id);

export function prepareRevisionTask(worlds) {
  if (worlds.length !== 2 || worlds[0].seed !== worlds[1].seed) throw Error('Invalid revision task worlds');
  const a = worlds.find(w => w.environment === 'fixed'), b = worlds.find(w => w.environment === 'relocation');
  if (!a || !b) throw Error('Missing revision task environment');
  const agents = [];
  for (const agentId of [1, 2]) {
    const block = (world, part) => world.windows.filter(w => w.agentId === agentId && (part === 'train' ? w.tick + 7 < 900 : part === 'validation' ? w.tick >= 900 && w.tick + 7 < 1300 : w.tick >= 1300)).map(outcomeExample);
    const data = {aTrain: block(a, 'train'), bTrain: block(b, 'train'), aValidation: block(a, 'validation'), bValidation: block(b, 'validation'), aFinal: block(a, 'final'), bFinal: block(b, 'final')};
    if (Object.values(data).some(rows => rows.length < 8)) throw Error('Insufficient revision task windows');
    const old = createKernelLearner(20, SEARCH_INCUMBENT);
    for (const example of data.aTrain) updateKernel(old, example.input, example.target);
    agents.push({agentId, old, ...data});
  }
  // Context derives only from already-experienced A training, never B/future
  // validation or final windows. These transforms are fixed before the study.
  const rows = agents.flatMap(a => a.aTrain), avg = key => mean(rows.map(row => row.input[key]));
  const rewardMean = mean(rows.map(row => row.target)), variance = mean(rows.map(row => (row.target - rewardMean) ** 2));
  const context = [1, clip(rewardMean / .1), clip(Math.sqrt(variance) / .2), avg(4), avg(5), avg(9), avg(6), avg(7)];
  return {seed: a.seed, context, agents};
}

const score = (state, rows) => mean(rows.map(row => (row.target - predictKernel(state, row.input)) ** 2));
export function evaluateRevision(task, program, {final = false} = {}) {
  if (!idToProgram(programId(program))) throw Error('Unlisted revision program');
  const rows = task.agents.map(agent => {
    const state = migrateKernel(agent.old, program), migrationWork = structuredClone(state.work);
    for (const example of agent.bTrain) updateKernel(state, example.input, example.target);
    const aQueries = final ? agent.aFinal : agent.aValidation, bQueries = final ? agent.bFinal : agent.bValidation;
    return {agentId: agent.agentId, a: score(state, aQueries), b: score(state, bQueries), aBefore: score(agent.old, aQueries), resetA: mean(aQueries.map(row => row.target ** 2)), resetB: mean(bQueries.map(row => row.target ** 2)), acquiredRecords: state.records.length, ownFactsHash: digest(state.records), finalStateHash: digest(state), migrationWork, finalWork: structuredClone(state.work)};
  });
  return {program, rows, ...Object.fromEntries(['a', 'b', 'aBefore', 'resetA', 'resetB'].map(key => [key, mean(rows.map(row => row[key]))]))};
}

export function revisionValue(result, baseline) {
  const a = (baseline.a - result.a) / Math.max(1e-8, baseline.a), b = (baseline.b - result.b) / Math.max(1e-8, baseline.b), retention = (result.aBefore - result.a) / Math.max(1e-8, result.aBefore);
  return {target: clip(Math.min(a, b, retention)), eligible: a >= 0 && b >= 0 && retention >= 0 && a + b > 0, improvement: ((baseline.a + baseline.b) - (result.a + result.b)) / 2};
}

export function proposalFeatures(context, program) {
  if (!Array.isArray(context) || context.length !== 8 || context.some(x => !Number.isFinite(x) || Math.abs(x) > 1) || !idToProgram(programId(program))) throw Error('Invalid revision proposal features');
  return [...context, ...KERNEL_PROGRAM_NAMES.map(name => +(name === program.kernel)), +(program.update === 'gradient'), +(program.update === 'ridge')];
}

export function teachRevisionHistory(tasks) {
  const learner = createKernelLearner(16), facts = [], evaluations = [];
  for (const task of tasks) {
    const baseline = evaluateRevision(task, SEARCH_INCUMBENT);
    for (const program of SEARCH_PROGRAMS) {
      const result = evaluateRevision(task, program), observed = revisionValue(result, baseline), input = proposalFeatures(task.context, program);
      updateKernel(learner, input, observed.target);
      facts.push({seed: task.seed, program, input, target: observed.target}); evaluations.push(result);
    }
  }
  return {learner, facts, evaluations};
}

function random(state) {
  let x = state.rngState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rngState = x >>> 0; return state.rngState / 4294967296;
}
function staticPreference(learner, features) {
  const rows = learner.records.filter(record => record.input.slice(8).every((value, i) => value === features[i + 8]));
  return rows.length ? mean(rows.map(row => row.target)) : 0;
}

export function createRevisionSession(original, arm, context, baseline, seed, budget = 3) {
  if (!['self', 'fixed', 'reset', 'random', 'static'].includes(arm) || !Number.isInteger(seed) || seed < 1 || seed > 0xffffffff || !Number.isInteger(budget) || budget < 1 || budget > SEARCH_PROGRAMS.length - 1) throw Error('Invalid revision search settings');
  proposalFeatures(context, SEARCH_INCUMBENT);
  const learner = arm === 'self' ? migrateKernel(original, SEARCH_INCUMBENT) : arm === 'reset' ? createKernelLearner(16, SEARCH_INCUMBENT) : structuredClone(original);
  return {schema: 1, kind: 'budgeted-revision-search', arm, context: [...context], baseline: structuredClone(baseline), rngState: seed, budget, learner, queries: [], selected: structuredClone(SEARCH_INCUMBENT), selectedValidation: structuredClone(baseline), initialFactsHash: digest(learner.records)};
}

export function stepRevisionSearch(session, evaluateValidation) {
  if (session.queries.length >= session.budget) throw Error('Revision search budget exhausted');
  const used = new Set([incumbentId, ...session.queries.map(q => programId(q.program))]);
  const ranked = SEARCH_PROGRAMS.filter(program => !used.has(programId(program))).map(program => {
    const input = proposalFeatures(session.context, program), priority = random(session);
    const estimate = session.arm === 'random' ? 0 : session.arm === 'static' ? staticPreference(session.learner, input) : predictKernel(session.learner, input);
    return {program, input, estimate, priority};
  }).sort((a, b) => b.estimate - a.estimate || b.priority - a.priority);
  const chosen = ranked[0], learnerBeforeHash = digest(session.learner), result = evaluateValidation(chosen.program);
  // The callback must return validation results only. No final result key is
  // accepted or stored by this policy, and it never evaluates another program.
  const expectedKeys = ['a', 'aBefore', 'b', 'program', 'resetA', 'resetB', 'rows'];
  if (Object.keys(result).sort().join(',') !== expectedKeys.sort().join(',') || programId(result.program) !== programId(chosen.program)) throw Error('Invalid revision validation response');
  const observed = revisionValue(result, session.baseline);
  if (observed.eligible && result.a + result.b < session.selectedValidation.a + session.selectedValidation.b) { session.selected = structuredClone(chosen.program); session.selectedValidation = structuredClone(result); }
  updateKernel(session.learner, chosen.input, observed.target);
  session.queries.push({program: chosen.program, estimate: chosen.estimate, priority: chosen.priority, input: chosen.input, observed, validation: result, learnerBeforeHash, learnerAfterHash: digest(session.learner)});
  return session;
}

export function restoreRevisionSession(value) {
  if (value?.schema !== 1 || value.kind !== 'budgeted-revision-search' || !Number.isInteger(value.rngState) || value.rngState < 1 || value.rngState > 0xffffffff || !Number.isInteger(value.budget) || value.budget < 1 || value.budget >= SEARCH_PROGRAMS.length || !Array.isArray(value.queries) || value.queries.length > value.budget || !['self', 'fixed', 'reset', 'random', 'static'].includes(value.arm)) throw Error('Invalid revision search checkpoint');
  const expected = value.arm === 'self' || value.arm === 'reset' ? SEARCH_INCUMBENT : {kernel: 'linear', update: 'gradient'};
  const learner = restoreKernelLearner(value.learner);
  if (JSON.stringify(learner.program) !== JSON.stringify(expected) || learner.dimensions !== 16) throw Error('Revision modifier identity mismatch');
  const ids = value.queries.map(q => programId(q.program));
  if (ids.includes(incumbentId) || new Set(ids).size !== ids.length || ids.some(id => !idToProgram(id)) || !idToProgram(programId(value.selected))) throw Error('Invalid revision search lineage');
  proposalFeatures(value.context, value.selected);
  return structuredClone(value);
}

export function preferenceRecallError(state, facts) {
  if (!facts.length) throw Error('Empty modifier retention probe');
  return mean(facts.map(fact => (fact.target - predictKernel(state, fact.input)) ** 2));
}
