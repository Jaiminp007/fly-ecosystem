# KERNEL-CRITIC RESULTS V1: INFEASIBLE-BUDGET (fail-closed at fixtures, zero worlds)

Date: 2026-11-02. Plan: `docs/KERNEL_CRITIC_PLAN_V1.md` (FROZEN).
Implement: `learning/tick-kernel-critic.mjs` (actor-exact + RBF-gradient
critic + frozen projection + carry/records-clear transplant) +
`tests/tick-kernel-critic.test.mjs` 5/5 green (projection/billing/
construction/restore/reset + BUDGET FUSE). No bank built. No attempt run.
No worlds spent.

## Verdict: INFEASIBLE-BUDGET (plan INVALID per its own fuse)

- Fuse (frozen): kernelBill(256) + tick allowance vs 8.0e9/12/1792/24.
  Actual: 49,242 + 2,000 = 51,242 vs 15,500 budget — **3.3× over**.
- Main level: ≈2.0e9 vs 1e9 standard cap (2× over). Aggregate:
  ≈24e9 vs 8.0e9 plan cap (3× over). Infeasible at every level.
- Fires mechanically (fuse test asserts the outcome; suite green):
  the frozen capacity (256, accepted value) cannot fit the tick budget
  with every-tick updates. Fail-closed BEFORE any bank (as designed).

## What stands (mechanism intact, budget doesn't fit)

- Module built and verified (5/5): frozen deterministic projection
  (20×33, |v|<1 by tanh-dot/8 adapter); exact billing decomposition
  (hand-verified at 0/1/256 records); construction (accepted program at
  accepted capacity); restore/reset round-trips.
- The DESIGN is sound (actor-exact + kernel critic + carry/clear);
  the BUDGET doesn't fit (sustained capacity-256 kernel arithmetic
  exceeds per-tick allowance from the first full-records tick onward).

## Licenses (INVALID grants)

(a) V1A reduced-capacity embodiment (≤69 records, e.g., 64:
14,378 ≤ 15,500 ✓ fits) — pre-computed, needs its own
frozen plan (capacity is a frozen design parameter; new rationale:
fit-constrained embodiment; dose-analogy to V1m's α).
(b) No bank, no attempt, no spent range (451001–451054 REMAINS CLEAN —
never built, never touched; available for V1A or other lines).
(c) The 451xxx range is NOT spent by this line (nothing built).
Line CLOSED (V1 invalid; V1A specified-not-frozen).
Cumulative program spend: unchanged (8070 + 0).
No RSI claim (infeasibility is a negative, not an improvement).
