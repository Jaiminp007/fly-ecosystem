// Fly-RSI L3-I runner (docs/FLY_RSI_GOALS.md). Six arms per seed; validated scorer; all gates.
// Usage: node microverse/l3i.mjs selftest
//        node microverse/l3i.mjs <seeds: a-b or a,b,c>      (world: brainSwitch mul [1,20], switch .001)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { pathToFileURL } from 'node:url';
const MAIN = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
import { runWorld, STRAINS } from './run.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';

const ARMS = ['META', 'SHAM', 'EVOR', 'FIXED', 'NOREV', 'METAOFF'];
export const L3I_WORLD = { ...CONFIG, brainSwitch: { mul: [1, 20], switch: .001 } };

// Scorer v2. One-sided paired sign-flip test of mean > 0: exact enumeration for n <= 16, otherwise a
// Monte Carlo with an integer-exact 32-bit LCG (Math.imul) and p = (exceedances + 1) / (draws + 1).
export function signflip(d, draws = 200000) {
  const n = d.length, obs = d.reduce((a, b) => a + b, 0) / n; let ge = 0;
  if (n <= 16) { for (let m = 0; m < 1 << n; m++) { let t = 0; for (let i = 0; i < n; i++) t += (m >> i & 1 ? -1 : 1) * d[i]; if (t / n >= obs - 1e-12) ge++; } return { mean: obs, p: ge / 2 ** n }; }
  let r = 7; for (let k = 0; k < draws; k++) { let t = 0; for (let i = 0; i < n; i++) { r = (Math.imul(r, 1103515245) + 12345) >>> 0; t += (r >>> 16 & 1 ? -1 : 1) * d[i]; } if (t / n >= obs - 1e-12) ge++; }
  return { mean: obs, p: (ge + 1) / (draws + 1) };
}
// Exact one-sided binomial: P(X >= k | n, 1/2). Zeros count as non-wins.
export function signTest(d) { const n = d.length, k = d.filter(x => x > 0).length; let p = 0, c = 1;
  for (let j = 0; j <= n; j++) { if (j >= k) p += c; c = c * (n - j) / (j + 1); } return { wins: k, n, p: p / 2 ** n }; }

if (!isMainThread) {
  const { seed, arm } = workerData, { snaps } = runWorld(seed, TICKS, ['X'], { every: EVERY, config: L3I_WORLD, strains: { X: STRAINS['L3I_' + arm] } });
  const late = []; for (let t = 10000 + EVERY; t <= TICKS; t += EVERY) { const s = snaps.find(x => x.tick === t); late.push(s ? s.pop : 0); }
  const extinct = !snaps.length || snaps[snaps.length - 1].tick < TICKS;
  parentPort.postMessage({ seed, arm, meanPop: late.reduce((a, b) => a + b, 0) / late.length, extinct });
} else if (MAIN && process.argv[2] === 'selftest') {
  // Validate the Monte Carlo branch against exact enumeration on 16-element vectors (forced MC path via n=16 copies).
  let worst = 0; let r = 99; const rnd = () => (r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let t = 0; t < 20; t++) { const d = Array.from({ length: 16 }, () => rnd() * 4 - 1.2), ex = signflip(d).p;
    const n = d.length, obs = d.reduce((a, b) => a + b, 0) / n; let ge = 0, q = 7; for (let k = 0; k < 200000; k++) { let s = 0; for (let i = 0; i < n; i++) { q = (Math.imul(q, 1103515245) + 12345) >>> 0; s += (q >>> 16 & 1 ? -1 : 1) * d[i]; } if (s / n >= obs - 1e-12) ge++; }
    worst = Math.max(worst, Math.abs((ge + 1) / 200001 - ex)); }
  const st = signTest(Array.from({ length: 48 }, (_, i) => i < 33 ? 1 : -1)), st32 = signTest(Array.from({ length: 48 }, (_, i) => i < 32 ? 1 : -1));
  console.log(JSON.stringify({ mcVsExactMaxAbsErr: +worst.toFixed(4), signTest33of48: +st.p.toFixed(5), signTest32of48: +st32.p.toFixed(5) }));
} else if (MAIN) {
  const arg = process.argv[2], seeds = arg.includes('-') ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(arg.split('-').map(Number)) : arg.split(',').map(Number);
  const jobs = seeds.flatMap(seed => ARMS.map(arm => ({ seed, arm }))), res = {}, ext = {};
  await new Promise(resolve => { let next = 0, done = 0; const go = () => { if (next >= jobs.length) return; const j = jobs[next++], w = new Worker(new URL(import.meta.url), { workerData: j });
    w.on('message', m => { (res[m.seed] ??= {})[m.arm] = m.meanPop; (ext[m.seed] ??= {})[m.arm] = m.extinct; }); w.on('error', e => { throw e; }); w.on('exit', () => ++done === jobs.length ? resolve() : go()); };
    for (let i = 0; i < Math.min(jobs.length, cpus().length - 1); i++) go(); });
  for (const s of seeds) for (const a of ARMS) if (typeof res[s]?.[a] !== 'number') throw Error(`missing result seed ${s} arm ${a}`);
  const v = f => seeds.map(s => f(res[s])), mean = a => seeds.reduce((t, s) => t + res[s][a], 0) / seeds.length;
  const d = v(x => (x.META - x.NOREV) - 1.5 * (x.FIXED - x.NOREV)), fac = v(x => (x.META - x.NOREV) - 1.5 * (x.FIXED - x.NOREV) - (x.METAOFF - x.NOREV));
  const c = { 'META-EVOR': signflip(v(x => x.META - x.EVOR)), 'META-SHAM': signflip(v(x => x.META - x.SHAM)), 'META-FIXED': signflip(v(x => x.META - x.FIXED)),
    L3_d: signflip(d), factorial: signflip(fac), factorialSign: signTest(fac), 'L1gain FIXED-NOREV': signflip(v(x => x.FIXED - x.NOREV)), 'direct METAOFF-NOREV': signflip(v(x => x.METAOFF - x.NOREV)) };
  const gates = { L2_vsEVOR: c['META-EVOR'].mean >= 1 && c['META-EVOR'].p < .01, L2_vsSHAM: c['META-SHAM'].mean >= 1 && c['META-SHAM'].p < .01, L2_vsFIXED: c['META-FIXED'].mean > 0 && c['META-FIXED'].p < .01,
    L3_original: c.L3_d.mean > 0 && c.L3_d.p < .01, factorialMean: c.factorial.mean > 0 && c.factorial.p < .01, factorialSign: c.factorialSign.p < .01, L1gain: c['L1gain FIXED-NOREV'].mean > 0 && c['L1gain FIXED-NOREV'].p < .01 };
  const extinctions = Object.fromEntries(ARMS.map(a => [a, seeds.filter(s => ext[s][a]).length]));
  console.log(JSON.stringify({ seeds: seeds.length, means: Object.fromEntries(ARMS.map(a => [a, +mean(a).toFixed(2)])), contrasts: c, gates, pass: Object.values(gates).every(Boolean), extinctions, perSeed: res, extinctBySeed: ext }));
}
