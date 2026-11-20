# RSI P12 results: in-lineage self-revision of the fly's own taste program (PASSED)

The plan was [RSI_P12_PLAN.md](RSI_P12_PLAN.md), frozen in `b9ec490` before the run. The runner is `scripts/rsi-p12-lineage.mjs`, and the output is `evidence/rsi-p12/run.json` (local). The run took 2894 s. Design: 24 rules × 4 lineages × 8 generations × 3 arms.

| Gate | Measure | Mean | sd | Rules positive | p | Pass |
|---|---|---|---|---|---|---|
| L1 size | SELF − S0, energy in generations 7–8 | **+3.54** (gate ≥ 1.65) | 1.18 | 24/24 | < 0.00001 | yes |
| L2 own evidence | SELF − SHAM, energy in generations 7–8 | **+3.28** | 0.87 | 24/24 | < 0.00001 | yes |
| L3 mechanism | share of added masks that are target terms, SELF − SHAM | **+0.44** | 0.09 | 24/24 | < 0.00001 | yes |
| L4 improves across generations | (SELF last − first) − (S0 last − first) | **+3.25** | 1.11 | 24/24 | < 0.00001 | yes |

The p values are the Monte Carlo floor (1/200,001). No sign-flip draw reached the observed mean, because every difference was positive. **All gates pass.**

By family, SELF − S0 was +3.98 on the pairs rules and +3.09 on the staircase rules.

At the end of generation 8, self-revising lineages held **2.84–2.98 of the 3** pairs target terms and **3.09–3.49 of the 4** staircase target terms. Of the masks they added:

| Family | Target-term share, SELF | Target-term share, SHAM (chance) |
|---|---|---|
| pairs | 55–64% | 6–9% |
| staircase | 32–52% | 1–4% |

## What this shows, with its labels

A lineage of flies revised its own taste-learning program from its own experience, with no offline search and no surrogate. Each generation inherited its parent's program and self-revision evidence, but not learned food values. Over 8 generations, the lineages found the hidden structure of their world's food chemistry, and the flies gained energy. The gain beat a sham that adds features at the same moments, and it grew across generations relative to unrevised lineages.

Labels:

- **In-lineage, not in-life.** This is a generational relay of separate runs of the same world, not breeding within a run. Founder i inherits from founder i, with no selection. In-life revision alone is data-limited ([exploration](RSI_INLIFE_EXPLORATION.md)).
- **Opt-in world.** The world is the opt-in many-odor mode. The tasks are constructed Walsh-term rules over an 8-bit odor code.
- **Hand-written operator.** The revision operator (extend by evidence, with a 3σ test) is hand-written. It is the move the offline system invented in P6/P10, installed as the fly's own operator.
- **No level 2 inside the lineage.** The lineage revises its learning program, not the reviser itself, so this is self-revision, not recursive revision inside the fly.
