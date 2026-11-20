# P14b plan: does a better taste program raise survival over the default learner? (frozen before the run)

**Gates were chosen after seeing P14.** P14 failed its pre-registered gate S2, because its no-skill arm turned out to be a non-eater (see [P14 results](RSI_P14_RESULTS.md)). In P14, TRUE − S0 was reported, not gated, at +4.8 to +5.8 survivors, 12/12 rules. P14b is a **replication of that reported effect on fresh rules**, not an independent milestone. Design by the Fable review (2026-11-16).

## Design

- **Rules.** 12 fresh embodied rules in the many-odor world (`odorShiftEvery` 32):
  - pairs, seeds 2101001–2101006;
  - staircase, seeds 2101007–2101012.
  - Odor tables are built as in P14.
- **World.** `nutrientScale` 1 only.
- **Arms.** Both use step 4, replays 1 and threshold decisions:
  - **S0**: the default learner over single bits.
  - **TRUE**: masks `[0, ...target]`.
- **Histories.** 16 per rule, from `makeHistories(2102000+k, 16)`. Both arms use the same histories.
- **Outcome.** Survivors of 24 founders, as the mean over histories. Energy is reported.
- **Statistics.** Exact one-sided sign-flip test over 12 rules.

## Gates (both must pass)

- **G1:** TRUE − S0 survivors has mean ≥ 3 and p < 0.01.
- **G2:** S0 survivors has mean ≥ 2.

## How a pass will be described

"A better taste program raises survival over the default learner, in the many-odor world."

- TRUE is an oracle program, so this measures what better skill is worth, not something the flies found.
- The world is the opt-in many-odor world, and the tasks are constructed.
- After P14b, the taste line is finished at its bound, pass or fail.

Smoke runs use seeds offset by +500. Runner: `scripts/p14b-survival.mjs`. Output: `evidence/p14b/run.json`.
