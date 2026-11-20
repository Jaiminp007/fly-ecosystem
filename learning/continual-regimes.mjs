// Experimental task transitions only. The default World never imports this.
// Reconfigure resources in continuing bodies, without refilling food/energy.
import assert from 'node:assert/strict';
import {RNG} from '../engine.mjs';

export const CONTINUAL_PHASES = Object.freeze([
  Object.freeze({id: 'A', kind: 'stable', ticks: 512, nutrient: .4, shiftEvery: 0}),
  Object.freeze({id: 'B', kind: 'moving', ticks: 512, nutrient: .4, shiftEvery: 128}),
  Object.freeze({id: 'C', kind: 'scarce', ticks: 512, nutrient: .2, shiftEvery: 0}),
  Object.freeze({id: 'return-A', kind: 'stable', ticks: 256, nutrient: .4, shiftEvery: 0})
]);
// ODOR DEV ROUND 2 rehearsal table (PLAN V1 FROZEN): A256-B512-A128-
// C512-A128-D256 = 1792 ticks (same budget as round 1). Slot keys at
// runtime: A1,B1,A2,C1,A3,D1 with 'A' aliased to the final A-slot.
// A-revisits reuse the A resource seed via ODOR_R2_SEED_MAP.
export const CONTINUAL_PHASES_REHEARSAL = Object.freeze([
  Object.freeze({id: 'A', kind: 'stable', ticks: 256, nutrient: .4, shiftEvery: 0}),
  Object.freeze({id: 'B', kind: 'moving', ticks: 512, nutrient: .4, shiftEvery: 128}),
  Object.freeze({id: 'A', kind: 'stable', ticks: 128, nutrient: .4, shiftEvery: 0}),
  Object.freeze({id: 'C', kind: 'scarce', ticks: 512, nutrient: .2, shiftEvery: 0}),
  Object.freeze({id: 'A', kind: 'stable', ticks: 128, nutrient: .4, shiftEvery: 0}),
  Object.freeze({id: 'D', kind: 'stable', ticks: 256, nutrient: .4, shiftEvery: 0})
]);
// Frozen round-2 numbers (importable, no side effects): schedule ticks,
// seed map (A-slots -> resourceSeeds[0]; B->1; C->2; D->3), caps.
export const ODOR_R2_TICKS = Object.freeze([256,512,128,512,128,256]);
export const ODOR_R2_SEED_MAP = Object.freeze([0,1,0,2,0,3]);
export const ODOR_R2_OP_CAP = 40_000_000_000;
export const ODOR_R2_WALL_CAP_SECONDS = 3600;

function layout(world, rng, moveFood) {
  world.resourceCenters = Array.from({length: 3}, () => ({x: rng.range(100, 900), y: rng.range(80, 560)}));
  for (const patch of world.food) {
    if (moveFood) { patch.x = rng.range(25, world.width - 25); patch.y = rng.range(25, world.height - 25); }
    const abundance = Math.max(...world.resourceCenters.map(c => Math.exp(-((patch.x - c.x) ** 2 + (patch.y - c.y) ** 2) / 24000)));
    patch.regrowth = abundance * .16 + .001;
    patch.capacity = Math.max(patch.amount, abundance * 4 + .05);
  }
}

export function enterContinualPhase(world, phase, resourceSeed) {
  assert.ok(CONTINUAL_PHASES.some(p => p.id === phase.id && p.kind === phase.kind));
  assert.ok(Number.isInteger(resourceSeed) && resourceSeed > 0 && resourceSeed <= 0xffffffff);
  const energyBefore = world.energy(), rngState = world.rng.state, ecologyRngState = world.ecologyRng.state;
  const rng = new RNG(resourceSeed);
  world.config.ecology = 'baseline'; // The explicit experimental clock owns shifts.
  world.config.nutrient = phase.nutrient;
  world.nextRelocationTick = null;
  layout(world, rng, true);
  const transition = {schema: 1, phase: phase.id, kind: phase.kind, resourceSeed, startTick: world.tick, nextShiftTick: phase.shiftEvery ? world.tick + phase.shiftEvery : null, shiftEvery: phase.shiftEvery, rngState: rng.state, shifts: 0};
  assert.equal(world.energy(), energyBefore);
  assert.equal(world.rng.state, rngState); assert.equal(world.ecologyRng.state, ecologyRngState);
  world.record('continual-phase', `Continuous ${phase.id}: independently generated ${phase.kind} resources`, {phase: phase.id, resourceSeed});
  return transition;
}

export function updateContinualResources(world, transition) {
  if (transition.nextShiftTick === null || world.tick < transition.nextShiftTick) return false;
  const energyBefore = world.energy(), rng = new RNG(transition.rngState);
  layout(world, rng, false);
  transition.rngState = rng.state; transition.shifts++;
  transition.nextShiftTick += transition.shiftEvery;
  assert.equal(world.energy(), energyBefore);
  world.record('continual-resource-shift', `Continuous ${transition.phase}: resource renewal centers moved`, {phase: transition.phase, shifts: transition.shifts});
  return true;
}

export function fixedFounderEndpoint(world, founderIds, startingEnergy) {
  assert.ok(founderIds.length > 0 && new Set(founderIds).size === founderIds.length);
  const surviving = world.flies.filter(f => founderIds.includes(f.id));
  return {founders: founderIds.length, survivors: surviving.length, survivalFraction: surviving.length / founderIds.length,
    energyPerFounder: (surviving.reduce((sum, f) => sum + f.energy, 0) - startingEnergy) / founderIds.length};
}
