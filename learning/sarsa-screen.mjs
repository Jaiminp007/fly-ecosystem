// Fixed prospective screen. No parameter selection and no live platform imports.
import assert from 'node:assert/strict';
import {SarsaExperiment, SARSA_ARMS, SARSA_PROBES, runSarsaProbe} from './sarsa-experiment.mjs';
import {CONTINUAL_PHASES} from './continual-regimes.mjs';
import {digest, mean} from './intervention-study.mjs';
import {pairedSignFlip} from './self-modifying-tasks.mjs';

export const SARSA_CONTRASTS = Object.freeze([
  {id: 'B-acquisition', terms: [['B:B', 1], ['B:A', -1]]},
  {id: 'C-acquisition', terms: [['C:C', 1], ['C:B', -1]]},
  ...['incumbent', 'fast', 'slow'].map(arm => ({id: `sequence-${arm}`, main: arm})),
  {id: 'A-initial-skill', terms: [['A:A', 1], ['A:reset', -1]]},
  {id: 'B-initial-skill', terms: [['B:B', 1], ['B:reset', -1]]},
  {id: 'A-retention', terms: [['A:C', 1], ['A:A', -.95], ['A:reset', -.05]]},
  {id: 'B-retention', terms: [['B:C', 1], ['B:B', -.95], ['B:reset', -.05]]},
  {id: 'trace-contribution', main: 'lambda0', optional: true}
]);

export function validateSarsaProtocol(p) {
  assert.equal(p.experiment, 'fixed-expected-sarsa-embodied-screen');
  assert.equal(p.histories.length, 16);
  assert.deepEqual(p.arms, SARSA_ARMS); assert.deepEqual(p.probes, SARSA_PROBES);
  assert.deepEqual(p.phases, CONTINUAL_PHASES);
  assert.deepEqual(p.contrasts, SARSA_CONTRASTS);
  assert.equal(p.reference.founders, 24);
  assert.equal(p.budget.mainWorlds, 112); assert.equal(p.budget.probeWorlds, 144);
  const seeds = p.histories.flatMap(h => [h.seed, ...h.resourceSeeds, ...Object.values(h.probeSeeds)]);
  assert.equal(seeds.length, 128); assert.equal(new Set(seeds).size, seeds.length);
  assert.ok(seeds.every(s => Number.isInteger(s) && s > 0 && s <= 0xffffffff && !p.excludedSeeds.includes(s)));
  assert.ok(p.critical > 0 && p.alphaPerTest === .05 / 10);
}

const learnerSummary = s => ({agentId: s.agentId, config: s.config, weights: s.weights, eligibility: s.eligibility,
  recentExperiences: s.recent.map(t => t.experience), olderExperiences: s.older.map(t => t.experience),
  olderSeen: s.olderSeen, rngState: s.rngState, retentionRngState: s.retentionRngState, replayRngState: s.replayRngState,
  decisions: s.decisions, transitions: s.transitions, replayUpdates: s.replayUpdates, work: s.work, charge: s.charge,
  acquisition: s.acquisition, dead: s.dead, ...(s.replayDiagnostics ? {replayDiagnostics: s.replayDiagnostics} : {}),
  ...(s.plasticityDiagnostics ? {projection: s.projection, rewardBaseline: s.rewardBaseline, plasticityDiagnostics: s.plasticityDiagnostics} : {})});

// Emit factual transition/decision records for a separate Python implementation.
// The recorder receives copies only; none of its outputs returns to a learner.
export function simulateSarsaHistory(p, h, emit = () => {}) {
  const arms = {}, initialWorlds = [], phases = p.phases.map(v => v.ticks), totalTicks = phases.reduce((a, b) => a + b, 0);
  let atC = null;
  for (const arm of p.arms) {
    const run = new SarsaExperiment({seed: h.seed, resourceSeeds: h.resourceSeeds, arm, reference: p.reference, pricing: p.pricing, learnerProgram: p.learnerProgram});
    // Config flags differ, but founder genomes, energy and physical bodies agree.
    initialWorlds.push(digest(run.world.flies));
    emit({type: 'start', arm, seed: h.seed, learners: Object.values(run.learners).map(learnerSummary)});
    const checkpoints = [];
    while (run.world.tick < totalTicks && run.world.flies.length) {
      const tick = run.world.tick + 1;
      if (['reset', 'frozen'].includes(arm) && [513, 1025].includes(tick)) emit({type: 'intervention', arm, tick, action: arm === 'frozen' ? 'freeze' : 'reset'});
      const previous = Object.fromEntries(Object.values(run.learners).filter(s => !s.dead).map(s => [s.agentId, {decisions: s.decisions, transitions: s.transitions}]));
      assert.ok(run.step());
      for (const [id, old] of Object.entries(previous)) {
        const s = run.learners[id];
        // A death on a decision tick completes the previous transition before
        // choosing and the new terminal transition afterward. Preserve both.
        const transitions = s.recent.filter(t => t.experience > old.transitions);
        assert.equal(transitions.length, s.transitions - old.transitions);
        const decision = s.decisions > old.decisions ? s.history.at(-1) : null;
        if (transitions.length || decision) emit({type: 'experience', arm, tick, agentId: s.agentId, transitions, decision});
      }
      if ([512, 1024, 1536, 1792].includes(run.world.tick)) checkpoints.push({tick: run.world.tick, sha256: digest(run.checkpoint()), endpoint: run.endpoint()});
    }
    if (arm === 'candidate') atC = run.atC;
    const learners = Object.values(run.learners).map(learnerSummary);
    for (const s of learners) {
      assert.ok(s.charge.outstandingEnergy >= 0);
      assert.ok(Math.abs(s.charge.incurredEnergy - s.charge.paidEnergy - s.charge.outstandingEnergy) < 1e-7);
    }
    const endpoint = run.endpoint(); assert.ok(Math.abs(endpoint.accountingResidual) < 1e-6);
    arms[arm] = {arm, seed: h.seed, endpoint, phases: run.phaseRows, checkpoints, finalSha256: digest(run.checkpoint()), learners};
    emit({type: 'end', arm, learners});
  }
  assert.equal(new Set(initialWorlds).size, 1, 'Arms did not start from matched bodies');
  const probes = p.probes.map(spec => runSarsaProbe(atC, spec, h.probeSeeds[spec.family], p.reference.founders));
  for (const family of ['A', 'B', 'C']) {
    const rows = probes.filter(r => r.family === family);
    if (rows.length) assert.equal(new Set(rows.map(r => r.startWorldSha256)).size, 1, 'Probe bodies differ');
  }
  return {schema: 1, seed: h.seed, resourceSeeds: h.resourceSeeds, probeSeeds: h.probeSeeds,
    founders: p.reference.founders, arms, probes, endCCheckpointSha256: atC ? digest(atC) : null};
}

export function validateSarsaRow(row, h, p) {
  assert.equal(row.seed, h.seed); assert.equal(row.founders, p.reference.founders);
  assert.deepEqual(row.resourceSeeds, h.resourceSeeds); assert.deepEqual(row.probeSeeds, h.probeSeeds);
  assert.deepEqual(Object.keys(row.arms), p.arms); assert.equal(row.probes.length, p.probes.length);
  for (const arm of p.arms) {
    const r = row.arms[arm]; assert.equal(r.arm, arm); assert.equal(r.seed, h.seed);
    assert.equal(r.endpoint.founders, p.reference.founders);
    assert.ok(r.endpoint.tick <= 1792 && r.endpoint.survivors >= 0 && r.endpoint.survivors <= p.reference.founders);
    assert.ok(r.endpoint.tick === 1792 || r.endpoint.survivors === 0);
    assert.ok(Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
    assert.deepEqual(r.phases.map(v => v.phase), p.phases.filter((_, i) => p.phases.slice(0, i + 1).reduce((s, v) => s + v.ticks, 0) <= r.endpoint.tick).map(v => v.id));
  }
  for (const [i, spec] of p.probes.entries()) {
    const r = row.probes[i]; assert.equal(r.family, spec.family); assert.equal(r.version, spec.version);
    assert.equal(r.resourceSeed, h.probeSeeds[spec.family]); assert.equal(r.founders, p.reference.founders); assert.ok(Number.isFinite(r.value));
  }
}

export function sarsaEffects(row, c) {
  if (c.main) return row.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder - row.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder;
  return c.terms.reduce((sum, [key, weight]) => {
    const r = row.probes.find(v => `${v.family}:${v.version}` === key); assert.ok(r); return sum + r.value * weight;
  }, 0);
}
export function scoreSarsaScreen(rows, p) {
  assert.equal(rows.length, p.histories.length);
  rows.forEach((r, i) => validateSarsaRow(r, p.histories[i], p));
  const comparisons = p.contrasts.map(c => {
    const effects = rows.map(r => sarsaEffects(r, c)), result = pairedSignFlip(effects), m = mean(effects);
    const se = Math.sqrt(effects.reduce((s, v) => s + (v - m) ** 2, 0) / (effects.length - 1) / effects.length);
    const lower = m - p.critical * se;
    return {id: c.id, optional: Boolean(c.optional), effects, ...result, standardError: se, simultaneousLower: lower,
      passed: lower > 0 && result.pOneSided <= p.alphaPerTest};
  });
  const survival = ['incumbent', 'fast', 'slow', 'frozen', 'reset', 'lambda0'].map(arm => {
    const effects = rows.map(r => r.arms.candidate.endpoint.survival - r.arms[arm].endpoint.survival), m = mean(effects);
    const se = Math.sqrt(effects.reduce((s, v) => s + (v - m) ** 2, 0) / 15 / 16);
    return {control: arm, effects, mean: m, descriptiveCi95: [m - p.descriptiveCritical * se, m + p.descriptiveCritical * se], passed: m >= 0};
  });
  return {schema: 1, experiment: p.experiment, histories: rows.map(r => r.seed), comparisons, survival,
    qualified: comparisons.filter(c => !c.optional).every(c => c.passed) && survival.every(c => c.passed),
    traceContributionSupported: comparisons.find(c => c.id === 'trace-contribution').passed,
    meanSequenceEnergy: Object.fromEntries(p.arms.map(arm => [arm, mean(rows.map(r => r.arms[arm].endpoint.budgetAdjustedEnergyPerFounder))])),
    boundary: 'One fixed fresh 16-history speed-only embodied screen. No sample extension, reselection, ecological promotion or RSI claim. Equal survival counts do not demonstrate a survival benefit.'};
}
