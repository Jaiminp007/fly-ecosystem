# Microverse attempt log

Workflow and thresholds: [MICROVERSE_GOALS.md](MICROVERSE_GOALS.md). Practice seeds: 101–108. Final-run seeds are listed here and never reused.

## Baseline (2026-11-17)

**Passed:** G6, which was spurious. **Failed:** G1–G5 and G7.

- **G1:** every world goes extinct between ticks 570 and 1015, with almost no births. Flies find food, but the total supply is too low, and toxic bites drain them before they reach the birth threshold.
- **G2–G5, G7:** the competition shares are all 0, because every world dies out.
- **G6:** this "passed" on skill read from worlds that were dying out. That is a test bug. Validity fix: G6 now also requires the world to be alive at 20,000 in ≥ 7/8 seeds. The fix was made before any tuning against G6.

## G1 loop
Each attempt is one design change, scored on G1 over practice seeds 101–108.

| Attempt | Change | G1 seeds ok | Notes |
|---|---|---|---|
| 1 | More food (8 patches, regrow .08) | 0/8 | Extinct by tick 600–1900 |
| 2 | Milder toxin (1.5 → .6) | 0/8 | Lasts longer, few births |
| 3 | Movement learning: advantage + trace, replacing TD | 0/8 | Instinct no longer eroded; one world reached tick 12,578 |
| 4 | Cheaper reproduction (breed at 60, cost 30) | 0/8 | No progress |
| 5 | Lower metabolism (.06, move .02) | 2/8 | Deaths cluster after rule switches |
| 6 | Bigger world (40×40, 12 patches) | 2/8 | No progress |
| 7 | Taste-exploration gene (5% taste when predicted bad) | 3/8 | |
| 8 | Expected-value accept threshold gene (.4) | 2/8 | No progress. Diagnosis: the good-kind base rate swings 4–12 of 16 per draw, causing famines |
| 9 | Balanced chemistry (8 good / 8 bad kinds per draw) | **7/8: pass** | |

**Full practice suite after attempt 9.** Passed: G1, G3, G5, G6. Failed: G2, G4, G7.

| Goal | Result |
|---|---|
| G2 | ORACLE share .63, 5/8 wins |
| G3 | FIXED vs RANDMOVE .88, 7/8 |
| G4 | FROZEN wins 8/8: lifetime learning is harmful |
| G5 | SELF vs FIXED 8/8, SELF vs SHAM 8/8 |
| G6 | Gain .20, late skill .53 |
| G7 | TASTEONLY beats SELF 7/8; MOVEONLY loses 8/8 |

Shares are mostly 0 or 1: competitions end in one strain's extinction.

Diagnostics bug: `debug-taste.mjs` imported `suite.mjs` and re-ran the suite. The settings were moved to `config.mjs`.

## G2 / G4 loop (shared cause: the default taste learner chases noise on rules it cannot represent)
Comparison tool `microverse/compare.mjs` (practice only). First, the decomposition: taste-learning-only vs FROZEN was 0/8, and move-learning-only vs FROZEN was 4/8, so taste learning is what hurts.

| Attempt | Change | Result |
|---|---|---|
| 1 | Confidence gate: trust the taste model only while its running log-loss beats a base-rate guess | FIXED vs FROZEN 5/8 (from 0/8) |
| 2 | Smell and food movement features weigh food by its expected value to the fly, p − (1−p)·toxin, counting only food it would eat. The old (2p−1) weighting made an unconfident fly smell nothing. | see below |

**Null controls.** Identical strains: FIXED vs FIXED gave 9/24 wins (share .38) with no extinctions. That is consistent with chance; there is no structural A/B bias. Outcomes are drift-heavy (mostly 0 or 1), so the 7/8 bars demand large real effects.

**Full practice suite after attempt 2.** Passed: G1–G5, all 8/8. Failed:
- **G6:** gain .181, late skill .566.
- **G7:** SELF vs TASTEONLY 5/8; vs MOVEONLY 8/8.

## G6 loop
Trace (SELF, seed 101): the taste feature set reaches its cap of 16 by tick 3,000 and stays full. Target terms held drop in later epochs (second pairs epoch: about 1.0–1.4, against 2.9 in the first).

| Attempt | Change | G6 |
|---|---|---|
| 1 | Forgetting: evidence decays (×(1−1/200) per tasting); when the set is full, drop the weakest added feature with \|w\| < 2. SHAM shares the same pruning, so the control stays matched. | **pass**: gain .368, late skill .757 |

**Full practice suite.** Passed: G1–G6. Failed: G7 (SELF vs TASTEONLY 3/8, share .47; vs MOVEONLY 8/8).

## G7 loop
Headroom check: a measuring-only planner strain (heads for the best food it senses, judged by its own taste) beat TASTEONLY 5/8 (share .72). So movement had modest room to improve.

| Attempt | Change | SELF vs TASTEONLY |
|---|---|---|
| 1 | Movement-revision evidence uses the decaying trace (delayed credit) | 3/8, .45: no progress |
| 2 | **Bug fix:** movement candidates were mostly duplicates (bias × x = x) or move-invariant. Candidates now must be products of real features with at least one move-dependent feature. | 5/8, .54 |
| 3 | Prune the weakest added movement feature when full (\|w\| < .5), as for taste | 6/8, .66 |

**Full practice suite after attempt 3: all of G1–G7 pass.**

## Final run 1

Fresh seeds 50001–50008, never used before. The code is frozen at the commit before this run.
**Result:**
- **G1–G6 CLOSED** on fresh seeds. G2–G5 were all 8/8; G6 gain .394, late skill .775.
- **G7 FAILED:** SELF vs TASTEONLY 3/8, share .33; vs MOVEONLY 8/8. The practice pass did not generalize.
- Seeds 50001–50008 are spent.

## G7 loop, continued (step back)

The planner headroom check gave only 5/8 against TASTEONLY, so the G7 bar (6/8) is out of reach in this world even for perfect planning. Next: make movement matter more in the world, then re-check headroom before any brain change. All goals will be re-tested on the next final run.
| Attempt | Change | SELF vs TASTEONLY |
|---|---|---|
| 4 (world) | Food relocates every 50 ticks with 8 patches. Planner headroom vs TASTEONLY rises to 8/8. | 2/8. Movement learning helps (6/8 vs instinct-only), but revision does not |
| 5 (brain) | Sense menu: optional senses (near smell r2, far smell r6, heads-toward-best-food, food-worth-staying) wired in by the fly's own evidence; TASTEONLY can reach them only by random mutation | 3/8 |
| diagnostic | brainCost 0 | 6/8. The feature cost (.002 per feature per tick, about +20% metabolism) ate the gain |
| 6 (world) | brainCost .0005 (still a real cost) | 7/8, .89 |

**Full practice suite in the new world (relocate 50, 8 patches, brainCost .0005): all of G1–G7 pass.**

## Final run 2

Fresh seeds 60001–60008. Every goal is re-tested, because the world changed.
**Final run 2 result** (seeds 60001–60008, commit `da995b0`):
- **G1–G6 pass** (all 8/8; G6 gain .362, late skill .711).
- **G7 FAILED:** SELF vs TASTEONLY 5/8, share .625. Seeds 60001–60008 are spent.

**G7 attempt 7** (movement evidence forgetting): 6/8 on practice, 10/16 on extra practice seeds 301–316. Dropped, not adopted.

**Bigger world** (56², 16 patches): G7 7/16. Confounded: each patch relocates half as often. Not adopted.

## Fable review (2026-11-17) and validity checks of G1–G6

**Fable on G7:** "not shown". Pooled, it is 18/32 wins, indistinguishable from the null (18/40). Repeating finals is not acceptable. Any stronger test must be a new, separately named test with a lower-drift measure → G7b.

Validity checks, all at commit `da995b0` on practice seeds:

| Check | Result |
|---|---|
| Order swaps (weaker strain listed first) | G2, G4, G5 (both) all A share 0, 0/8: no side bias |
| SELF vs EVO (mutation only, no evidence revision) | SELF 8/8: own evidence beats evolution alone |
| G3 caveat | Instinct-only (no movement learning) also beats RANDMOVE 8/8, so G3 shows that movement matters, mostly through instinct. Movement learning on its own: TASTEONLY-learning vs instinct-only 6/8 (one practice check) |
| FROZEN is a real eater | 42 tastings per 100 ticks, same as FIXED; good share .53 vs FIXED .67 |
| G6 is rediscovery, not hoarding | After each epoch, current-rule targets held 0.61–1.00; higher-order targets of earlier rules still held ≤ .18 |
| Arm parity | All arms pay the same per-feature cost. SHAM and SELF share forgetting and pruning; FIXED never adds features, so pruning does not apply to it |
| Label leaks | Smell and movement senses use only the fly's own taste prediction of the current code |

**Verdict: G1–G6 are CLOSED** (two fresh final runs).

## G7b result (seeds 70001–70048, commit `da995b0`)

| Contrast | SELF | Other | Difference | Positive seeds | p | Pass |
|---|---|---|---|---|---|---|
| SELF − TASTEONLY | 55.44 | 54.56 | +0.88 | 30/48 | 0.0119 | **no** (p ≥ .01) |
| SELF − MOVEONLY | 55.44 | 47.63 | +7.81 | 48/48 | < 0.00001 | yes |

**G7b FAILS** on SELF − TASTEONLY, by a narrow margin.
- The size bar (≥ 0.7 flies) was met. The p-value missed the frozen cutoff of .01.
- As frozen, this was one shot. **G7 is reported as not shown**, and the loop stops for this goal.
- The direction is consistently positive (practice p = .033, final p = .012), so movement self-revision plausibly adds a small benefit, about 1.6% more flies sustained. The registered tests do not establish it.

## Final status of the ladder

| Goal | Status |
|---|---|
| G1 The world is livable | **CLOSED** |
| G2 Taste matters | **CLOSED** |
| G3 Movement matters | **CLOSED** (mostly via instinct; learning's part is smaller) |
| G4 Learning in life helps | **CLOSED** |
| G5 Self-improvement helps (vs FIXED and SHAM; also beats EVO) | **CLOSED** |
| G6 They adapt | **CLOSED** (rediscovery, not hoarding) |
| G7 Both systems improve | **NOT SHOWN**: taste self-revision is the main source of gains. Movement self-revision's extra benefit is small and missed significance (G7 failed 3/8 and 5/8; G7b p = .012) |

## G7c practice (frozen in MICROVERSE_GOALS.md; 48 practice seeds 101–116 and 301–332 unless noted)

**Baseline** (current SELF): SELF − TASTEONLY = +.86 (31/48, p .033).

**Headroom** (16 seeds, measuring instruments only):
- The movement planner adds +5.24 over TASTEONLY (16/16).
- Handing TASTEONLY the "toward best food" and "stay" senses at weight 1 adds +2.92 (13/16).

**Diagnosis.** SELF adds "toward" with a tiny weight (about .2) and never adds "stay". Added senses start at weight 0 and learn slowly (step .05), so within a life they hardly change behaviour.

**Attempts.** The change is to the movement self-revision operator only: an added sense starts at an evidence-signed weight (`moveAddInit`; the random-revision sham gets a random sign).

| Attempt | moveAddInit | SELF − TASTEONLY |
|---|---|---|
| 1 | 1 | +2.39 (36/48, p < .00001) |
| 2 | 2 | **+2.47 (42/48, p < .00001)** |

**Adopted:** attempt 2, set for SELF, SHAM and MOVEONLY (every strain that revises movement). The default-world fingerprint changes accordingly (new hash bdaca307…; SELF and SHAM are part of it).

**Practice checks after adoption.**
- SELF − MOVEONLY = +9.46 (48/48).
- The universal suite on practice seeds 101–108 passes **G1–G7**: G5 8/8 and 8/8; G6 gain .42; G7 8/8 against both taste-only and move-only.

## G7c final (fresh seeds 94001–94096, run once; commit dd0ea19) — PASSED

| Contrast | SELF | Other | Difference | Positive seeds | p (200k sign flips) | Bar | Pass |
|---|---|---|---|---|---|---|---|
| SELF − TASTEONLY | 57.19 | 55.06 | **+2.14** | 66/96 | < .00001 | ≥ .7, p < .01 | **yes** |
| SELF − MOVEONLY | 57.19 | 47.80 | **+9.40** | 96/96 | < .00001 | ≥ .7, p < .01 | **yes** |

Raw data: `evidence/microverse/g7c-final-94001-94096-vs-*.json`.

**G7c PASSED. "Both systems improve" is shown.** Self-revising movement adds +2.14 flies on top of self-revising taste, and self-revising taste adds +9.40 on top of self-revising movement.

**Pooled with G7b, as frozen:** (48 × .88 + 96 × 2.14) / 144 = +1.72 flies. G7b ran the older movement reviser, so the pooled figure mixes two versions of the code.

**Notes:**
- G7 (3/8 and 5/8) and G7b (p .0119) stay recorded as failed. G7c is a new test with a redesigned movement reviser and a larger final.
- G1–G6 were closed on fresh seeds with the earlier code (da995b0). With the G7c code they pass the universal suite on practice seeds only.
