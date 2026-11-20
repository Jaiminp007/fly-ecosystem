// Headless microverse runner. Usage: node microverse/run.mjs <seed> <ticks> <strainA,strainB,...> [every]
import { Microverse } from './sim.mjs';
import { STRAINS } from './strains.mjs';
export { STRAINS, MOVE0, MOVE_INIT } from './strains.mjs';
export function runWorld(seed, ticks, names, { every = 500, config = {}, log = null, strains = STRAINS } = {}) {
  const w = new Microverse(seed, Object.fromEntries(names.map(n => [n, strains[n]])), config), snaps = [];
  for (let t = 0; t < ticks && w.flies.length; t++) { w.step(); if (w.tick % every === 0) { const s = w.snapshot(); snaps.push(s); log?.(s); } }
  return { snaps, final: w.snapshot(), world: w };
}
if ((process.argv[1] ?? '').split(/[\\/]/).slice(-2).join('/') === 'microverse/run.mjs') {
  const [seed = '1', ticks = '6000', names = 'FIXED', every = '500'] = process.argv.slice(2), t0 = Date.now();
  runWorld(+seed, +ticks, names.split(','), { every: +every, log: s => console.log(JSON.stringify({ t: s.tick, pop: s.pop, rule: s.rule, ...Object.fromEntries(Object.entries(s.strains).map(([k, v]) => [k, `n${v.n} sk${v.skill.toFixed(2)} tm${v.tasteMasks.toFixed(1)} th${v.targetsHeld.toFixed(1)} mm${v.moveMasks.toFixed(1)} g${v.gen.toFixed(1)}`])) })) });
  console.log('seconds', (Date.now() - t0) / 1000);
}
