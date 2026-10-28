import assert from 'node:assert/strict';
import {advanceRng} from './intervention-study.mjs';
import {odorIdentityFeatures} from './odor-identity.mjs';
import {motorPrimitive} from './cue-foraging.mjs';

export const TICK_AC_DEFAULTS = Object.freeze({mechanism: 'tick-shared-actor-critic-v1',inputs: 33,hidden: 4,actions: 4,
  initializationSeed: 0x74616331,discount: .99,lambda: .9,epsilon: .1,actorRate: .01,criticRate: .05,weightBound: 4});
export const TICK_AC_PARAMETERS = 161;
export const TICK_AC_ACTIONS = Object.freeze(['accept-cruise','refuse-cruise','accept-stationary','refuse-stationary']);
const hiddenStride = 34, headStride = 5, actorOffset = 136, criticOffset = 156;
const finiteVector = (values, size) => Array.isArray(values) && values.length === size && values.every(Number.isFinite);

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
    weights[hidden*hiddenStride+input] = math.multiply(.2,math.subtract(math.divide(rng,4294967296),.5));
  }
  weights[actorOffset+4] = math.log(3);
  return weights;
}

export function createTickBody(agentId, seed) {
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0);
  assert.ok(Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
  const work = {scalarOperations: 0,liveUpdates: 0,replayUpdates: 0};
  return {schema: 1,kind: 'own-tick-shared-actor-critic',agentId,config: {...TICK_AC_DEFAULTS},
    weights: initialWeights(work),eligibility: [Array(TICK_AC_PARAMETERS).fill(0),Array(TICK_AC_PARAMETERS).fill(0)],
    pending: null,rngState: seed,decisions: 0,transitions: 0,lastDecisionTick: 0,lastObservedTick: 0,
    awaitingObservation: false,acquisition: true,dead: false,work,
    charge: {operationsBilled: 0,outstandingEnergy: 0,incurredEnergy: 0,paidEnergy: 0,storageBytes: 0}};
}

export function tickFeatures(state, raw, observation) {
  assert.ok(finiteVector(raw,17) && finiteVector(observation,17));
  for (const index of [4,5,6,7,8,9,10,11,13,14,15,16]) assert.equal(observation[index],raw[index]);
  assert.equal(observation[12],raw[3]);
  return [...raw,...odorIdentityFeatures(state,observation)];
}

export function tickNetwork(weights, inputs, work, action = null) {
  assert.ok(finiteVector(weights,TICK_AC_PARAMETERS) && finiteVector(inputs,33));
  assert.ok(action === null || Number.isInteger(action) && action >= 0 && action < 4);
  const math = arithmetic(work), hiddenValues = [];
  for (let hidden = 0; hidden < 4; hidden++) {
    let sum = weights[hidden*hiddenStride+33];
    for (let input = 0; input < 33; input++) sum = math.add(sum,math.multiply(weights[hidden*hiddenStride+input],inputs[input]));
    hiddenValues.push(math.tanh(sum));
  }
  const head = offset => {
    let value = weights[offset+4];
    for (let hidden = 0; hidden < 4; hidden++) value = math.add(value,math.multiply(weights[offset+hidden],hiddenValues[hidden]));
    return value;
  };
  const logits = Array.from({length: 4},(_,index) => head(actorOffset+index*headStride));
  const maximum = logits.reduce((largest,value) => math.max(largest,value),logits[0]);
  const exponentials = logits.map(value => math.exp(math.subtract(value,maximum)));
  const total = exponentials.reduce((sum,value) => math.add(sum,value),0);
  const softmax = exponentials.map(value => math.divide(value,total));
  const probabilities = softmax.map(value => math.add(math.divide(.1,4),math.multiply(.9,value)));
  const value = head(criticOffset);
  if (action === null) return {probabilities,value};
  const actorGradient = Array(TICK_AC_PARAMETERS).fill(0), criticGradient = Array(TICK_AC_PARAMETERS).fill(0);
  const factor = math.divide(math.multiply(.9,softmax[action]),probabilities[action]);
  const logitGradients = softmax.map((probability,index) => math.multiply(factor,math.subtract(index === action ? 1 : 0,probability)));
  for (let index = 0; index < 4; index++) {
    for (let hidden = 0; hidden < 4; hidden++) actorGradient[actorOffset+index*headStride+hidden] = math.multiply(logitGradients[index],hiddenValues[hidden]);
    actorGradient[actorOffset+index*headStride+4] = logitGradients[index];
  }
  for (let hidden = 0; hidden < 4; hidden++) {
    const slope = math.subtract(1,math.multiply(hiddenValues[hidden],hiddenValues[hidden]));
    let actorSignal = 0;
    for (let index = 0; index < 4; index++) actorSignal = math.add(actorSignal,
      math.multiply(logitGradients[index],weights[actorOffset+index*headStride+hidden]));
    const actorHidden = math.multiply(slope,actorSignal), criticHidden = math.multiply(slope,weights[criticOffset+hidden]);
    for (let input = 0; input < 33; input++) {
      actorGradient[hidden*hiddenStride+input] = math.multiply(actorHidden,inputs[input]);
      criticGradient[hidden*hiddenStride+input] = math.multiply(criticHidden,inputs[input]);
    }
    actorGradient[hidden*hiddenStride+33] = actorHidden;
    criticGradient[hidden*hiddenStride+33] = criticHidden;
    criticGradient[criticOffset+hidden] = hiddenValues[hidden];
  }
  criticGradient[criticOffset+4] = 1;
  return {probabilities,value,actorGradient,criticGradient};
}

function transition(state, finalEnergy, nextValue, terminal, emit) {
  const pending = state.pending;
  assert.ok(state.acquisition && pending && Number.isFinite(finalEnergy) && Number.isFinite(nextValue));
  const math = arithmetic(state.work), reward = math.divide(math.subtract(finalEnergy,pending.initialEnergy),120);
  const delta = math.subtract(math.add(reward,math.multiply(.99,nextValue)),pending.value);
  const decay = math.multiply(.99,.9);
  const actorStep = math.multiply(.01,delta), criticStep = math.multiply(.05,delta);
  for (let index = 0; index < TICK_AC_PARAMETERS; index++) {
    state.eligibility[0][index] = math.add(math.multiply(decay,state.eligibility[0][index]),pending.actorGradient[index]);
    state.eligibility[1][index] = math.add(math.multiply(decay,state.eligibility[1][index]),pending.criticGradient[index]);
    const updated = math.add(state.weights[index],math.add(math.multiply(actorStep,state.eligibility[0][index]),
      math.multiply(criticStep,state.eligibility[1][index])));
    state.weights[index] = math.max(-4,math.min(4,updated));
  }
  state.transitions++; state.work.liveUpdates++;
  if (terminal) for (const trace of state.eligibility) trace.fill(0);
  state.pending = null;
  emit({agentId: state.agentId,tick: pending.tick,duration: 1,action: pending.action,
    initialEnergy: pending.initialEnergy,finalEnergy,reward,previousValue: pending.value,nextValue,delta,terminal});
}

export function chooseTickAction(state, own, emit = () => {}) {
  assert.equal(own.agentId,state.agentId); assert.ok(!state.dead && !state.awaitingObservation);
  assert.equal(own.tick,state.lastObservedTick+1); assert.ok(Number.isFinite(own.energy));
  const inputs = tickFeatures(state,own.raw,own.observation);
  if (state.pending) {
    assert.equal(state.pending.tick+1,own.tick);
    const bootstrap = tickNetwork(state.weights,inputs,state.work);
    transition(state,own.energy,bootstrap.value,false,emit);
  }
  const prediction = tickNetwork(state.weights,inputs,state.work);
  state.rngState = advanceRng(state.rngState); state.work.scalarOperations += 6;
  const math = arithmetic(state.work), draw = math.divide(state.rngState,4294967296);
  let cumulative = 0, action = 3;
  for (let index = 0; index < 4; index++) {
    cumulative = math.add(cumulative,prediction.probabilities[index]); state.work.scalarOperations++;
    if (draw < cumulative) {action = index; break;}
  }
  if (state.acquisition) {
    const gradient = tickNetwork(state.weights,inputs,state.work,action);
    state.pending = {tick: own.tick,action,initialEnergy: own.energy,value: gradient.value,
      actorGradient: gradient.actorGradient,criticGradient: gradient.criticGradient};
  }
  state.decisions++; state.lastDecisionTick = own.tick; state.awaitingObservation = true;
  return action;
}

export function observeTickBody(state, own, emit = () => {}) {
  assert.equal(own.agentId,state.agentId); assert.ok(!state.dead && state.awaitingObservation);
  assert.equal(own.tick,state.lastDecisionTick); assert.equal(own.tick,state.lastObservedTick+1);
  assert.ok(Number.isFinite(own.energy) && typeof own.terminal === 'boolean');
  if (own.terminal && state.pending) transition(state,own.energy,0,true,emit);
  state.lastObservedTick = own.tick; state.awaitingObservation = false; state.dead = own.terminal;
}

export function tickMotor(state, raw, action) {
  assert.ok(finiteVector(raw,17) && Number.isInteger(action) && action >= 0 && action < 4);
  const accept = action === 0 || action === 2;
  state.work.scalarOperations += accept ? 6 : 9;
  const outputs = motorPrimitive(raw,accept ? 1 : -1);
  if (action >= 2) outputs[1] = -1;
  return outputs;
}

export function freezeTickBody(state) {
  assert.ok(!state.awaitingObservation);
  state.acquisition = false; state.pending = null;
  for (const trace of state.eligibility) trace.fill(0);
}

export function resetTickBody(state) {
  assert.ok(!state.awaitingObservation);
  state.weights = initialWeights(state.work); state.pending = null;
  for (const trace of state.eligibility) trace.fill(0);
}

export function restoreTickBody(value) {
  assert.equal(value?.schema,1); assert.equal(value.kind,'own-tick-shared-actor-critic');
  assert.deepEqual(value.config,TICK_AC_DEFAULTS);
  assert.ok(Number.isSafeInteger(value.agentId) && value.agentId > 0);
  assert.ok(Number.isInteger(value.rngState) && value.rngState > 0 && value.rngState <= 0xffffffff);
  assert.ok(finiteVector(value.weights,TICK_AC_PARAMETERS) && value.weights.every(weight => Math.abs(weight) <= 4));
  assert.ok(Array.isArray(value.eligibility) && value.eligibility.length === 2);
  for (const trace of value.eligibility) assert.ok(finiteVector(trace,TICK_AC_PARAMETERS));
  for (const key of ['decisions','transitions','lastDecisionTick','lastObservedTick']) assert.ok(Number.isSafeInteger(value[key]) && value[key] >= 0);
  for (const key of ['awaitingObservation','acquisition','dead']) assert.equal(typeof value[key],'boolean');
  assert.equal(value.lastDecisionTick,value.lastObservedTick+(value.awaitingObservation ? 1 : 0));
  assert.equal(value.decisions,value.lastDecisionTick);
  assert.ok(value.transitions <= value.decisions);
  for (const key of ['scalarOperations','liveUpdates','replayUpdates']) assert.ok(Number.isSafeInteger(value.work[key]) && value.work[key] >= 0);
  assert.equal(value.work.liveUpdates,value.transitions); assert.equal(value.work.replayUpdates,0);
  for (const key of ['operationsBilled','outstandingEnergy','incurredEnergy','paidEnergy','storageBytes']) assert.ok(Number.isFinite(value.charge[key]) && value.charge[key] >= 0);
  assert.ok(Number.isSafeInteger(value.charge.operationsBilled) && Number.isSafeInteger(value.charge.storageBytes));
  assert.ok(value.charge.operationsBilled <= value.work.scalarOperations);
  assert.ok(Math.abs(value.charge.incurredEnergy-value.charge.paidEnergy-value.charge.outstandingEnergy) < 1e-8);
  assert.ok(!(value.dead && value.awaitingObservation));
  if (value.dead || !value.acquisition) {
    assert.equal(value.pending,null);
    assert.ok(value.eligibility.every(trace => trace.every(entry => entry === 0)));
  }
  if (value.awaitingObservation && value.acquisition) assert.notEqual(value.pending,null);
  if (value.pending !== null) {
    assert.ok(value.acquisition && !value.dead);
    assert.equal(value.pending.tick,value.lastDecisionTick);
    assert.ok(Number.isInteger(value.pending.action) && value.pending.action >= 0 && value.pending.action < 4);
    assert.ok(Number.isFinite(value.pending.initialEnergy) && Number.isFinite(value.pending.value));
    for (const key of ['actorGradient','criticGradient']) assert.ok(finiteVector(value.pending[key],TICK_AC_PARAMETERS));
  }
  return structuredClone(value);
}
