# KERNEL-CRITIC PLAN V1A (reduced-capacity embodiment) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
CORRECTIONS 2026-11-02 (implementation-driven, design-neutral, pre-code):
(a) Bank schema 8/history (tick-cue validateHistory requires seed/cueSeed/
shuffleSeed/nullSeed + 4 resourceSeeds): 48 seeds used (451001-451048) +
451049-451054 reserved-unused buffer (still union-excluded). Same range
superset; gates/caps/arms unchanged.
(b) G2b operationalized: same-val clause DROPPED (inapplicable - no transfer
in this design, so no same/flipped split exists); no-collapse = survival
>=50% AND pause-rate <= baseline + 0.2 (behavioral, pre-registered).
(c) Phantom G2d DROPPED (listed in V1 GO but never defined; no such check
existed - dropping changes nothing).
(d) G2c = fixture-level (construction-identity + sources-closure static
guard, green pre-bank, recorded in attempt.json); no live null arm
(the baseline module is untouched - nothing to null-gate live).
(e) Descriptive projection stats (not clamp counts - tanh adapter, no clamp).
License: `docs/KERNEL_CRITIC_RESULTS_V1.md` (V1 INFEASIBLE-BUDGET at
capacity 256; V1A ≤69 pre-computed, e.g., 64 fits at 14,378 ≤ 15,500).
New rationale (V1 demanded one for any V1A): fit-constrained embodiment —
maximal learning within the tick budget (capacity 64 = largest capacity
with mechanical fit证明; fuse re-verified below, not assumed).

## Amendment vs V1 (everything else V1-identical)

- Capacity: 256 → **64** (evict-oldest unchanged). Kernel program
  {rbf,gradient} unchanged. Projection unchanged (frozen matrix).
  Transplant rule unchanged (carry coefficients, clear records).
  Null-default unchanged (flag off ≡ current paths).
- Fuse re-verified (mechanical, this plan): kernelBill(64)+2000 =
  14,378 ≤ 15,500 (8.0e9/12/1792/24). Margin 1.08× — thin but EXACT
  (billed = formula by construction; tick part generously bounded).
  Fails → plan INVALID (same fail-closed).
- Module change: ONE constant (`KC_CAPACITY` 256→64) + fuse bound
  re-asserted in fixtures. No other code changes (the module already
  parameterizes capacity).

## Design (V1-verbatim otherwise)

Question, arms (baseline tick-AC + kernel-critic, matched histories,
12 mains), gates (G1/G0/G2a-PRIMARY superiority ≥+0.1/G2b/G2c),
verdicts (GO/NOGO/INCOMPLETE-BASELINE/INVALID), fixtures (12 incl.
budget fuse re-run at 64), caps (8.0e9/10800s), single attempt-01,
triage, repair-only-result-independent — all per
`docs/KERNEL_CRITIC_PLAN_V1.md` unless contradicted here.

## Bank (unchanged — V1 never built)

- Fresh-01 bank `evidence/kernel-critic-dev/fresh-01/`: 6 histories × 8 =
  48 seeds used (**451001-451048**) + 451049-451054 reserved-unused buffer
  (V1 spec was 9/history for the wrong harness; corrected per (a); range
  superset **451001-451054** union-excluded; never built - V1 died at
  fixtures; range verified clean again pre-freeze: zero hits).
  attempt-01 + fresh-01 verified free pre-freeze. Builder re-verifies at
  build; fixture-seeds file after build; post-bank refusal; union-excluded
  (spent through 450xxx + own 451001–451054 appended).

## What GO/NOGO mean (unchanged from V1)

- GO: embodied benefit DEMONSTRATED (first RSI-paragraph gap closed).
  Does NOT complete RSI.
- NOGO: even fit-constrained kernel-critic confers no benefit
  (mechanism fails at action selection, not just budget).
