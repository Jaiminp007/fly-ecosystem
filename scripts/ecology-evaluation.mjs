import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {World} from '../engine.mjs';

const SEEDS = Array.from({length: 10}, (_, i) => 2003 + i * 113);
const HORIZON = 7200;
const start = performance.now();
const rows = [];
for (const seed of SEEDS) {
  const pair = [];
  for (const ecology of ['baseline', 'relocation']) {
    const world = new World({seed, founders: 24, capacity: 240, learning: true, mutation: true,
      nutrient: 3, seasonal: false, challenges: 'off', ecology});
    const initialFounders = JSON.stringify(world.flies);
    if (ecology === 'relocation') {
      const baseline = pair[0];
      if (baseline.seed !== seed || baseline.initialFounders !== initialFounders) throw Error(`Unmatched founders for seed ${seed}`);
    }
    let populationTicks = 0;
    let completed = 0;
    for (; completed < HORIZON && world.step(); completed++) populationTicks += world.flies.length;
    pair.push({seed, ecology, initialFounders, horizonTicks: HORIZON, completedTicks: completed,
      finalPopulation: world.flies.length, meanPopulation: populationTicks / Math.max(1, completed),
      births: world.totals.births, deaths: world.totals.deaths, deathCauses: world.totals.deathCauses,
      foodEaten: world.totals.foodEaten, relocations: world.events.filter(event => event.kind === 'resource-shift').length,
      energyResidual: world.metrics().accountingError, checkpoint: world.checkpoint()});
  }
  const [baseline, relocation] = pair;
  rows.push({seed, baseline: Object.fromEntries(Object.entries(baseline).filter(([key]) => key !== 'initialFounders' && key !== 'checkpoint')),
    relocation: Object.fromEntries(Object.entries(relocation).filter(([key]) => key !== 'initialFounders' && key !== 'checkpoint')),
    pairedMeanPopulationDifference: relocation.meanPopulation - baseline.meanPopulation,
    pairedFoodEatenDifference: relocation.foodEaten - baseline.foodEaten});
  console.log(JSON.stringify({seed, baselinePopulation: baseline.finalPopulation,
    relocationPopulation: relocation.finalPopulation, relocations: relocation.relocations}, null, 0));
}
const mean = key => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
const differences = rows.map(row => row.pairedMeanPopulationDifference);
const avg = differences.reduce((a, b) => a + b, 0) / differences.length;
const sd = Math.sqrt(differences.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (differences.length - 1));
const halfWidth = 2.262 * sd / Math.sqrt(differences.length);
const sourceSha256 = {};
for (const path of ['engine.mjs', 'challenges.mjs', 'scripts/ecology-evaluation.mjs'])
  sourceSha256[path] = createHash('sha256').update(await readFile(new URL(`../${path}`, import.meta.url))).digest('hex');
const report = {protocol: {treatments: 'Matched same-seed worlds, stable renewal centers versus seeded unpredictable renewal-center relocation.',
  founders: 24, horizonTicks: HORIZON, reproduction: 'enabled', mutations: 'enabled', learning: 'enabled in both',
  challenges: 'off in both', seasonality: 'off in both', seeds: SEEDS,
  unitOfReplication: 'seed pair', primaryEndpoint: 'mean living population over completed ticks',
  uncertainty: 'paired mean difference and two-sided 95% t interval with 9 degrees of freedom'},
  sourceSha256, rows,
  summary: {meanBaselinePopulation: rows.reduce((sum, row) => sum + row.baseline.meanPopulation, 0) / rows.length,
    meanRelocationPopulation: rows.reduce((sum, row) => sum + row.relocation.meanPopulation, 0) / rows.length,
    pairedMeanPopulationDifference: avg, ci95: [avg - halfWidth, avg + halfWidth],
    meanFoodEatenDifference: mean('pairedFoodEatenDifference'), wallSeconds: (performance.now() - start) / 1000},
  interpretation: 'This is a descriptive ecological pressure comparison. Evolution and lifetime learning remain enabled; it cannot isolate a neural learning effect or establish stable niche formation.'};
const directory = new URL('../evidence/ecology-relocation/', import.meta.url);
await mkdir(directory, {recursive: true});
await writeFile(new URL('results.json', directory), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(new URL('summary.md', directory), `# Seeded food relocation comparison\n\n`+
  `Ten paired seeds compared stable renewal centers to seeded relocations over ${HORIZON} ticks. Both arms retain reproduction, mutation, and learning.\n\n`+
  `- Mean population: baseline ${report.summary.meanBaselinePopulation.toFixed(1)}, relocation ${report.summary.meanRelocationPopulation.toFixed(1)}.\n`+
  `- Paired mean population difference: ${avg.toFixed(2)} (95% t interval ${report.summary.ci95[0].toFixed(2)} to ${report.summary.ci95[1].toFixed(2)}).\n`+
  `- ${report.interpretation}\n\nSee results.json for seed-level outcomes and source hashes.\n`);
console.log(JSON.stringify(report.summary, null, 2));
