import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {advanceRng,digest} from './intervention-study.mjs';
import {CONTINUAL_PHASES,enterContinualPhase,updateContinualResources} from './continual-regimes.mjs';
import {makeCueCodebook,enterCuePhase,updateCueResources,cueObservation} from './cue-foraging.mjs';
import {chargeForStep,billSarsaWork,encodedStateBytes} from './sarsa-experiment.mjs';
import {createTickBody,chooseTickAction,observeTickBody,tickMotor,freezeTickBody,resetTickBody,restoreTickBody} from './tick-actor-critic.mjs';

export const TICK_CUE_ARMS = Object.freeze(['candidate','frozen','reset','cueBlind','shuffled','nullCandidate','nullBlind',
  'incumbent','acceptCruise','refuseCruise','acceptStationary','refuseStationary','random']);
export const TICK_CUE_PROBES = Object.freeze([
  ...[['A','A'],['A','C'],['A','reset'],['B','A'],['B','B'],['B','C'],['B','reset'],['C','B'],['C','C']],
  ...['A','C','reset','accept','acceptStationary'].map(version => ['transfer',version])
].map(([family,version]) => Object.freeze({family,version})));
// Additional prospective interference intervention; keep the original battery unchanged.
export const TICK_CUE_PRESSURE_PROBES = Object.freeze([Object.freeze({family: 'A',version: 'B'})]);
const learned = arm => ['candidate','frozen','reset','cueBlind','shuffled','nullCandidate','nullBlind'].includes(arm);
const canonical = value => JSON.parse(JSON.stringify(value));
const validSeed = value => Number.isInteger(value) && value > 0 && value <= 0xffffffff;

function fixedState(agentId, seed, arm, tick = 0) {
  return {schema: 1,kind: arm === 'incumbent' ? 'native-tick-reference-observer' : 'fixed-tick-menu-control',
    agentId,arm,rngState: seed,dead: false,decisions: tick,lastDecisionTick: tick,lastObservedTick: tick,
    work: {scalarOperations: 0,liveUpdates: 0,replayUpdates: 0},
    charge: {operationsBilled: 0,outstandingEnergy: 0,incurredEnergy: 0,paidEnergy: 0,storageBytes: 0}};
}

function validateHistory(history) {
  for (const key of ['seed','cueSeed','shuffleSeed','nullSeed']) assert.ok(validSeed(history[key]),key);
  assert.ok(Array.isArray(history.resourceSeeds) && history.resourceSeeds.length === 4 && history.resourceSeeds.every(validSeed));
}

export class TickCueExperiment {
  constructor({history,arm,reference,pricing,emit = () => {}}) {
    validateHistory(history); assert.ok(TICK_CUE_ARMS.includes(arm));
    assert.ok(Number.isSafeInteger(reference.founders) && reference.founders >= 2);
    assert.ok(Number.isFinite(pricing.operationEnergy) && pricing.operationEnergy > 0);
    assert.ok(Number.isFinite(pricing.byteEnergyPerSecond) && pricing.byteEnergyPerSecond > 0);
    this.historySpec = structuredClone(history); this.arm = arm;
    this.reference = structuredClone(reference); this.pricing = structuredClone(pricing);
    this.world = new World({seed: history.seed,founders: reference.founders,capacity: 240,reproduction: false,mutation: false,
      controller: 'episodic-actor',learning: arm === 'incumbent',actorParameters: reference.actorParameters,
      episodicParameters: {...reference.parameters,actuator: 'move',memoryLearning: arm === 'incumbent',neuralLearning: arm === 'incumbent'},
      nutrient: .4,seasonal: false,challenges: 'off',cueForaging: true});
    this.codebook = makeCueCodebook(history.cueSeed);
    this.founderIds = this.world.flies.map(fly => fly.id);
    this.startingEnergy = this.world.flies.reduce((sum,fly) => sum+fly.energy,0);
    this.startingDebt = 0; this.startingOperations = 0; this.learners = {};
    for (const id of this.founderIds) {
      const seed = (history.seed ^ Math.imul(id,2654435761)) >>> 0 || 1;
      this.learners[id] = learned(arm) ? createTickBody(id,seed) : fixedState(id,seed,arm);
    }
    this.phaseIndex = 0; this.phaseEnd = CONTINUAL_PHASES[0].ticks;
    this.phaseRows = []; this.savedModels = {}; this.atC = null;
    this.transfer = false; this.probe = false; this.finished = false;
    this.resource = enterCuePhase(this.world,CONTINUAL_PHASES[0],history.resourceSeeds[0],this.codebook,this.isNull() ? history.nullSeed : null);
    Object.defineProperty(this,'emit',{value: emit,writable: true,enumerable: false});
  }

  record(event) {this.emit(structuredClone({arm: this.arm,...event}));}
  isNull() {return ['nullCandidate','nullBlind'].includes(this.arm);}
  observation(fly, raw, tick) {
    let cue = this.transfer ? [0,0,0,0] : fly.sensedCue;
    if (['cueBlind','nullBlind'].includes(this.arm)) cue = [0,0,0,0];
    if (this.arm === 'shuffled' && !this.transfer) {
      const family = this.resource.family === 'return-A' ? 'A' : this.resource.family;
      const index = parseInt(digest(`${this.historySpec.shuffleSeed}:${fly.id}:${tick}`).slice(0,8),16)%4;
      cue = this.codebook[family][index].bits;
    }
    return cueObservation(raw,cue);
  }

  fixedChoice(state, tick) {
    assert.ok(!state.dead); assert.equal(state.lastObservedTick+1,tick);
    let action = ['acceptCruise','refuseCruise','acceptStationary','refuseStationary'].indexOf(this.arm);
    state.work.scalarOperations++;
    if (this.arm === 'random') {
      state.rngState = advanceRng(state.rngState);
      action = Math.floor(state.rngState/4294967296*4); state.work.scalarOperations += 9;
    }
    assert.ok(action >= 0 && action < 4);
    state.decisions++; state.lastDecisionTick = tick;
    return action;
  }

  enterNextPhase() {
    this.phaseIndex++;
    if (this.phaseIndex >= CONTINUAL_PHASES.length) {this.finished = true; return false;}
    const phase = CONTINUAL_PHASES[this.phaseIndex];
    if (['B','C'].includes(phase.id) && ['frozen','reset'].includes(this.arm)) {
      for (const state of Object.values(this.learners)) {
        if (state.dead) continue;
        if (this.arm === 'frozen') freezeTickBody(state);
        else resetTickBody(state);
      }
      this.record({type: 'intervention',tick: this.world.tick,phase: phase.id,action: this.arm});
    }
    this.resource = enterCuePhase(this.world,phase,this.historySpec.resourceSeeds[this.phaseIndex],this.codebook,this.isNull() ? this.historySpec.nullSeed : null);
    this.phaseEnd += phase.ticks;
    this.record({type: 'phase',tick: this.world.tick,phase: phase.id,resource: this.resource});
    return true;
  }

  step() {
    if (this.finished || !this.world.flies.length) return false;
    if (this.world.tick === this.phaseEnd) {
      if (this.probe) {this.finished = true; return false;}
      if (!this.enterNextPhase()) return false;
    }
    if (this.transfer) updateContinualResources(this.world,this.resource);
    else updateCueResources(this.world,this.resource);
    const before = [...this.world.flies];
    this.world.step((fly,raw,tick) => {
      const state = this.learners[fly.id];
      if (this.arm === 'incumbent') {
        state.decisions++; state.lastDecisionTick = tick;
        return {energyCost: 0,afterController: outputs => this.record({type: 'native-motor',agentId: fly.id,tick,raw,outputs,
          nativeMemoryRecords: fly.brain.episodic.memory.records.length,nativeLookupRecords: fly.brain.episodic.lookupRecordsThisStep}),
          afterStep: receipt => this.record({type: 'physical',...receipt,storageBytes: 0,requestedExtra: 0,outstandingEnergy: 0})};
      }
      const observation = this.observation(fly,raw,tick);
      const own = {agentId: fly.id,tick,energy: fly.energy-state.charge.outstandingEnergy,raw,observation};
      const choice = learned(this.arm) ? chooseTickAction(state,own,row => this.record({type: 'transition',...row})) : this.fixedChoice(state,tick);
      const outputs = tickMotor(state,raw,choice), bill = chargeForStep(state,this.pricing);
      this.record({type: 'decision',own,sourceCue: fly.sensedCue,physicalEnergy: fly.energy,choice,outputs,rngState: state.rngState,
        scalarOperations: state.work.scalarOperations,storageBytes: state.charge.storageBytes,requestedExtra: bill.energyCost});
      return {...bill,afterController: native => {
        native.splice(0,5,...outputs);
        this.record({type: 'native-cost',agentId: fly.id,tick,outputs: native,
          nativeMemoryRecords: fly.brain.episodic.memory.records.length,nativeLookupRecords: fly.brain.episodic.lookupRecordsThisStep});
      },afterStep: receipt => {
        assert.ok(Math.abs(receipt.initialEnergy-receipt.cost+receipt.beneficialEaten-receipt.toxinDamage-receipt.finalEnergy) < 1e-7);
        this.record({type: 'physical',...receipt,storageBytes: state.charge.storageBytes,requestedExtra: bill.energyCost,
          outstandingEnergy: state.charge.outstandingEnergy,incurredEnergy: state.charge.incurredEnergy,paidEnergy: state.charge.paidEnergy});
      }};
    });
    for (const fly of before) {
      const state = this.learners[fly.id], alive = this.world.flies.includes(fly);
      const own = {agentId: fly.id,tick: this.world.tick,energy: (alive ? fly.energy : 0)-state.charge.outstandingEnergy,terminal: !alive};
      if (learned(this.arm)) observeTickBody(state,own,row => this.record({type: 'transition',...row}));
      else {state.lastObservedTick = this.world.tick; state.dead = !alive;}
      if (!alive && this.arm !== 'incumbent') billSarsaWork(state,this.pricing);
      this.record({type: 'observe',own,physicalEnergy: alive ? fly.energy : 0,discardedEnergy: alive ? 0 : fly.energy,
        scalarOperations: state.work.scalarOperations,outstandingEnergy: state.charge.outstandingEnergy,
        incurredEnergy: state.charge.incurredEnergy,paidEnergy: state.charge.paidEnergy});
    }
    assert.ok(Math.abs(this.world.metrics().accountingError) < 1e-6);
    if (!this.probe && this.world.tick === this.phaseEnd) {
      const phase = CONTINUAL_PHASES[this.phaseIndex]; this.phaseRows.push({phase: phase.id,...this.endpoint()});
      if (['A','B'].includes(phase.id) && learned(this.arm)) this.savedModels[phase.id] = Object.fromEntries(
        Object.entries(this.learners).map(([id,state]) => [id,structuredClone(state.weights)]));
      this.record({type: 'phase-end',tick: this.world.tick,phase: phase.id,endpoint: this.endpoint()});
      if (phase.id === 'C' && this.arm === 'candidate') this.atC = this.checkpoint(false);
    }
    return true;
  }

  advance(ticks) {
    assert.ok(Number.isSafeInteger(ticks) && ticks >= 0);
    for (let index = 0; index < ticks; index++) if (!this.step()) break;
  }

  endpoint() {
    const physicalEnergy = this.world.flies.reduce((sum,fly) => sum+fly.energy,0);
    const outstandingEnergy = Object.values(this.learners).reduce((sum,state) => sum+state.charge.outstandingEnergy,0);
    const scalarOperations = Object.values(this.learners).reduce((sum,state) => sum+state.work.scalarOperations,0);
    return {tick: this.world.tick,founders: this.founderIds.length,survivors: this.world.flies.length,
      survival: this.world.flies.length/this.founderIds.length,physicalEnergy,startingEnergy: this.startingEnergy,
      startingDebt: this.startingDebt,outstandingEnergy,
      budgetAdjustedEnergyPerFounder: (physicalEnergy-this.startingEnergy-(outstandingEnergy-this.startingDebt))/this.founderIds.length,
      accountingResidual: this.world.metrics().accountingError,foodInventory: this.world.food.reduce((sum,patch) => sum+patch.amount,0),
      totals: structuredClone(this.world.totals),scalarOperations,additionalScalarOperations: scalarOperations-this.startingOperations,
      learnerEncodedBytes: this.arm === 'incumbent' ? 0 : Object.values(this.learners).reduce((sum,state) => sum+encodedStateBytes(state),0)};
  }

  checkpoint(includeAtC = true) {
    const {world,atC,...state} = this;
    return canonical({schema: 1,kind: 'joint-tick-cue-experiment',world: world.checkpoint(),state,atC: includeAtC ? atC : null});
  }

  static restore(checkpoint, emit = () => {}) {
    assert.equal(checkpoint.schema,1); assert.equal(checkpoint.kind,'joint-tick-cue-experiment');
    const run = Object.create(TickCueExperiment.prototype); Object.assign(run,structuredClone(checkpoint.state));
    assert.ok(TICK_CUE_ARMS.includes(run.arm)); validateHistory(run.historySpec);
    assert.ok(new Set(run.founderIds).size === run.founderIds.length && run.founderIds.length === run.reference.founders);
    assert.deepEqual(Object.keys(run.learners).sort(),run.founderIds.map(String).sort());
    assert.ok(Number.isFinite(run.pricing.operationEnergy) && run.pricing.operationEnergy > 0);
    assert.ok(Number.isFinite(run.pricing.byteEnergyPerSecond) && run.pricing.byteEnergyPerSecond > 0);
    run.world = World.restore(checkpoint.world); run.atC = structuredClone(checkpoint.atC);
    assert.ok(run.world.flies.every(fly => run.founderIds.includes(fly.id)));
    assert.equal(run.world.config.reproduction,false); assert.equal(run.world.config.mutation,false);
    assert.equal(run.world.config.controller,'episodic-actor');
    assert.equal(run.world.config.learning,run.arm === 'incumbent');
    assert.ok(Number.isSafeInteger(run.phaseIndex) && run.phaseIndex >= 0 && run.phaseIndex <= CONTINUAL_PHASES.length);
    assert.ok(Number.isSafeInteger(run.phaseEnd) && run.phaseEnd >= run.world.tick);
    for (const key of ['probe','finished','transfer']) assert.equal(typeof run[key],'boolean');
    assert.ok(Number.isFinite(run.startingEnergy) && run.startingEnergy >= 0);
    assert.ok(Number.isFinite(run.startingDebt) && run.startingDebt >= 0);
    assert.ok(Number.isSafeInteger(run.startingOperations) && run.startingOperations >= 0);
    for (const [family,models] of Object.entries(run.savedModels)) {
      assert.ok(['A','B'].includes(family)); assert.deepEqual(Object.keys(models).sort(),run.founderIds.map(String).sort());
      for (const weights of Object.values(models)) assert.ok(Array.isArray(weights) && weights.length === 161 && weights.every(value => Number.isFinite(value) && Math.abs(value) <= 4));
    }
    Object.defineProperty(run,'emit',{value: emit,writable: true,enumerable: false});
    for (const id of run.founderIds) {
      const state = run.learners[id]; assert.equal(state.agentId,id);
      assert.equal(state.dead,!run.world.flies.some(fly => fly.id === id));
      assert.ok(state.lastObservedTick <= run.world.tick);
      if (!state.dead) assert.equal(state.lastObservedTick,run.world.tick);
      if (learned(run.arm)) run.learners[id] = restoreTickBody(state);
      else {
        assert.deepEqual(Object.keys(state).sort(),Object.keys(fixedState(id,state.rngState,run.arm)).sort());
        assert.equal(state.kind,run.arm === 'incumbent' ? 'native-tick-reference-observer' : 'fixed-tick-menu-control');
        assert.equal(state.arm,run.arm); assert.ok(validSeed(state.rngState));
        assert.equal(state.lastDecisionTick,state.lastObservedTick);
        assert.equal(state.decisions,state.lastDecisionTick);
        assert.ok(Number.isSafeInteger(state.work.scalarOperations) && state.work.scalarOperations >= state.charge.operationsBilled);
        assert.equal(state.work.liveUpdates,0); assert.equal(state.work.replayUpdates,0);
        assert.ok(Number.isSafeInteger(state.charge.operationsBilled) && Number.isSafeInteger(state.charge.storageBytes));
        for (const key of ['operationsBilled','outstandingEnergy','incurredEnergy','paidEnergy','storageBytes']) assert.ok(Number.isFinite(state.charge[key]) && state.charge[key] >= 0);
        assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy) < 1e-8);
      }
    }
    assert.ok(Object.values(run.learners).reduce((sum,state) => sum+state.work.scalarOperations,0) >= run.startingOperations);
    return run;
  }
}

export function runTickCueProbe(atC, spec, resourceSeed, founders, {ticks = 256,emit = () => {}} = {}) {
  assert.ok([...TICK_CUE_PROBES,...TICK_CUE_PRESSURE_PROBES].some(probe => probe.family === spec.family && probe.version === spec.version));
  assert.ok(validSeed(resourceSeed) && Number.isSafeInteger(founders) && founders >= 2);
  assert.ok(Number.isSafeInteger(ticks) && ticks > 0 && ticks <= 256);
  if (!atC) return {...spec,resourceSeed,founders,survivors: 0,survival: 0,value: 0,skippedAllDead: true,startWorldSha256: null,
    resetInitializationOperations: 0,resetInitializationEnergyPerFounder: 0};
  const run = TickCueExperiment.restore(atC,emit);
  assert.ok(learned(run.arm)); assert.equal(run.founderIds.length,founders);
  const source = ['A','B'].includes(spec.version) ? run.savedModels[spec.version] : null;
  if (['A','B'].includes(spec.version)) assert.ok(source,'Missing saved skill version');
  const fixedArm = spec.version === 'accept' ? 'acceptCruise' : spec.version === 'acceptStationary' ? 'acceptStationary' : null;
  let startingOperations = 0, resetInitializationOperations = 0;
  for (const id of run.founderIds) {
    const current = run.learners[id];
    if (fixedArm) {
      const fixed = fixedState(id,current.rngState,fixedArm,current.lastObservedTick);
      fixed.dead = current.dead;
      fixed.charge = {...current.charge,operationsBilled: 0,storageBytes: 0};
      run.learners[id] = fixed;
    } else {
      startingOperations += current.work.scalarOperations;
      if (source) {assert.ok(Array.isArray(source[id]) && source[id].length === 161); current.weights = structuredClone(source[id]);}
      if (spec.version === 'reset' && !current.dead) {
        const operations = current.work.scalarOperations; resetTickBody(current);
        resetInitializationOperations += current.work.scalarOperations-operations;
      }
      freezeTickBody(current);
    }
  }
  run.arm = fixedArm || 'frozen';
  run.probe = true; run.finished = false; run.atC = null; run.savedModels = {}; run.phaseRows = [];
  run.transfer = spec.family === 'transfer';
  const phase = CONTINUAL_PHASES.find(item => item.id === (run.transfer ? 'A' : spec.family));
  run.phaseIndex = CONTINUAL_PHASES.indexOf(phase); run.phaseEnd = run.world.tick+ticks;
  if (run.transfer) {
    run.world.config.cueForaging = false;
    run.resource = enterContinualPhase(run.world,phase,resourceSeed);
  } else run.resource = enterCuePhase(run.world,phase,resourceSeed,run.codebook);
  run.startingEnergy = run.world.flies.reduce((sum,fly) => sum+fly.energy,0);
  run.startingDebt = Object.values(run.learners).reduce((sum,state) => sum+state.charge.outstandingEnergy,0);
  run.startingOperations = startingOperations;
  const startWorldSha256 = digest(run.world.checkpoint()), beforeWeights = digest(Object.values(run.learners).map(state => state.weights ?? null));
  run.record({type: 'probe-start',spec,resourceSeed,ticks,startingEnergy: run.startingEnergy,startingDebt: run.startingDebt,
    startWorldSha256,resetInitializationOperations,learners: run.learners,world: run.world.checkpoint()});
  const skippedAllDead = run.world.flies.length === 0;
  run.advance(ticks);
  assert.equal(digest(Object.values(run.learners).map(state => state.weights ?? null)),beforeWeights);
  const endpoint = run.endpoint(); run.record({type: 'probe-end',endpoint,learners: run.learners});
  return {...spec,resourceSeed,founders,survivors: endpoint.survivors,survival: endpoint.survival,value: endpoint.budgetAdjustedEnergyPerFounder,
    resetInitializationOperations,resetInitializationEnergyPerFounder: resetInitializationOperations*run.pricing.operationEnergy/founders,
    skippedAllDead,startWorldSha256,endpoint,acquisitionDisabled: true,learnedWeightsUnchanged: true,
    finalWorldSha256: digest(run.world.checkpoint())};
}
