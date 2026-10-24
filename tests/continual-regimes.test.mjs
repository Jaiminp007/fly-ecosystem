import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {CONTINUAL_PHASES, enterContinualPhase, updateContinualResources, fixedFounderEndpoint} from '../learning/continual-regimes.mjs';

test('task transitions generate distinct resources while preserving bodies, acquired state, energy and simulator RNG', () => {
  const world = new World({seed: 51, founders: 4, reproduction: false, mutation: false, controller: 'episodic-actor'});
  world.advance(32);
  const flies = structuredClone(world.flies), total = world.energy(), rng = world.rng.state;
  const a = enterContinualPhase(world, CONTINUAL_PHASES[0], 1001), landscapeA = structuredClone(world.food);
  const b = enterContinualPhase(world, CONTINUAL_PHASES[1], 1002);
  assert.notDeepEqual(world.food, landscapeA);
  assert.deepEqual(world.flies, flies);
  assert.equal(world.energy(), total); assert.equal(world.rng.state, rng);
  assert.equal(a.nextShiftTick, null);
  assert.equal(b.nextShiftTick, world.tick + 128);
  World.restore(world.checkpoint());
});

test('moving-resource transitions continue exactly across serialized experiment checkpoints', () => {
  const world = new World({seed: 51, founders: 4, reproduction: false, mutation: false, controller: 'episodic-actor'});
  const state = enterContinualPhase(world, CONTINUAL_PHASES[1], 1002);
  world.advance(127); assert.equal(updateContinualResources(world, state), false);
  const copy = World.restore(JSON.parse(JSON.stringify(world.checkpoint()))), copiedState = JSON.parse(JSON.stringify(state));
  world.step(); copy.step();
  assert.equal(updateContinualResources(world, state), true);
  assert.equal(updateContinualResources(copy, copiedState), true);
  assert.deepEqual(copy.checkpoint(), world.checkpoint()); assert.deepEqual(copiedState, state);
});

test('founder metrics keep deaths in the denominator', () => {
  const world = new World({seed: 51, founders: 4}), ids = world.flies.map(f => f.id), energy = world.flies.reduce((s, f) => s + f.energy, 0);
  const removed = world.flies.pop();
  const endpoint = fixedFounderEndpoint(world, ids, energy);
  assert.equal(endpoint.survivalFraction, .75);
  assert.equal(endpoint.energyPerFounder, -removed.energy / ids.length);
  assert.equal(CONTINUAL_PHASES.reduce((s, p) => s + p.ticks, 0), 1792);
});
