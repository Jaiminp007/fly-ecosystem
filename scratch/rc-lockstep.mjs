// RewriteCost preflight: tick-by-tick identity of two arms in the same seeded world.
import { Microverse, RW_STATS, resetRwStats } from '../microverse/sim.mjs';
import { STRAINS } from '../microverse/strains.mjs';
import { CONFIG } from '../microverse/config.mjs';
const W = { ...CONFIG, rewriteCost: { cheap: .15, dear: 3, switch: .002 } };
const [A, B, seed = 101, ticks = 20000] = process.argv.slice(2);
const key = w => JSON.stringify(w.flies.map(f => [f.id, f.x, f.y, +f.energy.toFixed(9), f.age, f.brain.taste.masks, f.brain.taste.w.map(x => +x.toFixed(9)), f.brain.move.masks, f.brain.move.w.map(x => +x.toFixed(9)), f.brain.taste.ev.slice(0, 8).map(x => +x.toFixed(9))]));
resetRwStats(); const wa = new Microverse(+seed, { X: STRAINS[A] }, W), wb = new Microverse(+seed, { X: STRAINS[B] }, W);
let div = -1, t = 0; for (; t < +ticks && (wa.flies.length || wb.flies.length); t++) { wa.step(); wb.step(); if (key(wa) !== key(wb)) { div = t; break; } }
console.log(JSON.stringify({ A, B, seed: +seed, ticksCompared: t, firstDivergentTick: div, popA: wa.flies.length, popB: wb.flies.length, stats: { ...RW_STATS } }));
