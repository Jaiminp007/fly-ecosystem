# RSI P10 results: joint test in one system, embodied (PASSED)

The plan is [RSI_P10_PLAN.md](RSI_P10_PLAN.md), frozen in `8da0b01` before the run. Runner: `scripts/rsi-p10-joint.mjs`. Output: `evidence/rsi-p10/run.json`, kept locally because evidence is gitignored. Run time: 1024 s.

## Result

| Criterion | Value | Rules | p (exact sign-flip, 12 rules) | Pass |
|---|---|---|---|---|
| J1: embodied A − B (system vs blind search) | +3.59 energy (sd 1.31) | 12/12 positive | 0.00024 | yes |
| J2: embodied A − S0 (system vs no search) | +3.76 energy (sd 1.36) | 11/12 positive | 0.00049 | yes |
| J3: A's top term move is invented | 11/12 libraries | | | yes |
| Reported: embodied A − A0 (U* vs U0 libraries) | +1.48 | | 0.051 | not gated |

All three gated criteria pass, so **P10 passes**.

Per rule (energy per founder; tA and tB = target terms found):

| Rule | A | A0 | B | S0 | A's top move | tA | tB |
|---|---|---|---|---|---|---|---|
| p1− | −54.55 | −57.23 | −58.19 | −58.19 | extend/evid/2 | 3 | 0 |
| p2+ | −54.91 | −52.77 | −57.40 | −57.40 | extend/evid/2 | 3 | 0 |
| p3+ | −52.40 | −56.47 | −54.40 | −56.47 | extend/evid/3 | 3 | 1 |
| p4+ | −52.51 | −57.18 | −56.98 | −57.18 | extend/evid/3 | 3 | 0 |
| p5+ | −52.29 | −53.53 | −56.82 | −57.00 | extend/evid/1 | 3 | 1 |
| p6− | −51.59 | −51.59 | −56.20 | −56.20 | extend/evid/2 | 3 | 0 |
| p7+ | −51.50 | −55.84 | −56.25 | −56.55 | extend/evid/2 | 3 | 0 |
| p8− | −51.74 | −53.55 | −55.40 | −55.53 | extend/evid/4 | 3 | 0 |
| p9− | −55.23 | −50.40 | −55.64 | −55.23 | remove/random/1 | 0 | 0 |
| p10+ | −52.89 | −56.78 | −56.95 | −56.72 | extend/evid/4 | 3 | 0 |
| p11− | −53.38 | −53.83 | −57.59 | −57.46 | extend/evid/4 | 3 | 0 |
| p12+ | −51.70 | −53.20 | −55.90 | −55.90 | extend/evid/3 | 3 | 0 |

Notes:

- In 11 of 12 libraries, the system invented an evidence-guided extend move and found all 3 target terms of the unseen rule. Blind search found 0–1.
- In p9, the U* library did not discover the move: it finished with `remove/random/1` and found no target terms. This is the one exception. In P9, all 32 libraries found the move.
- A − A0 (+1.48, p = 0.051) is reported only; it was not gated. The pre-registered expectation was low power for this contrast. The level-2 benefit itself was tested in P9, in the surrogate.

## What this shows, with its labels

One system was scored in the embodied fly. It:

- uses an improvement rule it revised itself (level 2, from P9);
- starts from blind moves only and invents the move it relies on;
- is applied to a rule family it never trained on.

Its found programs raised embodied energy over blind search and over no search.

Labels:

- **Surrogate search.** The search, invention and level-2 revision ran in a surrogate calibrated to measured embodied statistics. The embodied simulation scored the end products, so this is sim-to-real transfer.
- **Opt-in world.** The world is the opt-in many-odor mode (odor table redrawn every 32 ticks). It was introduced after P7 failed in the default world.
- **Constructed tasks.** The tasks are constructed Walsh-term valence rules over an 8-bit odor code. The gene grammar is hand-written. Level 2's invention options were added to its space after diagnosis (P9).
- **Embodied level-2 effect not shown.** The embodied effect of the level-2 revision itself, A − A0, is not significant here.
