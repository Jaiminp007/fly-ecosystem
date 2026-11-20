# RSI P9 results: level 2 over the invention operator (PASSED)

The plan, [RSI_P9_PLAN.md](RSI_P9_PLAN.md), was frozen in `5d753b2` before the run. Runner: `scripts/rsi-p9.mjs`. Outputs, local because evidence is gitignored: `evidence/rsi-p9/level2.json` and `test.json`.

## Stage 1: level 2 (12 validation libraries)

Mean validation score of the incumbent U0: 26.83.

| # | Change from incumbent | Mean | Wins–losses | Accepted |
|---|---|---|---|---|
| 1 | credit positive | 26.92 | 5–6 | no |
| 2 | rho .5 | 23.86 | 6–4 | no |
| 3 | inventParent sample | 23.91 | 6–6 | no |
| 4 | N0 4 | 23.07 | 3–6 | no |
| 5 | **inventGenes 2** | **28.78** | **7–5** | **yes** |
| 6 | + explore 2 | 29.12 | 4–4 | no (tie) |
| 7 | + rho .1 | 27.94 | 7–4 | no |
| 8 | + inventParent sample | 28.73 | 6–6 | no |

U* = U0 with `inventGenes: 2`. The system's level-2 search changed its own invention operator: new moves are made by mutating two genes instead of one.

## Stage 2: test (32 fresh libraries, 12 unseen pairs rules)

| Measure | Value |
|---|---|
| U* − U0 mean | **+5.39** |
| sd | 10.29 |
| Libraries positive / negative | 20 / 12 |
| p (sign-flip, Monte Carlo 200k) | **0.00064** |
| Discovery (top move is extend/evid) | U* 32/32, U0 26/32 |

**L2 passes**: U* ≠ U0, mean > 0, p < 0.05.

The effect is concentrated. Six libraries gain +15 to +30: those where U0 never discovered extend-by-evidence. The other 26 differences are small, between −2.0 and +6.1, centred near 0. The revision works by making discovery reliable, not by improving libraries that already discover the move.

## What this shows, with its labels

A fixed level-2 hill climber revised the system's own improvement rule (its move-invention operator). It used only its own validation data. The revision replicated on 32 fresh libraries and on an unseen rule family.

Labels:

- **Surrogate.** Everything ran in the calibrated surrogate, with constructed staircase and pairs tasks and a hand-written gene grammar.
- **Space chosen after diagnosis.** The invention genes were added to the space after exploration showed discovery was the bottleneck. The designer knew good options existed. The system picked one, out of 8 proposals, from its own data.
- **History.** P6 (p = 0.082) and P6b (p = 0.144) remain recorded level-2 failures over the old space.
- **Not shown jointly yet.** The RSI parts are now each supported in at least one pre-registered test: P5, P6 C2/C3, P8 and P9. They are supported across experiments, not jointly in one.
