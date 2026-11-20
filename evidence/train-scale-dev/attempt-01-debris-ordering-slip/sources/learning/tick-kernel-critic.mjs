// Tick kernel-critic body (Track-K1 V1 implementation, FROZEN under
// docs/KERNEL_CRITIC_PLAN_V1.md). Actor tick-AC-exact (same 161 weights,
// same forward math, same sampling); critic = RBF-gradient kernel
// prediction of return trained on the fly's own TD-errors.
// Transplant: coefficients carried (model), records cleared (experience).
// Null-default: flag off = current tick-AC paths only (separate module).
import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {tickFeatures,tickNetwork,TICK_AC_DEFAULTS,TICK_AC_PARAMETERS,TICK_AC_ACTIONS} from './tick-actor-critic.mjs';
import {createKernelLearner,updateKernel,predictKernel} from './kernel-learner.mjs';

export const KC_PROGRAM = Object.freeze({kernel: 'rbf', update: 'gradient'});
export const KC_CAPACITY = 64;
export const KC_DIMS = 20;
export const KC_TICK_INPUTS = 33;
export const KC_PROJECTION_SEED = 0x4b435249;
export const KC_PROJECTION_SCALE = 8;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Frozen projection: 20x33 entries in [-1,1], deterministic from pinned seed.
// Module constant = frozen; sources-hashed with the instrument.
export const KC_PROJECTION = (() => {
  const rng = mulberry32(KC_PROJECTION_SEED), m = [];
  for (let j = 0; j < KC_DIMS; j++) {
    const row = [];
    for (let i = 0; i < KC_TICK_INPUTS; i++) row.push(rng() * 2 - 1);
    m.push(Object.freeze(row));
  }
  return Object.freeze(m);
})();

// Adapter: tanh(dot/8) guarantees |v|<1 (kernel inputs() never throws).
// Documented information change: saturates extremes (not a clamp).
export function projectKernelInputs(inputs) {
  assert.ok(Array.isArray(inputs) && inputs.length === KC_TICK_INPUTS && inputs.every(Number.isFinite));
  return KC_PROJECTION.map(row => {
    let s = 0;
    for (let i = 0; i < KC_TICK_INPUTS; i++) s += row[i] * inputs[i];
    return Math.tanh(s / KC_PROJECTION_SCALE);
  });
}

// Billed-cost formula (documented counts from kernel-learner code paths):
// rbf kernelValue ~= 3 ops/dim + exp + negate ~= 62; predict ~= 64R+5;
// gradient update ~= predict + coefficient math (~25). Per decision:
// bootstrap-predict + choice-predict + update ~= 192R + 90.
// Conservative (pow counted as 1 op; exp as 1 op).
export function kernelPredictBill(records) {
  assert.ok(Number.isInteger(records) && records >= 0 && records <= KC_CAPACITY,'kernel records out of capacity bounds');
  return 64 * records + 5;
}
export function kernelUpdateBill(records) {
  assert.ok(Number.isInteger(records) && records >= 0 && records <= KC_CAPACITY,'kernel records out of capacity bounds');
  return 64 * records + 80;
}
export function kernelBill(records) {
  assert.ok(Number.isInteger(records) && records >= 0 && records <= KC_CAPACITY,'kernel records out of capacity bounds');
  return 2 * kernelPredictBill(records) + kernelUpdateBill(records);
}
export const KC_TICK_ALLOWANCE = 2000;
export function kernelFitsBudget(records, perTickPerFounder) {
  return kernelBill(records) + KC_TICK_ALLOWANCE <= perTickPerFounder;
}

function arithmetic(work) {
  const operation = callback => (...values) => {
    work.scalarOperations++;
    const result = callback(...values);
    return result === 0 ? 0 : result;
  };
  return {add: operation((left,right) => left+right),subtract: operation((left,right) => left-right),
    multiply: operation((left,right) => left*right),divide: operation((left,right) => left/right),
    exp: operation(Math.exp),log: operation(Math.log),tanh: operation(Math.tanh),max: operation(Math.max),min: operation(Math.min)};
}

function initialWeights(work) {
  const math = arithmetic(work), weights = Array(TICK_AC_PARAMETERS).fill(0);
  let rng = TICK_AC_DEFAULTS.initializationSeed;
  for (let hidden = 0; hidden < 4; hidden++) for (let input = 0; input < 33; input++) {
    rng = advanceRng(rng); work.scalarOperations += 6;
    weights[hidden*34+input] = math.multiply(.2,math.subtract(math.divide(rng,4294967296),.5));
  }
  weights[136+4] = math.log(3);
  return weights;
}

export function createKernelCriticBody(agentId, seed) {
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0);
  assert.ok(Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
  const work = {scalarOperations: 0,liveUpdates: 0,replayUpdates: 0};
  return {schema: 1,kind: 'tick-kernel-critic-v1',agentId,config: {...TICK_AC_DEFAULTS,critic: 'kernel-rbf-gradient'},
    weights: initialWeights(work),eligibility: [Array(TICK_AC_PARAMETERS).fill(0),Array(TICK_AC_PARAMETERS).fill(0)],
    pending: null,kernel: createKernelLearner(KC_DIMS,KC_PROGRAM,KC_CAPACITY),
    rngState: seed,decisions: 0,transitions: 0,lastDecisionTick: 0,lastObservedTick: 0,
    awaitingObservation: false,acquisition: true,dead: false,work,
    charge: {operationsBilled: 0,outstandingEnergy: 0,incurredEnergy: 0,paidEnergy: 0,storageBytes: 0}};
}

function kernelTransition(state, finalEnergy, nextValue, terminal, emit) {
  const pending = state.pending;
  assert.ok(state.acquisition && pending && Number.isFinite(finalEnergy) && Number.isFinite(nextValue));
  const math = arithmetic(state.work), reward = math.divide(math.subtract(finalEnergy,pending.initialEnergy),120);
  const delta = math.subtract(math.add(reward,math.multiply(.99,nextValue)),pending.value);
  const decay = math.multiply(.99,.9);
  const actorStep = math.multiply(.01,delta);
  for (let index = 0; index < TICK_AC_PARAMETERS; index++) {
    state.eligibility[0][index] = math.add(math.multiply(decay,state.eligibility[0][index]),pending.actorGradient[index]);
    const updated = math.add(state.weights[index],math.multiply(actorStep,state.eligibility[0][index]));
    state.weights[index] = math.max(-4,math.min(4,updated));
  }
  const target = Math.max(-1,Math.min(1,reward + .99 * nextValue));
  const before = state.kernel.records.length;
  updateKernel(state.kernel,pending.kernelInput,target);
  assert.ok(state.kernel.records.length === Math.min(before + 1,KC_CAPACITY));
  state.work.scalarOperations += kernelUpdateBill(before);
  state.transitions++; state.work.liveUpdates++;
  if (terminal) for (const trace of state.eligibility) trace.fill(0);
  state.pending = null;
  emit({agentId: state.agentId,tick: pending.tick,duration: 1,action: pending.action,
    initialEnergy: pending.initialEnergy,finalEnergy,reward,previousValue: pending.value,nextValue,delta,terminal,
    kernelRecords: state.kernel.records.length,kernelTarget: target});
}

export function chooseKernelCriticAction(state, own, emit = () => {}) {
  assert.equal(own.agentId,state.agentId); assert.ok(!state.dead && !state.awaitingObservation);
  assert.equal(own.tick,state.lastObservedTick+1); assert.ok(Number.isFinite(own.energy));
  const inputs = tickFeatures(state,own.raw,own.observation);
  const kx = projectKernelInputs(inputs);
  if (state.pending) {
    assert.equal(state.pending.tick+1,own.tick);
    const bootstrap = predictKernel(state.kernel,kx);
    state.work.scalarOperations += kernelPredictBill(state.kernel.records.length);
    kernelTransition(state,own.energy,bootstrap,false,emit);
  }
  const prediction = tickNetwork(state.weights,inputs,state.work);
  const value = predictKernel(state.kernel,kx);
  state.work.scalarOperations += kernelPredictBill(state.kernel.records.length);
  state.rngState = advanceRng(state.rngState); state.work.scalarOperations += 6;
  const math = arithmetic(state.work), draw = math.divide(state.rngState,4294967296);
  let cumulative = 0, action = 3;
  for (let index = 0; index < 4; index++) {
    cumulative = math.add(cumulative,prediction.probabilities[index]); state.work.scalarOperations++;
    if (draw < cumulative) {action = index; break;}
  }
  if (state.acquisition) {
    const gradient = tickNetwork(state.weights,inputs,state.work,action);
    state.pending = {tick: own.tick,action,initialEnergy: own.energy,value,
      actorGradient: gradient.actorGradient,kernelInput: kx};
  }
  state.decisions++; state.lastDecisionTick = own.tick; state.awaitingObservation = true;
  return action;
}

export function observeKernelCriticBody(state, own, emit = () => {}) {
  assert.equal(own.agentId,state.agentId); assert.ok(!state.dead && state.awaitingObservation);
  assert.equal(own.tick,state.lastDecisionTick); assert.equal(own.tick,state.lastObservedTick+1);
  assert.ok(Number.isFinite(own.energy) && typeof own.terminal === 'boolean');
  if (own.terminal && state.pending) kernelTransition(state,own.energy,0,true,emit);
  state.lastObservedTick = own.tick; state.awaitingObservation = false; state.dead = own.terminal;
}

export function freezeKernelCriticBody(state) {
  assert.ok(!state.awaitingObservation);
  state.acquisition = false; state.pending = null;
  for (const trace of state.eligibility) trace.fill(0);
}

export function resetKernelCriticBody(state, seed) {
  assert.ok(!state.awaitingObservation);
  state.weights = initialWeights(state.work); state.pending = null;
  state.kernel = createKernelLearner(KC_DIMS,KC_PROGRAM,KC_CAPACITY);
  if (seed !== undefined) {assert.ok(Number.isInteger(seed) && seed > 0); state.rngState = seed;}
  for (const trace of state.eligibility) trace.fill(0);
}

// Chain transplant helper (V1b precedent): coefficients carried (model),
// records cleared (experience, refill from the test world).
export function carryKernelState(srcKernel) {
  assert.ok(srcKernel && Array.isArray(srcKernel.records) && Array.isArray(srcKernel.coefficients));
  assert.equal(srcKernel.records.length,srcKernel.coefficients.length);
  return {records: [],coefficients: [...srcKernel.coefficients]};
}
export function restoreKernelCriticBody(value) {
  assert.equal(value?.schema,1); assert.equal(value.kind,'tick-kernel-critic-v1');
  assert.deepEqual(value.config,{...TICK_AC_DEFAULTS,critic: 'kernel-rbf-gradient'});
  assert.ok(Number.isSafeInteger(value.agentId) && value.agentId > 0);
  assert.ok(Number.isInteger(value.rngState) && value.rngState > 0 && value.rngState <= 0xffffffff);
  assert.ok(Array.isArray(value.weights) && value.weights.length === TICK_AC_PARAMETERS);
  assert.ok(value.weights.every(weight => Number.isFinite(weight) && Math.abs(weight) <= 4));
  assert.ok(Array.isArray(value.eligibility) && value.eligibility.length === 2);
  return structuredClone(value);
}
