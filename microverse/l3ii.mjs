// Fly-RSI L3-II runner (docs/FLY_RSI_GOALS.md). Usage: node microverse/l3ii.mjs stageA | stageB <FIXEDarm>
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { Microverse, newBrain, tasteLearn, newAttnCtx, attnTick, attnSample, rng32, mix } from './sim.mjs';
import { STRAINS } from './strains.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';
export const L3II_WORLD = { ...CONFIG, ruleSchedule: [['bankPairs', 3000]], attention: { switch: .004 } };
const llOf = (p, y) => { p = Math.min(1 - 1e-3, Math.max(1e-3, p)); return -(y ? Math.log(p) : Math.log(1 - p)); };
const modelP = (b, bits) => { const t = b.taste, n = t.masks.length; let z = Math.log(3); for (let i = 0; i < n; i++) { let v = 1; for (let k = 0; k < 8; k++) if (t.masks[i] >> k & 1) v *= bits[k]; z += t.w[i] * v / Math.sqrt(n); } return 1 / (1 + Math.exp(-z)); };
function popRun(seed, arm) { const w = new Microverse(seed, { X: STRAINS[arm] }, L3II_WORLD); const late = [];
  for (let t = 0; t < TICKS && w.flies.length; t++) { w.step(); if (w.tick > 10000 && w.tick % EVERY === 0) late.push(w.flies.length); }
  while (late.length < (TICKS - 10000) / EVERY) late.push(0); return late.reduce((a, b) => a + b, 0) / late.length; }
function tapeAssay(seed, arms) {
  const w = new Microverse(seed, { X: STRAINS.AT_NOREV }, L3II_WORLD); w.tape = []; for (let t = 0; t < TICKS && w.flies.length; t++) w.step();
  const byFly = new Map(); for (const e of w.tape) (byFly.get(e.id) ?? byFly.set(e.id, []).get(e.id)).push(e);
  const loss = Object.fromEntries(arms.map(a => [a, 0])); let n = 0;
  for (const [id, tape] of byFly) for (const arm of arms) {
    const prog = STRAINS[arm], b = newBrain(prog, rng32(mix(seed ^ Math.imul(id, 2246822519) ^ 0x4c305250))), c = newAttnCtx(seed, id); let ticks = 0;
    for (const e of tape) { while (ticks < e.age + 1) { attnTick(c, L3II_WORLD.attention.switch); ticks++; }
      loss[arm] += llOf(modelP(b, e.bits), e.y); b.att = prog.attention ? attnSample(c, b, e.bits) : null; tasteLearn(b, e.bits, e.y); b.att = null; }
    if (arm === arms[0]) n += tape.length; }
  if (!n) throw Error('empty tape'); return Object.fromEntries(arms.map(a => [a, loss[a] / n]));
}
if (!isMainThread) { const { kind, seed, arm, arms } = workerData; parentPort.postMessage(kind === 'pop' ? { kind, seed, arm, v: popRun(seed, arm) } : { kind, seed, v: tapeAssay(seed, arms) }); }
else {
  const stage = process.argv[2], seeds = stage === 'stageA' ? Array.from({ length: 16 }, (_, i) => 101 + i) : Array.from({ length: 16 }, (_, i) => 301 + i);
  const STATICS = ['AT_S0', 'AT_S25', 'AT_S50', 'AT_S75', 'AT_S100'], arms = stage === 'stageA' ? ['AT_ORACLE', ...STATICS, 'AT_BLIND'] : ['AT_META', process.argv[3], 'AT_BLIND'];
  const jobs = [...seeds.flatMap(seed => arms.map(arm => ({ kind: 'pop', seed, arm }))), ...seeds.map(seed => ({ kind: 'tape', seed, arms }))], pop = {}, tape = {};
  await new Promise(res => { let next = 0, done = 0; const go = () => { if (next >= jobs.length) return; const wk = new Worker(new URL(import.meta.url), { workerData: jobs[next++] });
    wk.on('message', m => m.kind === 'pop' ? ((pop[m.seed] ??= {})[m.arm] = m.v) : (tape[m.seed] = m.v)); wk.on('error', e => { console.error(e); process.exit(1); }); wk.on('exit', () => ++done === jobs.length ? res() : go()); };
    for (let i = 0; i < Math.min(jobs.length, cpus().length - 1); i++) go(); });
  const mp = a => seeds.reduce((t, s) => t + pop[s][a], 0) / seeds.length, ml = a => seeds.reduce((t, s) => t + tape[s][a], 0) / seeds.length, wins = (a, b) => seeds.filter(s => pop[s][a] - pop[s][b] > 0).length;
  const summary = Object.fromEntries(arms.map(a => [a, { pop: +mp(a).toFixed(3), loss: +ml(a).toFixed(5) }]));
  let verdict;
  if (stage === 'stageA') {
    const FIXED = [...STATICS].sort((a, b) => mp(b) - mp(a) || Math.abs(+a.slice(4) / 100 - .5) - Math.abs(+b.slice(4) / 100 - .5) || +a.slice(4) - +b.slice(4))[0], O = 'AT_ORACLE';
    const vs = [...STATICS, 'AT_BLIND'].map(c => ({ c, dLoss: ml(c) - ml(O), dPop: mp(O) - mp(c) }));
    verdict = { lockedFIXED: FIXED, vs, winsVsFIXED: wins(O, FIXED), winsVsBLIND: wins(O, 'AT_BLIND'), advance: vs.every(x => x.dLoss >= .01 && x.dPop >= 2) && wins(O, FIXED) >= 12 && wins(O, 'AT_BLIND') >= 12 };
  } else { const M = 'AT_META'; const vs = [process.argv[3], 'AT_BLIND'].map(c => ({ c, dLoss: ml(c) - ml(M), dPop: mp(M) - mp(c), wins: wins(M, c) }));
    verdict = { vs, advance: vs.every(x => x.dLoss >= .005 && x.dPop >= 1 && x.wins >= 11) }; }
  console.log(JSON.stringify({ stage, seeds: seeds.length, summary, verdict, pop, tape }));
}
