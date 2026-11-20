// Practice-only head-to-head: node microverse/compare.mjs '<A json>' '<B json>' [seeds]
// Each strain json = {"base":"FIXED","genes":{...},"set":{...}} (overrides on a named strain).
// Prints A's late share per seed (ticks 15000-20000; extinct world = 0).
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { runWorld, STRAINS } from './run.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';
const build = spec => { const s = STRAINS[spec.base]; return { ...s, ...(spec.set ?? {}), genes: { ...s.genes, ...(spec.genes ?? {}) } }; };
if (!isMainThread) {
  const { seed, A, B } = workerData, { snaps, final } = runWorld(seed, TICKS, ['A', 'B'], { every: EVERY, config: { ...CONFIG, ...JSON.parse(process.env.MV_WORLD || '{}') }, strains: { A: build(A), B: build(B) } });
  const late = snaps.filter(s => s.tick >= 15000), share = !late.length || !final.pop ? 0 : late.reduce((a, s) => a + (s.pop ? s.strains.A.n / s.pop : 0), 0) / late.length;
  parentPort.postMessage({ seed, share, extinct: !final.pop, diedAt: final.pop ? null : final.tick });
} else {
  const [a, b, seedArg = '101,102,103,104,105,106,107,108'] = process.argv.slice(2), A = JSON.parse(a), B = JSON.parse(b), seeds = seedArg.split(',').map(Number), res = [];
  await new Promise(resolve => { let next = 0, done = 0; const go = () => { if (next >= seeds.length) return; const w = new Worker(new URL(import.meta.url), { workerData: { seed: seeds[next++], A, B } });
    w.on('message', m => res.push(m)); w.on('exit', () => ++done === seeds.length ? resolve() : go()); }; for (let i = 0; i < Math.min(seeds.length, cpus().length - 1); i++) go(); });
  res.sort((x, y) => x.seed - y.seed); const m = res.reduce((s, r) => s + r.share, 0) / res.length;
  console.log(`A share ${m.toFixed(2)} wins ${res.filter(r => r.share > .5).length}/${res.length} [${res.map(r => r.share.toFixed(2)).join(' ')}] extinct ${res.filter(r => r.extinct).map(r => r.seed + '@' + r.diedAt).join(',') || 'none'}`);
}
