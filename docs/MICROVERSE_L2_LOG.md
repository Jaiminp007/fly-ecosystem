# Microverse level 2: log

Goals: [MICROVERSE_L2_GOALS.md](MICROVERSE_L2_GOALS.md). Fable review was unavailable (no usage credits).

## P11b search (amendment A1, as frozen)

The climber started at R_P12 = memory 1e12, prune 0, z 3, every 8, cap 16. It ran 24 proposals on training seeds 101–116; runtime 473 s. Accepted steps:

| Proposal | Change | Δ flies | Positive seeds |
|---|---|---|---|
| 0 | tastePrune 0 → .5 | +2.15 | 12/16 |
| 1 | tasteEvery 8 → 4 | +.85 | 10/16 |
| 2 | tasteMemory 1e12 → 800 | +3.13 | 15/16 |

All 21 later proposals were rejected.

**R\* = memory 800, prune .5, z 3, every 4, cap 16.** Training population: 55.91. For reference, R_P12 is about 49.8 and the designer's R0 is 56.17.

Unprompted, the system's level-2 search found the two mechanisms the designer had added by hand in the G6 loop: forgetting and pruning.

## P11b gate (fresh seeds 80001–80048)
| Contrast | R* | Other | Δ | Positive seeds | p | Result |
|---|---|---|---|---|---|---|
| **Gate:** R* − R_P12 | 55.54 | 49.81 | **+5.73** | 48/48 | < .00001 | **PASS** (bar ≥ 1.0 flies, p < .01) |
| Reported: R* − R0 (designer) | 55.54 | 56.08 | −.54 | 21/48 | .89 | Not gated |

**P11b PASSES.** The system's own level-2 search improved its improvement rule, and the gain holds in the embodied world on fresh seeds. It is essentially as good as the designer's hand-tuning.

Labels:
- The climber is hand-written.
- The search grid is designer-chosen, and it contains the answers (forgetting and pruning knobs).
- The start point is the pre-tuning reviser (amendment A1, set after H1/H2 failed from R0).
- This is the microverse, not the old embodied P11 setup. **The original P11 stays FAILED.**

## P13b loop (practice seeds 101–116; paired solo, Δ flies)

| Attempt | Meta-rule | vs EVO-R | vs SHAM | vs FIXED |
|---|---|---|---|---|
| 1 (as frozen in A1) | Direction rules (weak features → prune more; distrust → forget faster; trust → forget slower) | +.13 (11/16) | −.51 (8/16) | +5.00 (14/16) |
| 2 | Drop the backfiring "trust → lengthen" step (long run 30, never back to ∞) | −.56 | +.44 | — |
| 3 | In-life trial-and-revert: try one grid step, keep it only if own running taste loss fell; SHAM = same trials, coin-flip keep | **+1.49 (10/16, p .018)** | +.26 (11/16) | +6.36 (15/16) |
| 4 | Trial evidence from window means instead of the running loss | +.85 | −.38 | — |

The attempt-3 tuner reached 56.12 flies, the level of the designer's R0. But its coin-flip sham reached 55.86. Trying steps plus selection does almost as well as the fly's own keep/revert evidence.

### Step back: is there anything for own-experience tuning to track? (headroom H3)

A measuring-only oracle shortens memory for 300 ticks after each rule switch.

| World | Contrast | Δ flies |
|---|---|---|
| Normal (rules every 3000 ticks) | oracle (50/800) − R* | +.03 |
| Normal | oracle (100/800) − R* | −.65 |
| Normal | oracle (50/400) − R* | −.57 |
| Fast variant (rules every 600 ticks) | oracle (50/800) − R* | +2.47 (13/16) |
| Fast variant | fixed memory 200 − R* | +1.81 (12/16) |

In the fast variant, the oracle's gain over the best fixed setting is about +.66 flies. Evolution can find the fixed setting by itself.

### Verdict: P13b BLOCKED (not shown), with a measured bound

**In the normal world** the best reviser setting is stable. Selection plus any variation (mutation or random trials) finds it, so a lineage's own experience adds almost nothing. **Even in a fast-switching variant**, perfect in-life tracking beats the best fixed setting by only about .66 flies, below the frozen 1.0 bar.

No final was run: practice never passed, and finals are not used to fish.

**What was shown on practice only, not gate-tested:** the lineage's own trial-and-revert tuner recovered the designer-level reviser from the pre-tuning start (+6.4 vs FIXED) and beat free evolution of the same genes (+1.49, p .018).

**The original P13 stays FAILED.**

## Summary

| Test | Result |
|---|---|
| **P11b** (level 2: the system's own search improves the reviser; embodied, fresh seeds) | **PASSED**: +5.73 flies, 48/48. It rediscovered forgetting and pruning and equals the designer's tuning |
| **P13b** (the lineage tunes its own reviser from its own experience, beating evolution and a sham) | **Blocked / not shown.** There is no headroom: the reviser optimum is stable, so evolution suffices |

## P13b escape-hatch redesign: volatility world (headroom H4; capped at two variants, decided in advance)

**Idea.** In-life tuning should beat evolution when the best learning setting changes within a lifetime, unpredictably. The variant alternates calm epochs (one rule for 4000 ticks) with volatile bursts (rule switches every 150 ticks, 2000 ticks long); see `microverse/volatility.mjs`. Flies cannot sense the regime.

Measuring-only regime oracle vs fixed settings (practice 101–116, paired solo, Δ flies vs R*):

| Variant | Best fixed memory | Best regime oracle | Oracle − best fixed |
|---|---|---|---|
| A: label noise .05 | 200: +1.26 (12/16) | calm ∞ / volatile 50: +2.34 (13/16) | **about +1.1** |
| B: label noise .15 | 200: +.07 | +.12 | **about 0** |

**Verdict: still blocked.** In variant A, a tuner would have to capture nearly the whole oracle gap (about 1.1) over the best fixed setting just to reach the 1.0 gate. Evolution can find that fixed setting on its own. The headroom bar of 1.5 is not met. Variant B has none. The variant search stops here, as decided in advance, rather than hunting for a world that passes.

**Diagnosis.** It is data-limited, the same limit that stopped in-life self-revision earlier. A fly's life holds too few tastings to measure which learning setting is better, and to profit from it, before evolution finds a good fixed setting anyway.

What could honestly change this: much longer, richer lives (more feedback per lifetime), or a reviser knob whose optimum swings strongly and unpredictably within a lifetime. Both would be new lines with their own headroom checks.

## P13b longer-lives line (headroom H5)

Variant A (volatility world) with maxAge 1200 → 6000: more feedback per life and fewer generations for evolution. Δ flies vs R*, practice seeds 101–116:

| Strategy | Δ flies |
|---|---|
| Best fixed: memory 200 | +1.40 (14/16) |
| Regime oracle | +1.79 (12/16) |
| **Oracle − best fixed** | **about +.39** |

**H5 FAILED** (bar ≥ 1.5).

### Final position on P13b

Every world tried bounds the possible gain of own-experience reviser tuning over a fixed setting (which evolution finds on its own) well below the 1.0 gate:

| World | Oracle − best fixed |
|---|---|
| Normal (H2/H3) | < 1 |
| Fast switching | about .66 |
| Volatility | about 1.1 |
| Volatility, noisy labels | about 0 |
| Volatility, long lives | about .39 |

**P13b is not achievable in the microverse as built**, and no amount of tuning the meta-rule can fix that: the cap comes from the world, not the tuner. Making it pass would require lowering the frozen bar or weakening the controls; neither was done.

## P13b: redesigning the flies (headroom H6; user: "make anything you want to the flies")

Opt-in individual senses (`noiseNiche` [.02, .3]): each fly draws its own taste-sensor noise at birth, and the noise is not inherited. The idea: when each fly must discover how much to trust its own feedback, in-life tuning of its learning rate should beat any fixed rate. Practice seeds 101–116:

| Strategy | Δ flies |
|---|---|
| Fixed step 2, vs step 4 | **+1.07**, the best fixed setting |
| Fixed step 1, vs step 4 | −.72 |
| Fixed step 8, vs step 4 | −2.55 |
| Best per-fly oracle (sets each fly's step from its true noise), vs the best fixed step | **−.33**; the other oracle mappings ran −.73 to −2.26 |

**H6 FAILED.** No headroom: even knowing each fly's true noise does not beat one fixed learning rate. The learner (gated logistic with replay, forgetting and pruning) is robust enough that a single setting is near-best for every fly.

### Conclusion after six designs (normal, fast, volatile, volatile + noisy, volatile + long lives, individual senses)

**P13b is not achievable in this microverse.** In every design, the best possible gain from a lineage or fly tuning its own reviser over a fixed setting that evolution finds on its own is below the 1.0 gate, or there is none. The robustness that makes the reviser good is also why there is nothing left for in-life level-2 tuning to do.

The gate and the controls were never changed.

## P13b: habitats (headroom H7)

Opt-in `habitats`: the left half of the world is calm (one staircase rule all run); the right half is volatile (its own rule switches every 150 ticks, with its own balanced odor table). Flies wander and are born where their parents are, so genes cannot know a fly's habitat. The flies split evenly between the halves (28 / 28 at tick 20,000, seed 101). Practice seeds 101–116, Δ flies vs R* (memory 800):

| Strategy | Δ flies |
|---|---|
| Fixed memory 50 | −2.48 |
| Fixed memory 200 | −1.84 |
| Fixed memory ∞ | −.92 |
| Habitat oracle (memory set by the fly's current habitat), best of three | −.47 |

**H7 FAILED.** No headroom: the single fixed R* beats every habitat-aware oracle. Switching memory as a fly crosses habitats disrupts its learning.

## P13b: COMPLETE. Final verdict: NOT ACHIEVABLE in the microverse

Seven designs were each checked with a measuring-only oracle, which sets the upper limit on what a lineage or fly tuning its own reviser could gain over a fixed setting that evolution finds on its own (gate: ≥ 1.0 flies):

| # | Design | Oracle gain over best fixed |
|---|---|---|
| 1 | Normal world (H2/H3) | < 1; switch-timed oracle +.03 |
| 2 | Fast rule switching | about +.66 |
| 3 | Volatile calm/burst regimes | about +1.1 (a tuner would need ≈100% of the oracle) |
| 4 | Volatile, noisy labels | about 0 |
| 5 | Volatile, long lives | about +.39 |
| 6 | Individual (non-heritable) sensor noise, learning-rate oracle | none (−.33) |
| 7 | Calm/volatile habitats | none (−.47) |

On practice seeds, the meta-tuners tried (direction rules, trial-and-revert, window evidence) never beat the matched sham by ≥ 1.0. No final was run.

**Reason.** The reviser that the P11b level-2 search found (forgetting, pruning, confidence gate, replay) is robust: one fixed setting is near-best across every situation tested. Evolution finds it, so in-life or in-lineage tuning of the reviser has nothing left to add.

The original P13 stays FAILED. **P13b is closed as not achievable.** The gate and the controls were never changed.

## P13b amendment A2: individual toxin sensitivity, tuned gene acceptAt (practice loop)

| Attempt | META rule | vs EVO-R | vs SHAM | vs FIXED |
|---|---|---|---|---|
| 1 | Trial-and-revert on acceptAt from own net feeding gain (100-tick windows) | +.05 | −.21 | +1.61 |
| 2 | Expected-value threshold from own measured toxin cost, c/(1+c); SHAM = same rule fed a random cost of the same distribution | +1.36 (11/16) | +.37 | +2.91 |
| 3 | Risk-averse EV threshold 2c/(1+2c) (maps real costs onto the oracle's .2/.75) | +.25 | −.62 | +1.80 |
| 4 | As 3, with the default threshold until the first toxic bite | −.13 | −1.01 | +1.43 |

**Diagnostic** (32 extra practice seeds 301–332, vs SHAM):

| Arm | Δ flies vs SHAM |
|---|---|
| ORACLE (knows sensitivity from birth) | +2.21 (27/32) |
| META (attempt 4) | +.02 (14/32) |
| FIXED | −1.70 (7/32) |

**Why A2 cannot pass.** The oracle's whole advantage over the sham (about 2.2 flies) comes from protecting flies **before they have any evidence**: sensitive newborns avoid their first toxic bites. A fly can learn its sensitivity only from such a bite. Once evidence exists, the exact threshold barely matters: META, holding near-oracle thresholds after its first bite, ties a sham that assigns thresholds at random.

The part of the gain that own experience can reach is about 0, against a gate of ≥ 1.0 over SHAM. **A2 is blocked.** No final was run (practice never passed).

## P13b: final status after eight designs

The gate (META ≥ EVO-R + 1.0, ≥ SHAM + 1.0, > FIXED, all p < .01) and the controls were never changed. Across eight designs, the gain available to own-experience tuning of the learning or decision system, beyond what evolution or a matched sham gets, is bounded below the gate:

| Design | Bound |
|---|---|
| Normal | < 1 |
| Fast switching | about .66 |
| Volatile | about 1.1, needing ~100% capture |
| Noisy volatile | about 0 |
| Long-lived volatile | about .39 |
| Individual sensor noise | none |
| Habitats | none |
| Individual toxin sensitivity | about 0 after evidence; the 2.2 oracle edge comes before any evidence exists |

**P13b has no pass.** Producing one would require weakening the sham or EVO-R, lowering the bar, or continuing to search worlds until one crosses. All three would make the result false.

## P13b: two skills with conflicting learning needs (headroom H9; the direction named as untried)

Opt-in `dualFood`: fruit kinds follow a stable rule all run (long memory should pay); leaf kinds follow a rule that switches every 150 ticks (short memory should pay). Both go through one shared taste learner with one memory gene. Patches are fruit-rich or leaf-rich (85/15), so each fly's diet depends on where it lives and is not predictable by genes. Leaf-diet fraction across flies: 10th percentile .02, median .39, 90th percentile .80. Practice seeds 101–116, Δ flies vs R* (memory 800):

| Strategy | Δ flies |
|---|---|
| Fixed memory 50 | −.52 |
| Fixed memory 200 | −.17 |
| Fixed memory ∞ | **+.85**, the best fixed setting |
| Diet oracle (memory set by the fly's own recent diet), best of three | −.35 |

**H9 FAILED.** No headroom: a single fixed memory beats every diet-aware oracle. The rapidly switching leaf rule cannot be learned at any memory setting, so tuning memory for it buys nothing.

**P13b status: nine designs, all bounded below the gate.** The gate and the controls are unchanged; no honest pass exists in any design tested.

## P13b parts: final (seeds 90001–90048, run once; commit e7d9619)

Mean flies: META 55.22, SHAM 55.24, EVO-R 54.68, FIXED 49.25. Raw data: `evidence/microverse/p13b-parts-final-90001-90048.json`.

| Part | Contrast | Δ flies | Seeds positive | p | Result |
|---|---|---|---|---|---|
| P13b-1: own tuning helps | META − FIXED | +5.96 | 46/48 | < .00001 | **PASSED** |
| P13b-2: trials beat blind mutation | META − EVO-R | +.53 | 29/48 | .13 | FAILED |
| P13b-3: own evidence beats a coin flip | META − SHAM | −.02 | 26/48 | .52 | FAILED |
| P13b-4 (= P13b) | margins ≥ 1.0 | — | — | — | FAILED |

**Reading.** A lineage that tunes its own reviser in life recovers most of the designer's tuning: +5.96 over no tuning, on fresh worlds. The gain comes from trying steps plus selection, not from the fly's evidence. A coin-flip keep does just as well (−.02), and on fresh seeds the edge over blind mutation (+1.49 on practice) shrank to +.53, which is not significant. This fits the headroom bounds: the fly's evidence has nothing left to add.

**P13b stays NOT SHOWN.** The original P13 stays FAILED.

## P13b-2b (new test; P13b-2 stays FAILED)

**Practice** (48 seeds: 101–116 and 301–332; EVO-R 53.92 flies). The variable is `metaK`, the number of revision checks between trials.

| metaK | META flies | META − EVO-R |
|---|---|---|
| 3 (attempt 1) | 55.65 | +1.73 (38/48) |
| 12 (attempt 2) | 55.36 | +1.44 |
| 2 (attempt 3) | 55.54 | +1.62 |
| 6 (the original rule, reference) | 55.82 | +1.90 |

Practice cannot separate the variants. The original rule scored best on practice, yet it gave only +.53 on fresh seeds in P13b-2. Under the frozen rule, the best attempt (metaK 3) went to the final.

**Final** (fresh seeds 91001–91048, run once). Mean flies: META′ 55.51, SHAM′ 55.25, EVO-R 54.26, FIXED 49.71.

| Contrast | Δ flies | Seeds positive | p | Result |
|---|---|---|---|---|
| META′ − EVO-R (gated) | +1.24 | 34/48 | .0024 | **P13b-2b PASSED** |
| META′ − SHAM′ (reported) | +.25 | 27/48 | .28 | not significant |
| META′ − FIXED (reported) | +5.80 | 47/48 | < .00001 | — |

**Reading and caveats.**
- In-life trials plus selection beat blind mutation of the same genes on fresh worlds.
- The fly's own keep/revert evidence still adds nothing significant over a coin flip. The edge comes from the trials, i.e. faster in-life variation, not from the evidence.
- Practice could not separate metaK 3 from the original metaK 6. The difference between P13b-2 (+.53) and P13b-2b (+1.24) may be seed-to-seed variance rather than the redesign.
- P13b-3 and P13b itself stay NOT SHOWN.

## P13b-3: headroom check for "own evidence beats a coin flip" (practice seeds 101–116 and 301–332)

The keep/revert decision is the only thing that separates META from its sham. A measuring-only oracle (`metaR: 'trialoracle'`) makes that decision perfectly: it keeps a trial step only if the step moves the gene toward R* (memory 800, prune .5). The arms are matched, with metaK 3 throughout.

| Arm | Mean flies | Δ vs SHAM | Seeds positive | p |
|---|---|---|---|---|
| SHAM (coin-flip keep) | 55.70 | — | — | — |
| META (own-loss keep) | 55.65 | −.05 | 23/48 | .56 |
| ORACLE (perfect keep) | 55.28 | −.42 | 21/48 | .83 |

**P13b-3 is blocked: there is no headroom.** Even perfect keep decisions do not beat a coin flip. In-life trials plus selection already hold the reviser genes near their best values, and which way a single trial is kept does not change fitness. No rule the fly could use, however good its evidence, can pass P13b-3 in this world. No P13b-3b final was run.

The default simulator is unchanged: the fingerprint still matches (7134d551…).

## P13b-3 parts: practice (48 seeds: 101–116 and 301–332)

New meta-rule, **shadow trial** (`metaR: 'shadow'`). The fly runs a copy of its taste learner with the trial setting on the same tastings as its real learner. It adopts the setting if the copy predicted those tastings better. SHAM runs identical shadows and adopts by coin flip (`'shadowsham'`). Because both learners see the same tastings, changes in the world cancel out of the comparison.

| Attempt | Rule | 3a META balanced accuracy (p vs .5) | 3b distance, SHAM − META (p) | Flies, META − SHAM (reported) |
|---|---|---|---|---|
| 0 (reference) | Running-loss trial, metaK 3 | .494 (2-seed smoke test) | — | — |
| 1 | Shadow, metaK 6 | .501 (p .26). The sham arm was misconfigured (it also ran META), so only META's figures are valid; the runner was fixed afterwards | — | — |
| 2 | Shadow, metaK 24 | .5077 (p .048) | +.20 (p .076) | +1.08 (p .019) |
| 3 | Shadow, metaK 48 | .500: trials outlast a life, none completed | 0 | 0; vs EVO-R −3.57 |
| 4 | Shadow, metaK 16 | **.5076 (p .0048)** | **+.37 (p .026)** | +.53 (p .20) |

Attempt 4 goes to the final, by the frozen rule (best 3a; both parts at p < .05).

**Caution.** The coin-flip sham's balanced accuracy was .5052 (p .024) in attempt 4, although its decisions are random. That is a chance excursion, about 2 standard errors. The effect being measured is small. The final also reports META − SHAM accuracy.

## P13b-3 parts: final (fresh seeds 92001–92048, run once; shadow trial, metaK 16; commit 7de7117)

Mean flies: META 54.58, SHAM 54.18, EVO-R 54.29, FIXED 49.95. Raw data: `evidence/microverse/p13b-3-parts-final-92001-92048.json`.

| Part | Measure | Value | p | Result |
|---|---|---|---|---|
| P13b-3a: own evidence picks the right direction | META balanced accuracy vs .5 | .5044 (27/48 above) | .019 | **FAILED** (bar p < .01) |
| P13b-3b: genes end closer to R* | SHAM − META distance | +.06 | .41 | **FAILED** |
| (reported) | META − SHAM accuracy | +.0036 (28/48) | .13 | — |
| (reported) | META − SHAM flies | +.40 | .13 | — |
| (reported) | META − EVO-R flies | +.29 | .28 | — |
| (reported) | META − FIXED flies | +4.63 (45/48) | < .00001 | — |

**Reading.** The shadow fly's keep decisions point the right way slightly more often than chance (.504), but the edge is too small to clear p < .01 on 48 fresh worlds. Practice (p .0048) overstated it again. No part of P13b-3 passed, and **P13b-3 and P13b stay NOT SHOWN**. The final will not be re-run.

## P13b A3 (in-life switching toxin sensitivity): practice

**Headroom H10** (16 practice seeds): tracking the current state is worth +10.71 flies over the best fixed setting. The same tracking fed a fake state is worth +.27.

**Attempt 1** (48 practice seeds; `metaA: 'track'`, lo .2 / hi .75, last-bite estimate). Mean flies: META 58.60, SHAM 48.45, EVO-R 49.31, FIXED 49.43.

| Contrast | Δ flies | Seeds positive |
|---|---|---|
| META − EVO-R | +9.29 | 48/48 |
| META − SHAM | +10.15 | 48/48 |
| META − FIXED | +9.18 | 48/48 |

Every gate margin is cleared, so attempt 1 goes to the one final.

## P13b A3: final (fresh seeds 93001–93048, run once; commit aff0f0a) — PASSED

Mean flies: META 58.62, SHAM 49.76, EVO-R 49.14, FIXED 49.50. Raw data: `evidence/microverse/p13b-a3-final-93001-93048.json`.

| Gate | Δ flies | Seeds positive | p (200k sign flips) | Bar | Result |
|---|---|---|---|---|---|
| META − EVO-R | +9.48 | 48/48 | < .00001 | ≥ 1.0, p < .01 | pass |
| META − SHAM | +8.86 | 48/48 | < .00001 | ≥ 1.0, p < .01 | pass |
| META − FIXED | +9.12 | 48/48 | < .00001 | > 0, p < .01 | pass |

**P13b PASSED under amendment A3.**

**What passed.** In a constructed world, a fly's body sensitivity changes during its life. The fly retunes its own food-acceptance threshold from the damage it feels. That beats plain evolution of the threshold, beats a matched sham that makes identical updates from a fake state, and beats a fixed threshold.

**Labels (they travel with the result):**
- The tuned gene is the decision-and-sampling threshold `acceptAt` (extended R, as in A2). It is **not** the feature-revision operator, so this is not recursive revision of the reviser.
- The meta-rule is hand-written. It reads the felt damage per bite (noise-free in this world) and maps it to two thresholds taken from the headroom oracle.
- The world was built, in its tenth design, so that this kind of in-life tuning matters. Earlier designs H2–H9 and A2 are all reported above as not passed.
- The original P13 stays FAILED. P13b under A1 stays not shown, including the parts P13b-3a and 3b.
