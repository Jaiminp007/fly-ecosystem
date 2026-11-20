// Universal test for the microverse goal ladder (docs/MICROVERSE_GOALS.md; thresholds fixed there).
// Usage: node microverse/suite.mjs dev            -> practice seeds 101..108
//        node microverse/suite.mjs final <base>   -> fresh seeds base+1..base+8 (record in MICROVERSE_LOG.md)
//        add  --only G1,G2  to run a subset (practice only; a final run is always the full suite)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { writeFileSync, mkdirSync } from 'node:fs';
import { cpus } from 'node:os';
import { runWorld } from './run.mjs';

import { TICKS, EVERY, CONFIG } from './config.mjs';
export const GOALS = {
  G1: { worlds: [['FIXED']] },
  G2: { worlds: [['ORACLE', 'FIXED']] },
  G3: { worlds: [['FIXED', 'RANDMOVE']] },
  G4: { worlds: [['FIXED', 'FROZEN']] },
  G5: { worlds: [['SELF', 'FIXED'], ['SELF', 'SHAM']] },
  G6: { worlds: [['SELF']] },
  G7: { worlds: [['SELF', 'TASTEONLY'], ['SELF', 'MOVEONLY']] },
};

if (!isMainThread) {
  const { seed, names } = workerData, { snaps, final } = runWorld(seed, TICKS, names, { every: EVERY, config: CONFIG });
  parentPort.postMessage({ snaps: snaps.map(s => ({ tick: s.tick, pop: s.pop, epoch: s.epoch, births: s.births, strains: Object.fromEntries(Object.entries(s.strains).map(([k, v]) => [k, { n: v.n, skill: v.skill, th: v.targetsHeld, tm: v.tasteMasks, mm: v.moveMasks }])) })), final: { tick: final.tick, pop: final.pop, births: final.births } });
} else {
  const [mode = 'dev', base = '0', ...rest] = process.argv.slice(2), onlyArg = process.argv.find(a => a.startsWith('--only'));
  const only = onlyArg ? (onlyArg.split('=')[1] ?? process.argv[process.argv.indexOf(onlyArg) + 1]).split(',') : null;
  if (mode === 'final' && only) throw Error('a final run is always the full suite');
  const seeds = mode === 'final' ? [...Array(8).keys()].map(i => +base + i + 1) : [101, 102, 103, 104, 105, 106, 107, 108];
  const goals = Object.keys(GOALS).filter(g => !only || only.includes(g)), jobs = [];
  for (const g of goals) GOALS[g].worlds.forEach((names, wi) => seeds.forEach(seed => jobs.push({ g, wi, seed, names })));
  const t0 = Date.now(), out = {}, size = Math.max(1, cpus().length - 1);
  await new Promise((resolve, reject) => {
    let next = 0, done = 0;
    const launch = () => { if (next >= jobs.length) return; const job = jobs[next++], w = new Worker(new URL(import.meta.url), { workerData: job });
      w.on('message', res => { ((out[job.g] ??= [])[job.wi] ??= [])[seeds.indexOf(job.seed)] = res; }); w.on('error', reject);
      w.on('exit', () => { if (++done === jobs.length) resolve(); else launch(); }); };
    for (let i = 0; i < Math.min(size, jobs.length); i++) launch();
  });
  const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
  const share = (res, a) => { const late = res.snaps.filter(s => s.tick >= 15000); if (!late.length || res.final.pop === 0) return 0; return mean(late.map(s => s.pop ? s.strains[a].n / s.pop : 0)); };
  const compete = (worlds, a, minShare, minWins) => { const sh = worlds.map(r => share(r, a)), wins = sh.filter(x => x > .5).length; return { pass: mean(sh) >= minShare && wins >= minWins, meanShare: +mean(sh).toFixed(3), wins, shares: sh.map(x => +x.toFixed(2)) }; };
  const report = {};
  for (const g of goals) {
    const W = out[g];
    if (g === 'G1') { const per = W[0].map(r => { const late = r.snaps.filter(s => s.tick >= 10000); const mp = late.length ? mean(late.map(s => s.pop)) : 0; return { alive: r.final.tick >= TICKS && r.final.pop > 0, meanPop: +mp.toFixed(1), births: r.final.births, ok: r.final.tick >= TICKS && r.final.pop > 0 && mp >= 30 && mp <= 360 && r.final.births >= 200, diedAt: r.final.pop ? null : r.final.tick }; });
      report.G1 = { pass: per.filter(p => p.ok).length >= 7, okSeeds: per.filter(p => p.ok).length, per }; }
    if (g === 'G2') report.G2 = compete(W[0], 'ORACLE', .65, 7);
    if (g === 'G3') report.G3 = compete(W[0], 'FIXED', .65, 7);
    if (g === 'G4') report.G4 = compete(W[0], 'FIXED', .60, 7);
    if (g === 'G5') { const a = compete(W[0], 'SELF', .60, 7), b = compete(W[1], 'SELF', .60, 7); report.G5 = { pass: a.pass && b.pass, vsFIXED: a, vsSHAM: b }; }
    if (g === 'G6') { const gains = [], lates = [];
      for (const r of W[0]) { const ep = {}; for (const s of r.snaps) if (s.strains.SELF.n) (ep[s.epoch] ??= []).push(s.strains.SELF.skill);
        for (const v of Object.values(ep)) if (v.length >= 20) { const first = mean(v.slice(0, Math.ceil(v.length / 10))), late = mean(v.slice(-Math.ceil(v.length / 4))); gains.push(late - first); lates.push(late); } }
      const alive = W[0].filter(r => r.final.tick >= TICKS && r.final.pop > 0).length; // validity: skill only counts in living worlds
      report.G6 = { pass: alive >= 7 && gains.length > 0 && mean(gains) >= .2 && mean(lates) >= .5, aliveSeeds: alive, meanGain: gains.length ? +mean(gains).toFixed(3) : null, meanLate: lates.length ? +mean(lates).toFixed(3) : null, epochs: gains.length }; }
    if (g === 'G7') { const a = compete(W[0], 'SELF', .55, 6), b = compete(W[1], 'SELF', .55, 6); report.G7 = { pass: a.pass && b.pass, vsTASTEONLY: a, vsMOVEONLY: b }; }
  }
  const summary = { mode, seeds, seconds: (Date.now() - t0) / 1000, passed: goals.filter(g => report[g].pass), failed: goals.filter(g => !report[g].pass), report };
  mkdirSync(new URL('../evidence/microverse/', import.meta.url), { recursive: true });
  writeFileSync(new URL(`../evidence/microverse/suite-${mode}${mode === 'final' ? '-' + base : ''}-${Date.now()}.json`, import.meta.url), JSON.stringify({ ...summary, raw: out }) + '\n');
  console.log(JSON.stringify(summary, null, 1));
}
