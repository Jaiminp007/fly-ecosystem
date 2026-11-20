# RSI P6b plan: replication of the level-2 result (frozen before the run)

P6 failed only C1. The level-2 revision U* = {N0 2, ρ .25, gain, explore 1} beat U0 by +3.29 over 12 libraries, but at p = 0.082 ([RSI_P6_RESULTS.md](RSI_P6_RESULTS.md)). The per-library differences had an sd of about 7, so 12 libraries was too few.

P6b is a **new, separately pre-registered replication of that one claim**:

- 32 libraries on fresh banks;
- U* is taken as fixed from `evidence/rsi-p6/level2.json` and is not re-searched;
- P6 stays recorded as failed.

## Design

- **Libraries.** Library k (k = 1..32) trains on 6 staircase rules with seeds 1302000+10k+i and training seed k. It is trained twice, once with U* and once with U0.
- **Test rules.** 12 unseen "pairs" rules, seeds 1301001–1301012, using the P6 surrogate, budget 18 and frozen evaluation.
- **Unit and statistic.** Each library gives one difference: mean U* score − mean U0 score over the test rules. The test is a one-sided sign-flip test, Monte Carlo with 200,000 draws at fixed seed 1301999.
- **R1 (pass):** mean > 0 and p < 0.05.

## How results will be described

- **If R1 passes:** level 2 (a fixed hill climber over the update rule) found a revision that replicates on fresh data. With P6's C2 and C3, the three parts of the V5 bar (invention, a revised update rule, transfer to an unseen family) are then each supported. They are supported across two experiments, not jointly in one, and that must be stated.
- **If R1 fails:** level 2 is not shown. There are no further replications of this U*.

Smoke runs use seeds offset by +500. Runner: `scripts/rsi-p6b.mjs`.
