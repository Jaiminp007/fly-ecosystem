import { Microverse, newBrain, tasteLearn, bankOf, newAttnCtx, attnSample, attnTick } from '../microverse/sim.mjs';
import { STRAINS } from '../microverse/strains.mjs';
import { CONFIG } from '../microverse/config.mjs';
const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32;
// F1/F2: routed-bank accounting and L0 isolation on a trained fixture brain.
const prog = STRAINS.AT_META, b1 = newBrain(prog, rng(5)), b2 = newBrain(prog, rng(5)); const r = rng(9);
const rb = () => [...Array(8)].map(() => r() < .5 ? -1 : 1);
for (let i = 0; i < 40; i++) { const bits = rb(), y = r() < .5 ? 1 : 0, a = { bank: i % 2, sample: bits, blind: false }; b1.att = a; b2.att = a; tasteLearn(b1, bits, y); tasteLearn(b2, bits, y); }
const bits = rb(), y = 1, D = 1 - 1 / prog.genes.tasteMemory, ev0 = [...b1.taste.ev];
b1.att = { bank: 0, sample: bits, blind: false }; b2.att = { bank: 1, sample: bits.map(v => -v), blind: false }; // different route and corruption
tasteLearn(b1, bits, y); tasteLearn(b2, bits, y);
let fresh = 0, otherBad = 0; for (let k = 1; k < 256; k++) { const dec = ev0[k] * D, ch = Math.abs(b1.taste.ev[k] - dec) > 1e-12; if (bankOf(k) === 0 && ch) fresh++; if (bankOf(k) !== 0 && ch) otherBad++; }
const wSame = JSON.stringify(b1.taste.w) === JSON.stringify(b2.taste.w);
console.log(JSON.stringify({ F1_freshInRoutedBank: fresh, F1_changedOutsideRoutedBank: otherBad, F2_L0weightsIdenticalAcrossRoutes: wSame }));
// F3: METAOFF vs NOREV lockstep, 20000 ticks, seed 101.
const W = { ...CONFIG, ruleSchedule: [['bankPairs', 3000]], attention: { switch: .004 } };
const key = w => JSON.stringify(w.flies.map(f => [f.id, f.x, f.y, +f.energy.toFixed(9), f.age, f.brain.taste.masks, f.brain.taste.w.map(x => +x.toFixed(9)), f.brain.move.masks, f.brain.move.w.map(x => +x.toFixed(9)), f.brain.taste.ev.slice(0, 16).map(x => +x.toFixed(9))]));
const wa = new Microverse(101, { X: STRAINS.AT_METAOFF }, W), wb = new Microverse(101, { X: STRAINS.AT_NOREV }, W);
let div = -1, t = 0; for (; t < 20000 && (wa.flies.length || wb.flies.length); t++) { wa.step(); wb.step(); if (key(wa) !== key(wb)) { div = t; break; } }
console.log(JSON.stringify({ F3_ticks: t, F3_firstDivergentTick: div, popMETAOFF: wa.flies.length, popNOREV: wb.flies.length }));
