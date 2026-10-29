import assert from 'node:assert/strict';
import * as linear from './sarsa-body.mjs';
import * as tiles from './tile-sarsa-body.mjs';
import * as retrace from './retrace-sarsa-body.mjs';
import * as mushroom from './mushroom-body.mjs';

const linearApi = {create: linear.createSarsaBody, choose: linear.chooseSarsaAction, observe: linear.observeSarsaBody, freeze: linear.freezeSarsaBody, reset: linear.resetSarsaAcquired, restore: linear.restoreSarsaBody};
const tileApi = {create: tiles.createTileBody, choose: tiles.chooseTileAction, observe: tiles.observeTileBody, freeze: tiles.freezeTileBody, reset: tiles.resetTileAcquired, restore: tiles.restoreTileBody};
const replayApi = {create: retrace.createRetraceBody, choose: retrace.chooseRetraceAction, observe: retrace.observeRetraceBody, freeze: retrace.freezeRetraceBody, reset: retrace.resetRetraceAcquired,
  restore(s) { assert.equal(s.config.replayLambda, .9); return retrace.restoreRetraceBody(s); }};
const oneStepApi = {...replayApi, create: retrace.createOneStepReplayBody, restore(s) { assert.equal(s.config.replayLambda, 0); return retrace.restoreRetraceBody(s); }};
const mushroomApi = {create(id, seed, options = {}) { if (Object.hasOwn(options, 'consolidationRate')) assert.equal(options.consolidationRate, .02); return mushroom.createMushroomBody(id, seed, options); },
  choose: mushroom.chooseMushroomAction, observe: mushroom.observeMushroomBody,
  freeze: mushroom.freezeMushroomBody, reset: mushroom.resetMushroomBody,
  restore(s) { assert.equal(s.config.consolidationRate, .02); return mushroom.restoreMushroomBody(s); }};
const fastMushroomApi = {...mushroomApi, create: mushroom.createFastMushroomBody,
  restore(s) { assert.equal(s.config.consolidationRate, 0); return mushroom.restoreMushroomBody(s); }};
const reflexApi = {
  create(agentId, seed) { return {schema: 1, kind: 'fixed-feeding-reflex', agentId, config: {}, weights: [], eligibility: [], history: [], pending: null, recent: [], older: [], olderSeen: 0,
    rngState: seed, retentionRngState: seed, replayRngState: seed, acquisition: false, dead: false, decisions: 0, transitions: 0, replayUpdates: 0, lastDecisionTick: 0, lastObservedTick: 0,
    work: {scalarOperations: 0, liveUpdates: 0, replayUpdates: 0}, charge: {operationsBilled: 0, outstandingEnergy: 0, incurredEnergy: 0, paidEnergy: 0, storageBytes: 0}}; },
  choose(s, own) { assert.equal(own.agentId, s.agentId); assert.equal(own.tick, s.lastObservedTick + 1); assert.ok(!s.dead); s.lastDecisionTick = own.tick; s.decisions++; s.work.scalarOperations++; return own.observation[13] > 0 ? -1 : 1; },
  observe(s, {agentId, tick, terminal}) { assert.equal(agentId, s.agentId); assert.equal(tick, s.lastObservedTick + 1); s.lastObservedTick = tick; s.dead = terminal; },
  freeze() {}, reset() {},
  restore(s) { assert.equal(s?.kind, 'fixed-feeding-reflex'); assert.equal(s.schema, 1); assert.ok(!s.acquisition && s.transitions === 0); return structuredClone(s); }
};
export const EMBODIED_PROGRAMS = Object.freeze({
  'mushroom-policy-v1': {id: 'mushroom-policy-v1', api: mushroomApi, learned: true},
  'mushroom-fast-only-v1': {id: 'mushroom-fast-only-v1', api: fastMushroomApi, learned: true},
  'linear-sarsa-v1': {id: 'linear-sarsa-v1', api: linearApi, learned: true},
  'tile-sarsa-v1': {id: 'tile-sarsa-v1', api: tileApi, learned: true},
  'linear-retrace-v1': {id: 'linear-retrace-v1', api: replayApi, learned: true},
  'linear-replay-one-step-v1': {id: 'linear-replay-one-step-v1', api: oneStepApi, learned: true},
  'feeding-reflex-v1': {id: 'feeding-reflex-v1', api: reflexApi, learned: false}
});
export function embodiedProgram(id = 'linear-sarsa-v1') { assert.ok(Object.hasOwn(EMBODIED_PROGRAMS, id), 'Unknown embodied program'); return EMBODIED_PROGRAMS[id]; }
