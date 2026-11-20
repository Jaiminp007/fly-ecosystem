// Paired solo runs (lower-drift fitness measure): each strain alone in the same seeded world;
// outcome = mean population over ticks 10000-20000 (extinct = 0 for remaining ticks). Usage:
// node microverse/solo.mjs A B seeds   -> per-seed A-B differences, mean, sign-flip p (one-sided, exact for n<=16 else MC)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { runWorld, STRAINS } from './run.mjs';
// A strain arg is a name (SELF) or JSON {"base":"SELF","genes":{...},"set":{...}}; MV_WORLD env merges world overrides.
const build = spec => { if (typeof spec === 'string') spec = spec.trim().startsWith('{') ? JSON.parse(spec) : { base: spec }; const b = STRAINS[spec.base]; return { ...b, ...(spec.set ?? {}), genes: { ...b.genes, ...(spec.genes ?? {}) } }; };
import { TICKS, EVERY, CONFIG } from './config.mjs';
if (!isMainThread) {
  const { seed, name } = workerData, { snaps } = runWorld(seed, TICKS, ['X'], { every: EVERY, config: { ...CONFIG, ...JSON.parse(process.env.MV_WORLD || '{}') }, strains: { X: build(name) } });
  const late = []; for (let t = 10000 + EVERY; t <= TICKS; t += EVERY) { const s = snaps.find(x => x.tick === t); late.push(s ? s.pop : 0); }
  parentPort.postMessage({ seed, name, meanPop: late.reduce((a, b) => a + b, 0) / late.length });
} else {
  const [A, B, seedArg] = process.argv.slice(2), seeds = seedArg.split(',').map(Number), jobs = seeds.flatMap(seed => [{ seed, name: A }, { seed, name: B }]), res = {};
  await new Promise(resolve => { let next = 0, done = 0; const go = () => { if (next >= jobs.length) return; const j = jobs[next++], w = new Worker(new URL(import.meta.url), { workerData: j });
    w.on('message', m => (res[m.seed] ??= {})[m.name] = m.meanPop); w.on('exit', () => ++done === jobs.length ? resolve() : go()); }; for (let i = 0; i < Math.min(jobs.length, cpus().length - 1); i++) go(); });
  const d = seeds.map(s => res[s][A] - res[s][B]), n = d.length, obs = d.reduce((a, b) => a + b, 0) / n;
  let ge = 0, total = 0; if (n <= 16) { for (let m = 0; m < 1 << n; m++) { let t = 0; for (let i = 0; i < n; i++) t += (m >> i & 1 ? -1 : 1) * d[i]; if (t / n >= obs - 1e-12) ge++; } total = 2 ** n; }
  else { let r = 7; for (let k = 0; k < 200000; k++) { let t = 0; for (let i = 0; i < n; i++) { r = (r * 1103515245 + 12345) >>> 0; t += (r & 0x10000 ? -1 : 1) * d[i]; } if (t / n >= obs - 1e-12) ge++; } total = 200000; }
  console.log(JSON.stringify({ A, B, seeds: n, meanA: +(seeds.reduce((a, s) => a + res[s][A], 0) / n).toFixed(2), meanB: +(seeds.reduce((a, s) => a + res[s][B], 0) / n).toFixed(2), meanDiff: +obs.toFixed(2), positive: d.filter(x => x > 0).length, p: +(ge / total).toFixed(5), diffs: d.map(x => +x.toFixed(1)) }));
}
