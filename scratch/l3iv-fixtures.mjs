// L3-IV-H0 integrity fixtures (docs/FLY_RSI_GOALS.md, L3-IV-H0 "Integrity and records").
import { Microverse, newBrain, tasteLearn, makeRule, valence, newQuadCtx, quadTick, quadSample, bankOf4, evIdx4, BANK4, QUAD_ALLOCS, Q_STATS } from '../microverse/sim.mjs';
import { STRAINS, SELF_Q } from '../microverse/strains.mjs';
import { CONFIG } from '../microverse/config.mjs';
const W = { ...CONFIG, ruleSchedule: [['quadBankPairs', 3000]], quad: { switch: .004 } };
const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32, out = {}, eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rbits = r => [...Array(16)].map(() => r() < .5 ? -1 : 1);
const modelP = (b, bits) => { const t = b.taste, n = t.masks.length; let z = Math.log(3); for (let i = 0; i < n; i++) { let v = 1; for (let k = 0; k < bits.length; k++) if (t.masks[i] >> k & 1) v *= bits[k]; z += t.w[i] * v / Math.sqrt(n); } return 1 / (1 + Math.exp(-z)); };

// Q0: the static menu has 39 distinct allocations summing to 1.
out.Q0 = { allocs: QUAD_ALLOCS.length, distinct: new Set(QUAD_ALLOCS.map(a => a.join())).size, allSumOne: QUAD_ALLOCS.every(a => Math.abs(a.reduce((s, x) => s + x, 0) - 1) < 1e-12) };

// Q1: banks 2 and 3 affect valence (flipping one bit of each bank's target pair changes the sum term).
{ let changed = [0, 0, 0, 0], n = 0; for (let sd = 1; sd <= 50; sd++) { const R = makeRule('quadBankPairs', sd); const r = rng(sd);
    for (let i = 0; i < 40; i++) { const x = rbits(r), v = valence(R, x); for (let b = 0; b < 4; b++) { const k = Math.log2(R.terms[b][0] & -R.terms[b][0]), y = [...x]; y[k] = -y[k]; if (valence(R, y) !== v) changed[b]++; } n++; } }
  const terms = makeRule('quadBankPairs', 7).terms; out.Q1 = { valenceFlipsByBank: changed, trials: n, termBanks: terms.map(t => bankOf4(t[0])), pairsArePairs: terms.every(t => t[0].toString(2).split('1').length - 1 === 2) }; }

// Q2: prediction and replay use bank-2/3 masks; admission can admit a bank-3 pair.
{ const p = SELF_Q('oracle'), b = newBrain(p, rng(3)), m2 = 0b11 << 8, m3 = 0b101 << 12; b.taste.masks.push(m2, m3); b.taste.w.push(4, -4);
  const x = rbits(rng(9)), y8 = [...x], y12 = [...x]; y8[8] = -y8[8]; y12[12] = -y12[12]; const predDiff = modelP(b, x) !== modelP(b, y8) && modelP(b, x) !== modelP(b, y12);
  // replay: memory phi includes the bank-2/3 masks
  tasteLearn(b, x, 1); const phiLen = b.taste.memory[0].phi.length, phiHas = b.taste.memory[0].phi.length === b.taste.masks.length;
  // admission: feed a brain clean bank-3 evidence for pair (bit12,bit13) via scripted routed samples
  const a = newBrain(SELF_Q('oracle'), rng(4)), r = rng(5), pair = 1 << 12 | 1 << 13; let admitted = false;
  for (let i = 0; i < 4000 && !admitted; i++) { const z = rbits(r), lab = z[12] * z[13] > 0 ? 1 : 0; a.att = { bank: 3, sample: z, blind: false }; tasteLearn(a, z, lab); a.att = null; if (a.taste.masks.includes(pair)) admitted = true; }
  out.Q2 = { predictionUsesBanks23: predDiff, replayPhiLen: phiLen, replayMatchesMasks: phiHas, bank3PairAdmitted: admitted, admittedAll: a.taste.added }; }

// Q3: each routing label: exactly 15 fresh correlations in the routed bank, 0 outside beyond decay; L0 identical across routes.
{ const p = SELF_Q('oracle'), base = newBrain(p, rng(11)), r = rng(12); for (let i = 0; i < 30; i++) { const z = rbits(r); base.att = { bank: i % 4, sample: z, blind: false }; tasteLearn(base, z, i % 2); base.att = null; }
  const clone = () => { const b = newBrain(p, rng(11)), r2 = rng(12); for (let i = 0; i < 30; i++) { const z = rbits(r2); b.att = { bank: i % 4, sample: z, blind: false }; tasteLearn(b, z, i % 2); b.att = null; } return b; };
  const x = rbits(rng(13)), D = 1 - 1 / p.genes.tasteMemory, res = [], ws = [];
  for (let bank = 0; bank < 4; bank++) { const b = clone(), ev0 = [...b.taste.ev], smp = x.map((v, i) => (i >> 2) === bank ? v : -v); b.att = { bank, sample: smp, blind: false }; tasteLearn(b, x, 1);
    let fresh = 0, outside = 0; for (let k = 1; k < 65536; k++) { const bk = bankOf4(k); if (bk < 0) continue; const j = evIdx4(k), ch = Math.abs(b.taste.ev[j] - ev0[j] * D) > 1e-12; if (bk === bank && ch) fresh++; if (bk !== bank && ch) outside++; }
    res.push({ bank, fresh, outside }); ws.push(JSON.stringify(b.taste.w)); }
  out.Q3 = { perBank: res, L0weightsIdenticalAcrossRoutes: ws.every(w => w === ws[0]) }; }

// Q4: corruption: reliable bank never flipped; the 12 unreliable bits flip independently at ~.5.
{ const c = newQuadCtx(101, 5), b = newBrain(SELF_Q('oracle'), rng(1)), x = Array(16).fill(1), N = 20000, flips = Array(16).fill(0), co = [];
  let pairCo = 0, pairN = 0; const routes = [0, 0, 0, 0], states = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) { if (i % 50 === 0) quadTick(c, .2); const st = c.state; states[st]++; const a = quadSample(c, b, x); routes[a.bank]++;
    const f = a.sample.map(v => v < 0 ? 1 : 0); for (let k = 0; k < 16; k++) if ((k >> 2) !== st) flips[k] += f[k]; else if (f[k]) flips[k] += 1e6;
    const un = [...Array(16).keys()].filter(k => (k >> 2) !== st); pairCo += (f[un[0]] - .5) * (f[un[11]] - .5) + (f[un[3]] - .5) * (f[un[4]] - .5); pairN += 2; }
  out.Q4 = { reliableFlipped: flips.some(v => v >= 1e6), unreliableFlipRate: +(flips.reduce((s, v) => s + v, 0) / (N * 12)).toFixed(4), pairCov: +(pairCo / pairN).toFixed(4), oracleRoutesFollowState: eq(routes, states), statesVisited: states }; }

// Q5: static allocation routing frequencies match the gene; BLIND routes to all four labels.
{ const c = newQuadCtx(101, 6), al = [.5, .25, 0, .25], b = newBrain(SELF_Q('static', al), rng(2)), cnt = [0, 0, 0, 0]; for (let i = 0; i < 40000; i++) cnt[quadSample(c, b, Array(16).fill(1)).bank]++;
  const bb = newBrain(STRAINS.Q_BLIND, rng(2)), cb = [0, 0, 0, 0]; for (let i = 0; i < 4000; i++) cb[quadSample(c, bb, Array(16).fill(1)).bank]++;
  out.Q5 = { staticFreq: cnt.map(v => +(v / 40000).toFixed(3)), gene: al, blindRoutes: cb }; }

// Q6: METAOFF-style identity is not part of H0; check NOREV world runs and the mutation prior mass on within-bank masks.
{ const w = new Microverse(101, { X: STRAINS.Q_NOREV }, W); for (let t = 0; t < 3000 && w.flies.length; t++) w.step();
  const masks = w.flies.flatMap(f => f.brain.taste.masks.filter(m => m && (m & (m - 1)))); const within = masks.filter(m => bankOf4(m) >= 0).length;
  out.Q6 = { pop3000: w.flies.length, codeBits: w.codes[0].length, nonSingleMasks: masks.length, withinBankShare: masks.length ? +(within / masks.length).toFixed(3) : null, ruleBanks: w.rule.target.map(bankOf4), births: Q_STATS.births, birthTargets: Q_STATS.birthTargets }; }
console.log(JSON.stringify(out));
