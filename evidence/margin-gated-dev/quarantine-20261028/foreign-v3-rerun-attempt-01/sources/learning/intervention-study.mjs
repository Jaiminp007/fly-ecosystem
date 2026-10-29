// Offline controlled-intervention diagnostics. Never imported by World.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyBinaryPolicyDraws} from './behavior-policy.mjs';
import {createWeightedOutcome, updateWeightedOutcome, predictWeightedOutcome} from './policy-aware-outcome.mjs';

export const digest = x => createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
export const CHANNELS = [0, 1, 2, 3, 4, 10, 11, 12, 13];
export const MODES = ['observational', 'ipw', 'ipw-contrast', 'dr-contrast', 'uniform', 'paired', 'explicit-exploration', 'matched-uniform'];
export const REPRESENTATIONS = ['current', 'history'];
export const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
export function advanceRng(value) { let x = value; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return x >>> 0; }
export function independentChoice(assignmentSeed, seed, environment, tick, agentId) {
  // A separate SHA-256 assignment stream cannot consume or alter simulator RNG.
  return parseInt(digest(`${assignmentSeed}:${seed}:${environment}:${tick}:${agentId}`).slice(0, 8), 16) < 0x80000000 ? -1 : 1;
}
export function features(observation, history, representation) {
  assert.ok(REPRESENTATIONS.includes(representation));
  assert.equal(observation.length, 17);
  const out = [1, ...CHANNELS.map(i => observation[i])];
  if (representation === 'history') {
    assert.equal(history.length, 3);
    for (const previous of history) {
      assert.ok([-1, 1].includes(previous.choice));
      // The history metric is part of this declared representation package.
      out.push(...CHANNELS.map(i => previous.observation[i] / 3), previous.choice / 3);
    }
  }
  assert.ok(out.every(x => Number.isFinite(x) && Math.abs(x) <= 1));
  return out;
}
const actionInput = (x, choice) => [...x, choice, ...x.slice(1).map(v => v * choice)];
const outcome = (c, action, horizon) => c.arms[action < 0 ? 'slow' : 'fast'][horizon].energyChange / 120;
const contrastMode = mode => mode.endsWith('contrast');
export function createDiagnosticModel(mode, representation, capacity = 128) {
  assert.ok(MODES.includes(mode)); assert.ok(REPRESENTATIONS.includes(representation));
  const dimensions = representation === 'history' ? 40 : 10;
  return {schema: 1, kind: 'pooled-intervention-diagnostic', mode, representation, scale: mode === 'dr-contrast' ? 42 : mode === 'ipw-contrast' ? 20 : 1,
    estimator: createWeightedOutcome(contrastMode(mode) ? dimensions : dimensions * 2, capacity), nuisance: mode === 'dr-contrast' ? createWeightedOutcome(dimensions * 2, capacity) : null,
    checkpoints: 0, labels: 0, scope: 'Pooled development-world fork labels, not individual embodied learning.'};
}
export function fitDiagnosticModel(cases, mode, representation, horizon, capacity = 128) {
  const model = createDiagnosticModel(mode, representation, capacity);
  const pendingNuisance = [];
  let priorSeed = null;
  const releaseNuisance = cutoff => {
    while (pendingNuisance.length && pendingNuisance[0].completionTick <= cutoff) {
      const item = pendingNuisance.shift();
      updateWeightedOutcome(model.nuisance, item.input, item.target, 1, item.provenance);
    }
  };
  // Equal 128-label maximum. Paired reference sees both outcomes at half as
  // many checkpoints, spread over the same ordered training bank.
  const active = cases.filter(c => !c.alreadyDead);
  for (const [index, c] of active.entries()) {
    if (model.nuisance) {
      // Worlds are processed as completed independent episodes. Within the
      // current world, overlapping outcomes cannot reach the nuisance model
      // until their complete horizon has elapsed, including both founders.
      if (priorSeed !== null && priorSeed !== c.seed) releaseNuisance(Infinity);
      priorSeed = c.seed;
      releaseNuisance(c.tick);
      assert.ok(model.nuisance.records.every(r => r.evidence.seed !== c.seed || r.evidence.completionTick <= c.tick));
    }
    if (mode === 'paired' && (Math.floor(index / 2) + index) % 2) continue;
    if (['explicit-exploration', 'matched-uniform'].includes(mode) && !c.policy.explicitExploration) continue;
    const x = features(c.observation, c.history, representation);
    const choices = mode === 'paired' ? [-1, 1] : [mode === 'uniform' || mode === 'matched-uniform' ? c.uniformChoice : c.naturalChoice];
    model.checkpoints++;
    for (const choice of choices) {
      const target = outcome(c, choice, horizon), probability = c.policy.chosenProbability;
      assert.ok(Math.abs(target) <= 1 + 1e-12);
      const provenance = {seed: c.seed, environment: c.environment, tick: c.tick, completionTick: c.tick + horizon, agentId: c.agentId, choice, horizon, source: mode};
      if (contrastMode(mode)) {
        let value = choice * target / probability;
        if (model.nuisance) {
          const slow = predictWeightedOutcome(model.nuisance, actionInput(x, -1)), fast = predictWeightedOutcome(model.nuisance, actionInput(x, 1));
          provenance.nuisanceBeforeLabels = model.nuisance.seen;
          value = fast - slow + choice * (target - (choice > 0 ? fast : slow)) / probability;
        }
        assert.ok(Math.abs(value) <= model.scale + 1e-9);
        updateWeightedOutcome(model.estimator, x, value / model.scale, 1, provenance);
        if (model.nuisance) pendingNuisance.push({input: actionInput(x, choice), target, provenance, completionTick: c.tick + horizon});
      } else updateWeightedOutcome(model.estimator, actionInput(x, choice), target, mode === 'ipw' ? .5 / probability : 1, provenance);
      model.labels++;
    }
  }
  if (model.nuisance) releaseNuisance(Infinity);
  assert.ok(model.labels <= capacity);
  return model;
}
export function predictDiagnostic(model, c) {
  if (c.alreadyDead) return 0;
  const x = features(c.observation, c.history, model.representation);
  return contrastMode(model.mode) ? predictWeightedOutcome(model.estimator, x) * model.scale : predictWeightedOutcome(model.estimator, actionInput(x, 1)) - predictWeightedOutcome(model.estimator, actionInput(x, -1));
}
export function choiceValue(c, difference, horizon) {
  if (c.alreadyDead) return 0;
  const slow = c.arms.slow[horizon].energyChange, fast = c.arms.fast[horizon].energyChange;
  return difference > 0 ? fast : difference < 0 ? slow : (fast + slow) / 2;
}
export function forcedExplorationSeeds(exploration) {
  const found = {};
  for (let seed = 1; seed < 1000000 && Object.keys(found).length < 2; seed++) {
    const first = advanceRng(seed), second = advanceRng(first);
    if (first / 4294967296 < exploration) found[second / 4294967296 < .5 ? -1 : 1] ??= seed;
  }
  assert.ok(found[-1] && found[1]); return found;
}
export function collectInterventionWorld(World, protocol, seed, environment, onCase = () => {}) {
  const world = new World({seed, founders: protocol.reference.founders, capacity: 240, reproduction: false, mutation: false,
    ...protocol.reference.environments[environment], controller: 'episodic-actor', learning: true, actorParameters: protocol.reference.actorParameters, episodicParameters: protocol.reference.parameters});
  const history = new Map(protocol.agents.map(id => [id, []])), cases = [], forcing = forcedExplorationSeeds(protocol.reference.parameters.exploration);
  const maxHorizon = Math.max(...protocol.horizons);
  for (const tick of protocol.checkpointTicks) {
    while (world.tick < tick) {
      if (!world.step()) break;
      for (const id of protocol.agents) {
        const f = world.flies.find(fly => fly.id === id), d = f?.brain.episodic.lastDecision;
        if (d?.step === world.tick) { const h = history.get(id); h.push({observation: [...f.lastInputs], choice: d.choice}); if (h.length > 3) h.shift(); }
      }
    }
    const checkpoint = world.checkpoint(), beforeHash = digest(checkpoint);
    for (const agentId of protocol.agents) {
      const agent = world.flies.find(f => f.id === agentId);
      const common = {seed, environment, tick, agentId, checkpointSha256: beforeHash, uniformChoice: independentChoice(protocol.assignmentSeed, seed, environment, tick, agentId)};
      if (!agent) { cases.push({...common, alreadyDead: true}); onCase(); continue; }
      assert.equal(world.tick, tick); assert.equal(agent.brain.episodic.steps % protocol.reference.parameters.decisionTicks, 0);
      assert.equal(history.get(agentId).length, 3);
      const natural = World.restore(checkpoint), target = natural.flies.find(f => f.id === agentId), beforeRng = target.brain.episodic.memory.rngState;
      natural.step();
      const decision = structuredClone(target.brain.episodic.lastDecision);
      const observation = [...target.lastInputs];
      assert.equal(decision.step, tick + 1);
      const draw = verifyBinaryPolicyDraws(beforeRng, target.brain.episodic.memory.rngState, decision, protocol.reference.parameters.exploration);
      const naturalAfterFirst = natural.checkpoint(), arms = {};
      let replaySteps = 0;
      for (const choice of [-1, 1]) {
        const fork = World.restore(checkpoint), f = fork.flies.find(fly => fly.id === agentId);
        f.brain.episodic.memory.rngState = forcing[choice];
        const outcomes = {};
        for (let elapsed = 1; elapsed <= maxHorizon; elapsed++) {
          if (fork.step()) replaySteps++;
          if (elapsed === 1) {
            assert.equal(f.brain.episodic.lastDecision.choice, choice);
            assert.deepEqual(f.brain.episodic.lastDecision.retrieval, decision.retrieval);
            assert.deepEqual(f.lastInputs, observation);
            f.brain.episodic.memory.rngState = draw.afterRng;
            if (choice === decision.choice) {
              f.brain.episodic.lastDecision.reason = decision.reason;
              assert.deepEqual(fork.checkpoint(), naturalAfterFirst);
            }
          }
          if (protocol.horizons.includes(elapsed)) {
            if (choice === decision.choice) { natural.advance(elapsed - (natural.tick - tick)); assert.deepEqual(fork.checkpoint(), natural.checkpoint()); }
            const alive = fork.flies.find(fly => fly.id === agentId);
            outcomes[elapsed] = {energyChange: (alive?.energy ?? 0) - agent.energy, alive: Boolean(alive), worldSha256: digest(fork.checkpoint())};
          }
        }
        arms[choice < 0 ? 'slow' : 'fast'] = outcomes;
      }
      const c = {...common, alreadyDead: false, initialEnergy: agent.energy, observation, history: structuredClone(history.get(agentId)),
        naturalChoice: decision.choice, incumbentDifference: decision.retrieval.positive.estimate - decision.retrieval.negative.estimate,
        policy: draw.policy, beforeRng, afterRng: draw.afterRng, arms, replaySteps, exactFactualContinuation: true};
      assert.equal(digest(world.checkpoint()), beforeHash);
      cases.push(c); onCase();
    }
  }
  return {seed, environment, cases, finalBaselineSha256: digest(world.checkpoint()), forkWorldSteps: cases.reduce((sum, c) => sum + (c.replaySteps ?? 0), 0)};
}

export function evaluateModel(model, rows, horizon) {
  return rows.map(row => ({seed: row.seed, environment: row.environment,
    value: mean(row.cases.map(c => choiceValue(c, predictDiagnostic(model, c), horizon))),
    incumbent: mean(row.cases.map(c => choiceValue(c, c.incumbentDifference ?? 0, horizon))),
    slow: mean(row.cases.map(c => choiceValue(c, -1, horizon))), fast: mean(row.cases.map(c => choiceValue(c, 1, horizon))),
    oracle: mean(row.cases.map(c => c.alreadyDead ? 0 : Math.max(c.arms.slow[horizon].energyChange, c.arms.fast[horizon].energyChange)))}));
}
