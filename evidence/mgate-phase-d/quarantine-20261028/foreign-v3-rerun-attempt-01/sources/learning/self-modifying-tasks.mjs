import {createProgramLearner, compileProgram, predictProgram, updateProgram} from './self-modifying.mjs';

const CHANNELS = [0, 1, 2, 3, 4, 10, 11, 12, 13];
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
export function outcomeExample(window) {
  if (!Array.isArray(window.observation) || window.observation.length !== 17 || window.observation.some(x => !Number.isFinite(x) || Math.abs(x) > 1) || ![-1, 1].includes(window.choice) || !Array.isArray(window.rewards) || window.rewards.length !== 8 || window.rewards.some(x => !Number.isFinite(x) || Math.abs(x) > 1)) throw Error('Invalid factual outcome window');
  const sensed = CHANNELS.map(i => window.observation[i]);
  let target = 0, mass = 0, power = 1;
  for (const reward of window.rewards) { target += power * reward; mass += power; power *= .99; }
  return {input: [1, ...sensed, window.choice, ...sensed.map(x => x * window.choice)], target: target / mass};
}

// One learner per founder, carried from A training into B training. A's same
// future-query probe is read-only before/after B. Worlds remain unmodified.
export function scoreProgram(program, worlds, {splitTick = 900, agents = [1, 2]} = {}) {
  const compiled = compileProgram(program), seeds = [...new Set(worlds.map(w => w.seed))], rows = [];
  for (const seed of seeds) {
    const a = worlds.find(w => w.seed === seed && w.environment === 'fixed'), b = worlds.find(w => w.seed === seed && w.environment === 'relocation');
    if (!a || !b) throw Error('Missing matched factual world');
    const perAgent = [];
    for (const agentId of agents) {
      const windows = world => world.windows.filter(w => w.agentId === agentId);
      const train = world => windows(world).filter(w => w.tick + 7 < splitTick).map(outcomeExample);
      const test = world => windows(world).filter(w => w.tick >= splitTick).map(outcomeExample);
      const aTrain = train(a), aTest = test(a), bTrain = train(b), bTest = test(b);
      if (Math.min(aTrain.length, aTest.length, bTrain.length, bTest.length) < 8) throw Error('Insufficient factual windows for fixed retention task');
      const state = createProgramLearner(20, program);
      const evaluate = examples => mean(examples.map(({input, target}) => (target - predictProgram(state, input)) ** 2));
      for (const example of aTrain) updateProgram(state, example.input, example.target, compiled);
      const aBefore = evaluate(aTest), beforeB = structuredClone(state);
      let bOnlineSSE = 0;
      for (const example of bTrain) bOnlineSSE += updateProgram(state, example.input, example.target, compiled).squaredError;
      const aAfter = evaluate(aTest), bAfter = evaluate(bTest);
      perAgent.push({agentId, aBefore, aAfter, bAfter, bOnline: bOnlineSSE / bTrain.length, aReset: mean(aTest.map(x => x.target ** 2)), bReset: mean(bTest.map(x => x.target ** 2)), retentionChange: aAfter - aBefore, trainCounts: [aTrain.length, bTrain.length], testCounts: [aTest.length, bTest.length], state, beforeB});
    }
    rows.push({seed, aBefore: mean(perAgent.map(x => x.aBefore)), aAfter: mean(perAgent.map(x => x.aAfter)), bAfter: mean(perAgent.map(x => x.bAfter)), aReset: mean(perAgent.map(x => x.aReset)), bReset: mean(perAgent.map(x => x.bReset)), retentionChange: mean(perAgent.map(x => x.retentionChange)), perAgent});
  }
  if (!rows.length) throw Error('Empty program evaluation');
  return {rows, objective: mean(rows.map(x => (x.aAfter + x.bAfter) / 2 + Math.max(0, x.retentionChange)))};
}

// Exact one-sided paired sign-flip test of positive improvement. Assumes
// symmetric seed-level paired effects; the seed, not the window, is the unit.
export function pairedSignFlip(values) {
  if (!Array.isArray(values) || values.length < 2 || values.length > 20 || values.some(x => !Number.isFinite(x))) throw Error('Invalid paired effects');
  const observed = values.reduce((a, b) => a + b, 0), count = 2 ** values.length;
  let extreme = 0;
  for (let mask = 0; mask < count; mask++) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) sum += mask & 2 ** i ? values[i] : -values[i];
    if (sum >= observed - 1e-12) extreme++;
  }
  return {mean: observed / values.length, pOneSided: extreme / count, n: values.length, assumption: 'symmetric independent seed-level paired effects'};
}

export function comparePrograms(candidate, incumbent, alpha) {
  if (!(alpha > 0 && alpha < 1) || candidate.rows.length !== incumbent.rows.length) throw Error('Invalid program comparison');
  const paired = candidate.rows.map((row, i) => {
    const old = incumbent.rows[i];
    if (row.seed !== old.seed) throw Error('Unmatched program comparison seeds');
    return {seed: row.seed, a: old.aAfter - row.aAfter, b: old.bAfter - row.bAfter, retention: old.retentionChange - row.retentionChange, aLearning: row.aReset - row.aAfter, bLearning: row.bReset - row.bAfter};
  });
  const metrics = Object.fromEntries(['a', 'b', 'retention', 'aLearning', 'bLearning'].map(key => [key, pairedSignFlip(paired.map(row => row[key]))]));
  return {alpha, metrics, paired, passed: ['a', 'b', 'aLearning', 'bLearning'].every(key => metrics[key].mean > 0 && metrics[key].pOneSided <= alpha) && metrics.retention.mean >= 0};
}
