import {createHash} from 'node:crypto';
import {createKernelLearner, predictKernel, updateKernel, migrateKernel, INITIAL_KERNEL_PROGRAM} from './kernel-learner.mjs';
import {outcomeExample, pairedSignFlip} from './self-modifying-tasks.mjs';
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const UPGRADE_PROGRAMS = Object.freeze([
  {kernel: 'linear', update: 'gradient'}, {kernel: 'linear', update: 'ridge'},
  {kernel: 'rbf', update: 'gradient'}, {kernel: 'rbf', update: 'ridge'}
]);

export function scoreAlgorithmUpgrade(program, worlds, {incumbent = INITIAL_KERNEL_PROGRAM, capture = false} = {}) {
  const rows = [];
  for (const seed of [...new Set(worlds.map(w => w.seed))]) {
    const a = worlds.find(w => w.seed === seed && w.environment === 'fixed'), b = worlds.find(w => w.seed === seed && w.environment === 'relocation');
    if (!a || !b) throw Error('Missing upgrade task pair');
    const perAgent = [];
    for (const agentId of [1, 2]) {
      const examples = (world, train) => world.windows.filter(w => w.agentId === agentId && (train ? w.tick + 7 < 900 : w.tick >= 900)).map(outcomeExample);
      const aTrain = examples(a, true), aTest = examples(a, false), bTrain = examples(b, true), bTest = examples(b, false);
      if (Math.min(aTrain.length, aTest.length, bTrain.length, bTest.length) < 8) throw Error('Insufficient upgrade task examples');
      const old = createKernelLearner(20, incumbent);
      for (const example of aTrain) updateKernel(old, example.input, example.target);
      const score = (state, examples) => mean(examples.map(x => (x.target - predictKernel(state, x.input)) ** 2));
      const aBefore = score(old, aTest), beforeHash = hash(old), next = migrateKernel(old, program);
      if (hash(old) !== beforeHash || JSON.stringify(old.records) !== JSON.stringify(next.records)) throw Error('Migration changed or lost factual experience');
      const aMigrated = score(next, aTest), migrationWork = structuredClone(next.work);
      for (const example of bTrain) updateKernel(next, example.input, example.target);
      const aAfter = score(next, aTest), bAfter = score(next, bTest), lifetimeWork = Object.fromEntries(Object.keys(old.work).map(key => [key, old.work[key] + next.work[key]]));
      perAgent.push({agentId, aBefore, aMigrated, aAfter, bAfter, aReset: mean(aTest.map(x => x.target ** 2)), bReset: mean(bTest.map(x => x.target ** 2)), migrationRetention: aBefore - aMigrated, totalRetention: aBefore - aAfter, trainCounts: [aTrain.length, bTrain.length], testCounts: [aTest.length, bTest.length], recordsPreserved: true, initialStateHash: beforeHash, finalStateHash: hash(next), acquiredRecords: next.records.length, seen: next.seen, migrationWork, lifetimeWork, ...(capture && seed === worlds[0].seed && agentId === 1 ? {oldState: old, finalState: next} : {})});
    }
    rows.push({seed, ...Object.fromEntries(['aBefore', 'aMigrated', 'aAfter', 'bAfter', 'aReset', 'bReset', 'migrationRetention', 'totalRetention'].map(key => [key, mean(perAgent.map(r => r[key]))])), perAgent});
  }
  if (!rows.length) throw Error('Empty upgrade task set');
  return {program, incumbent, rows, meanA: mean(rows.map(r => r.aAfter)), meanB: mean(rows.map(r => r.bAfter))};
}

export function compareAlgorithmUpgrade(candidate, control, alpha) {
  if (candidate.rows.length !== control.rows.length || !(alpha > 0 && alpha < 1)) throw Error('Invalid upgrade comparison');
  const paired = candidate.rows.map((r, i) => {
    const old = control.rows[i]; if (r.seed !== old.seed) throw Error('Unmatched upgrade seeds');
    return {seed: r.seed, aImprovement: old.aAfter - r.aAfter, bImprovement: old.bAfter - r.bAfter, aLearning: r.aReset - r.aAfter, bLearning: r.bReset - r.bAfter, migrationRetention: r.migrationRetention, totalRetention: r.totalRetention};
  });
  const metrics = Object.fromEntries(Object.keys(paired[0]).filter(key => key !== 'seed').map(key => [key, pairedSignFlip(paired.map(r => r[key]))]));
  const passed = ['aImprovement', 'bImprovement', 'aLearning', 'bLearning'].every(key => metrics[key].mean > 0 && metrics[key].pOneSided <= alpha) && metrics.migrationRetention.mean >= 0 && metrics.totalRetention.mean >= 0;
  return {alpha, metrics, paired, passed};
}

// Selection uses development observations only. Each program is a bounded
// executable algorithm, not a label for a precomputed prediction array.
export function selectAlgorithmUpgrade(worlds, incumbent = INITIAL_KERNEL_PROGRAM) {
  const baseline = scoreAlgorithmUpgrade(incumbent, worlds, {incumbent});
  const candidates = UPGRADE_PROGRAMS.map(program => {
    const score = scoreAlgorithmUpgrade(program, worlds, {incumbent});
    const objective = Math.min((baseline.meanA - score.meanA) / baseline.meanA, (baseline.meanB - score.meanB) / baseline.meanB);
    return {program, score, objective};
  });
  const selected = candidates.reduce((best, candidate) => candidate.objective > best.objective ? candidate : best);
  return {baseline, candidates, selectedProgram: selected.program, selectedObjective: selected.objective};
}
