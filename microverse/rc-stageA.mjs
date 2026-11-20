// L3-I screen 2, stage A (hidden challengers): switching world, hurdle NEVER, shadows observe only. Seeds 101-116.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { Microverse, RW_STATS, resetRwStats } from './sim.mjs';
import { STRAINS } from './strains.mjs';
import { TICKS, CONFIG } from './config.mjs';
const W = { ...CONFIG, rewriteCost: { cheap: .15, dear: 3, switch: .002 } };
if (!isMainThread) {
  resetRwStats(); const w = new Microverse(workerData.seed, { X: STRAINS.RC_NEVER }, W);
  for (let t = 0; t < TICKS && w.flies.length; t++) w.step();
  const pendingAtEnd = w.flies.filter(f => f.brain.taste.swapTrial).length;
  parentPort.postMessage({ seed: workerData.seed, ...RW_STATS, pendingAtEnd, pop: w.flies.length });
} else {
  const seeds = Array.from({ length: 16 }, (_, i) => 101 + i), out = [];
  await new Promise(res => { let next = 0, done = 0; const go = () => { if (next >= seeds.length) return; const wk = new Worker(new URL(import.meta.url), { workerData: { seed: seeds[next++] } });
    wk.on('message', m => out.push(m)); wk.on('exit', () => ++done === seeds.length ? res() : go()); }; for (let i = 0; i < Math.min(16, cpus().length - 1); i++) go(); });
  out.sort((a, b) => a.seed - b.seed);
  for (const r of out) { r.rate = r.checks ? r.wins / r.checks : 0; r.qualifies = r.checks >= 20 && r.rate >= .1; r.accountingOk = r.nominations === r.completions + r.cancellations + r.pendingAtDeath + r.pendingAtEnd; }
  const q = out.filter(r => r.qualifies).length;
  console.log(JSON.stringify({ stage: 'A', qualifyingSeeds: q, bar: '>= 12/16', advance: q >= 12, accountingOkAll: out.every(r => r.accountingOk), perSeed: out.map(r => ({ seed: r.seed, checks: r.checks, nominations: r.nominations, cancellations: r.cancellations, pendingAtDeath: r.pendingAtDeath, pendingAtEnd: r.pendingAtEnd, completions: r.completions, wins: r.wins, rate: +r.rate.toFixed(3) })) }));
}
