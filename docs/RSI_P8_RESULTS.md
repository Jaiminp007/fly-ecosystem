# RSI P8 results: embodied benefit in a calibrated, many-odor world (PASSED)

Plan: [RSI_P8_PLAN.md](RSI_P8_PLAN.md), frozen in `65d9e1e` before the run. Runner: `scripts/rsi-p8-embodied.mjs`. Output: `evidence/rsi-p8/run.json` (local; evidence is gitignored). Run time: 785 s.

## Result

| Criterion | Mean energy gain | sd | Rules positive | p (exact sign-flip, 12 rules) | Pass |
|---|---|---|---|---|---|
| E1: A − B (self-improving search vs blind search) | +2.85 | 1.78 | 12/12 | 0.00024 | yes |
| E2: A − S0 (self-improving search vs no search) | +2.54 | 2.18 | 11/12 | 0.0020 | yes |

Both criteria pass, so **P8 passes**.

Per rule (energy per founder; tA and tB = target terms in A and B):

| Rule | A | B | S0 | tA | tB |
|---|---|---|---|---|---|
| e1+ | −47.21 | −50.29 | −50.29 | 4 | 1 |
| e2+ | −47.13 | −49.64 | −49.64 | 3 | 1 |
| e3+ | −48.50 | −50.61 | −48.57 | 2 | 1 |
| e4− | −61.76 | −61.78 | −62.06 | 1 | 0 |
| e5+ | −47.10 | −49.96 | −51.11 | 4 | 1 |
| e6+ | −47.34 | −50.01 | −50.01 | 4 | 1 |
| e7+ | −46.09 | −46.91 | −47.23 | 4 | 2 |
| e8+ | −44.66 | −49.06 | −48.88 | 4 | 1 |
| e9− | −60.93 | −62.27 | −59.43 | 1 | 0 |
| e10+ | −45.17 | −47.92 | −48.33 | 4 | 1 |
| e11− | −56.55 | −62.57 | −61.63 | 4 | 0 |
| e12− | −56.22 | −61.80 | −62.02 | 4 | 1 |

- **Both signs.** Rule signs fell 8 positive and 4 negative. A − B was positive in all four negative rules (+0.02, +1.35, +6.02, +5.58).
- **Weakest rules.** The two rules where A found only one target term (e4, e9) gave the smallest gains. In e9, A lost to S0.
- **Learning step.** Programs found on the calibrated surrogate mostly kept step 4. P7's miscalibrated surrogate had picked steps 1–2.

## What this shows, with its labels

In this setting, programs found by the self-improving search beat programs found by blind search, and beat no search, in **energy in the embodied fly simulation**. "Self-improving" here means level 1 with invented moves, update rule U0.

Labels that must stay attached:

- **Surrogate search.** The search and its self-improvement ran on a surrogate. The surrogate's settings were matched to measured embodied statistics: examples per fly, and label noise. The embodied simulation only scored the final programs, so this is sim-to-real transfer.
- **Changed world.** The world is the opt-in many-odor mode (`odorShiftEvery: 32`). It was introduced **after** P7 failed, because the default 12-odor world does not reward taste structure. The benefit is shown in that world, not in the default one.
- **Constructed task.** The rules are constructed staircase valences over an 8-bit odor code, and the moves are a hand-written primitive grammar.
- **Level 2 not shown.** It failed in P6 and P6b, and P8 does not change that.
- **Failures stand.** P7 remains a recorded failure.
