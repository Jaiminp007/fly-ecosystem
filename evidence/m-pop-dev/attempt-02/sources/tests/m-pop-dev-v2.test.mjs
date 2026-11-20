// M-POP V2 fixtures (PLAN V1: FROZEN design; this file implements the
// instrument-gating tests). Zero bank worlds: synthetic seeds 389101+ (spent
// range, auto union-excluded via tests/*.mjs scan) + tmp-bank builds only +
// zero-tick construction checks (no advance() calls anywhere).
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mPopDevV2Bank,P2_FIXTURE_SEEDS,P2_MATING_ENERGY_BAR} from '../scripts/m-pop-dev-v2.mjs';
import {scoreMpop} from '../scripts/m-pop-dev.mjs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';

const mkRow = (tag, seed, lines) => ({tag, history: {seed}, perLine: lines});
const L = (a, d, g) => ({a, d, g});

// Scorer binding: V2 decides through the frozen V1 scorer (identical V1a bars).
test('scorer GO/NOGO/INVALID branches via V2 binding', async () => {
  const go = [
    mkRow('candidate', 389101, [L(1, 3, 2), L(1, 2, 1), L(0, 0, 0), L(1, 4, 2)]),
    mkRow('candidate', 389102, [L(1, 3, 2), L(1, 2, 1), L(1, 1, 1), L(0, 0, 0)]),
    mkRow('unlearned', 389101, [L(1, 0, 0), L(0, 0, 0), L(0, 0, 0), L(0, 0, 0)]),
    mkRow('unlearned', 389102, [L(1, 0, 0), L(0, 0, 0), L(0, 0, 0), L(0, 0, 0)]),
    mkRow('frozen', 389101, [L(1, 1, 1), L(0, 0, 0), L(1, 0, 0), L(0, 0, 0)]),
    mkRow('frozen', 389102, [L(1, 1, 1), L(0, 0, 0), L(1, 0, 0), L(0, 0, 0)]),
  ];
  const v = scoreMpop(go, 10);
  assert.equal(v.verdict, 'PHASE-A-GO');
  assert.ok(v.go);
  // Ties resolve without throwing; a missing arm fails closed.
  const tie = JSON.parse(JSON.stringify(go));
  assert.equal(scoreMpop(tie, 10).verdict, 'PHASE-A-GO');
  const nodmg = go.filter(r => r.tag !== 'candidate');
  assert.throws(() => scoreMpop(nodmg, 10), /no rows for candidate/);
  // Zero births -> INVALID-FEASIBLE regardless of lines.
  assert.equal(scoreMpop(go, 0).verdict, 'INVALID-FEASIBLE');
  // Candidate wiped -> NOGO (line with no retention).
  const flat = JSON.parse(JSON.stringify(go));
  for (const r of flat) if (r.tag === 'candidate') for (const l of r.perLine) { l.a = 0; l.d = 0; l.g = 0; }
  assert.equal(scoreMpop(flat, 10).verdict, 'PHASE-A-NOGO');
});

// HELD bar: the single knob that differs from V1.
test('V2 holds matingEnergyBar=50 (V1 default is 65)', () => {
  assert.equal(P2_MATING_ENERGY_BAR, 50);
  assert.notEqual(P2_MATING_ENERGY_BAR, 65);
});

// Wiring: zero-tick construction proves the bar reaches the World config
// (no advance() calls: zero worlds spent). Synthetic spent-range seeds.
test('bar-50 reaches world config on construction; default stays 65', () => {
  const hist = seed => ({seed, cueSeed: seed + 1, resourceSeeds: [seed + 2, seed + 3, seed + 4, seed + 5], probeSeeds: {A: seed + 6, B: seed + 7, transfer: seed + 8}});
  const on = new TasteExperiment({history: hist(389121), arm: 'candidate', reproduction: true, matingEnergyBar: P2_MATING_ENERGY_BAR});
  assert.equal(on.world.config.matingEnergyBar, 50);
  const off = new TasteExperiment({history: hist(389131), arm: 'candidate', reproduction: true});
  assert.equal(off.world.config.matingEnergyBar, 65);
});

// Null-default: reproduction flag defaults false (V1 engine contract, re-verified).
test('reproduction defaults OFF (null-default engine contract holds)', () => {
  const hist = {seed: 389141, cueSeed: 389142, resourceSeeds: [389143, 389144, 389145, 389146], probeSeeds: {A: 389147, B: 389148, transfer: 389149}};
  const r = new TasteExperiment({history: hist, arm: 'candidate'});
  assert.equal(r.reproduction, false);
});

// Bank guard: live bank 445001-445054 cannot be rebuilt (union-exclusion guard).
test('live bank 445001-445054 cannot be rebuilt (union-exclusion guard)', () => {
  const p = mPopDevV2Bank('evidence/m-pop-dev/fresh-02/protocol.json');
  assert.equal(p.experiment, 'm-pop-dev-v2');
  assert.equal(p.histories.length, 6);
  const flat = p.histories.flatMap(h => [h.seed, h.cueSeed, ...h.resourceSeeds, h.probeSeeds.A, h.probeSeeds.B, h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size, 54);
  assert.equal(Math.min(...flat), 445001);
  assert.equal(Math.max(...flat), 445054);
  for (const s of [381001, 388001, 396001, 407001, 414001, 444001, 445001]) assert.ok(p.excludedSeeds.includes(s), `missing exclusion ${s}`);
  const dir = mkdtempSync(join(tmpdir(), 'm-pop-v2-bank-guard-'));
  assert.throws(() => mPopDevV2Bank(join(dir, 'protocol.json')), /already used in prior evidence/);
});
