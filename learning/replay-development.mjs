import assert from 'node:assert/strict';
import {SARSA_ARMS, SARSA_PROBES} from './sarsa-experiment.mjs';
import {SARSA_CONTRASTS, simulateSarsaHistory, validateSarsaRow, sarsaEffects} from './sarsa-screen.mjs';
import {simulateReflexReference} from './sarsa-development.mjs';
import {CONTINUAL_PHASES} from './continual-regimes.mjs';
import {mean} from './intervention-study.mjs';
import {pairedSignFlip} from './self-modifying-tasks.mjs';

export const REPLAY_CONTRASTS = Object.freeze([
  ...SARSA_CONTRASTS.filter(c => !c.optional),
  {id: 'sequence-one-step', external: 'oneStep'}, {id: 'sequence-linear', external: 'linear'}, {id: 'sequence-reflex', external: 'reflex'},
  SARSA_CONTRASTS.find(c => c.optional)
]);
const programIds = {candidate: 'linear-retrace-v1', oneStep: 'linear-replay-one-step-v1', linear: 'linear-sarsa-v1'};
export function replayOptions(p, phase, program) {
  return {...p, learnerProgram: programIds[program], arms: program === 'candidate' ? SARSA_ARMS : ['candidate'],
    probes: program === 'candidate' || (program === 'oneStep' && phase === 'development') ? SARSA_PROBES : []};
}
export function validateReplayProtocol(p) {
  assert.equal(p.experiment, 'bounded-retrace-embodied-development-v1'); assert.equal(p.reference.founders, 24);
  assert.deepEqual(p.phases, CONTINUAL_PHASES); assert.deepEqual(p.arms, SARSA_ARMS); assert.deepEqual(p.probes, SARSA_PROBES); assert.deepEqual(p.contrasts, REPLAY_CONTRASTS);
  assert.deepEqual(p.programs, {...programIds, reflex: 'feeding-reflex-v1'});
  assert.equal(p.developmentHistories.length, 8); assert.equal(p.confirmationHistories.length, 16);
  const seeds = [...p.developmentHistories, ...p.confirmationHistories].flatMap(h => [h.seed, ...h.resourceSeeds, ...Object.values(h.probeSeeds)]);
  assert.equal(seeds.length, 192); assert.equal(new Set(seeds).size, seeds.length);
  assert.ok(seeds.every(s => Number.isInteger(s) && s > 0 && s <= 0xffffffff && !p.excludedSeeds.includes(s)));
  const {explanation: budgetExplanation, ...budget} = p.budget;
  assert.deepEqual(budget, {developmentWorlds: 224, confirmationWorlds: 304, totalWorlds: 528, totalCollectionWorldSteps: 503808});
  assert.match(budgetExplanation, /one-step replay control/);
  assert.equal(p.alphaPerTest, .05 / 13); assert.equal(p.minimumMultiStepFraction, .1);
}
export function simulateReplayHistory(p, h, phase, emit = () => {}) {
  const programs = {};
  for (const program of Object.keys(programIds)) programs[program] = simulateSarsaHistory(replayOptions(p, phase, program), h, e => emit({program, ...e}));
  return {schema: 1, seed: h.seed, phase, resourceSeeds: h.resourceSeeds, probeSeeds: h.probeSeeds, programs, reflex: simulateReflexReference(p, h, emit)};
}
export function validateReplayRow(row, h, p, phase) {
  assert.equal(row.seed, h.seed); assert.equal(row.phase, phase); assert.deepEqual(Object.keys(row.programs), Object.keys(programIds));
  assert.deepEqual(row.resourceSeeds, h.resourceSeeds); assert.deepEqual(row.probeSeeds, h.probeSeeds);
  for (const program of Object.keys(programIds)) validateSarsaRow(row.programs[program], h, replayOptions(p, phase, program));
  const ep = row.reflex.endpoint; assert.equal(ep.founders, p.reference.founders); assert.ok(Number.isFinite(ep.budgetAdjustedEnergyPerFounder) && (ep.tick === 1792 || ep.survivors === 0));
}
export function replayEffects(row, c, role = 'candidate') {
  const source = row.programs[role], value = source.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder;
  if (c.external) return value - (c.external === 'reflex' ? row.reflex.endpoint.budgetAdjustedEnergyPerFounder : row.programs[c.external].arms.candidate.endpoint.budgetAdjustedEnergyPerFounder);
  if (c.main) return value - row.programs.candidate.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder;
  return sarsaEffects(source, c);
}
export function scoreReplayRows(rows, p, phase) {
  const histories = phase === 'development' ? p.developmentHistories : p.confirmationHistories, n = histories.length;
  assert.equal(rows.length, n); rows.forEach((row, i) => validateReplayRow(row, histories[i], p, phase));
  const comparisons = p.contrasts.map(c => {
    const effects = rows.map(row => replayEffects(row, c)), paired = pairedSignFlip(effects);
    const se = Math.sqrt(effects.reduce((s, v) => s + (v - paired.mean) ** 2, 0) / (n - 1) / n), lower = paired.mean - p.critical[phase] * se;
    return {id: c.id, optional: Boolean(c.optional), effects, ...paired, standardError: se, simultaneousLower: lower, developmentalPositive: paired.mean > 0,
      confirmatoryPass: lower > 0 && paired.pOneSided <= p.alphaPerTest};
  });
  const survival = ['incumbent', 'fast', 'slow', 'frozen', 'reset', 'lambda0', 'oneStep', 'linear', 'reflex'].map(control => {
    const effects = rows.map(row => row.programs.candidate.arms.candidate.endpoint.survival - (control === 'reflex' ? row.reflex.endpoint.survival : ['oneStep', 'linear'].includes(control) ? row.programs[control].arms.candidate.endpoint.survival : row.programs.candidate.arms[control].endpoint.survival));
    const m = mean(effects), se = Math.sqrt(effects.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1) / n);
    return {control, effects, mean: m, descriptiveCi95: [m - p.descriptiveCritical[phase] * se, m + p.descriptiveCritical[phase] * se], passed: m >= 0};
  });
  const replayActivity = rows.map(row => {
    const ds = row.programs.candidate.arms.candidate.learners.map(s => s.replayDiagnostics);
    const updates = ds.reduce((s, d) => s + d.updates, 0), terms = ds.reduce((s, d) => s + d.terms, 0), multi = ds.reduce((s, d) => s + d.multiStepUpdates, 0);
    return {seed: row.seed, updates, terms, multiStepUpdates: multi, fraction: updates ? multi / updates : 0, meanSteps: updates ? terms / updates : 0,
      maxSteps: Math.max(...ds.map(d => d.maxSteps)), passed: updates > 0 && multi / updates >= p.minimumMultiStepFraction};
  });
  const common = survival.every(v => v.passed) && replayActivity.every(v => v.passed);
  return {schema: 1, phase, histories: histories.map(h => h.seed), comparisons, survival, replayActivity,
    promising: phase === 'development' ? comparisons.filter(c => !c.optional).every(c => c.developmentalPositive) && common : null,
    qualified: phase === 'confirmation' ? comparisons.filter(c => !c.optional).every(c => c.confirmatoryPass) && common : false,
    oneStepReferenceComparisons: phase === 'development' ? p.contrasts.filter(c => !c.optional && !c.external).map(c => ({id: c.id, effects: rows.map(row => replayEffects(row, c, 'oneStep')), mean: mean(rows.map(row => replayEffects(row, c, 'oneStep')))})) : [],
    boundary: 'One fixed contiguous-trajectory replay hypothesis. Development is not qualification. No tuning/reselection/extension on this bank; neither qualification nor a theoretical Retrace guarantee establishes RSI.'};
}
