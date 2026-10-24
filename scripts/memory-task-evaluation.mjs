import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {World, RNG, brainStep, INPUTS} from '../engine.mjs';

const ROOT = new URL('../', import.meta.url);
const SEEDS = Array.from({length: 10}, (_, i) => 1001 + i * 137);
const TRAIN_TRIALS = 64;
const TEST_TRIALS = 48;
const TRAIN_DELAYS = [10, 16, 22];
const TEST_DELAYS = [28, 34];

function freshBrain(genome) {
  return {activity: Object.fromEntries(genome.nodes.map(node => [node.id, 0])),
    plastic: genome.edges.map(() => 0), eligibility: genome.edges.map(() => 0), baseline: 0};
}

function makeTrials(seed, count, delays, amplitudes) {
  const rng = new RNG(seed);
  return Array.from({length: count}, () => ({side: rng.next() < .5 ? -1 : 1,
    delay: delays[Math.floor(rng.next() * delays.length)], amplitude: amplitudes[Math.floor(rng.next() * amplitudes.length)]}));
}

function inputsFor(side, amplitude) {
  const values = Array(INPUTS.length).fill(0);
  if (side < 0) values[1] = amplitude;
  else values[2] = amplitude;
  return values;
}

function evaluateTrial(genome, brain, trial, learning, rewardedTraining) {
  let output = [0, 0, 0, 0, 0];
  let reward = 0;
  const cue = inputsFor(trial.side, trial.amplitude);
  for (let tick = 0; tick < 4; tick++) output = brainStep(genome, brain, cue, reward, learning);
  for (let tick = 0; tick < trial.delay; tick++) output = brainStep(genome, brain, Array(INPUTS.length).fill(0), reward, learning);
  // The cue and periodic clock inputs are absent at choice. No future task state is read here.
  output = brainStep(genome, brain, Array(INPUTS.length).fill(0), reward, learning);
  const choice = output[0] >= 0 ? 1 : -1;
  const correct = choice === trial.side;
  reward = rewardedTraining ? (correct ? 1 : -1) : 0;
  if (rewardedTraining) brainStep(genome, brain, Array(INPUTS.length).fill(0), reward, learning);
  return {correct, choice, response: output[0], reward: correct ? 1 : 0};
}

function runSeed(seed) {
  const world = new World({seed, founders: 2, capacity: 2, learning: true, mutation: false,
    seasonal: false, nutrient: 0, challenges: 'off'});
  const genome = structuredClone(world.flies[0].genome);
  const training = makeTrials(seed ^ 0x51f15e, TRAIN_TRIALS, TRAIN_DELAYS, [.7, 1]);
  const heldOut = makeTrials(seed ^ 0x2da06, TEST_TRIALS, TEST_DELAYS, [.55, .85]);
  const arms = {};
  for (const arm of ['learned', 'frozen', 'reset']) {
    const brain = freshBrain(genome);
    for (const trial of training) evaluateTrial(genome, brain, trial, arm !== 'frozen', arm !== 'frozen');
    // Reset ablation clears recurrent activity, acquired weights, eligibility traces, and reward baseline.
    if (arm === 'reset') Object.assign(brain, freshBrain(genome));
    const results = heldOut.map(trial => evaluateTrial(genome, brain, trial, false, false));
    arms[arm] = {successes: results.filter(result => result.correct).length,
      trials: results.length, accuracy: results.filter(result => result.correct).length / results.length,
      meanSignedResponse: results.reduce((sum, result) => sum + result.response * result.choice, 0) / results.length};
  }
  return {seed, genomeSha256: createHash('sha256').update(JSON.stringify(genome)).digest('hex'),
    trainingTrials: TRAIN_TRIALS, heldOutTrials: TEST_TRIALS, arms};
}

const start = performance.now();
const rows = SEEDS.map(runSeed);
const differences = rows.map(row => row.arms.learned.accuracy - row.arms.frozen.accuracy);
const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
const sd = Math.sqrt(differences.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (differences.length - 1));
const halfWidth = 2.262 * sd / Math.sqrt(differences.length);
const sourceFiles = ['engine.mjs', 'scripts/memory-task-evaluation.mjs'];
const sourceSha256 = {};
for (const file of sourceFiles) sourceSha256[file] = createHash('sha256').update(await readFile(new URL(file, ROOT))).digest('hex');
const report = {protocol: {task: 'Delayed left/right cue, cue removed before choice; no periodic clock input; one fixed genome per seed; reproduction disabled; mutations disabled; training and held-out trials use separate seeded schedules.',
  training: {trials: TRAIN_TRIALS, delayTicks: TRAIN_DELAYS, cueStrengths: [.7, 1]},
  heldOut: {trials: TEST_TRIALS, delayTicks: TEST_DELAYS, cueStrengths: [.55, .85]},
  arms: {learned: 'Plasticity enabled during training; acquired state retained; frozen evaluation.',
    frozen: 'Plasticity disabled from the first training trial; frozen evaluation.',
    reset: 'Same training as learned; plastic weights, recurrent state, eligibility, and reward baseline reset before frozen evaluation.'},
  primaryEndpoint: 'Held-out choice accuracy; seed is the unit of replication.',
  confidenceInterval: 'Paired mean difference learned minus frozen, t interval with 9 degrees of freedom (2.262 multiplier). Ten independent seeds.'},
  sourceSha256, rows, summary: {pairedAccuracyDifference: mean,
    ci95: [mean - halfWidth, mean + halfWidth],
    learnedMeanAccuracy: rows.reduce((sum, row) => sum + row.arms.learned.accuracy, 0) / rows.length,
    frozenMeanAccuracy: rows.reduce((sum, row) => sum + row.arms.frozen.accuracy, 0) / rows.length,
    resetMeanAccuracy: rows.reduce((sum, row) => sum + row.arms.reset.accuracy, 0) / rows.length,
    wallSeconds: (performance.now() - start) / 1000},
  interpretation: 'This compact, engineered task tests whether this controller implementation retains a delayed cue. It is not evidence of general intelligence, biological memory, or performance on the open-ended ecosystem task.'};
const directory = new URL('../evidence/memory-task/', import.meta.url);
await mkdir(directory, {recursive: true});
await writeFile(new URL('results.json', directory), `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# Delayed-cue memory task\n\n`+
  `Protocol and seed-level results generated by scripts/memory-task-evaluation.mjs.\n\n`+
  `- Held-out accuracy: learned ${(report.summary.learnedMeanAccuracy * 100).toFixed(1)}%, frozen ${(report.summary.frozenMeanAccuracy * 100).toFixed(1)}%, reset ${(report.summary.resetMeanAccuracy * 100).toFixed(1)}%.\n`+
  `- Paired learned minus frozen difference: ${(mean * 100).toFixed(1)} percentage points (95% t interval ${(report.summary.ci95[0] * 100).toFixed(1)} to ${(report.summary.ci95[1] * 100).toFixed(1)}).\n`+
  `- Ten independent seeds; ${TRAIN_TRIALS} training and ${TEST_TRIALS} held-out trials per seed and arm.\n`+
  `- ${report.interpretation}\n\nSee results.json for the fixed protocol, each seed, source hashes, and timing.\n`;
await writeFile(new URL('summary.md', directory), markdown);
console.log(JSON.stringify(report.summary, null, 2));
