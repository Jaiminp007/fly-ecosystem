# RSI P5 plan: surrogate evaluator, three stages (frozen before any stage ran on bank seeds)

Date: 2026-11-15. This is the **fifth stage** of the RSI line.

- P2 and P3-A, the earlier learner attempts, failed their dev gates.
- P3/P3-B found one improvement step and no chain.
- P4, a chain check on the embodied world with wide odors, failed with 0/12 chained rules ([RSI_P4_CHAIN_RESULTS.md](RSI_P4_CHAIN_RESULTS.md)).
- The diagnosed cause in every case: an embodied evaluation carries too little information (12 odors, energy noise ≈ 3).

P5 changes **the evaluator**. The user asked to continue until RSI is completed.

## What P5 is and is not (labels any writeup must keep)

- **Surrogate evaluator, not the embodied simulation.** `scripts/rsi-p5-lib.mjs` runs the fly's single-head masks taste learner on simulated tasting streams. The learner code is copied in behaviour from `learning/odor-routed-taste.mjs`:
  - logistic readout with prior logit ln 3;
  - step·error/√n updates clipped to ±8;
  - reservoir memory with replays;
  - threshold decisions, so a refused odor gives no example.
- **The stream.** Each stream has 3 families of 12 odors. Each odor is a distinct random 8-bit code, drawn per stream. There are 120 encounters per family and 10% outcome-label noise.
- **Reward and score.** Reward is +1 for eating a good odor, −1 for a bad one and 0 for a refusal. Score = 100 × mean reward per encounter. One "history" is a batch of 16 streams.
- **Constructed task.** The valence is a staircase over 4 odor bits, sign·sgn(.5 + T1 + 2T12 + 2T123 + T1234), and the grammar only grows terms by one bit. Both were designed so that improvement takes several steps.
- **Level 1 only.** The system learns weights over an 18-move hand-written grammar, which is selection. Not claimed: invention, level 2, or anything about the embodied world.

## Search (shared by all stages)

| Setting | Value |
|---|---|
| Start program S0 | constant term + 8 single bits, step 4, replays 1 |
| Grammar (18 moves) | extend/{evid,random}/{1,2}; remove/{weak,random}/{1,2,4}; keepOnly/evid/{1,2,3,4}; step/replays up/down |
| Accept rule | as in P2–P4: dev gain > 0 with ≥ 4/6 wins, then confirm on 6 fresh histories |
| Budget | 18 evaluations |
| Final score | 8 held-out histories |

**Hand order O.** O is used as the headroom witness and in the chain check. It is ordered by the mean gain of each move under uniform search on 24 exploratory problems (seeds 60000–60023): extend/evid/2, extend/evid/1, stepDown, extend/random/1 and 2, replaysUp, …, keepOnly/evid/1 last.

**Learner.** The rule is P3-A's, unchanged:
- **Library:** each move keeps {n, sum, sumSq} of dev gains, crediting every proposal.
- **Training:** Thompson sampling with online updates, N0 = 1, σ0 = 2, variance floor 0.25.
- **Evaluation:** frozen libraries order moves by posterior mean, with ties broken by a uniform shuffle.
- **Comparison:** B_L is uniform order with a per-library seed (bankSeed·7 + L). Each library trains on its own 6 rules, budget 18.

## Exploration disclosed

Exploratory runs used non-bank seeds 777–782, 12345–12348, 50000–50011, 60000–60023 and 70000–70011. They set the task scale, the hand order O and the budget, and they ran with seeds offset by +500. What they showed:

- **Landscape:** layered programs score about 18 → 25 → 29 → 40 points, with batch noise around ±1.
- **First hand order:** it put keepOnly moves early and wasted budget (G − U +0.3).
- **Re-ordered O:** G − U was +2.9, +4.8 and +6.4 at budgets 8, 12 and 18, and 9 of 12 rules chained at budget 18. Budget 18 was chosen.
- **Smoke run:** the third step's edit gained more when applied straight to S0 (+4.4) than in sequence (+3.4). The steps look additive. Their order is forced by the grammar's reachability, not by the gains.

## Stages and criteria (each stage runs only if the previous one PASSED)

All bank seeds are fresh.

**Stage 1, chain check (no learner).** 12 rules, seeds 1001001–1001012. PASS requires all of:
- **C1:** ≥ 3 moves accepted on ≥ 8 of 12 rules, using O;
- **C3:** mean (O final − best one-jump shortcut) ≥ 1.0, where the shortcut is keepOnly top-k by S0 evidence over all terms of order ≤ 4, k ∈ {1,2,3,4,6}, scored by its best k;
- **C4:** mean (O − uniform) ≥ 1.5.

C2 (order dependence: the third step's concrete edit applied to S0 gains ≤ 0.5 × its in-chain gain) is **reported, not blocking**. It sets the wording:
- if C2 passes: "an order-dependent chain";
- if C2 fails: "a multi-step improvement path whose steps are additive; the order is forced by the grammar".

**Stage 2, dev check.** 6 libraries trained on seeds 1003000 + 10L + i, evaluated on 6 dev rules with seeds 1002001–1002006. This is the P2/P3-A gate, unchanged, in points:
1. O − B ≥ 1.5;
2. A_L − B_L > 0 for ≥ 5/6;
3. mean A_L − B_L ≥ 1.0;
4. ⌈10.03(sd/mean)² + 2.7⌉ ≤ 12.

**Stage 3, test.** 12 new libraries trained on seeds 1005000 + 10L + i, evaluated on 12 unseen rules with seeds 1004001–1004012. PASS requires both:
- an exact one-sided sign-flip test over the 12 per-library A_L − B_L differences, with p < 0.01;
- mean A_L − B_L ≥ 1.0.

Whatever the outcome, results are written and committed as they come. There is no re-running with new seeds and no changing of criteria after any stage runs. If a stage fails, the P5 line stops.

Runner: `scripts/rsi-p5.mjs <chain|dev|test>`. Output goes to `evidence/rsi-p5/`.
