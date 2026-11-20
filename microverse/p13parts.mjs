// P13b parts: run META (trial), SHAM (trialsham), EVO-R, FIXED once per seed; report every contrast.
// Usage: node microverse/p13parts.mjs seeds   (e.g. 90001-90048 or 101,102)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { runWorld, STRAINS } from './run.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';
import { META_STATS, MEM_GRID, PRUNE_GRID } from './sim.mjs';
// MV_META (JSON) overrides META/SHAM program fields (P13b-2b practice); MV_ARMS limits which arms run.
const X = JSON.parse(process.env.MV_META || '{}'), ALL = { META: { ...STRAINS.P13_FIXED, metaR: 'trial', ...X }, SHAM: { ...STRAINS.P13_FIXED, ...X, metaR: X.metaR ? X.metaR + 'sham' : 'trialsham' }, ORACLE: { ...STRAINS.P13_FIXED, metaR: 'trialoracle', ...X }, EVOR: STRAINS.P13_EVOR, FIXED: STRAINS.P13_FIXED };
// MV_SET=A3: P13b amendment A3 arms (world settings come from MV_WORLD).
if (process.env.MV_SET === 'L2') { for (const k of Object.keys(ALL)) delete ALL[k]; Object.assign(ALL, { META: { ...STRAINS.L2_META, ...X }, SHAM: { ...STRAINS.L2_SHAM, ...X }, EVOR: STRAINS.L2_EVOR, FIXED: STRAINS.L2_FIXED, NOREV: STRAINS.L2_NOREV }); }
// MV_PKG (JSON {leanGenes, fullGenes}): L3b practice; the same packages go to every L2 arm that can switch (META, SHAM, EVO-R).
if (process.env.MV_PKG) { const P = JSON.parse(process.env.MV_PKG); for (const k of ['META', 'SHAM', 'EVOR']) if (ALL[k]) ALL[k] = { ...ALL[k], ...P }; }
// METAOFF (Fly-RSI diagnostic): the full META controller with level-1 structural revision disabled.
if (process.env.MV_SET === 'L2') ALL.METAOFF = { ...ALL.META, tasteRevise: null, moveRevise: null };
if (process.env.MV_SET === 'A3') { for (const k of Object.keys(ALL)) delete ALL[k]; Object.assign(ALL, { META: { ...STRAINS.A3_META, ...X }, SHAM: { ...STRAINS.A3_SHAM, ...X }, EVOR: STRAINS.A3_EVOR, FIXED: STRAINS.A3_FIXED }); }
const WORLD = { ...CONFIG, ...JSON.parse(process.env.MV_WORLD || '{}') };
const ARMS = Object.fromEntries(Object.entries(ALL).filter(([k]) => (process.env.MV_ARMS ? true : k !== 'ORACLE' && k !== 'METAOFF') && !process.env.MV_ARMS || process.env.MV_ARMS.split(',').includes(k)));
if (!isMainThread) {
  const { seed, arm } = workerData, { snaps, world } = runWorld(seed, TICKS, ['X'], { every: EVERY, config: WORLD, strains: { X: ARMS[arm] } });
  const late = []; for (let t = 10000 + EVERY; t <= TICKS; t += EVERY) { const s = snaps.find(x => x.tick === t); late.push(s ? s.pop : 0); }
  // P13b-3b: mean grid distance of living flies' reviser genes from R* (memory 800, prune .5) at the end.
  const dist = world.flies.length ? world.flies.reduce((a, f) => a + Math.abs(MEM_GRID.indexOf(f.brain.genes.tasteMemory) - 1) + Math.abs(PRUNE_GRID.indexOf(f.brain.genes.tastePrune) - 1), 0) / world.flies.length : null;
  parentPort.postMessage({ seed, arm, meanPop: late.reduce((a, b) => a + b, 0) / late.length, stats: { ...META_STATS }, dist });
} else {
  const arg = process.argv[2], seeds = arg.includes('-') ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(arg.split('-').map(Number)) : arg.split(',').map(Number);
  const jobs = seeds.flatMap(seed => Object.keys(ARMS).map(arm => ({ seed, arm }))), res = {}, extra = {};
  await new Promise(resolve => { let next = 0, done = 0; const go = () => { if (next >= jobs.length) return; const j = jobs[next++], w = new Worker(new URL(import.meta.url), { workerData: j });
    w.on('message', m => { (res[m.seed] ??= {})[m.arm] = m.meanPop; (extra[m.seed] ??= {})[m.arm] = { stats: m.stats, dist: m.dist }; }); w.on('exit', () => ++done === jobs.length ? resolve() : go()); }; for (let i = 0; i < Math.min(jobs.length, cpus().length - 1); i++) go(); });
  const signflip = d => { const n = d.length, obs = d.reduce((a, b) => a + b, 0) / n; let ge = 0, total = 0;
    if (n <= 16) { for (let m = 0; m < 1 << n; m++) { let t = 0; for (let i = 0; i < n; i++) t += (m >> i & 1 ? -1 : 1) * d[i]; if (t / n >= obs - 1e-12) ge++; } total = 2 ** n; }
    else { let r = 7; for (let k = 0; k < 200000; k++) { let t = 0; for (let i = 0; i < n; i++) { r = (r * 1103515245 + 12345) >>> 0; t += (r & 0x10000 ? -1 : 1) * d[i]; } if (t / n >= obs - 1e-12) ge++; } total = 200000; }
    return { meanDiff: +obs.toFixed(2), positive: d.filter(x => x > 0).length, p: +(ge / total).toFixed(5) }; };
  const mean = a => +(seeds.reduce((s, x) => s + res[x][a], 0) / seeds.length).toFixed(2);
  const out = { seeds: seeds.length, means: Object.fromEntries(Object.keys(ARMS).map(a => [a, mean(a)])) };
  for (const [A, B] of [['META', 'FIXED'], ['META', 'EVOR'], ['META', 'SHAM'], ['ORACLE', 'SHAM']].filter(([a, b]) => ARMS[a] && ARMS[b])) out[A + '-' + B] = signflip(seeds.map(s => res[s][A] - res[s][B]));
  // Fly-RSI L3: d = (META - NOREV) - 1.5 * (FIXED - NOREV) per seed; > 0 means level-1 revision pays >= 50% more with L2.
  if (ARMS.META && ARMS.FIXED && ARMS.NOREV) out['L3'] = { L1gainWithL2: mean('META') - mean('NOREV'), L1gainWithoutL2: mean('FIXED') - mean('NOREV'), test: signflip(seeds.map(s => (res[s].META - res[s].NOREV) - 1.5 * (res[s].FIXED - res[s].NOREV))) };
  // P13b-3a: balanced accuracy of keep decisions (keep rate on toward-R* steps + revert rate on away steps) / 2; chance = .5.
  const bal = (s, a) => { const x = extra[s][a].stats; return x.towardN && x.awayN ? (x.towardKeep / x.towardN + 1 - x.awayKeep / x.awayN) / 2 : .5; };
  for (const a of ['META', 'SHAM'].filter(a => ARMS[a])) out['balAcc-' + a] = { mean: +(seeds.reduce((t, s) => t + bal(s, a), 0) / seeds.length).toFixed(4), vsChance: signflip(seeds.map(s => bal(s, a) - .5)) };
  if (ARMS.META && ARMS.SHAM) { const ok = seeds.filter(s => extra[s].META.dist !== null && extra[s].SHAM.dist !== null);
    out['dist-SHAM-minus-META'] = { n: ok.length, meanMETA: +(ok.reduce((t, s) => t + extra[s].META.dist, 0) / ok.length).toFixed(3), meanSHAM: +(ok.reduce((t, s) => t + extra[s].SHAM.dist, 0) / ok.length).toFixed(3), test: signflip(ok.map(s => extra[s].SHAM.dist - extra[s].META.dist)) }; }
  out.perSeed = res; out.extra = extra; console.log(JSON.stringify(out));
}
