// Fly-RSI L3-III runner: evidence-routed attention (docs/FLY_RSI_GOALS.md, L3-III).
// Usage: node microverse/l3iii.mjs stageA | stageB <FIXEDarm> | stageC <FIXEDarm> | final <FIXEDarm>
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { Microverse, ATT_STATS, mix } from './sim.mjs';
import { STRAINS } from './strains.mjs';
import { TICKS, EVERY, CONFIG } from './config.mjs';
const { signflip, signTest } = isMainThread ? await import('./l3i.mjs') : {}; // l3i.mjs has a worker branch; import it on the main thread only
const W = { ...CONFIG, ruleSchedule: [['bankPairs', 3000]], attention: { switch: .004 } }; // = L3II_WORLD, unchanged
const DONOR_TAG = 0x4c334444; // L3III_DONOR RNG domain
const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);

function donorLibrary(seed) { const w = new Microverse(mix(seed ^ DONOR_TAG), { X: STRAINS.AT_NOREV }, W); w.tape = [];
  for (let t = 0; t < TICKS && w.flies.length; t++) w.step();
  const by = new Map(); for (const e of w.tape) (by.get(e.id) ?? by.set(e.id, []).get(e.id)).push({ bits: e.bits, y: e.y });
  const L = [...by.values()].filter(x => x.length); if (!L.length) throw Error(`empty donor library seed ${seed}`); return { L, donorFlies: L.length, donorBites: w.tape.length }; }
function popRun(seed, arm) { const w = new Microverse(seed, { X: STRAINS[arm] }, W); let donor = null;
  if (arm === 'AT3_SHAM') { donor = donorLibrary(seed); w.donor = donor.L; }
  const late = []; for (let t = 0; t < TICKS && w.flies.length; t++) { w.step(); if (w.tick > 10000 && w.tick % EVERY === 0) late.push(w.flies.length); }
  const extinct = !w.flies.length; while (late.length < (TICKS - 10000) / EVERY) late.push(0);
  const g = ATT_STATS.lag, cov = g.n ? g.sxy / g.n - g.sx / g.n * (g.sy / g.n) : null, vx = g.n ? g.sxx / g.n - (g.sx / g.n) ** 2 : null, vy = g.n ? g.syy / g.n - (g.sy / g.n) ** 2 : null;
  const tel = { routed: ATT_STATS.routed, tastings: ATT_STATS.tastings, matchRate: ATT_STATS.tastings ? ATT_STATS.match / ATT_STATS.tastings : null, admissions: ATT_STATS.admissions,
    bitesAfterAdmPerAdm: ATT_STATS.admissions[0] + ATT_STATS.admissions[1] ? ATT_STATS.bitesAfterAdm / (ATT_STATS.admissions[0] + ATT_STATS.admissions[1]) : null,
    meanRouteRun: ATT_STATS.runs ? ATT_STATS.tastings / ATT_STATS.runs : null, innovN: ATT_STATS.zN, innovRMS: ATT_STATS.zN ? Math.sqrt(ATT_STATS.zSS / ATT_STATS.zN) : null,
    lag1SameBank: { n: g.n, r: g.n > 1 && vx > 0 && vy > 0 ? cov / Math.sqrt(vx * vy) : 'undefined' },
    ...(donor ? { donorFlies: donor.donorFlies, donorBites: donor.donorBites, joinsPer100Bites: ATT_STATS.tastings ? 100 * ATT_STATS.joins / ATT_STATS.tastings : null } : {}) };
  return { v: late.reduce((a, b) => a + b, 0) / late.length, extinct, tel }; }
function lockstep(seed) { // METAOFF vs NOREV identity, tick by tick; also yields both arms' populations
  const key = w => JSON.stringify(w.flies.map(f => [f.id, f.x, f.y, f.energy, f.age, f.brain.taste.masks, f.brain.taste.w, f.brain.move.masks, f.brain.move.w, f.brain.taste.ev, f.brain.move.ev, f.brain.taste.n]));
  const a = new Microverse(seed, { X: STRAINS.AT3_METAOFF }, W), b = new Microverse(seed, { X: STRAINS.AT_NOREV }, W); let div = -1;
  for (let t = 0; t < TICKS && (a.flies.length || b.flies.length); t++) { a.step(); b.step(); if (key(a) !== key(b)) { div = t; break; } }
  return { div, rngEqual: a.r() === b.r() }; }

if (!isMainThread) { const { kind, seed, arm } = workerData; parentPort.postMessage(kind === 'pop' ? { kind, seed, arm, ...popRun(seed, arm) } : { kind, seed, ...lockstep(seed) }); }
else {
  const stage = process.argv[2], FIXED = process.argv[3], STATICS = ['AT_S0', 'AT_S25', 'AT_S50', 'AT_S75', 'AT_S100'];
  const SIX = { META: 'AT3_META', SHAM: 'AT3_SHAM', EVOR: 'AT_EVOR', FIXED, NOREV: 'AT_NOREV', METAOFF: 'AT3_METAOFF' };
  const plan = { stageA: [range(301, 16), STATICS], stageB: [range(317, 16), ['AT3_META', FIXED, 'AT_NOREV']],
    stageC: [[...range(101, 16), ...range(301, 32)], Object.values(SIX)], final: [range(874001, 48), Object.values(SIX)] }[stage];
  if (!plan || (stage !== 'stageA' && !STATICS.includes(FIXED))) throw Error('usage');
  const [seeds, arms] = plan, lock = stage === 'stageC' || stage === 'final';
  const jobs = [...seeds.flatMap(seed => arms.map(arm => ({ kind: 'pop', seed, arm }))), ...(lock ? seeds.map(seed => ({ kind: 'lock', seed })) : [])], pop = {}, ext = {}, tel = {}, locks = {};
  await new Promise(res => { let next = 0, done = 0; const go = () => { if (next >= jobs.length) return; const wk = new Worker(new URL(import.meta.url), { workerData: jobs[next++] });
    wk.on('message', m => { if (m.kind === 'pop') { (pop[m.seed] ??= {})[m.arm] = m.v; (ext[m.seed] ??= {})[m.arm] = m.extinct; (tel[m.seed] ??= {})[m.arm] = m.tel; } else locks[m.seed] = { div: m.div, rngEqual: m.rngEqual }; });
    wk.on('error', e => { console.error(e); process.exit(1); }); wk.on('exit', () => ++done === jobs.length ? res() : go()); };
    for (let i = 0; i < Math.min(jobs.length, cpus().length - 1); i++) go(); });
  for (const s of seeds) for (const a of arms) if (!Number.isFinite(pop[s]?.[a])) throw Error(`invalid result seed ${s} arm ${a}`);
  const mp = a => seeds.reduce((t, s) => t + pop[s][a], 0) / seeds.length, v = f => seeds.map(s => f(pop[s]));
  const means = Object.fromEntries(arms.map(a => [a, mp(a)])), extinctions = Object.fromEntries(arms.map(a => [a, seeds.filter(s => ext[s][a]).length]));
  let verdict;
  if (stage === 'stageA') { const val = a => +a.slice(4) / 100, locked = [...STATICS].sort((a, b) => mp(b) - mp(a) || Math.abs(val(a) - .5) - Math.abs(val(b) - .5) || val(a) - val(b))[0]; verdict = { lockedFIXED: locked }; }
  else if (stage === 'stageB') { const g = v(x => x[FIXED] - x.AT_NOREV), m = v(x => x.AT3_META - x[FIXED]), d = seeds.map((_, i) => m[i] - .5 * g[i]), mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    verdict = { meanG: mean(g), meanM: mean(m), meanD: mean(d), dPositive: d.filter(x => x > 0).length, perSeed: { g, m, d }, advance: mean(g) > 0 && mean(d) > 0 && d.filter(x => x > 0).length >= 9 }; }
  else { const P = s => Object.fromEntries(Object.entries(SIX).map(([k, a]) => [k, pop[s][a]]));
    const V = f => seeds.map(s => f(P(s))), d = V(x => (x.META - x.NOREV) - 1.5 * (x.FIXED - x.NOREV)), fac = V(x => (x.META - x.NOREV) - 1.5 * (x.FIXED - x.NOREV) - (x.METAOFF - x.NOREV));
    const c = { 'META-EVOR': signflip(V(x => x.META - x.EVOR)), 'META-SHAM': signflip(V(x => x.META - x.SHAM)), 'META-FIXED': signflip(V(x => x.META - x.FIXED)), L3_d: signflip(d), factorial: signflip(fac), factorialSign: signTest(fac), 'FIXED-NOREV': signflip(V(x => x.FIXED - x.NOREV)), 'METAOFF-NOREV': signflip(V(x => x.METAOFF - x.NOREV)) };
    const identity = seeds.every(s => locks[s].div === -1 && locks[s].rngEqual) && seeds.every(s => pop[s].AT3_METAOFF === pop[s].AT_NOREV);
    const gates = { vsEVOR: c['META-EVOR'].mean >= 1 && c['META-EVOR'].p < .01, vsSHAM: c['META-SHAM'].mean >= 1 && c['META-SHAM'].p < .01, vsFIXED: c['META-FIXED'].mean > 0 && c['META-FIXED'].p < .01,
      L3_d: c.L3_d.mean > 0 && c.L3_d.p < .01, factorialMean: c.factorial.mean > 0 && c.factorial.p < .01, factorialSign: c.factorialSign.wins >= 33, L1gain: c['FIXED-NOREV'].mean > 0 && c['FIXED-NOREV'].p < .01, offArmIdentity: identity };
    const blocks = stage === 'stageC' ? Object.fromEntries([['101-116', range(101, 16)], ['301-316', range(301, 16)], ['317-332', range(317, 16)]].map(([k, ss]) => [k, Object.fromEntries(Object.entries(SIX).map(([n, a]) => [n, ss.reduce((t, s) => t + pop[s][a], 0) / ss.length]))])) : undefined;
    verdict = { contrasts: c, gates, pass: Object.values(gates).every(Boolean), blocks, locks }; }
  console.log(JSON.stringify({ stage, seeds: seeds.length, arms, means, extinctions, verdict, pop, extinctBySeed: ext, telemetry: tel }));
}
