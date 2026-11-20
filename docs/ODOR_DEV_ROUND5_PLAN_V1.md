# ODOR DEV ROUND 5 PLAN V1 — FROZEN 2026-11-02 (gated-pair steering)

Status: FROZEN. Authorizes exactly one implementation matching this
plan verbatim, fixtures, triage (read-only round-1/3 reuse check),
and single execution on the SAME 8 reused histories. No fresh bank.
No second run, no tuning, no qual claim. Zero worlds spent by this
freeze. Lead: B1 gated pair (NONLINEAR_HEAD_DESIGN_V1).

## 1. Design (single-variable vs R3-learned-guard)

- Curriculum: ROUND-1 FIXED (A512–B512–C512–D256, 1792 ticks).
  Rehearsal stays out.
- Steering: two 2×10 linear heads (go/stop branches), hard switch
  on the computed `guard.viable`: viable → argmax(go·phi); else
  forced stop with NO learning update on either branch (stop is a
  gate, not a policy). Go branch learns from environmental reward
  with the live delta rule. Features: the R3 10-dim set
  (guard channels included).
- Single variable vs R3: identical inputs, identical go-branch
  learning; the ONLY difference is forced-vs-learned stop.

## 2. Instrument contract

- New gated-head steering module (branch weights in
  `state.steering.weights`, fork/validate/freeze/reset generalized
  by shape — same pattern as the R3 dim work).
- Experiment flag selecting the B1 head (null-default: all legacy
  paths bit-identical).
- Billing: 1 scalar op per op, honestly counted; worst-case values
  2·(2·2·10) + update on the active branch only.

## 3. Arms and probes (8 reused histories)

- Acquisition (NEW, one arm): B1-gated (continuous regime, fixed
  curriculum).
- Reused read-only: R1-learned, R3-learned-guard, guarded,
  frozen, reset rows (comparators for clean separation).
- Probes: A/B earlier-current-reset + transfer 5 modes from the B1
  D anchor (same seeds, same scorer code path as rounds 1–4).

## 4. Caps

R3/R4 actuals (~27e9) → frozen caps 40e9 ops, 3600s wall.

## 5. Fixtures (all green before execution)

Gate switches correctly (viable→go, !viable→stop-0);
stop-branch frozen (no updates when stopped); go-branch learns
(live delta moves predictions on viable ticks); billing identity
(billed == executed); anchor keys (round-1 table, unchanged);
no-new-seeds; scorer reuse (same gates code path).

## 6. Verdict (frozen)

- GO iff transfer gate (6/8 vs reset AND vs cheap native-full,
  nonnegative survivor diffs) AND A≥95% AND B≥95% AND
  beat-guarded (≥6/8 positive, mean≥0 — B1 internalizes the guard,
  so beating it is the bar).
- PARTIAL iff transfer+A+B pass but guarded fails.
- Else NO-GO (B1 closed → B2 threshold units scoped next;
  B3 last resort).
- Descriptive dev verdicts in all cases. A GO triggers
  qual-freeze consideration (iv-b) — authorizes nothing further.
