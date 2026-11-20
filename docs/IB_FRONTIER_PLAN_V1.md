# IB-FRONTIER Plan V1 — cue-alphabet compression probe (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — zero new worlds under this plan, now and
forever (read-only measurement on frozen artifacts). Implementation computes the
specified quantities deterministically; re-running on the same artifacts must give
bit-identical results.

## Rationale (licensed follow-up — R68 specified this probe, not executed)

MAXENT-V1 measured I(action; valence) = 0.5753 bits (candidate) on frozen TURN-GATE
V1 rows. Unanswered: how much cue granularity does the behavior actually USE? If the
policy keys only on valence, I(action; cue-identity) == I(action; valence) and the
effective cue alphabet is 2. If it keys on cue specifics (the QD-map heterogeneity
suggests HB cues vary), identity carries more. The IB lens: trace retained action
information vs alphabet size k (rate curve) and report the k retaining 95%/99% —
the effective alphabet size of the learned policy.

## Data (frozen, read-only)

Same 12 rows as MAXENT-V1 (`evidence/turn-gated-dev/attempt-01/rows/*.json`).
No other artifacts. No engine code touched.

## Computation (exact, pure functions in `scripts/ib-frontier.mjs`)

Per arm (candidate primary; unlearned consistency):
1. I(action; cue-identity): 2×N table over the N distinct cue-bit keys present
   (N=15 audited), Laplace α=1 per cell (same prior as MAXENT-V1).
2. Gap = I(action;identity) − I(action;valence), with I(action;valence) REUSED
   from MAXENT-V1's frozen computation (recompute via same function for
   self-containment; assert equality with 0.5753/0.0000 to 1e-9 — guards schema drift).
   Descriptive reading (pre-registered, NOT a gate): gap < 0.05 bits → valence-sufficient;
   gap ≥ 0.05 → cue-specific behavior present.
3. Rate curve: greedy agglomerative clustering of cues by empirical turn rate
   (merge the adjacent pair minimizing combined-rate distance, sizes weighted);
   k = N..1; record I(action;cluster_k) at each k (same Laplace). Report smallest k
   with I ≥ 95% and ≥ 99% of I(action;identity) — the effective alphabet sizes.
   Curve property (asserted in fixtures AND on frozen rows): I non-decreasing in k.
4. Unlearned consistency (pre-registered): I(action;identity) ≈ 0 (< 0.05 bits) —
   else halt, schema misunderstood.

## Outputs (measurement, NO gates, NO verdict)

- `docs/IB_FRONTIER_RESULTS_V1.md`: identity bits, gap, rate curve table, effective
  k95/k99, unlearned check, interpretation within the pre-registered bands.
- Fixtures (`tests/ib-frontier.test.mjs`, synthetic only): valence-sufficient table
  → gap 0; cue-specific table → gap > 0; clustering monotonicity; k95/k99 logic;
  frozen-rows determinism + unlearned ≈ 0.
- No claim beyond the numbers. No RSI implication. No follow-up licensed by this
  document.
