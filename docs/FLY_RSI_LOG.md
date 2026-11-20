# Bounded fly-RSI log

Goals and gates: [FLY_RSI_GOALS.md](FLY_RSI_GOALS.md).

## Designs ruled out before L2 (headroom, practice seeds 101–116, Δ flies vs SELF)

| World | Best oracle | Fake-state oracle | Verdict |
|---|---|---|---|
| Sense drift, sign flips (`senseDrift`, switch .004, every 40); memory / prune / z oracles | +.77 | −.38 | no headroom |
| Sense drift, channel permutation (switch .002, every 150) | −.54 | — | no headroom |
| Brain cost switching, ×1 / ×12, switch .004 | +3.69 | +1.78 | headroom, but a narrow gap |
| Brain cost switching, ×1 / ×20, switch .002 | +2.98 | +.44 | — |
| **Brain cost switching, ×1 / ×12, switch .001** | **+3.05** | **−.83** | chosen and frozen |

(A first sense-drift run had a perception bug: the odor codes are ±1 arrays, not integers. It was caught by the fingerprint check; its numbers are discarded.)

## L2 and L3 practice (48 seeds: 101–116 and 301–332)

Attempt 1, means: META 44.73, SHAM 41.18, EVO-R 41.61, FIXED 41.09, NOREV 32.74.

| Attempt | META rule | META − FIXED | L1 gain ratio (L3 bar 1.5) |
|---|---|---|---|
| 1 | Lean package while costly | **+3.64** (vs EVO-R +3.12, vs SHAM +3.55; all ≥ 41/48) | 1.44 |
| 2 | Lean taste only | +1.49 | 1.18 |
| 3 | Lean movement only | +1.50 | 1.18 |
| 4 | Attempt 1 plus a 300-tick fast-regrowth phase | +3.17 | 1.38 |
| 5 | Lean, but keep strong features (prune 2 / 1) | +3.26 | 1.39 |

**L2.** Attempt 1 clears every margin, so it goes to the one final.

**L3** fails on practice in all 5 attempts (best 1.44 < 1.5), so **L3 is not shown** and gets no final. The final leaves out the NOREV arm, so no fresh-seed L3 number is produced.

## L2 final (fresh seeds 95001–95048, run once; commit a8e5e6b) — PASSED

Mean flies: META 44.83, SHAM 41.96, EVO-R 41.19, FIXED 41.67. Raw data: `evidence/microverse/fly-rsi-l2-final-95001-95048.json`.

| Gate | Δ flies | Seeds positive | p (200k sign flips) | Bar | Result |
|---|---|---|---|---|---|
| META − EVO-R | +3.64 | 44/48 | < .00001 | ≥ 1.0, p < .01 | pass |
| META − SHAM | +2.87 | 39/48 | < .00001 | ≥ 1.0, p < .01 | pass |
| META − FIXED | +3.16 | 43/48 | < .00001 | > 0, p < .01 | pass |

**L2 PASSED: the flies improve their own improver.** In life, each fly retunes the genes that control its own level-1 self-revision (feature caps, pruning, and the evidence threshold, for taste and for movement) from the brain cost it feels. That beats evolution of the same genes, a matched sham and no tuning, on fresh worlds.

**Labels:**
- The meta-rule is hand-written, and the two gene packages come from the headroom oracle.
- The world was built so that the best reviser setting changes during life, and the felt signal is noise-free.

## Bounded fly-RSI: status

| Level | Status |
|---|---|
| L0: learning helps | **shown** (G4) |
| L1: flies improve their own learning program | **shown** (G5, G7c) |
| L2: flies improve their own improver | **shown** (this final) |
| L3: compounding (L1 pays ≥ 1.5× more with L2) | **not shown**: practice best 1.44 in 5 attempts; no final |

## L3b practice (world `brainSwitch` mul [1, hi], switch .001; 48 practice seeds)

| Attempt | Change | META − FIXED | vs EVO-R | vs SHAM | L1 ratio (bar 1.5) |
|---|---|---|---|---|---|
| 1 | hi 20 | +3.78 | +3.09 | +4.39 | 1.372 |
| 2 | hi 50 | +.63 | +.60 | +6.00 | 1.026 |
| 3 | hi 30 | +1.58 | +2.59 | +4.33 | 1.106 |
| 4 | hi 20; lean package also revises every step (fast shedding); same packages for EVO-R | +4.02 | +3.60 | +4.85 | 1.395 |
| 5 | as 4, plus 300 ticks of frequent revision after costs fall (fast regrowth) | +4.52 | +4.09 | +5.12 | 1.444 |

**L3b FAILED on practice** (5 attempts, best 1.444 < 1.5); no final was run.

A costlier world raises level-1 revision's value for every arm, so it lowers the ratio. Partly this is because NOREV keeps accumulating mutated movement features it can never prune. Changes to the rule form gave steady progress (1.372 → 1.395 → 1.444).

## L3c practice (world mul [1, 20], switch .001; 48 practice seeds)

| Attempt | Rule | META − FIXED | vs EVO-R | vs SHAM | L1 ratio | L3 d > 0 | L3 p |
|---|---|---|---|---|---|---|---|
| 1 | Dormant features (park / unpark added features) | +4.61 | +3.92 | +7.05 | 1.453 | 20/48 | .59 |
| 2 | + park weak single-odor features (\|w\| < 1) | +7.59 | +6.90 | +14.48 | 1.746 | 30/48 | .041 |
| 3 | + park singles with \|w\| < 2 | +7.91 | +7.22 | +13.95 | **1.778** | 34/48 | **.017** |

**L3c STOPPED after attempt 3; no final was run.** Seeds 97001–97048 stay untouched. The two remaining attempt slots were not used, by decision. They would only park more *founder* features, which a fly can switch off without L1 discovering anything. That would make any pass less, not more, about compounding. This decision was frozen before looking at the META-OFF diagnostic.

**External review** (GPT-6.2 Astra, advice only: [thread](t3-thread://v2/bad08e28-8c88-40fe-af57-ced9fd1ccf77/mcp:8e44d7f6-3728-4075-bccc-d22ecd4da085)). It found two things:
- **Heavy tails.** In attempt 2, a single seed (113, where FIXED went extinct; d = +59.6) contributes +1.24 of the +2.51 mean d.
- **A confound.** Parking founder singles saves energy even without L1. A META-OFF arm (the same controller, with structural revision disabled) measures that direct benefit.

**Diagnostic rule (frozen before running):** META-OFF on practice is descriptive only. It cannot select an attempt, change a threshold, or decide publication.

**Scorer note.** The runner's Monte Carlo sign-flip uses `r * 1103515245` in floating point, which loses integer precision, and it reports `p: 0` instead of (exceed + 1) / (draws + 1). Old results are not rescored. New tests use a corrected, validated scorer.

## META-OFF diagnostic (L3c attempt 3, 48 practice seeds; descriptive only, per the frozen rule)

| Quantity | Value |
|---|---|
| META-OFF mean flies | 21.75 (NOREV 26.90) |
| Direct effect of the controller without L1 (META-OFF − NOREV) | **−5.15** (positive on 16/48) |
| Old L3 d | +2.83 (34/48) |
| Factorial amplification, d − (META-OFF − NOREV) | **+7.97** (positive on 32/48) |

**Reading.** The controller is not a free energy saving: without L1 it *hurts*.
- **Likely cause:** offspring born while singles are parked inherit only the active masks, and with no L1 the lineage cannot re-add them.
- **Consequence:** part of the factorial gain is L1 repairing damage the controller causes. It is not purely L1 being more productive.

The next registration (L3-I) must therefore keep parked features out of what offspring inherit, or restore them at birth, so that META-OFF has no lineage-damage channel.

## L3-I screen 1 (parking, the L3c attempt-3 setting; inheritance law on; 48 practice seeds) — MISSED

Mean flies: META 45.07, SHAM 34.23, EVO-R 37.31, FIXED 37.07, NOREV 26.90, METAOFF 30.26.

| Gate | Value | Pass |
|---|---|---|
| META − EVO-R / − SHAM / − FIXED | +7.76 / +10.84 / +8.00 (each p ≈ 5e-6) | yes |
| Original L3 d | +2.92, p .0108 | **no** |
| Factorial mean | **−.45**, p .58 | **no** |
| Factorial sign | 19/48 | **no** |
| L1 gain (FIXED − NOREV) | +10.17 | yes |

The direct effect (METAOFF − NOREV) is **+3.36** (p .005). Extinctions: FIXED 1, NOREV 2, METAOFF 2.

**Reading** (corrected after review). With parked features inherited properly, the controller's own direct benefit is positive (+3.36). That accounts for the apparent margin *above the 1.5× gate*, not for META's whole advantage.

The observed L1 gain was 14.81 flies with the controller (META − METAOFF) against 10.17 without it (FIXED − NOREV), i.e. **1.46× on practice**. The factorial −.45 is the shortfall against 1.5×; it is not an estimate of zero interaction. This is not promoted to a finding by testing a lower bar after the fact.

Screen 1 is closed: it missed the pre-registered magnitude and the typical-world requirement. By protocol, screen 2 follows.

## L3-I screen 2 (RewriteCost): preflight and stage A — MISSED at stage A

**Preflight (passed).**
- The default fingerprint is unchanged (bdaca307…).
- **Lockstep 1:** L1-on with hurdle NEVER vs swap disabled, seed 101, 20,000 ticks. Zero divergent ticks, 0 commits, 0 fee charged. The swap instrument observes without changing the live path.
- **Lockstep 2:** METAOFF vs NOREV, seed 101, 20,000 ticks. Zero divergent ticks, 0 checks, 0 swaps, 0 fee.

**Stage A** (hidden challengers, seeds 101–116, hurdle NEVER). Bar: at least 12/16 seeds with ≥ 20 checks and a win rate ≥ 10%.

**Result: 0/16 qualify.** The accounting identity holds on every seed. Per seed:
- **Blocked full-cap checks:** only 5–36 in a whole 20,000-tick run.
- **Cancellations:** most nominations were cancelled by a live edit within 16 tastings.
- **Wins:** 2 in total, both on seed 114 (rate .133, with only 15 checks).

**Reading** (corrected after review). The specific bottleneck that RewriteCost was built to relieve, a capacity-bound program with a better challenger waiting, is rare. Eligible checks are few, and most trials are interrupted by an ordinary live edit, which is not evidence that the challenger was bad.

This retires the operator. It is **not** a measurement that L1 is at its ceiling. By the registration, screen 2 stops at its first miss.

## L3 status after L3, L3b, L3c and L3-I (screens 1 and 2): NOT SHOWN

| Test | Result |
|---|---|
| L3 | practice ratio 1.44 < 1.5 |
| L3b | best 1.444 |
| L3c | best 1.778, p .017; stopped, no final |
| L3-I screen 1 (parking) | L1 gain ratio 1.46× on practice; the controller's direct benefit explains the margin above 1.5×; factorial −.45, 19/48 |
| L3-I screen 2 (RewriteCost) | the targeted bottleneck is rare (0/16 at stage A) |
| L3-II (attention) | oracle routing beats every static allocation, but not the cue-blind scheduler by the bar (+1.37 vs 2.0 flies; 10/16 vs 12) |

No final has been run for any L3 variant. The reserved banks 97001–97048 and 763001–763048 are untouched.

## L3-II (attention-limited structural revision): integrity checks and stage A — MISSED at stage A

**Integrity (passed).**
- **F1:** a routed bite changes exactly 15 correlations in its bank and 0 outside it.
- **F2:** L0 weights are identical across different routes and corruption.
- **F3:** METAOFF vs NOREV lockstep on seed 101, 20,000 ticks, 0 divergence.
- The default fingerprint is unchanged.

**Stage A** (seeds 101–116; population plus tape assay; every seed × arm value finite). Mean flies / tape loss (nats per bite):

| Arm | Population | Tape loss |
|---|---|---|
| ORACLE | 58.29 | .5654 |
| S0 | 50.72 | .6712 |
| S25 | 55.56 | .6766 |
| S50 (locked FIXED) | 56.00 | .6712 |
| S75 | 55.56 | .6781 |
| S100 | 51.80 | .6727 |
| BLIND | 56.91 | .6338 |

**Post-mortem** (per the frozen budget; from the original artifact only):

| ORACLE vs | Tape-loss advantage (bar ≥ .01) | Population advantage (bar ≥ 2.0) | Population wins |
|---|---|---|---|
| S0 | .1058 | +7.56 | — |
| S25 | .1112 | +2.73 | — |
| S50 (FIXED) | .1059 | +2.28 | 12/16 (bar ≥ 12) |
| S75 | .1128 | +2.73 | — |
| S100 | .1074 | +6.48 | — |
| **BLIND** | **.0684** | **+1.37 — missed by .63** | **10/16 — missed by 2** |

**Reading.** Every static allocation clears every bar. The miss is against BLIND alone, on population, both in mean (+1.37 against 2.0) and in win count (10 against 12).

Oracle routing improved prediction on common bites against every comparator, but did not buy enough flies over the cue-blind evidence scheduler. **"Correct features arrived too late"** cannot be established from this artifact. Mechanism telemetry was not retained.

L3-II stops at stage A. No stage B.

## L3-III (evidence-routed attention): integrity and stage A (FIXED re-lock)

**Integrity (passed, before stage A; `scratch/l3iii-fixtures.mjs`).**
- META reproduces former BLIND on 600 scripted tastings, including ties and 60 exploratory choices against utility. It has 0 route differences and 0 state differences, every gene write is correct, and the context RNG ends in the same state. Over a 20,000-tick world on seed 101, the ecology is identical.
- Offspring of a META parent are born at attentionA .5, and the parent is not reset. EVO-R offspring keep the real allele (51/60) or mutate only when their EVO stream fires (9/60); there were 0 bad cases.
- **SHAM wiring.**
  - S1: z′ was unchanged by the recipient's observation on 50/50 bites.
  - S2: changing the donor changed z′ on 300/300 bites but never changed the recipient's real L0 or L1 state (0 divergences).
  - S3: with identical scripted histories, z′ = META's z on 500/500 bites.
- METAOFF vs NOREV lockstep on seed 101 for 20,000 ticks: 0 divergence, and the world RNG ended equal.
- The fingerprint is unchanged.

**Stage A** (seeds 301–316; five static allocations; 0 extinctions). Mean late flies: S0 52.44, S25 55.49, S50 55.05, **S75 55.88 (locked as FIXED)**, S100 51.08. No META result entered the selection.

**Stage B (feasibility; seeds 317–332; META, FIXED = S75, NOREV; 0 extinctions): MISSED. L3-III stops.**

| Quantity | Value | Bar |
|---|---|---|
| mean g = FIXED − NOREV (ordinary L1 gain) | **+13.39** flies | > 0 (pass) |
| mean m = META − FIXED | +0.88 flies | none |
| mean d = m − .5g | **−5.81** | > 0 (**miss**) |
| seeds with d > 0 | **1/16** | ≥ 9 (**miss**) |

Mean late flies: META 55.74, S75 54.85, NOREV 41.46.

**Reading.**
- Ordinary L1 revision is worth about 13 flies in this world. Compounding would need the routing controller to add about 6.7 more on top of the best fixed split. It adds about 0.9, much the same small premium seen in L3-II practice (+0.91).
- Astra's predicted failure mode, a stage-B stop, is what happened.
- Telemetry (descriptive only; it changes no gate): META's true-bank match rate is .530, against .500 for S75. Its mean route run is 4.68 tastings, against 2.65 for S75. Bank admissions are 5,196 A / 5,321 B for META, against 3,826 / 1,635 for S75.
- So the evidence scheduler barely tracks the receptor state. Its premium comes from runs of same-bank sampling and balanced admissions, not from finding the reliable bank.

The registration's stop rule applies: no stage C and no final. Bank 874001–874048 stays untouched.

## L3-IV-H0 (four-bank routing headroom screen): integrity

These checks passed before any measurement (`scratch/l3iv-fixtures.mjs`). The fingerprint is unchanged.
- **Static menu:** 39 distinct allocations, each summing to 1.
- **Rule:** the `quadBankPairs` rule places one pair in each of the four banks. Flipping a bit of any bank's target pair changes valence (720 / 744 / 767 / 755 of 2,000 random odors, for banks 0–3).
- **Banks 2 and 3 matter downstream:**
  - prediction changes when a single bank-2 or bank-3 bit flips;
  - replay features match the mask list;
  - scripted clean bank-3 evidence gets a bank-3 pair admitted (12288 = bits 12, 13).
- **Routing:** for each of the four labels, a routed bite updates exactly 15 correlations in its bank and 0 outside it. L0 weights are identical across routes.
- **Corruption:** the reliable bank is never flipped. The unreliable bits flip at rate .5002, and the covariance between unreliable bits is −.0004, so the 12 draws are independent. ORACLE routes follow the true state exactly.
- **Allocation:** static routing frequencies match the gene ([.501, .248, 0, .251] for [.5, .25, 0, .25]), and BLIND routes to all four banks.
- **World:** codes are 16 bits, and NOREV runs.

Implementation:
- **Evidence:** 64 slots (60 used), indexed by bank × 16 + local mask; no 65,536-entry array.
- **Mutation prior:** 1/256 null, 30/256 within-bank, 225/256 masks spanning two or more banks.

**H0 result (seeds 101–116; both pre-registered toxin batches; 0 extinctions in every arm): MISSED at both toxin levels. L3-IV stops; no noisy-cue fly is built.**

| | toxin .60 | toxin .85 |
|---|---|---|
| NOREV | 42.40 | 31.26 |
| Best static F (of 39) | 48.27 (S10 = [0, .5, .25, .25]) | 41.74 (S20 = uniform) |
| ORACLE | 51.69 | 45.07 |
| BLIND | 49.15 | 42.45 |
| TRUE_ORACLE (diagnostic) | 63.19 | 55.02 |
| mean g = F − NOREV (bar ≥ 3) | **+5.87 pass** | **+10.48 pass** |
| mean dO = (ORACLE − F) − .5g (bar ≥ 4; > 0 on ≥ 13) | **+0.49, 8/16: miss** | **−1.91, 4/16: miss** |
| mean b = ORACLE − BLIND (bar ≥ 4; > 0 on ≥ 12) | **+2.54 (13/16): miss** | **+2.62 (13/16): miss** |
| α (reported only) | .28 | .44 |

**Telemetry** (descriptive only; at .60, averaged per seed):
- **ORACLE:** bank-match 1.000, 1,981 admissions, 637 correct-pair admissions.
- **BLIND:** match .278, 975 admissions, 212 correct.
- **F (S10):** match .250, 664 admissions, 102 correct.
- **Masks at the end:** about 23 of the 24 cap in every arm.

**Reading:**
- Four banks did make perfect routing much better at *finding* the rule: about 6× as many correct-pair admissions as the best static allocation.
- That bought only +3.4 flies, against the +2.9 needed merely to match half of L1's gain. The bar needed +7 or more.
- TRUE_ORACLE shows a large gap (+15 over F at .60). So knowing the rule is valuable, but in this world it is not limited by where structural evidence is collected.
- Every arm ends near its feature cap, so how the fly *uses and keeps* features may be the binding constraint. This is a hypothesis from telemetry, not a tested result.
- Both batches count toward the line budget. Per the registration, there is no third toxin, no rerun and no alternate bank count.

**Post-hoc diagnosis (Gemini 4 Neon; exploratory read-only runs on new practice seeds 501–504; not registered; not a test).** At toxin .60, mean late flies:

| Arm | Flies |
|---|---|
| NOREV | 41.55 |
| S10 | 46.77 |
| BLIND | 48.74 |
| ORACLE | 49.88 |
| TRUE_21 (bias + 16 founder singletons + 4 true pairs) | 53.29 |
| TRUE_5 (bias + 4 true pairs) | 62.71 |

**Most of the TRUE_ORACLE gap comes from feature count, not rule knowledge.** Every ordinary fly carries 16 unprunable founder singletons, which are uninformative under `quadBankPairs`. Adding them to TRUE_5 costs 9.4 flies:
- about 4.2 flies of maintenance energy;
- about 5.3 flies of L0 overfitting, since 21 features chase 16 food kinds that are redrawn every 100 ticks.

Even TRUE_21 would only reach dO ≈ +3.9 against S10, short of the bar of 4.

**The cap-crowding hypothesis is not supported.**
- ORACLE was at its cap on only 5% of fly-ticks.
- Raising the cap to 40 (49.97), turning mutation off (47.29), pruning harder (49.57) and raising the admission bar (46.21) did not help ORACLE.

**A world without founder singletons fails the other way.** Started from `[0]` (direct within-bank candidates, cap 10), NOREV collapses to 16.96 (0 at toxin .85). So the 1.5× bar would need more than god-mode TRUE_5 achieves.

**Movement L1 helps the static allocation much more than ORACLE.**
- Taste-only runs: ORACLE beats S10 by 5.70.
- With movement L1 on: S10 gains +3.74, ORACLE only +1.15.

**Gemini's verdict.** This ecology is structurally hostile to an honest 1.5× L3 pass: about 5–15% odds without contrived world changes. The reasons:
- the concave starvation-cliff / carrying-capacity curve;
- the 16-kind representation trap;
- population-wide search through inherited masks, which washes out gains from a better reviser.

Gemini proposes no ninth screen.
