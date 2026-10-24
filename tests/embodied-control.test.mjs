import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {stepEmbodiedControl} from '../learning/embodied-control.mjs';
const config = {seed: 71, founders: 4, reproduction: false, mutation: false, seasonal: false, controller: 'episodic-actor', episodicParameters: {actuator: 'move', moveMode: 'levels', decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99, slowSpeed: .15, fastSpeed: .5}};

test('experimental speed policy sees current own sensors and the executed choice reaches factual memory', () => {
  const world = new World(config); let queries = 0;
  for (let i = 0; i < 24; i++) {
    const {decisions} = stepEmbodiedControl(world, own => { queries++; assert.deepEqual(Object.keys(own).sort(), ['agentId', 'energy', 'observation', 'tick']); return own.agentId % 2 ? 1 : -1; });
    for (const f of world.flies) {
      const choice = f.id % 2 ? 1 : -1;
      assert.equal(f.lastActions[1], 2 * (choice > 0 ? .5 : .15) - 1);
      assert.equal(f.brain.episodic.choice, choice);
      assert.ok(f.brain.episodic.memory.records.every(r => r.action === choice));
      for (const d of decisions.filter(d => d.agentId === f.id)) assert.deepEqual(d.observation, f.lastInputs);
    }
  }
  assert.equal(queries, 12);
});

test('experimental energy charges enter rewards and the physical ledger', () => {
  const free = new World(config), priced = new World(config);
  stepEmbodiedControl(free, () => 1); stepEmbodiedControl(priced, () => 1, () => .2);
  assert.ok(Math.abs(priced.totals.dissipated - free.totals.dissipated - config.founders * .2) < 1e-10);
  assert.ok(Math.abs(priced.metrics().accountingError) < 1e-8);
  for (const f of priced.flies) assert.ok(Math.abs(f.reward - free.flies.find(g => g.id === f.id).reward + .2) < 1e-10);
});

test('adapter continuation is exact and an absent/no-op hook preserves ordinary worlds', () => {
  const world = new World(config), ordinary = new World(config);
  for (let i = 0; i < 32; i++) { world.step(() => undefined); ordinary.step(); }
  assert.deepEqual(world.checkpoint(), ordinary.checkpoint());
  for (let i = 0; i < 24; i++) stepEmbodiedControl(world, () => -1);
  const restored = World.restore(JSON.parse(JSON.stringify(world.checkpoint())));
  for (let i = 0; i < 24; i++) { stepEmbodiedControl(world, () => -1); stepEmbodiedControl(restored, () => -1); }
  assert.deepEqual(restored.checkpoint(), world.checkpoint());
});
