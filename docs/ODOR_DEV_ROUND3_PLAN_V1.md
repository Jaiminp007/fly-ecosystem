# ODOR DEV ROUND 3 PLAN V1 — FROZEN 2026-11-02 (guard-feature augmentation)

Status: FROZEN. Authorizes exactly one implementation matching this
plan verbatim, fixtures, triage (read-only round-1/2 reuse check),
and single execution on the SAME 8 reused histories. No fresh bank.
No second run, no tuning, no qual claim. Zero worlds spent by this
freeze. Promoted by round-2 NO-GO per the frozen mapping.

## 1. Design (single-variable isolation)

- Curriculum: ROUND-1 FIXED (A512–B512–C512–D256, 1792 ticks).
  Rehearsal stays out of round 3. R1-learned vs R3-learned-guard
  differ ONLY in steering input channels.
- New channels: append `[guard.viable?1:0, min(1,requiredEnergy/120)]`
  to the 8-dim steering features (8→10 dims, energy-scale-consistent,
  pre-registered). Viability boolean + requiredEnergy scalar already
  computed every decision by `overlapGuard`; this wires them into the
  learner instead of leaving them in the harness.
- Falsifier: guarded gap persists with the feature present →
  policy-expressiveness, not information (information hypothesis dead).

## 2. Instrument contract

- Generalize `STEERING_FEATURES` in `learning/own-steering.mjs` to a
  constructor dim (default 8 — legacy path bit-identical, all
  existing tests keep passing unmodified).
- Experiment passes dim 10 iff the round-3 flag is set; feature
  vector gains the 2 entries at the same position every decision.
- `values`/`update`/`validate`/`reset` bound by
  `weights[action].length`; billing stays 1 scalar op per op
  (decision 32→40 ops, update 49→59 — negligible at 27e9 scale,
  billed honestly).

## 3. Arms and probes (8 reused histories)

- Acquisition (NEW, one arm): learned-guard (continuous regime,
  fixed curriculum, 10-dim steering).
- Reused read-only: round-1 learned/native/guarded/frozen/reset +
  round-2 learned-interleaved rows (fixed-curriculum + rehearsal
  baselines, no re-spend).
- Probes (NEW, from the R3 D anchor): A/B earlier-current-reset +
  transfer current/reset/native/guarded/native-full (same seeds,
  same scorer code path as rounds 1–2).

## 4. Caps

Round-2 actuals 26.98e9 → frozen caps 40e9 ops, 3600s wall
(10-dim steering adds ~20 ops/decision).

## 5. Fixtures (all green before execution)

Encoding asserts (viable boolean, scalar bounds [0,1],
energy-scale); dim-parameterization (legacy 8-identical: same
weights/initialization/billing as today; 10-dim shapes);
anchor keys (round-1 table, unchanged); seed reuse (no new seeds
anywhere); scorer reuse (same gates code path).

## 6. Verdict (frozen)

- GO iff transfer gate (6/8 vs reset AND vs cheap native-full,
  nonnegative survivor diffs) AND A≥95% AND B≥95% AND
  guarded-comparison ≥6/8 positive with mean≥0 (BEAT guarded).
- PARTIAL if transfer+A+B pass but guarded bar fails.
- Else NO-GO (guard-feature closed).
- Descriptive dev verdicts in all cases. A GO triggers
  qual-freeze consideration (iv-b) — authorizes nothing further.
