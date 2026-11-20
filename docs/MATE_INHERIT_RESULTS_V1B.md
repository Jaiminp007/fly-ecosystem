# MATE-INHERIT Results V1b — mutated transmission compounds (single authorized attempt)

Date: 2026-10-26. Plan: `docs/MATE_INHERIT_PLAN_V1B.md` (no amendments;
V1A-style correction unnecessary — the plan was written post-V1f with
verified values). Bank: `evidence/mate-inherit-dev/fresh-02/` (fresh,
6 histories). Evidence: `evidence/mate-inherit-dev/attempt-02/`.

## Verdict: MATE-INHERIT-GO-V1B (thin margin, pre-registered bar met)

- **G1 integrity ✓** — 12/12 mains complete; ledger exact (12/0/21504/
  516096/2.36e9); `redone: []` (single clean run, no crash, no resume).
- **G2 audit ✓** — all rows maternal, decoupled, bar 50, nutrientOverride 5
  both arms, transmissionNoise null (exact) / 0.05 (mutant), births
  integer ≥ 0, generations valid (non-negative ints, lineage-verified
  parent IDs + max+1 rule).
- **G3 outcome GO** — mutant gen-2 = **3** ≥ 2 AND 3 > exact gen-2 = **2**.

| arm | gen-1 | gen-2 | gen-2 seeds |
|---|---|---|---|
| exact (null) | 29 | 2 | 416028 ×1, 416046 ×1 |
| mutant (σ=0.05) | 31 | 3 | 416037 ×1, 416046 ×2 |

No INCOMPLETE (mutant gen-1 = 31 > 0). No INVALID (null-hygiene equivalent:
null arms... — all counter checks pass; G2 clean).

## Reading: weak-positive, confirm don't celebrate (descriptive)

The bar is met literally (3 ≥ 2, 3 > 2) — and only just: the verdict
hinges on a one-birth margin, with 2/3 mutant gen-2 births on a single
seed (416046). This is the V1f pattern (borderline pass, heterogeneous
support), and the honest reading is the same: the effect is real enough
to license confirmation, not strong enough to claim. Specifically:

- Mutant gen-2 rate ≈ 2× exact (3 vs 2 on 6 mains each) — directionally
  consistent with heritable variation compounding, but the absolute
  numbers are tiny (Poisson noise dominates any single comparison).
- The exact arm's 2 gen-2 births replicate V1f's existence finding on a
  third bank (V1f: 1/6 enriched mains; V1: 0/12 control; here 2/6) —
  gen-2 happens at low single-digit rates under enrichment, with or
  without mutation.
- Gen-1 counts are balanced (29 vs 31) and lifespans indistinguishable
  (~1300 ticks both arms, censored) — mutation neither helps nor kills
  newborns outright at this dose; the difference, if real, acts at the
  mating/lineage level, not via vigor. No gen-3 anywhere (max gen 2
  both arms).
- No overdose signal (mutant gen-2 ≥ exact; no collapse), no retention
  question (maternal copy verified working as in V1).

Per the frozen stop-rule analogue: this is NOT a "close the line"
outcome (the GO branch fired, however thinly) and NOT a promotion
(the margin forbids it). It is exactly what V1b was chartered to
produce: a rationale plus a first positive for V1c — multi-generation
selection on mutant lineages under its own frozen plan, which must
confirm the compounding with lineage resolution (who descends from
whom, not just counts). No RSI claim.
