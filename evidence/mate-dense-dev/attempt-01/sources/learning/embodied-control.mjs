// Opt-in experiment adapter. No platform or live controller imports this.
import assert from 'node:assert/strict';
import {advanceRng, forcedExplorationSeeds} from './intervention-study.mjs';
function receipt(value) {
  return typeof value === 'number' ? {energyCost: value} : {energyCost: value.energyCost, afterEnergyCharge: value.afterEnergyCharge};
}

export function stepEmbodiedControl(world, choose, price = () => 0) {
  assert.equal(world.config.controller, 'episodic-actor');
  const p = world.config.episodicParameters;
  assert.equal(p.actuator, 'move'); assert.equal(p.moveMode, 'levels');
  assert.equal(typeof choose, 'function'); assert.equal(typeof price, 'function');
  const forcing = forcedExplorationSeeds(p.exploration), decisions = [];
  const advanced = world.step((fly, inputs, tick) => {
    if (fly.brain.episodic.steps % p.decisionTicks !== 0) return receipt(price({agentId: fly.id, tick}));
    // The policy receives only this body's current permitted observation,
    // energy and time. No preview world, action fork or future state exists.
    const own = {agentId: fly.id, tick, observation: [...inputs], energy: fly.energy};
    const choice = choose(own);
    assert.ok([-1, 1].includes(choice));
    const bill = receipt(price({agentId: fly.id, tick}));
    const beforeRng = fly.brain.episodic.memory.rngState;
    fly.brain.episodic.memory.rngState = forcing[choice];
    decisions.push({...own, choice});
    return {...bill, afterController: () => {
      assert.equal(fly.brain.episodic.lastDecision.choice, choice);
      fly.brain.episodic.memory.rngState = advanceRng(advanceRng(beforeRng));
    }};
  });
  return {advanced, decisions};
}
