# RSI C17 AMENDMENT A1 — cue-dimensionality correction (FROZEN 2026-11-02)

Status: FROZEN. Governs `RSI_C17_PLAN_V1.md` wherever they differ; the
plan is otherwise unchanged. Zero worlds spent by this amendment.
Precedent: V1C Amendments A1/A2, C16 Amendment A1 (correct the freeze,
never implement against a known-false freeze).

## Finding (analytic, pre-implementation)

The plan §3b specifies "K=8 fixed random 96-dim vectors, norm-matched."
The substrate's cue input is 4-dimensional ±1, asserted at every
decision boundary (`signs()` in `taste-energy.mjs:10`: 4-dim, all-zero
or all-±1; asserted `tasteEnergyFeatures:76`, decision record `:470`,
replay `:494`). A 96-dim vector would fail the assertion on first
presentation. (96 is the ecology motor-representation dimension
(`taste-energy.mjs:48`), not the cue dimension — the plan's number
came from the wrong tensor.)

## Correction

- Bank = the FULL 16-pattern ±1 4-space (fixed, history-independent),
  K=16 (within the Q5-scoped K≤16 envelope).
- Norm-match holds EXACTLY: every pattern has ‖v‖=2, equal to every
  codebook cue norm. F6's 1e-9 tolerance is replaced by exact equality.
- Aliasing permitted and recorded: a selected surrogate may coincide
  with a live codebook vector of the same leg. Each reassignment row
  logs a `coincide` flag (target string ∈ leg codebook strings).
  Rationale: the claim is input-addressability; both arms alias under
  identical statistics (dose-match preserved), and exclusion would
  shrink the bank history-dependently, breaking fixed-K.
- Probe billing unchanged in form: `probeOps` = 16×32 = 512 decision
  ops per trigger + read/write ops, inline on the row. Worst-case
  trigger count per leg ≤ number of transfer-beneficial cues reaching
  2 intakes (≤4 by codebook construction); envelope math stays inside
  the 5.0e9 aggregate cap.
- Fixture F6 updated: bank is exactly the 16-pattern space, norm 2.0
  exact. All other fixtures unchanged.

## Effect on gates

None. G0–G3, retention, dose-match, and verdict mapping operate on
HB/BH correctness, which is representation-agnostic. The correction
changes only what the bank contains, not what a lift would mean.
