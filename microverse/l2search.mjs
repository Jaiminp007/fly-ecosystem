// P11b level-2 operator (docs/MICROVERSE_L2_GOALS.md, amendment A1; fixed before running):
// a random one-step climber over the reviser's genes, scored by paired-solo fitness in the world.
// Usage: node microverse/l2search.mjs            -> search on training seeds 101-116, writes evidence/microverse/p11b-search.json
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { writeFileSync, mkdirSync } from 'node:fs';
import { runWorld, STRAINS } from './run.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';
import { rng32 } from './sim.mjs';

export const GRID = { tasteMemory: [1e12, 800, 400, 200, 100, 50], tastePrune: [0, .5, 1, 2, 3, 4], tasteZ: [1.5, 2, 3, 4, 6], tasteEvery: [4, 8, 16], tasteCap: [12, 16, 24] };
export const R_P12 = { tasteMemory: 1e12, tastePrune: 0, tasteZ: 3, tasteEvery: 8, tasteCap: 16 };
const TRAIN = [...Array(16).keys()].map(i => 101 + i), PROPOSALS = 24, ACCEPT = .5, CLIMB_SEED = 4242;

export function soloPop(seed, genes) {
  const strain = { ...STRAINS.SELF, genes: { ...STRAINS.SELF.genes, ...genes } }, { snaps } = runWorld(seed, TICKS, ['X'], { every: EVERY, config: CONFIG, strains: { X: strain } });
  const late = []; for (let t = 10000 + EVERY; t <= TICKS; t += EVERY) { const s = snaps.find(x => x.tick === t); late.push(s ? s.pop : 0); }
  return late.reduce((a, b) => a + b, 0) / late.length;
}
if (!isMainThread) { parentPort.postMessage(soloPop(workerData.seed, workerData.genes)); }
else if ((process.argv[1] ?? '').endsWith('l2search.mjs')) {
  const size = Math.max(1, cpus().length - 1), cache = new Map();
  const evalAll = genes => new Promise(resolve => { const key = JSON.stringify(genes); if (cache.has(key)) return resolve(cache.get(key));
    const out = Array(TRAIN.length); let next = 0, done = 0;
    const go = () => { if (next >= TRAIN.length) return; const i = next++, w = new Worker(new URL(import.meta.url), { workerData: { seed: TRAIN[i], genes } });
      w.on('message', v => out[i] = v); w.on('exit', () => { if (++done === TRAIN.length) { cache.set(key, out); resolve(out); } else go(); }); };
    for (let k = 0; k < Math.min(size, TRAIN.length); k++) go(); });
  const r = rng32(CLIMB_SEED), keys = Object.keys(GRID), log = [], t0 = Date.now();
  let best = { ...R_P12 }, bestPop = await evalAll(best);
  for (let p = 0; p < PROPOSALS; p++) {
    const k = keys[Math.floor(r() * keys.length)], vals = GRID[k], i = vals.indexOf(best[k]), dir = r() < .5 ? -1 : 1, j = i + dir < 0 || i + dir >= vals.length ? i - dir : i + dir;
    const cand = { ...best, [k]: vals[j] }, pops = await evalAll(cand), d = pops.map((v, s) => v - bestPop[s]), m = d.reduce((a, b) => a + b, 0) / d.length, accept = m >= ACCEPT;
    log.push({ proposal: p, knob: k, from: best[k], to: vals[j], meanDiff: +m.toFixed(2), positive: d.filter(x => x > 0).length, accept });
    console.log(JSON.stringify(log.at(-1)));
    if (accept) { best = cand; bestPop = pops; }
  }
  const result = { plan: 'docs/MICROVERSE_L2_GOALS.md#P11b-A1', start: R_P12, Rstar: best, trainMeanPop: bestPop.reduce((a, b) => a + b, 0) / bestPop.length, log, seconds: (Date.now() - t0) / 1000 };
  mkdirSync(new URL('../evidence/microverse/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../evidence/microverse/p11b-search.json', import.meta.url), JSON.stringify(result, null, 1) + '\n');
  console.log('R*', JSON.stringify(best), 'train pop', result.trainMeanPop.toFixed(2), 'sec', result.seconds);
}
