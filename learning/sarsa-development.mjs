// One prospective representation hypothesis, with separate development and
// confirmation. The failed qualification bank is never used for selection.
import assert from 'node:assert/strict';
import {SarsaExperiment, SARSA_ARMS, SARSA_PROBES} from './sarsa-experiment.mjs';
import {SARSA_CONTRASTS, simulateSarsaHistory, validateSarsaRow, sarsaEffects} from './sarsa-screen.mjs';
import {CONTINUAL_PHASES} from './continual-regimes.mjs';
import {digest, mean} from './intervention-study.mjs';
import {pairedSignFlip} from './self-modifying-tasks.mjs';

export const LOCAL_CONTRASTS = Object.freeze([
  ...SARSA_CONTRASTS.filter(c => !c.optional),
  {id: 'sequence-linear', external: 'linear'}, {id: 'sequence-reflex', external: 'reflex'},
  SARSA_CONTRASTS.find(c => c.optional)
]);
function options(p, phase, program) {
  return {...p, learnerProgram: program === 'tile' ? 'tile-sarsa-v1' : 'linear-sarsa-v1',
    arms: program === 'tile' ? SARSA_ARMS : ['candidate'], probes: program === 'linear' && phase === 'confirmation' ? [] : SARSA_PROBES};
}
export function validateLocalProtocol(p) {
  assert.equal(p.experiment, 'local-tile-embodied-development-v1');
  assert.deepEqual(p.phases, CONTINUAL_PHASES); assert.deepEqual(p.contrasts, LOCAL_CONTRASTS);
  assert.deepEqual(p.arms, SARSA_ARMS); assert.deepEqual(p.probes, SARSA_PROBES); assert.equal(p.reference.founders, 24);
  assert.equal(p.developmentHistories.length, 8); assert.equal(p.confirmationHistories.length, 16);
  const seeds = [...p.developmentHistories, ...p.confirmationHistories].flatMap(h => [h.seed, ...h.resourceSeeds, ...Object.values(h.probeSeeds)]);
  assert.equal(seeds.length, 192); assert.equal(new Set(seeds).size, seeds.length);
  assert.ok(seeds.every(s => Number.isInteger(s) && s > 0 && s <= 0xffffffff && !p.excludedSeeds.includes(s)));
  assert.equal(p.budget.developmentWorlds, 216); assert.equal(p.budget.confirmationWorlds, 288); assert.equal(p.budget.totalWorlds, 504);
  assert.equal(p.budget.totalCollectionWorldSteps, 460800);
  assert.equal(p.alphaPerTest, .05 / 12);
}
export function simulateLocalHistory(p, h, phase, emit = () => {}) {
  const programs = {};
  for (const program of ['tile', 'linear']) programs[program] = simulateSarsaHistory(options(p, phase, program), h, event => emit({program, ...event}));
  const reflex = new SarsaExperiment({seed: h.seed, resourceSeeds: h.resourceSeeds, arm: 'candidate', reference: p.reference, pricing: p.pricing, learnerProgram: 'feeding-reflex-v1'});
  emit({program: 'reflex', type: 'start', seed: h.seed});
  while (reflex.world.tick < 1792 && reflex.world.flies.length) {
    const before = reflex.world.flies.map(fly => ({fly, decisions: reflex.learners[fly.id].decisions}));
    assert.ok(reflex.step());
    for (const {fly, decisions} of before) if (reflex.learners[fly.id].decisions > decisions) emit({program: 'reflex', type: 'decision', tick: reflex.world.tick, agentId: fly.id,
      observation: [...fly.lastInputs], choice: fly.brain.episodic.lastDecision.choice});
  }
  const reference = {endpoint: reflex.endpoint(), finalSha256: digest(reflex.checkpoint()), phases: reflex.phaseRows, learners: reflex.learners};
  emit({program: 'reflex', type: 'end', learners: reflex.learners});
  return {schema: 1, seed: h.seed, phase, resourceSeeds: h.resourceSeeds, probeSeeds: h.probeSeeds, programs, reflex: reference};
}
export function validateLocalRow(row, h, p, phase) {
  assert.equal(row.seed, h.seed); assert.equal(row.phase, phase); assert.deepEqual(Object.keys(row.programs), ['tile', 'linear']);
  assert.deepEqual(row.resourceSeeds, h.resourceSeeds); assert.deepEqual(row.probeSeeds, h.probeSeeds);
  for (const program of ['tile', 'linear']) validateSarsaRow(row.programs[program], h, options(p, phase, program));
  const e = row.reflex.endpoint; assert.equal(e.founders, p.reference.founders);
  assert.ok(Number.isFinite(e.budgetAdjustedEnergyPerFounder) && e.survivors >= 0 && e.survivors <= e.founders && (e.tick === 1792 || e.survivors === 0));
}
export function localEffects(row, contrast, program = 'tile') {
  const source = row.programs[program], candidate = source.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder;
  if (contrast.external === 'linear') return candidate - row.programs.linear.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder;
  if (contrast.external === 'reflex') return candidate - row.reflex.endpoint.budgetAdjustedEnergyPerFounder;
  if (contrast.main) return candidate - row.programs.tile.arms[contrast.main].endpoint.budgetAdjustedEnergyPerFounder;
  return sarsaEffects(source, contrast);
}
export function scoreLocalRows(rows, p, phase) {
  const histories = phase === 'development' ? p.developmentHistories : p.confirmationHistories;
  assert.equal(rows.length, histories.length); rows.forEach((row, i) => validateLocalRow(row, histories[i], p, phase));
  const n = rows.length, critical = p.critical[phase], comparisons = p.contrasts.map(c => {
    const effects = rows.map(row => localEffects(row, c)), paired = pairedSignFlip(effects), standardError = Math.sqrt(effects.reduce((sum, v) => sum + (v - paired.mean) ** 2, 0) / (n - 1) / n);
    const lower = paired.mean - critical * standardError;
    return {id: c.id, optional: Boolean(c.optional), effects, ...paired, standardError, simultaneousLower: lower,
      confirmatoryPass: lower > 0 && paired.pOneSided <= p.alphaPerTest, developmentalPositive: paired.mean > 0};
  });
  const survival = ['incumbent', 'fast', 'slow', 'frozen', 'reset', 'lambda0', 'linear', 'reflex'].map(control => {
    const effects = rows.map(row => row.programs.tile.arms.candidate.endpoint.survival - (control === 'linear' ? row.programs.linear.arms.candidate.endpoint.survival : control === 'reflex' ? row.reflex.endpoint.survival : row.programs.tile.arms[control].endpoint.survival));
    const m = mean(effects), se = Math.sqrt(effects.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1) / n);
    return {control, effects, mean: m, descriptiveCi95: [m - p.descriptiveCritical[phase] * se, m + p.descriptiveCritical[phase] * se], passed: m >= 0};
  });
  const promising = comparisons.filter(c => !c.optional).every(c => c.developmentalPositive) && survival.every(v => v.passed);
  return {schema: 1, phase, histories: histories.map(h => h.seed), comparisons, survival, promising: phase === 'development' ? promising : null,
    qualified: phase === 'confirmation' ? comparisons.filter(c => !c.optional).every(c => c.confirmatoryPass) && survival.every(v => v.passed) : false,
    linearReferenceComparisons: phase === 'development' ? p.contrasts.filter(c => !c.optional && !c.external).map(c => ({id: c.id, effects: rows.map(r => localEffects(r, c, 'linear')), mean: mean(rows.map(r => localEffects(r, c, 'linear')))})) : [],
    boundary: phase === 'development' ? 'Developmental go/no-go for one fixed hypothesis; never qualification or RSI. No post-result tuning or replacement candidate on this bank.' : 'Fresh fixed-hypothesis confirmation with all old obligations plus linear and reflex controls. No recursive or live-policy claim.'};
}
