# RSI P6 results: C2 and C3 PASSED, C1 FAILED, so P6 as a whole FAILED

Plan: [RSI_P6_PLAN.md](RSI_P6_PLAN.md), frozen in `7f408fd`. Data: `evidence/rsi-p6/level2.json`, `test.json` and the logs. These files are gitignored. Runtime: level 2 took 545 s and the test took 981 s.

Labels (from the plan): surrogate evaluator, constructed tasks, hand-written primitive genes, fixed level-2 hill climber.

## Level 2 (update-rule revision)

U0 = {N0 1, ρ .25, credit gain, explore 1}. Validation mean was 31.80 across 6 libraries.

| Proposal | Change | Validation mean | Wins–losses vs incumbent | |
|---|---|---|---|---|
| 1 | ρ .5 | 32.72 | 3–3 | rejected |
| 2 | ρ .1 | 30.81 | 2–4 | rejected |
| 3 | explore .5 | 31.48 | 2–4 | rejected |
| 4 | explore 2 | 31.67 | 3–3 | rejected |
| 5 | credit positive | 30.07 | 0–6 | rejected |
| 6 | **N0 2** | **33.16** | **4–1** | **accepted** |

**U\* = {N0 2, ρ .25, gain, explore 1}.** This is a stronger prior on each move's mean, which shrinks lucky early estimates.

## Test: 12 libraries on 12 unseen "pairs" rules

| lib | U\* | U0 | noInv | L0 | U0 top term move | invented? |
|---|---|---|---|---|---|---|
| 1 | 31.81 | 31.81 | 16.90 | 15.31 | extend/evid/2 | yes |
| 2 | 33.90 | 29.73 | 15.91 | 14.09 | extend/evid/2 | yes |
| 3 | 34.32 | 16.61 | 15.83 | 14.31 | extend/weak/3 | yes |
| 4 | 32.82 | 17.71 | 16.40 | 15.62 | extend/random/1 | no (seed move) |
| 5 | 29.44 | 27.31 | 17.04 | 16.69 | extend/evid/1 | yes |
| 6 | 29.86 | 31.41 | 21.30 | 16.26 | extend/evid/2 | yes |
| 7 | 18.42 | 16.90 | 19.73 | 14.30 | extend/random/1 | no (seed move) |
| 8 | 22.04 | 32.02 | 17.47 | 14.73 | extend/evid/2 | yes |
| 9 | 32.42 | 28.48 | 16.92 | 14.58 | extend/evid/4 | yes |
| 10 | 33.35 | 33.35 | 20.00 | 16.59 | extend/evid/3 | yes |
| 11 | 31.74 | 29.84 | 16.71 | 15.36 | extend/evid/2 | yes |
| 12 | 32.29 | 27.76 | 18.81 | 15.70 | extend/evid/1 | yes |

| Criterion | Needed | Got | |
|---|---|---|---|
| **C1:** U\* ≠ U0, U\* − U0 mean > 0, p < .05 | p < .05 | mean **+3.29**, p = **0.082** | **FAIL** |
| **C2:** invented top term move in ≥ 8/12, U0 − noInv mean ≥ 1, p < .01 | | **10/12**, **+9.16**, p = **0.0012** | PASS |
| **C3:** U\* − L0 mean ≥ 1, p < .01 on the unseen family; U0 > no-search S0 | | **+14.91**, p = **0.00024** (12/12 positive); U0 mean 26.9 > S0 | PASS |

## What it means

- **Invention works.** Starting from blind moves only, the system invents evidence-guided extension moves (`extend/evid/k`) and comes to rely on them. In 10 of 12 libraries they ended up as the top-ranked term move. Libraries with invention beat the same training without it by about 9 points.
- **Transfer works.** Trained only on staircase rules, the libraries clearly improve search on a rule family they never saw.
- **Level 2 is not shown.** The hill climber changed the update rule. The change helped on average (+3.3) but very unevenly across libraries, with differences from −10.0 to +17.7. The test did not reach the pre-registered p < .05. Under the frozen plan, P6 fails. There is no rerun of this bank.

A replication of the specific level-2 result (U\* vs U0 on fresh banks, with more libraries) would be a **new, separately pre-registered experiment** ([RSI_P6B_PLAN.md](RSI_P6B_PLAN.md) if run). It would not rescue this one.
