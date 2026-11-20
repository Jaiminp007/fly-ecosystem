// L3-III pre-stage-A integrity fixtures (docs/FLY_RSI_GOALS.md, L3-III section 3).
import { Microverse, newBrain, tasteLearn, newAttnCtx, attnSample, attnTick, newTwin, twinBite, rng32, mix } from '../microverse/sim.mjs';
import { STRAINS } from '../microverse/strains.mjs';
import { CONFIG } from '../microverse/config.mjs';
const W = { ...CONFIG, ruleSchedule: [['bankPairs', 3000]], attention: { switch: .004 } }; // = L3II_WORLD
const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32, out = {};
const script = (seed, n) => { const r = rng(seed); return [...Array(n)].map(() => ({ bits: [...Array(8)].map(() => r() < .5 ? -1 : 1), y: r() < .6 ? 1 : 0 })); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// R1: META reproduces former BLIND (routes, live updates, utilities, ctx RNG consumption), with explicit gene writes.
{ const S = script(11, 600), bB = newBrain(STRAINS.AT_BLIND, rng(3)), bM = newBrain(STRAINS.AT3_META, rng(3)), cB = newAttnCtx(101, 7), cM = newAttnCtx(101, 7);
  let routeDiff = 0, stateDiff = 0, geneBad = 0, ties = 0, explore = 0;
  for (const e of S) { attnTick(cB, .004); attnTick(cM, .004); const U = bB.attU ?? [0, 0]; if (U[0] === U[1]) ties++;
    const aB = attnSample(cB, bB, e.bits), aM = attnSample(cM, bM, e.bits); if (aB.bank !== aM.bank) routeDiff++;
    if (bM.genes.attentionA !== (aM.bank === 0 ? 1 : 0)) geneBad++; if ((bB.attU ?? [0, 0])[aB.bank] < (bB.attU ?? [0, 0])[1 - aB.bank]) explore++;
    bB.att = aB; bM.att = aM; tasteLearn(bB, e.bits, e.y); tasteLearn(bM, e.bits, e.y); bB.att = bM.att = null;
    if (!eq([bB.taste.w, bB.taste.ev, bB.taste.S, bB.taste.masks, bB.attU], [bM.taste.w, bM.taste.ev, bM.taste.S, bM.taste.masks, bM.attU])) stateDiff++; }
  out.R1 = { tastings: S.length, ties, exploreAgainstUtility: explore, routeDiff, stateDiff, geneWriteMismatch: geneBad, ctxNextDrawEqual: cB.O() === cM.O() && cB.X() === cM.X() && cB.C() === cM.C() && rng(3)() === rng(3)() }; }

// R2: world-level, META vs former BLIND on seed 101: identical ecology (attentionA is controller telemetry only).
{ const key = w => JSON.stringify(w.flies.map(f => [f.id, f.x, f.y, f.energy, f.age, f.brain.taste.masks, f.brain.taste.w, f.brain.move.w]));
  const a = new Microverse(101, { X: STRAINS.AT_BLIND }, W), b = new Microverse(101, { X: STRAINS.AT3_META }, W); let div = -1, t = 0;
  for (; t < 20000 && (a.flies.length || b.flies.length); t++) { a.step(); b.step(); if (t % 50 === 0 && key(a) !== key(b)) { div = t; break; } }
  out.R2 = { ticks: t, firstDivergentCheck: div, popBLIND: a.flies.length, popMETA: b.flies.length }; }

// R3: offspring reset. META parent with attentionA 0 -> child .5 before mutation; EVO-R child keeps the real allele unless its EVO stream fires.
{ const w = new Microverse(101, { X: STRAINS.AT3_META }, W), p = w.flies[0]; p.brain.genes.attentionA = 0;
  const kids = [...Array(20)].map(() => w.spawn('X', null, p, p.x, p.y, 50, 1)); const parentKept = p.brain.genes.attentionA === 0;
  const we = new Microverse(101, { X: STRAINS.AT_EVOR }, W), pe = we.flies[0]; pe.brain.genes.attentionA = .75; let kept = 0, mutated = 0, bad = 0;
  for (let i = 0; i < 60; i++) { const k = we.spawn('X', null, pe, pe.x, pe.y, 50, 1), q = rng32(mix(we.seed ^ Math.imul(k.id, 1597334677) ^ 0x41545445)), fires = q() < .1, v = k.brain.genes.attentionA;
    if (!fires && v === .75) kept++; else if (fires && v !== .75 && [0, .25, .5, 1].includes(v)) mutated++; else bad++; }
  out.R3 = { metaKidsAllHalf: kids.every(k => k.brain.genes.attentionA === .5), parentNotReset: parentKept, evorKept: kept, evorMutated: mutated, evorBad: bad }; }

// S1-S3: SHAM sensory-twin wiring.
{ const donor = [script(21, 40), script(22, 25)], fakeW = d => ({ seed: 101, strains: { X: STRAINS.AT3_SHAM }, donor: d }), fly = () => ({ id: 9, strain: 'X' });
  // S1: hold donor, twin, bank and RNG fixed; vary only the recipient's observation -> z' unchanged.
  const w1 = fakeW(donor), f1 = fly(), f2 = fly(); f1.tw = newTwin(w1, f1); f2.tw = newTwin(w1, f2); let zDiff = 0, n1 = 0;
  const R1 = script(31, 50), R2 = script(32, 50);
  for (let i = 0; i < 50; i++) { const bank = i % 3 === 0 ? 1 : 0, a1 = { bank, sample: R1[i].bits, blind: true }, a2 = { bank, sample: R2[i].bits, blind: true };
    attnTick(f1.tw.ctx, .004); attnTick(f2.tw.ctx, .004); twinBite(w1, f1, a1); twinBite(w1, f2, a2); n1++; if (!eq(a1.twin, a2.twin)) zDiff++; }
  // S2: vary only the donor observation -> recipient's real L0 update and L1 evidence increment unchanged.
  const wA = fakeW(donor), wB = fakeW([script(41, 40), script(42, 25)]), gA = fly(), gB = fly(); gA.tw = newTwin(wA, gA); gB.tw = newTwin(wB, gB);
  const rA = newBrain(STRAINS.AT3_SHAM, rng(5)), rB = newBrain(STRAINS.AT3_SHAM, rng(5)), cA = newAttnCtx(101, 9), cB = newAttnCtx(101, 9); let realDiff = 0, twinDiffered = 0;
  for (const e of script(51, 300)) { attnTick(cA, .004); attnTick(cB, .004); attnTick(gA.tw.ctx, .004); attnTick(gB.tw.ctx, .004);
    rA.attU = [0, 0]; rB.attU = [0, 0]; // hold the controller fixed so routes are identical: only the donor differs
    const aA = attnSample(cA, rA, e.bits), aB = attnSample(cB, rB, e.bits); twinBite(wA, gA, aA); twinBite(wB, gB, aB); if (!eq(aA.twin, aB.twin)) twinDiffered++;
    rA.att = aA; rB.att = aB; tasteLearn(rA, e.bits, e.y); tasteLearn(rB, e.bits, e.y); rA.att = rB.att = null;
    if (!eq([rA.taste.w, rA.taste.ev, rA.taste.S, rA.taste.masks], [rB.taste.w, rB.taste.ev, rB.taste.S, rB.taste.masks])) realDiff++; }
  // S3: identical scripted donor/recipient history, identical learner init and receptor draws -> z' reproduces META's z bite for bite.
  const H = script(61, 500), mb = newBrain(STRAINS.AT3_META, rng(8)), tb = newBrain({ ...STRAINS.AT3_META, attnMode: 'forced' }, rng(8)), c1 = newAttnCtx(101, 3), c2 = newAttnCtx(101, 3); let zMis = 0, nz = 0;
  for (const e of H) { attnTick(c1, .004); attnTick(c2, .004); const a = attnSample(c1, mb, e.bits); tb.forceBank = a.bank; const ta = attnSample(c2, tb, e.bits);
    mb.att = a; tb.att = ta; tasteLearn(mb, e.bits, e.y); tasteLearn(tb, e.bits, e.y); if (a.zParts) { nz++; if (!eq(a.zParts, ta.zParts)) zMis++; } mb.att = tb.att = null; }
  out.S = { S1_bites: n1, S1_zPrimeChangedByRecipient: zDiff, S2_twinInnovationDiffered: twinDiffered, S2_realStateDiverged: realDiff, S3_bites: nz, S3_zMismatch: zMis }; }

// F: METAOFF vs NOREV lockstep, seed 101, 20000 ticks.
{ const key = w => JSON.stringify(w.flies.map(f => [f.id, f.x, f.y, f.energy, f.age, f.brain.taste.masks, f.brain.taste.w, f.brain.move.masks, f.brain.move.w, f.brain.taste.ev, f.brain.move.ev, f.brain.taste.n]));
  const a = new Microverse(101, { X: STRAINS.AT3_METAOFF }, W), b = new Microverse(101, { X: STRAINS.AT_NOREV }, W); let div = -1, t = 0;
  for (; t < 20000 && (a.flies.length || b.flies.length); t++) { a.step(); b.step(); if (key(a) !== key(b)) { div = t; break; } }
  out.F = { ticks: t, firstDivergentTick: div, popMETAOFF: a.flies.length, popNOREV: b.flies.length, worldRngNext: a.r() === b.r() }; }
console.log(JSON.stringify(out));
