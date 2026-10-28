# RSI gen6 fresh eval: R=4 ACCEPTED (first fresh accept, 1/2 successive)

Config: Gen0 base + `replayPasses=4` (source `taste-energy.mjs:2023aa25…`).
Fresh bank `gen6-eval-20261102-v1` (`8f61cd1a…`), 8 histories × 6 arms = 48
worlds. One frozen attempt, no tuning on these seeds.

## Gate results (v2 plan, predeclared)

1. vs unlearned: +5.41, 8/8, surv +83 → PASS.
2. vs frozen-after-A: +2.34, 8/8 (min paired +0.43), surv +42 → PASS.
3. vs reset-at-B/C: +5.26, 8/8 ≥ −1.00 (min +3.84), surv +4 → PASS.
4. Skills: aSkill 1.54 (8/8), bSkill 1.60 (8/8), bAcq 1.03 (8/8), saved > 0
   → PASS.
5. Retention: aRetention +0.21 (exactly 4/8 — at the boundary), bRetention
   +0.29 (6/8), probe surv +3/+2 → PASS.
6. Transfer: transferReset 0.0 exactly, 8/8 ≥ −0.50, surv 0 → PASS (tie).
7. Integrity: runner asserts held (run completed, results written).

**ACCEPT. Successive counter 1/2.** Mixture tracking (4 replay passes per
trigger) lifts the joint final vector over the gate where six anchoring /
routing families failed: replay pulls weights toward the historical mixture
faster than live recency overwrites it, and the extra passes are honestly
billed. Boundary flag for the next generation: aRetention exactly 4/8 —
Gen1 search must strengthen the A-leg margin, not just repeat R=4.

Productivity gen6: A-procedure best 6.484 (R=4, claimant) > B-procedure best
5.921 (R=5, dual-true but below Gen0) → directed search wins the round.

Evidence: `evidence/rsi-taste-v1/gen6-eval-20261102-v1/r4-fresh/`.
Cumulative RSI: prior 1664 + 80 (v9 search) + 48 (eval) = **1792 worlds**.
