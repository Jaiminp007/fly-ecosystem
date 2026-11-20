# ODOR DEV ROUND 6 RESULTS V1 — R6-NO-GO (B2 closed, no B3 on gating)

Date: 2026-11-02. Single authorized execution per PLAN V1 FROZEN.
Triage: bank copy hash `893c60a9…cd4487` == R1 bankSha256, 8 reused
histories, zero new seeds. Scalar ops 27.02e9 (cap 40e9 ✓).

## Outcome (frozen gates + three-branch falsifier)

- Transfer vs reset: mean −0.95, 2/8 positive, survivor diff −1 — FAIL.
- Transfer vs native-full: mean −1.05, 2/8, −1 — FAIL.
- Beat-guarded: mean −0.01, 3/8 (need 6/8 + mean≥0) — FAIL.
- Retention A: 22.3% (need ≥95%) — FAIL, inside the R5-band (33%).
  B: 67.6% (need ≥95%) — FAIL.
- Verdict: **R6-NO-GO**, via the falsifier's fail-A-too branch
  (A ≤ R5's 33% band): B2 closed WITHOUT promoting B3 on gating
  grounds. The gating family (B1+B2) is closed.

## Mechanism read (descriptive, not a new claim)

Per-regime experts did worse than the forced stop (A 22% vs B1's
33%, B 68% vs 93%). The likely mechanism: the stop branch, learning
its own policy from low-viability states, converges on behavior
that keeps the fly out of viable states (move-and-burn rather than
rest-and-wait), starving the go branch of the viable ticks it needs
— B1's sane forced-0 at least held still, while B2's stop learns an
actively bad policy and drags the go branch down with it through
the shared trajectory. Forced stop starves the update (B1); learned
stop poisons the trajectory (B2). The stop hypothesis ladder is now
exhausted at every level: input (R3 dead) → behavior (R4 dead) →
hard architecture (R5 starves) → soft architecture (R6 poisons).
What remains open is not another gate form but the go-quality side
(B3 needs a fresh rationale) and the learned-router candidate (B4,
unlicensed, needs its own case under C17-bar discipline).
