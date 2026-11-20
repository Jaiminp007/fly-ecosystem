# P16 results: generic pairwise representation (FAILED)

The plan, [RSI_P16_PLAN.md](RSI_P16_PLAN.md), was frozen in `c471ee4` before the run. Output: `evidence/p16/run.json` (kept locally). The run took 1397 s.

| Arm | Survivors (of 24) | Tastings per founder | Energy |
|---|---|---|---|
| S0 | 5.82 | 80 | −58.0 |
| PAIRS (37 generic masks) | 6.79 | 117 | −57.5 |
| TRUE (oracle reference) | 11.85 | 93 | −49.6 |

| Gate | Result | Pass |
|---|---|---|
| G1: PAIRS − S0 ≥ 1.25, p < .01 | +0.97 (sd 1.36), 16/24 rules, p = 0.0010 | no (below the size bar) |
| G2: positive in each family | pairs +2.13 (12/12, p = 0.00024); staircase −0.18 (4/12, p = 0.88) | no |

**P16 fails.** The case G2 was written to catch is what happened:

- On the pairs family, which pairwise terms express exactly, the generic representation helps: +2.13 survivors on every rule.
- On the staircase family, which needs order-3 and order-4 terms, it gives nothing.
- Overall it captures 16% of the gap between S0 and TRUE.

A generic representation chosen by the designer helps only when it happens to contain the rule. It is a family-specific prior, not a general fix. Finding the right terms remains the thing that pays; in this project only the lineage revision in P12 found them from the flies' own experience.

The exploration result (about +1.9, positive on both staircase rules) did not replicate on staircase rules. Exploration used 4 histories per rule; the bank used 16.
