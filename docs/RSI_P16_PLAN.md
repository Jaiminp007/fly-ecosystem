# P16 plan: a generic pairwise representation from birth (frozen before the run)

P15 found that the bottleneck is representation, not label count. The flies' single-bit features cannot express the rules. P16 tests whether a **generic** richer representation, fixed at birth, raises survival over the default learner S0.

The representation is the same for every rule: the bias, all 8 single bits and all 28 pairs, 37 masks in total. It is not fitted to any rule.

Design by the Fable review (2026-11-17).

## Exploration (non-bank seeds 99001–99004, histories 99501–99504)

Rules alternated pairs / staircase, with 4 histories each. Survivors of 24:

| Arm | Rule 1 (pairs) | Rule 2 (staircase) | Rule 3 (pairs) | Rule 4 (staircase) |
|---|---|---|---|---|
| S0 | 10.0 | 3.0 | 6.0 | 1.0 |
| PAIRS | 11.3 | 5.0 | 8.8 | 2.5 |
| ORD3 (+ all triples) | 11.0 | 3.0 | 5.5 | 1.8 |
| TRUE | 14.5 | 8.3 | 12.8 | 8.3 |

PAIRS gained about +1.9 of a +6.0 TRUE gap and was positive on all 4 rules. Variants with step 8, replays 2, and PAIRS with in-life selfRevise were also explored. None is used in P16.

## Design

- **Rules.** 24 embodied rules in the many-odor world (`odorShiftEvery` 32), with the odor table built as in P14b:
  - pairs rules: seeds 2301001–2301012;
  - staircase rules: seeds 2301013–2301024.
- **Histories.** 16 per rule, `makeHistories(2302001+k, 16)`. All arms use the same histories.
- **World.** As in P14b: threshold decisions, nutrientScale 1, toxinScale default, shift seed `mix(bankSeed ^ 0x7f4a7c15)`.
- **Arms.** All use step 4 and replays 1, with no self-revision:
  - **S0:** bias + 8 single bits.
  - **PAIRS:** bias + 8 single bits + 28 pairs (37 masks).
  - **TRUE:** bias + the rule's target terms (oracle reference).
- **Outcome.** Survivors of 24 at the end of the run, averaged over the 16 histories, one value per rule.
- **Statistics.** The rule is the unit (n = 24). The test is a one-sided sign-flip, Monte Carlo with 200,000 draws at seed 2304999.

## Gates (all must pass)

- **G1:** PAIRS − S0 survivors has mean ≥ 1.25 and p < 0.01.
- **G2:** the mean of PAIRS − S0 is > 0 within each family (12 pairs rules, 12 staircase rules) separately. If only the pairs family gains, the result is a family-specific prior and the milestone fails.

**Reported (not gated):**
- the fraction of TRUE − S0 captured, (PAIRS − S0) / (TRUE − S0);
- tastings per founder life;
- energy;
- p-values per family.

## Labels

- **Hand-chosen representation.** The representation is hand-chosen: "pairwise" is the designer's choice. This is a body/representation change, not RSI, and nothing is discovered by the flies.
- **Partly matched to the rules.** The pairs family is exactly expressible in pairwise terms; the staircase family is not, which is why G2 exists.
- **Opt-in world.** The many-odor world is opt-in, and the tasks are constructed.
- **Smoke run.** The smoke run uses seed offset +500.

Runner: `scripts/p16-pairs.mjs`. Output: `evidence/p16/run.json`. The run is resumable through a per-cell cache.
