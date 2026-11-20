# TRAIN-SCALE PLAN V1 — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: dose-synthesis finding (lossy transfer 0.95 EXCEEDS train 0.81–0.91
on every bank — negative tax) + RSI-SELF ledger (revisions without advantage;
a working revision OPERATION is prerequisite). New rationale: PERTURBATION
vs TIME (optimization dynamics, not transfer).

## Question

Does the 0.95 plateau come from TIME (train underfits at 1792 ticks) or
from PERTURBATION (lossy transplant escapes a local optimum)? Matched
3584-tick comparison: long training vs train + lossy-restart.

## Design (single perturbation, matched budgets)

- 6 fresh histories × 3 tags = 18 mains, 0 probes, no transfer pairs:
  - `short` (1792 ticks, reference; replicates ~0.82);
  - `long` (3584 ticks continuous, same history);
  - `restart` (1792 train + lossy transplant α=0.25 onto fresh learners +
    1792 continue on the SAME history; total 3584 ticks matched).
- Transplant: exact-copied V1m machinery (scaleSnapshot α=0.25 +
  copyWeights + checkScaledIntegrity, imported frozen — no duplication).
  ProbeSeeds present-but-unused in bank schema (no transfer; documented).
- Metric: pooled train correctness (contact-weighted own-label, T1-style
  `correctnessOf`; no flip-split — no transfer) + survival per tag.

## Gates (conjunctive, fail-closed)

- G1 join ≥0.99 + integrity. G0 short ≥0.5 (replication, 10th).
- **G2a-PRIMARY**: restart − long ≥ +0.1 (yardstick; matched 3584 ticks).
- G2b no-collapse: long survival ≥30% AND restart survival ≥30% (harsh
  world; below is INCOMPLETE-HARSH, not NOGO).
- GO-V1 ⟺ G1 ∧ G0 ∧ G2a ∧ G2b. Time effect (long − short) DESCRIPTIVE
  either way (answers underfit-vs-structural regardless of verdict).

## Fixtures (12, gate before bank)

Module (4): transplant imports (exact + scaled); α=0.25 constant guard;
billing (scale ops); sources-closure. Instrument (8): collector valence;
scorer GO/NOGO/INCOMPLETE-HARSH/INVALID branches; bank-build tmpdir
(9-schema + union-exclusion); mains-caps check (6×3=18); structural guard;
tick-count guard (long/restart = 2× short, fail-closed).

## Bank, caps, attempt discipline

- Fresh-17 bank `evidence/train-scale-dev/fresh-17/`, V1k-family 9-schema,
  6 histories × 9, range **455001–455054**. VERIFIED clean 2026-11-02.
  attempt-01 + fresh-17 verified free pre-freeze. Builder re-verifies;
  fixture-seeds after build; post-bank refusal; union-excluded
  (spent through 454xxx + own).
- Caps: 18 mains / 0 probes / 53760 worldTicks / 1290240 founderSlots /
  6.0e9 scalar ops (1.2× linear est 4.8e9) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected.

## What GO/NOGO mean

- GO: perturbation beats time at matched budget (revision operation with
  advantage — prerequisite for RSI-SELF, not RSI itself).
- NOGO (long reaches plateau): time suffices (train underfits; transfer
  just gets there faster). NOGO (both stuck): structural ceiling
  (local optimum even perturbation can't escape / wrong perturbation).
  All three outcomes distinguish mechanisms — the line cannot be void
  (except INCOMPLETE-HARSH/INVALID).
