// Fly-RSI L3-IV-H0 runner: four-bank routing headroom screen (docs/FLY_RSI_GOALS.md). Practice seeds 101-116 only.
// Usage: node microverse/l3iv-h0.mjs        (runs both pre-registered toxin batches, .60 and .85)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { Microverse, Q_STATS, QUAD_ALLOCS } from './sim.mjs';
import { STRAINS, SELF_Q } from './strains.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';
const world = toxin => ({ ...CONFIG, toxin, ruleSchedule: [['quadBankPairs', 3000]], quad: { switch: .004 } });
const SEEDS = Array.from({ length: 16 }, (_, i) => 101 + i), TOXINS = [.6, .85];
const STATIC = QUAD_ALLOCS.map((a, i) => 'S' + i), ARMS = ['Q_NOREV', ...STATIC, 'Q_ORACLE', 'Q_BLIND', 'Q_TRUEORACLE'];
const prog = arm => arm[0] === 'S' ? SELF_Q('static', QUAD_ALLOCS[+arm.slice(1)]) : STRAINS[arm];

if (!isMainThread) { const { seed, arm, toxin } = workerData, w = new Microverse(seed, { X: prog(arm) }, world(toxin)), late = [];
  for (let t = 0; t < TICKS && w.flies.length; t++) { w.step(); if (w.tick > 10000 && w.tick % EVERY === 0) late.push(w.flies.length); }
  const extinct = !w.flies.length; while (late.length < (TICKS - 10000) / EVERY) late.push(0);
  const { target, ...tel } = Q_STATS; tel.matchRate = tel.tastings ? tel.match / tel.tastings : null; tel.meanTasteMasksEnd = w.flies.length ? w.flies.reduce((s, f) => s + f.brain.taste.masks.length, 0) / w.flies.length : null;
  parentPort.postMessage({ seed, arm, toxin, v: late.reduce((a, b) => a + b, 0) / late.length, extinct, tel }); }
else {
  const jobs = TOXINS.flatMap(toxin => SEEDS.flatMap(seed => ARMS.map(arm => ({ seed, arm, toxin })))), R = {};
  await new Promise(res => { let next = 0, done = 0; const go = () => { if (next >= jobs.length) return; const wk = new Worker(new URL(import.meta.url), { workerData: jobs[next++] });
    wk.on('message', m => { ((R[m.toxin] ??= {})[m.seed] ??= {})[m.arm] = m; }); wk.on('error', e => { console.error(e); process.exit(1); });
    wk.on('exit', () => { if (++done % 100 === 0) console.error(`${done}/${jobs.length}`); done === jobs.length ? res() : go(); }); };
    for (let i = 0; i < Math.min(jobs.length, cpus().length - 1); i++) go(); });
  const batches = {};
  for (const tx of TOXINS) { const P = R[tx]; for (const s of SEEDS) for (const a of ARMS) if (!Number.isFinite(P[s]?.[a]?.v)) throw Error(`invalid result toxin ${tx} seed ${s} arm ${a}`);
    const mp = a => SEEDS.reduce((t, s) => t + P[s][a].v, 0) / SEEDS.length, dist = a => QUAD_ALLOCS[+a.slice(1)].reduce((t, x) => t + (x - .25) ** 2, 0);
    const lex = (a, b) => { const x = QUAD_ALLOCS[+a.slice(1)], y = QUAD_ALLOCS[+b.slice(1)]; for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
    const F = [...STATIC].sort((a, b) => mp(b) - mp(a) || dist(a) - dist(b) || lex(a, b))[0];
    const g = SEEDS.map(s => P[s][F].v - P[s].Q_NOREV.v), dO = SEEDS.map((s, i) => (P[s].Q_ORACLE.v - P[s][F].v) - .5 * g[i]), b = SEEDS.map(s => P[s].Q_ORACLE.v - P[s].Q_BLIND.v);
    const mean = a => a.reduce((t, x) => t + x, 0) / a.length, pos = a => a.filter(x => x > 0).length, norevExt = SEEDS.filter(s => P[s].Q_NOREV.extinct).length, tg = mean(SEEDS.map(s => P[s].Q_TRUEORACLE.v - P[s].Q_NOREV.v));
    const bars = { g: mean(g) >= 3 && norevExt <= 1, dO: mean(dO) >= 4 && pos(dO) >= 13, b: mean(b) >= 4 && pos(b) >= 12 };
    batches[tx] = { selectedStatic: F, selectedAlloc: QUAD_ALLOCS[+F.slice(1)], means: Object.fromEntries(ARMS.map(a => [a, mp(a)])), meanG: mean(g), meanDO: mean(dO), dOPositive: pos(dO), meanB: mean(b), bPositive: pos(b), norevExtinct: norevExt,
      alpha: tg > 0 ? mean(g) / tg : 'undefined', bars, pass: Object.values(bars).every(Boolean), extinctions: Object.fromEntries(ARMS.map(a => [a, SEEDS.filter(s => P[s][a].extinct).length])), perSeed: { g, dO, b } }; }
  const chosen = batches[.6].pass ? .6 : batches[.85].pass ? .85 : null;
  const tel = Object.fromEntries(TOXINS.map(tx => [tx, Object.fromEntries(SEEDS.map(s => [s, Object.fromEntries(['Q_NOREV', batches[tx].selectedStatic, 'Q_ORACLE', 'Q_BLIND', 'Q_TRUEORACLE'].map(a => [a, R[tx][s][a].tel]))]))]));
  const pop = Object.fromEntries(TOXINS.map(tx => [tx, Object.fromEntries(SEEDS.map(s => [s, Object.fromEntries(ARMS.map(a => [a, R[tx][s][a].v]))]))]));
  console.log(JSON.stringify({ screen: 'L3-IV-H0', seeds: SEEDS, toxins: TOXINS, verdict: { chosenToxin: chosen, stop: chosen === null }, batches, pop, telemetry: tel }));
}
