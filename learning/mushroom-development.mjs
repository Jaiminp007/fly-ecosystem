import assert from 'node:assert/strict';
import {SARSA_ARMS, SARSA_PROBES} from './sarsa-experiment.mjs';
import {SARSA_CONTRASTS, simulateSarsaHistory, validateSarsaRow, sarsaEffects} from './sarsa-screen.mjs';
import {simulateReflexReference} from './sarsa-development.mjs';
import {CONTINUAL_PHASES} from './continual-regimes.mjs';
import {mean} from './intervention-study.mjs';
import {pairedSignFlip} from './self-modifying-tasks.mjs';

export const MB_CONTRASTS = Object.freeze([
  ...SARSA_CONTRASTS.filter(c => !c.optional),
  {id: 'sequence-fast-only', external: 'fastOnly'}, {id: 'sequence-linear', external: 'linear'}, {id: 'sequence-reflex', external: 'reflex'},
  SARSA_CONTRASTS.find(c => c.optional)
]);
const programIds = {candidate: 'mushroom-policy-v1', fastOnly: 'mushroom-fast-only-v1', linear: 'linear-sarsa-v1'};
export function mushroomOptions(p, phase, program) {
  return {...p, learnerProgram: programIds[program], arms: program === 'candidate' ? SARSA_ARMS : ['candidate'],
    probes: program === 'candidate' || (program === 'fastOnly' && phase === 'development') ? SARSA_PROBES : []};
}
export function validateMushroomProtocol(p) {
  assert.equal(p.experiment, 'mushroom-policy-embodied-development-v1'); assert.equal(p.reference.founders, 24);
  assert.deepEqual(p.phases, CONTINUAL_PHASES); assert.deepEqual(p.arms, SARSA_ARMS); assert.deepEqual(p.probes, SARSA_PROBES); assert.deepEqual(p.contrasts, MB_CONTRASTS);
  assert.deepEqual(p.programs, {...programIds, reflex: 'feeding-reflex-v1'});
  assert.equal(p.developmentHistories.length, 8); assert.equal(p.confirmationHistories.length, 16);
  const seeds = [...p.developmentHistories, ...p.confirmationHistories].flatMap(h => [h.seed, ...h.resourceSeeds, ...Object.values(h.probeSeeds)]);
  assert.equal(seeds.length, 192); assert.equal(new Set(seeds).size, seeds.length);
  assert.ok(seeds.every(s => Number.isInteger(s) && s > 0 && s <= 0xffffffff && !p.excludedSeeds.includes(s)));
  const {explanation: budgetExplanation, ...budget} = p.budget;
  assert.deepEqual(budget, {developmentWorlds: 224, confirmationWorlds: 304, totalWorlds: 528, totalCollectionWorldSteps: 503808});
  assert.match(budgetExplanation, /fast-only plasticity control/);
  assert.equal(p.alphaPerTest, .05 / 13); assert.equal(p.minimumDopamineFraction, .5);
}
export function simulateMushroomHistory(p, h, phase, emit = () => {}) {
  const programs = {};
  for (const program of Object.keys(programIds)) programs[program] = simulateSarsaHistory(mushroomOptions(p, phase, program), h, e => emit({program, ...e}));
  return {schema: 1, seed: h.seed, phase, resourceSeeds: h.resourceSeeds, probeSeeds: h.probeSeeds, programs, reflex: simulateReflexReference(p, h, emit)};
}
export function validateMushroomRow(row, h, p, phase) {
  assert.equal(row.seed, h.seed); assert.equal(row.phase, phase); assert.deepEqual(Object.keys(row.programs), Object.keys(programIds));
  assert.deepEqual(row.resourceSeeds, h.resourceSeeds); assert.deepEqual(row.probeSeeds, h.probeSeeds);
  for (const program of Object.keys(programIds)) validateSarsaRow(row.programs[program], h, mushroomOptions(p, phase, program));
  const ep = row.reflex.endpoint; assert.equal(ep.founders, p.reference.founders); assert.ok(Number.isFinite(ep.budgetAdjustedEnergyPerFounder) && (ep.tick === 1792 || ep.survivors === 0));
}
export function mushroomEffects(row, c, role = 'candidate') {
  const source = row.programs[role], value = source.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder;
  if (c.external) return value - (c.external === 'reflex' ? row.reflex.endpoint.budgetAdjustedEnergyPerFounder : row.programs[c.external].arms.candidate.endpoint.budgetAdjustedEnergyPerFounder);
  if (c.main) return value - row.programs.candidate.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder;
  return sarsaEffects(source, c);
}
export function scoreMushroomRows(rows, p, phase) {
  const histories = phase === 'development' ? p.developmentHistories : p.confirmationHistories, n = histories.length;
  assert.equal(rows.length, n); rows.forEach((row, i) => validateMushroomRow(row, histories[i], p, phase));
  const comparisons = p.contrasts.map(c => {
    const effects = rows.map(row => mushroomEffects(row, c)), paired = pairedSignFlip(effects);
    const se = Math.sqrt(effects.reduce((s, v) => s + (v - paired.mean) ** 2, 0) / (n - 1) / n), lower = paired.mean - p.critical[phase] * se;
    return {id: c.id, optional: Boolean(c.optional), effects, ...paired, standardError: se, simultaneousLower: lower, developmentalPositive: paired.mean > 0,
      confirmatoryPass: lower > 0 && paired.pOneSided <= p.alphaPerTest};
  });
  const survival = ['incumbent', 'fast', 'slow', 'frozen', 'reset', 'lambda0', 'fastOnly', 'linear', 'reflex'].map(control => {
    const effects = rows.map(row => row.programs.candidate.arms.candidate.endpoint.survival - (control === 'reflex' ? row.reflex.endpoint.survival : ['fastOnly', 'linear'].includes(control) ? row.programs[control].arms.candidate.endpoint.survival : row.programs.candidate.arms[control].endpoint.survival));
    const m = mean(effects), se = Math.sqrt(effects.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1) / n);
    return {control, effects, mean: m, descriptiveCi95: [m - p.descriptiveCritical[phase] * se, m + p.descriptiveCritical[phase] * se], passed: m >= 0};
  });
  const plasticityActivity = rows.map(row => {
    const ds = row.programs.candidate.arms.candidate.learners.map(s => s.plasticityDiagnostics);
    const total = key => ds.reduce((sum, d) => sum + d[key], 0);
    const updates = total('updates'), nonzeroDopamine = total('nonzeroDopamine'), transfers = total('transfers'), absoluteTransfer = total('absoluteTransfer');
    return {seed: row.seed, updates, nonzeroDopamine, transfers, absoluteTransfer,
      fraction: updates ? nonzeroDopamine / updates : 0,
      passed: updates > 0 && nonzeroDopamine / updates >= p.minimumDopamineFraction && transfers > 0 && absoluteTransfer > 0};
  });
  const common = survival.every(v => v.passed) && plasticityActivity.every(v => v.passed);
  return {schema: 1, phase, histories: histories.map(h => h.seed), comparisons, survival, plasticityActivity,
    promising: phase === 'development' ? comparisons.filter(c => !c.optional).every(c => c.developmentalPositive) && common : null,
    qualified: phase === 'confirmation' ? comparisons.filter(c => !c.optional).every(c => c.confirmatoryPass) && common : false,
    fastOnlyReferenceComparisons: phase === 'development' ? p.contrasts.filter(c => !c.optional && !c.external).map(c => ({id: c.id, effects: rows.map(row => mushroomEffects(row, c, 'fastOnly')), mean: mean(rows.map(row => mushroomEffects(row, c, 'fastOnly')))})) : [],
    boundary: 'One fixed sparse dopamine-gated direct policy with fast/slow synapses. Development is not qualification. No tuning, reselection, extension, biological-fidelity claim or RSI claim follows this screen.'};
}
