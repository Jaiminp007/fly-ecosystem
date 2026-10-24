import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {stepEmbodiedControl} from '../learning/embodied-control.mjs';
import {createOwnLearner, chooseOwnAction, observeOwnEnergy, restoreOwnLearner} from '../learning/own-experience-learner.mjs';
import {CONTINUAL_PHASES, enterContinualPhase, updateContinualResources} from '../learning/continual-regimes.mjs';

const config = {seed: 83, founders: 4, reproduction: false, mutation: false, seasonal: false, controller: 'episodic-actor', episodicParameters: {actuator: 'move', moveMode: 'levels', decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99, memoryLearning: false}};
function step(world, learners) {
  const before = [...world.flies];
  stepEmbodiedControl(world, own => chooseOwnAction(learners[own.agentId], own));
  for (const f of before) {
    const alive = world.flies.includes(f);
    observeOwnEnergy(learners[f.id], {agentId: f.id, tick: world.tick, energy: alive ? f.energy : 0, terminal: !alive});
  }
}

test('continuing learners use executed own trajectories and survive complete world/learner checkpoint continuation', () => {
  const world = new World(config), learners = Object.fromEntries(world.flies.map(f => [f.id, createOwnLearner(f.id, f.id + 83, {horizon: 8, capacity: 16})]));
  for (let i = 0; i < 160; i++) step(world, learners);
  for (const learner of Object.values(learners)) {
    assert.equal(learner.completed, 20); assert.equal(learner.estimator.records.length, 16);
    for (const r of learner.estimator.records) assert.equal(r.evidence.agentId, learner.agentId);
  }
  const copy = World.restore(JSON.parse(JSON.stringify(world.checkpoint()))), copiedLearners = Object.fromEntries(Object.entries(learners).map(([id, value]) => [id, restoreOwnLearner(JSON.parse(JSON.stringify(value)))]));
  for (let i = 0; i < 32; i++) { step(world, learners); step(copy, copiedLearners); }
  assert.deepEqual(copy.checkpoint(), world.checkpoint()); assert.deepEqual(copiedLearners, learners);
});

test('the 256-tick own-experience learner reaches actual memory pressure within unchanged body lifetimes', () => {
  const world = new World(config), learners = Object.fromEntries(world.flies.map(f => [f.id, createOwnLearner(f.id, f.id + 83)]));
  for (const [index, phase] of CONTINUAL_PHASES.entries()) {
    const transition = enterContinualPhase(world, phase, 901 + index);
    const end = world.tick + phase.ticks;
    while (world.tick < end) { updateContinualResources(world, transition); step(world, learners); }
  }
  assert.equal(world.tick, CONTINUAL_PHASES.reduce((n, phase) => n + phase.ticks, 0));
  assert.ok(Object.values(learners).some(learner => learner.completed > learner.config.capacity));
  for (const learner of Object.values(learners)) {
    assert.equal(learner.estimator.records.length, Math.min(learner.completed, learner.config.capacity));
    assert.ok(learner.pending.length <= learner.config.horizon / 8);
  }
  assert.ok(Math.abs(world.metrics().accountingError) < 1e-7);
});
