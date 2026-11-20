# RSI P5 results: all three stages PASSED

The plan is [RSI_P5_PLAN.md](RSI_P5_PLAN.md), frozen in `e573f25` before any stage ran on bank seeds. Raw outputs are in `evidence/rsi-p5/` (`chain.json`, `dev.json`, `test.json`; gitignored like all evidence).

This is the **fifth stage** of the RSI line. P2 and P3-A, the earlier learner attempts, failed; P3 and P3-B found no chain; P4 failed its chain check.

## Read this first: what passed

On a **constructed task** scored by a **surrogate evaluator**, a search procedure learns from its own past searches which edits to try first. That learned preference makes it improve the fly's taste-learning program faster and further on **unseen** problems than the same search without the learned preference. The improvement takes several accepted steps in sequence, 3.7 on average.

What did not pass, or was never claimed:

- **Order dependence (C2) failed.** The steps are additive: the third step's edit also helps when applied straight to the start program. Their order is forced by the grammar, because a term can only be grown one bit at a time, not by the gains. So this is "a multi-step improvement path with additive steps", not "an order-dependent chain".
- **This is level 1 (selection).** The system learns weights over 18 hand-written moves. It does not invent moves, and it does not improve its own learning rule (level 2).
- **The surrogate is not the embodied world.** The learner code is the fly's taste learner, but the world is a simulated tasting stream, not the physical simulation. In the embodied world the same idea failed for lack of signal: P3-A, P4.

## Stage 1, chain check with no learner: PASS

| Criterion | Needed | Got |
|---|---|---|
| C1: rules with ≥ 3 accepted moves | ≥ 8/12 | **12/12** (mean 3.58 accepted) |
| C3: O − best one-jump shortcut | ≥ 1.0 | **+6.96** |
| C4: O − uniform | ≥ 1.5 | **+5.74** |
| C2: third edit on S0 ≤ 0.5 × in-chain (reported, not blocking) | — | **fail**: +4.26 on S0 vs +3.48 in chain |

O improved on S0 by +13.3 points. The typical accepted path was extend/evid/2 adding T12, then extend/evid/2 adding T123, then stepDown or adding T1234.

## Stage 2, dev check with 6 libraries: PASS (the P2/P3-A gate, unchanged)

| Gate | Needed | Got |
|---|---|---|
| O − B | ≥ 1.5 | **+8.24** |
| A_L − B_L > 0 | ≥ 5/6 | **6/6** (+9.85, +2.56, +4.40, +10.16, +7.71, +10.48) |
| Mean A − B | ≥ 1.0 | **+7.53** |
| Power ⌈10.03(sd/mean)² + 2.7⌉ | ≤ 12 | **5** |

Every library's top learned move was an evidence-guided extension. Accepted moves per search averaged 3.56 for A and 2.33 for B.

## Stage 3, test with 12 new libraries on 12 unseen rules: PASS

| Criterion | Needed | Got |
|---|---|---|
| Exact one-sided sign-flip test | p < 0.01 | **p = 0.00024** (1/4096, the minimum possible: all 12 positive) |
| Mean A_L − B_L | ≥ 1.0 | **+6.57** (sd 2.00, range +3.76 to +9.74) |

- **Scores:** A averaged 30.44 points and B 23.87, where a point is 100 × mean reward per encounter.
- **Accepted moves per search:** 3.66 for A, 2.13 for B.
- **First proposals by trained libraries:** extend/evid/2 in 108 of 144 searches and extend/evid/1 in 36. That is the move the chain check found to be the productive one.

## Disclosures

- **Exploration before freezing.** Non-bank exploratory runs, listed in the plan, set the task scale, the budget and the hand order O. One earlier hand order put keepOnly first and showed almost no headroom (+0.3). This did not affect A or B: neither arm uses O.
- **Rule signs were skewed.** `makeProblem` draws the rule sign from an RNG seeded with consecutive integers, and those draws are correlated. All 12 chain rules and all 6 dev rules came out negative. The test set has 7 negative and 5 positive. The test effect holds on both signs:
  - positive rules: mean A − B +7.19, positive for all 12 libraries;
  - negative rules: mean A − B +6.13, positive for all 12 libraries.

  This split was computed after the test and was not pre-registered.
- **The smoke runs** used seeds offset by +500, never bank seeds.
- **A strong learned prior here is close to a constant.** "Extend by evidence first" works on every staircase rule. The library does not adapt its order per problem, and the result does not show it could.

## Bottom line

The pre-registered RSI gate, failed in P2 and P3-A, passes in P5 at the dev and test levels. It passes **on a surrogate evaluator and a constructed task, at level 1, with additive steps.** Any summary must keep those four qualifiers.

The next real step up would be one of:

- the same result in the embodied world, which needs a cheaper or less noisy embodied evaluation;
- a level-2 result, where the search improves its own update rule rather than just move weights.
