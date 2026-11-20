# P14 results: does taste skill change survival? (FAILED on S2; skill effect itself is large)

Plan: [RSI_P14_PLAN.md](RSI_P14_PLAN.md), frozen in `3c31ecd` before the run. Runner: `scripts/p14-survival.mjs`. A resumable per-cell cache was added in `ce5102d` after two runs were interrupted by server restarts; each cell is deterministic, so the cache changes no result. Output: `evidence/p14/run.json` (kept locally). The completed run took 2364 s.

Survivors of 24 founders, mean over 12 rules × 16 histories:

| nutrientScale | NONE (no skill) | S0 (lifetime learning) | TRUE (true terms from birth) | S1: TRUE − NONE | S2: NONE ≥ 2 |
|---|---|---|---|---|---|
| 0.75 | 1.42 | 5.60 | 10.37 | +8.95, 12/12, p = 0.00024 | **no** |
| 1 | 1.39 | 7.05 | 12.65 | +11.26, 12/12, p = 0.00024 | **no** |
| 1.5 | 1.52 | 9.32 | 15.11 | +13.59, 12/12, p = 0.00024 | **no** |

**The milestone fails.** S1 passes at every scale, by 3–4× the bar. S2 fails at every scale: flies with no taste skill nearly die out (about 1.4–1.5 of 24 survive) at all three food values. The plan required one scale to pass both gates.

Reported, not gated:

- **Lifetime learning (S0) − NONE:** survivors +4.19, +5.66 and +7.80 at the three scales. All 12/12 rules, p = 0.00024 at each scale.
- **TRUE − S0:** +4.8 to +5.8 survivors. All 12/12 rules, p = 0.00024.
- **Energy per founder:** NONE −62 to −61, S0 −60 to −50, TRUE −54 to −38.

## What this means

- **What is shown.** In the many-odor world, taste skill changes survival strongly, both learned skill and innate structure. This contradicts the earlier pattern of "skill moves energy but not survival", which came from the default 12-odor world.
- **What is not shown.** The pre-registered milestone required a world where the unskilled flies are not simply wiped out. At these food values they are, so the survival gap partly reflects a world that kills any fly without taste skill. Raising food value by 2× (from 0.75 to 1.5) did not move NONE survivors at all, while the skilled arms gained.

Labels: opt-in many-odor world; constructed tasks; TRUE is an oracle program, not something the flies found.

## Follow-up check: NONE flies barely eat (Fable review, 2026-11-16)

The check ran on exploration seeds 98301–98302 with 8 histories each, so it is not a bank run.

| Rule | Arm | Tastings per founder | Survivors |
|---|---|---|---|
| pairs | NONE | 4.0 | 0.5 |
| pairs | S0 | 89.0 | 5.8 |
| pairs | TRUE | 95.0 | 13.6 |
| staircase | NONE | 3.0 | 0.8 |
| staircase | S0 | 62.8 | 1.1 |
| staircase | TRUE | 67.7 | 9.6 |

A bias-only fly makes threshold decisions. After a few bad tastes its single weight drops below the accept threshold, and it refuses all food for the rest of its life. **NONE was a non-eater, not an unskilled eater.** This explains why food value did not move NONE survivors.

The S2 gate therefore tested the wrong arm. Fable's review had named the default learner (S0) as the baseline, but the plan gated on NONE, and the plan was not reviewed before the run.

P14 stays FAILED as registered. The comparison the milestone was about, TRUE vs S0, is tested separately in P14b on fresh rules.
