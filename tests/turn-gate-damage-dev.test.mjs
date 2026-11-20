// DAMAGE-GATE engine fixtures (PLAN V1: FROZEN design, this file implements the
// engine-gate tests only). Zero bank worlds: synthetic bodies/records only.
// Union-excluded via tests/*.mjs scan. Schema-absence (knob-off rows lack the
// damage field) is asserted at instrument stage on trial rows, not here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createTasteEnergyBody,compactTasteEnergyBody,restoreTasteEnergyBody,replayGated} from '../learning/taste-energy.mjs';
import {scoreTurnGateDamage,agentWorkDamage,sumManipulationDamage,turnGateDamageDevBank,rowDamage,
  DG_GAIN_OPTS,DG_DAMAGE_OPTS} from '../scripts/turn-gate-damage-dev.mjs';
import {T9_GAIN_OPTS,scoreFlipSplit,subsetGap,mechanismConfirmed} from '../scripts/turn-gated-dev-v1i.mjs';

const D = 3.0;
const mkState = (opts = {}) => createTasteEnergyBody(1, 7, {tasteRate: 0.1, ...opts});
const mkRecord = (damage) => ({target: 1, phi: [0.5, -0.25, 0.1, -0.1, 0.2, 0, -0.3, 0.15, 0, 0.05, -0.05], ...(damage === undefined ? {} : {damage})});
const noop = () => {};
const wsum = (s) => s.weights.taste.reduce((a, v) => a + v, 0);

test('knob validates finite non-negative; counter inits zero', () => {
  assert.throws(() => mkState({replayDamageGain: -1}), /./);
  assert.throws(() => mkState({replayDamageGain: NaN}), /./);
  const s = mkState();
  assert.equal(s.config.replayDamageGain, 0);
  assert.equal(s.work.replayDamageBoosts, 0);
  const on = mkState({replayDamageGain: D});
  assert.equal(on.config.replayDamageGain, D);
  assert.equal(on.work.replayDamageBoosts, 0);
});

test('trigger fires iff knob on AND record damage > 0', () => {
  const on = mkState({replayDamageGain: D});
  const before = wsum(on);
  replayGated(on, mkRecord(2), noop);
  assert.equal(on.work.replayDamageBoosts, 1);
  const boostedDelta = wsum(on) - before;
  const plain = mkState({replayDamageGain: D});
  const pbefore = wsum(plain);
  replayGated(plain, mkRecord(0), noop);
  assert.equal(plain.work.replayDamageBoosts, 0);
  const plainDelta = wsum(plain) - pbefore;
  assert.ok(Math.abs(boostedDelta) > Math.abs(plainDelta));
  assert.ok(Math.abs(boostedDelta / plainDelta - (1 + D)) < 1e-9);
});

test('knob off ignores damage entirely (null-default)', () => {
  const off = mkState();
  const before = wsum(off);
  replayGated(off, mkRecord(5), noop);
  assert.equal(off.work.replayDamageBoosts, 0);
  assert.equal(off.work.replaySurpriseBoosts, 0);
  const ref = mkState();
  const rbefore = wsum(ref);
  replayGated(ref, mkRecord(undefined), noop);
  assert.equal(wsum(off) - before, wsum(ref) - rbefore);
});

test('knob-on zero-damage matches knob-off weights; ops delta is constant', () => {
  const runOnce = (opts, dmg) => {
    const s = mkState(opts);
    const b = wsum(s), o = s.work.scalarOperations;
    replayGated(s, mkRecord(dmg), noop);
    return {dW: wsum(s) - b, dO: s.work.scalarOperations - o, boosts: s.work.replayDamageBoosts};
  };
  const on = runOnce({replayDamageGain: D}, 0);
  const off = runOnce({}, 0);
  assert.equal(on.dW, off.dW);
  assert.equal(on.boosts, 0);
  assert.ok(on.dO > off.dO);
  // Documented constant: shared err/err2 computation + one damage comparison.
  // Re-measure loudly if the gate internals change: this MUST stay small and constant.
  const delta = on.dO - off.dO;
  const again = runOnce({replayDamageGain: D}, 0);
  const base = runOnce({}, 0);
  assert.equal(again.dO - base.dO, delta);
});

test('compact+restore round-trips knob and counter', () => {
  const s = mkState({replayDamageGain: D});
  replayGated(s, mkRecord(1), noop);
  assert.equal(s.work.replayDamageBoosts, 1);
  compactTasteEnergyBody(s);
  const r = restoreTasteEnergyBody(s);
  assert.equal(r.config.replayDamageGain, D);
  assert.equal(r.work.replayDamageBoosts, 1);
  const z = mkState();
  compactTasteEnergyBody(z);
  const zr = restoreTasteEnergyBody(z);
  assert.equal(zr.config.replayDamageGain, 0);
  assert.equal(zr.work.replayDamageBoosts, 0);
});

// ---- instrument fixtures (5-arm scorer, damage presence, HELD opts, bank) ----
// Zero bank worlds: synthetic rows/learners only. Union-excluded via tests/*.mjs scan.

const mkRowDG = (tag, seed, turnPairs) => ({tag, history: {seed},
  summary: {joinRate: 1,
    cues: Object.fromEntries(turnPairs.map(([cue, harm, turn]) => [cue, {contact: 10, pause: 2, turn: turn ?? (harm ? 8 : 1),
      beneficial: harm ? 1 : 9, harmful: harm ? 9 : 1, label: harm ? 'harmful' : 'beneficial'}]))}});

const rows15 = (seedBase, t, u, d, g, uu) => {
  const rows = [];
  for (let h = 0; h < 3; h++) {
    const mk = (tag, [th, tb2]) => mkRowDG(tag, seedBase + h, [['h', true, th], ['b', false, tb2]]);
    rows.push(mk('train', t));
    rows.push(mk('transferred', u));
    rows.push(mk('transferred-damage', d));
    rows.push(mk('transferred-gain', g));
    rows.push(mk('unlearned', uu));
  }
  return rows;
};
// gap = th/10 - tb/10. GO: train 0.7, uniform 0.4, damage 0.5, gain 0.5, unlearned 0.0.
test('scorer GO when trained + uniform + damage + gain + flat unlearned', () => {
  const v = scoreTurnGateDamage(rows15(444001, [8, 1], [5, 1], [6, 1], [6, 1], [1, 1]));
  assert.equal(v.g1, true);
  assert.equal(v.g0, true);
  assert.equal(v.g2a, true);
  assert.ok(Math.abs(v.transMean - 0.4) < 1e-9);
  assert.equal(v.g2b, true);
  assert.equal(v.go, true);
  assert.equal(v.verdict, 'PHASE-D1-GO');
});

test('scorer NOGO / INVALID / INCOMPLETE branches + all arm triples required', () => {
  // uniform gap 0.2 < 0.3 -> NOGO (intervention arms never gate)
  const n = scoreTurnGateDamage(rows15(444011, [8, 1], [3, 1], [6, 1], [6, 1], [1, 1]));
  assert.equal(n.go, false);
  assert.equal(n.verdict, 'PHASE-D1-NOGO');
  assert.equal(n.g2a, false);
  // train gap 0.0 < 0.5 -> INCOMPLETE-UNTRAINED
  const u = scoreTurnGateDamage(rows15(444021, [4, 4], [5, 1], [6, 1], [6, 1], [1, 1]));
  assert.equal(u.verdict, 'INCOMPLETE-UNTRAINED');
  // unlearned gap 0.5 -> INVALID via g2b... (g2b false -> go false -> NOGO)
  const f = scoreTurnGateDamage(rows15(444031, [8, 1], [5, 1], [6, 1], [6, 1], [6, 4]));
  assert.equal(f.g2b, false);
  assert.equal(f.verdict, 'PHASE-D1-NOGO');
  // join failure -> INVALID
  const bad = rows15(444041, [8, 1], [5, 1], [6, 1], [6, 1], [1, 1]);
  bad[0].summary.joinRate = 0.5;
  assert.equal(scoreTurnGateDamage(bad).verdict, 'INVALID');
  // missing damage triple -> throws (fail-closed completeness)
  const nodmg = rows15(444051, [8, 1], [5, 1], [6, 1], [6, 1], [1, 1]).filter(r => r.tag !== 'transferred-damage');
  assert.throws(() => scoreTurnGateDamage(nodmg), /3 transferred-damage rows/);
  const nogain = rows15(444061, [8, 1], [5, 1], [6, 1], [6, 1], [1, 1]).filter(r => r.tag !== 'transferred-gain');
  assert.throws(() => scoreTurnGateDamage(nogain), /3 transferred-gain rows/);
});

test('HELD gain identical to V1i; damage arm shares live path, trigger differs', () => {
  assert.deepEqual(DG_GAIN_OPTS, T9_GAIN_OPTS);
  assert.equal(DG_DAMAGE_OPTS.surpriseGain, 1.0);
  assert.equal(DG_DAMAGE_OPTS.replayDamageGain, 3.0);
  assert.equal(DG_DAMAGE_OPTS.replaySurpriseGain ?? 0, 0);
  assert.equal(DG_GAIN_OPTS.replayDamageGain ?? 0, 0);
});

test('rowDamage reads endpoint totals; missing -> false', () => {
  assert.equal(rowDamage({endpoint: {totals: {toxinDamage: 5}}}), true);
  assert.equal(rowDamage({endpoint: {totals: {toxinDamage: 0}}}), false);
  assert.equal(rowDamage({endpoint: {}}), false);
  assert.equal(rowDamage({}), false);
  assert.equal(rowDamage(null), false);
});

test('agentWorkDamage + sumManipulationDamage carry the damage counter; nulls propagate', () => {
  const learners = {1: {work: {surpriseBoosts: 2, replaySurpriseBoosts: 3, replayDamageBoosts: 4, replaySkips: 1}}, 2: {}};
  assert.deepEqual(agentWorkDamage(learners), {surpriseBoosts: 2, replaySurpriseBoosts: 3, replayDamageBoosts: 4, replaySkips: 1});
  const rows = [{manipulation: {surpriseBoosts: 1, replaySurpriseBoosts: 2, replayDamageBoosts: 3, replaySkips: 0}}, {}];
  assert.deepEqual(sumManipulationDamage(rows), {surpriseBoosts: 1, replaySurpriseBoosts: 2, replayDamageBoosts: 3, replaySkips: 0});
});

test('D1/D2 flip math path (scoreFlipSplit + subsetGap + mechanismConfirmed)', () => {
  const tr = mkRowDG('train', 444001, [['A', true], ['B', false]]);
  const un = mkRowDG('transferred', 444010, [['A', false, 2], ['B', true, 9]]);
  const dm = mkRowDG('transferred-damage', 444010, [['A', false, 1], ['B', true, 9]]);
  const fu = scoreFlipSplit(tr, un), fd = scoreFlipSplit(tr, dm);
  assert.equal(typeof subsetGap(fu, fd, 'flippedHB'), 'number');
  assert.equal(subsetGap(fu, fd, 'same'), null);
  assert.equal(typeof mechanismConfirmed(fu), 'boolean');
  const noHB = scoreFlipSplit(mkRowDG('train', 444019, [['A', true]]), mkRowDG('transferred', 444028, [['A', true, 10]]));
  assert.equal(subsetGap(noHB, fd, 'flippedHB'), null);
});

test('live bank 444001-444054 cannot be rebuilt (union-exclusion guard)', () => {
  // Post-build maintenance: the fresh-11 bank built cleanly pre-build (12/12 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p = turnGateDamageDevBank('evidence/turn-gated-dev/fresh-11/protocol.json');
  assert.equal(p.experiment, 'turn-gate-damage-dev');
  assert.equal(p.histories.length, 6);
  const flat = p.histories.flatMap(h => [h.seed, h.cueSeed, ...h.resourceSeeds, h.probeSeeds.A, h.probeSeeds.B, h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size, 54);
  assert.equal(Math.min(...flat), 444001);
  assert.equal(Math.max(...flat), 444054);
  for (const s of [381001, 395019, 396001, 407001, 408001, 409001, 410001, 411001, 412001, 413001, 414001, 444001])assert.ok(p.excludedSeeds.includes(s), `missing exclusion ${s}`);
  const dir = mkdtempSync(join(tmpdir(), 'turn-gate-damage-bank-guard-'));
  assert.throws(() => turnGateDamageDevBank(join(dir, 'protocol.json')), /already used in prior evidence/);
});
