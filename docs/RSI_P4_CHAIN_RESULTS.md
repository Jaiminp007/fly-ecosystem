# RSI P4 chain check: results (FAILED all four criteria)

Plan: [RSI_P4_CHAIN_PLAN.md](RSI_P4_CHAIN_PLAN.md), frozen in `14d071f`. Data: `evidence/rsi-p4-chain/run.json`. Runtime 75 min.
This is the fourth stage of the RSI line. P2 and P3-A both failed, and the P3/P3-B probes found no chain in the 4-bit space.
P4 is a **constructed task**: 8-bit odor codes read only by taste, staircase valence rules, and moves that extend a term by one bit. No learner was involved.

| Criterion | Needed | Got | |
|---|---|---|---|
| C1 chain: ≥ 3 accepted moves on ≥ 8/12 rules | 8 | **0** rules (mean 0.92 accepted) | fail |
| C2 order dependence | needs ≥ 3-move chains | not measurable | fail |
| C3 greedy final − best one-jump shortcut | ≥ +1.0 | **−1.05** (shortcut wins) | fail |
| C4 greedy − uniform | ≥ +1.5 | **+0.09** | fail |

Greedy − S0 was only +0.21.

## Per rule (energy per founder, 8 held-out histories)

| rule | S0 | greedy | uniform | best shortcut | accepted ops |
|---|---|---|---|---|---|
| stair1+ | −45.42 | −44.99 | −44.99 | −45.13 | extend/evid/1, extend/evid/2 |
| stair2+ | −41.24 | −41.24 | −41.48 | −38.92 | none |
| stair3− | −64.13 | −64.13 | −63.67 | −61.25 | none |
| stair4+ | −43.69 | −43.69 | −43.69 | −41.49 | none |
| stair5+ | −44.38 | −44.41 | −44.38 | −44.84 | keepOnly/evid/3 |
| stair6+ | −37.37 | −37.47 | −37.47 | −36.34 | extend/evid/1 |
| stair7+ | −49.68 | −49.55 | −49.27 | −49.21 | extend/evid/1, remove/weak/2 |
| stair8− | −63.79 | −63.79 | −63.79 | −63.03 | none |
| stair9+ | −47.23 | −48.88 | −47.63 | −47.73 | extend/evid/2 |
| stair10+ | −44.99 | −44.99 | −45.33 | −44.19 | none |
| stair11− | −63.59 | −61.63 | −63.60 | −61.17 | remove/weak/1, extend/evid/2 |
| stair12+ | −37.95 | −36.22 | −36.82 | −35.15 | extend/evid/1, keepOnly/evid/4 |

## Why it failed

- **Wrong children.** The flies' own evidence picks the wrong child terms. Greedy added a term by extension 9 times. It added the true staircase term T12 only twice (stair6 and stair12). The other additions were unrelated terms such as 6, 14, 96 and 130.
  - Each history shows the flies only 12 odors, 4 per family.
  - On 12 points, many of the 28 two-bit children of the 8 single bits correlate with the rule about as well as T12 does.
  - So evidence restricted to the frontier cannot single out the next step.
- **The gains exist, but the search can't reach them.** The scratch probe showed T1→T1234 is worth about +3 to +4 energy on some rules. The one-jump shortcut also does better than greedy by +1.05. The staircase is there in the energy, but a step-by-step search driven by evidence can't climb it with this much data per evaluation.
- **Accept-gate noise.** Most first steps had dev gains of ±2 with 3–4/6 wins. That is the same noise level that broke P2 and P3-A.

## Conclusion

The plan's rule applies: stop. No learner is built on P4.

Across four stages the limiting factor has been the same: each embodied evaluation gives too little information. There are 12 odors per run, and energy noise is about 3 per history. This allowed at most one reliable improvement step (P3) and no chain (P3-B, P4). A recursive self-improvement result needs a chain of improvements a learner can speed up. This engine's taste task, even widened, does not supply one at an affordable evaluation cost.

Engine change kept: `tasteProgram.odor` is opt-in and the default is unchanged.
