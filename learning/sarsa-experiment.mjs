// Complete offline experiment state: physics, resource clock, per-body
// learners, replay/exploration streams and outstanding cost obligations.
import assert from 'node:assert/strict';
import {World, DT} from '../engine.mjs';
import {digest} from './intervention-study.mjs';
import {CONTINUAL_PHASES, enterContinualPhase, updateContinualResources} from './continual-regimes.mjs';
import {stepEmbodiedControl} from './embodied-control.mjs';
import {embodiedProgram} from './embodied-programs.mjs';

export const SARSA_ARMS = ['candidate', 'lambda0', 'frozen', 'reset', 'incumbent', 'fast', 'slow'];
// Declared canonical encoding: float64 numbers, one-byte booleans/null,
// length-prefixed UTF-8 strings, and length/key-prefixed arrays/objects.
// This prices actual encoded state, not JavaScript heap allocation.
export function encodedStateBytes(value) {
  if (value === null || typeof value === 'boolean') return 1;
  if (typeof value === 'number') { assert.ok(Number.isFinite(value)); return 8; }
  if (typeof value === 'string') return 4 + Buffer.byteLength(value);
  if (Array.isArray(value)) return 4 + value.reduce((sum, v) => sum + encodedStateBytes(v), 0);
  assert.equal(typeof value, 'object');
  return 4 + Object.entries(value).reduce((sum, [key, v]) => sum + 4 + Buffer.byteLength(key) + encodedStateBytes(v), 0);
}
export function billSarsaWork(state, pricing) {
  const operations = state.work.scalarOperations - state.charge.operationsBilled;
  assert.ok(operations >= 0);
  const due = operations * pricing.operationEnergy;
  state.charge.operationsBilled = state.work.scalarOperations;
  state.charge.outstandingEnergy += due; state.charge.incurredEnergy += due;
}
function chargeForStep(state, pricing) {
  billSarsaWork(state, pricing);
  // Numeric values have fixed size in the declared encoding; changes in
  // array/object shape occur at decisions, reset/freeze or terminal events.
  if (!state.charge.storageBytes || state.lastDecisionTick === state.lastObservedTick + 1) state.charge.storageBytes = encodedStateBytes(state);
  const storage = state.charge.storageBytes * pricing.byteEnergyPerSecond * DT;
  state.charge.outstandingEnergy += storage; state.charge.incurredEnergy += storage;
  return {energyCost: state.charge.outstandingEnergy, afterEnergyCharge: ({paid}) => {
    assert.ok(paid >= 0 && paid <= state.charge.outstandingEnergy + 1e-10);
    state.charge.outstandingEnergy = Math.max(0, state.charge.outstandingEnergy - paid); state.charge.paidEnergy += paid;
  }};
}
const learnedArm = arm => ['candidate', 'lambda0', 'frozen', 'reset'].includes(arm);
function resourceMetrics(world) { return {foodInventory: world.food.reduce((s, p) => s + p.amount, 0), foodEaten: world.totals.foodEaten, deliveredRegrowth: world.totals.externalEnergy}; }

export class SarsaExperiment {
  constructor({seed, resourceSeeds, arm, reference, pricing, learnerProgram}) {
    assert.ok(SARSA_ARMS.includes(arm)); assert.equal(resourceSeeds.length, CONTINUAL_PHASES.length);
    assert.ok(pricing && pricing.byteEnergyPerSecond > 0 && pricing.operationEnergy > 0, 'Campaign prices are mandatory');
    this.schema = 1; this.arm = arm; this.seed = seed; this.resourceSeeds = [...resourceSeeds]; this.pricing = {...pricing};
    const learner = embodiedProgram(learnerProgram).api;
    if (learnerProgram && learnerProgram !== 'linear-sarsa-v1') this.learnerProgram = learnerProgram;
    const legacy = arm === 'incumbent';
    this.world = new World({seed, founders: reference.founders, capacity: 240, reproduction: false, mutation: false, controller: 'episodic-actor', learning: true,
      actorParameters: reference.actorParameters, episodicParameters: {...reference.parameters, ...(legacy ? {} : {memoryLearning: false, neuralLearning: false})},
      nutrient: .4, seasonal: false, challenges: 'off'});
    this.founderIds = this.world.flies.map(f => f.id); this.startingEnergy = this.world.flies.reduce((s, f) => s + f.energy, 0);
    this.learners = learnedArm(arm) ? Object.fromEntries(this.world.flies.map(f => [f.id, learner.create(f.id, ((seed ^ Math.imul(f.id, 2654435761)) >>> 0) || 1, arm === 'lambda0' ? {lambda: 0} : {})])) : {};
    this.phaseIndex = 0; this.phaseEnd = CONTINUAL_PHASES[0].ticks;
    this.resource = enterContinualPhase(this.world, CONTINUAL_PHASES[0], resourceSeeds[0]);
    this.phaseStart = resourceMetrics(this.world); this.phaseRows = []; this.savedModels = {}; this.atC = null;
    this.scalarOperationsAtStart = 0;
  }
  step() {
    const learner = embodiedProgram(this.learnerProgram).api;
    if (this.phaseIndex >= CONTINUAL_PHASES.length || !this.world.flies.length) return false;
    if (this.world.tick === this.phaseEnd) {
      this.phaseIndex++;
      if (this.phaseIndex === CONTINUAL_PHASES.length) return false;
      const phase = CONTINUAL_PHASES[this.phaseIndex];
      this.resource = enterContinualPhase(this.world, phase, this.resourceSeeds[this.phaseIndex]);
      this.phaseEnd += phase.ticks; this.phaseStart = resourceMetrics(this.world);
      if (this.arm === 'frozen' && phase.id === 'B') for (const state of Object.values(this.learners)) { learner.freeze(state); state.charge.storageBytes = 0; }
      if (this.arm === 'reset' && ['B', 'C'].includes(phase.id)) for (const state of Object.values(this.learners)) { learner.reset(state); state.charge.storageBytes = 0; }
    }
    updateContinualResources(this.world, this.resource);
    const before = [...this.world.flies];
    if (this.arm === 'incumbent') this.world.step();
    else {
      assert.equal(this.world.config.episodicParameters.memoryLearning, false);
      assert.equal(this.world.config.episodicParameters.neuralLearning, false);
      stepEmbodiedControl(this.world, own => learnedArm(this.arm) ? learner.choose(this.learners[own.agentId], {...own, energy: own.energy - this.learners[own.agentId].charge.outstandingEnergy}) : this.arm === 'fast' ? 1 : -1,
        ({agentId}) => learnedArm(this.arm) ? chargeForStep(this.learners[agentId], this.pricing) : 0);
      for (const fly of before) if (learnedArm(this.arm)) {
        const alive = this.world.flies.includes(fly), state = this.learners[fly.id];
        const netEnergy = (alive ? fly.energy : 0) - state.charge.outstandingEnergy;
        learner.observe(state, {agentId: fly.id, tick: this.world.tick, energy: netEnergy, terminal: !alive});
        // A terminal update has no later alive step in which to pay. Keep its
        // complete bill in the joint state and subtract it at scoring.
        if (!alive) billSarsaWork(state, this.pricing);
      }
    }
    if (this.world.tick === this.phaseEnd) {
      const phase = CONTINUAL_PHASES[this.phaseIndex], end = resourceMetrics(this.world);
      this.phaseRows.push({phase: phase.id, tick: this.world.tick, population: this.world.flies.length, foodInventoryStart: this.phaseStart.foodInventory,
        foodInventoryEnd: end.foodInventory, foodEaten: end.foodEaten - this.phaseStart.foodEaten, deliveredRegrowth: end.deliveredRegrowth - this.phaseStart.deliveredRegrowth});
      if (['A', 'B'].includes(phase.id) && learnedArm(this.arm)) this.savedModels[phase.id] = structuredClone(this.learners);
      if (phase.id === 'C' && this.arm === 'candidate') this.atC = this.checkpoint({includeAtC: false});
    }
    return true;
  }
  advance(ticks) { for (let i = 0; i < ticks; i++) if (!this.step()) break; }
  endpoint() {
    const usable = this.world.flies.reduce((s, f) => s + f.energy, 0), debt = Object.values(this.learners).reduce((s, l) => s + l.charge.outstandingEnergy, 0);
    return {tick: this.world.tick, founders: this.founderIds.length, survivors: this.world.flies.length, survival: this.world.flies.length / this.founderIds.length,
      grossEnergyPerFounder: (usable - this.startingEnergy) / this.founderIds.length, budgetAdjustedEnergyPerFounder: (usable - this.startingEnergy - debt) / this.founderIds.length,
      outstandingEnergy: debt, incurredEnergy: Object.values(this.learners).reduce((s, l) => s + l.charge.incurredEnergy, 0),
      paidEnergy: Object.values(this.learners).reduce((s, l) => s + l.charge.paidEnergy, 0), scalarOperations: Object.values(this.learners).reduce((s, l) => s + l.work.scalarOperations, 0) - this.scalarOperationsAtStart,
      encodedLearnerBytes: Object.values(this.learners).reduce((s, l) => s + encodedStateBytes(l), 0), accountingResidual: this.world.metrics().accountingError};
  }
  checkpoint({includeAtC = true} = {}) {
    const {world, atC, ...rest} = this;
    // Canonical JSON zeros also cover immutable earlier-phase snapshots,
    // which otherwise keep signed zeros after the live state has advanced.
    return JSON.parse(JSON.stringify({schema: 1, kind: 'joint-sarsa-world-experiment', world: world.checkpoint(), experiment: rest, atC: includeAtC ? atC : null}));
  }
  static restore(value) {
    assert.equal(value?.schema, 1); assert.equal(value.kind, 'joint-sarsa-world-experiment');
    const result = Object.create(SarsaExperiment.prototype);
    Object.assign(result, structuredClone(value.experiment)); result.world = World.restore(value.world); result.atC = structuredClone(value.atC);
    for (const state of Object.values(result.learners)) embodiedProgram(result.learnerProgram).api.restore(state);
    assert.ok(SARSA_ARMS.includes(result.arm)); assert.equal(result.founderIds.length, value.world.world.config.founders);
    assert.ok(result.pricing.byteEnergyPerSecond > 0 && result.pricing.operationEnergy > 0);
    return result;
  }
}

export const SARSA_PROBES = Object.freeze([
  {family: 'A', version: 'A'}, {family: 'A', version: 'C'}, {family: 'A', version: 'reset'},
  {family: 'B', version: 'A'}, {family: 'B', version: 'B'}, {family: 'B', version: 'C'}, {family: 'B', version: 'reset'},
  {family: 'C', version: 'B'}, {family: 'C', version: 'C'}
]);

export function runSarsaProbe(atC, {family, version}, resourceSeed, founders) {
  if (!atC) return {family, version, resourceSeed, founders, survivors: 0, value: 0, skippedAllDead: true};
  const run = SarsaExperiment.restore(atC), current = structuredClone(run.learners);
  const learner = embodiedProgram(run.learnerProgram).api;
  const source = version === 'C' ? current : version === 'reset' ? null : run.savedModels[version];
  assert.ok(source || version === 'reset');
  for (const [id, state] of Object.entries(current)) {
    const model = source ? structuredClone(source[id]) : learner.create(state.agentId, state.rngState, state.config);
    learner.freeze(model); model.history = []; model.rngState = state.rngState;
    model.lastObservedTick = run.world.tick; model.lastDecisionTick = run.world.tick - 7;
    model.dead = !run.world.flies.some(f => f.id === Number(id));
    model.charge = {operationsBilled: model.work.scalarOperations, outstandingEnergy: 0, incurredEnergy: 0, paidEnergy: 0, storageBytes: 0};
    run.learners[id] = model;
  }
  const learnedWeightsBefore = digest(Object.values(run.learners).map(s => s.weights));
  run.arm = 'frozen'; run.phaseIndex = CONTINUAL_PHASES.findIndex(p => p.id === family);
  run.resource = enterContinualPhase(run.world, CONTINUAL_PHASES[run.phaseIndex], resourceSeed);
  run.phaseEnd = run.world.tick + 256; run.phaseStart = resourceMetrics(run.world); run.phaseRows = []; run.savedModels = {}; run.atC = null;
  run.startingEnergy = run.world.flies.reduce((sum, f) => sum + f.energy, 0);
  run.scalarOperationsAtStart = Object.values(run.learners).reduce((sum, s) => sum + s.work.scalarOperations, 0);
  const startWorldSha256 = digest(run.world.checkpoint());
  run.advance(256);
  assert.equal(digest(Object.values(run.learners).map(s => s.weights)), learnedWeightsBefore, 'Probe fed back into learned weights');
  const endpoint = run.endpoint();
  return {family, version, resourceSeed, ...endpoint, value: endpoint.budgetAdjustedEnergyPerFounder, skippedAllDead: false,
    startWorldSha256, finalWorldSha256: digest(run.world.checkpoint()), acquisitionDisabled: true, learnedWeightsUnchanged: true};
}
