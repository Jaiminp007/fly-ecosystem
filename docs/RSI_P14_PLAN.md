# P14 plan: does taste skill change survival? (frozen before the run)

The Fable review (2026-11-16) names "skill moves energy but not survival" as the result that keeps recurring in earlier lines: distinct-tasks survival was unchanged, and P2 survivors were flat. It proposes as the next milestone a world where taste skill clearly changes survival, without the unskilled flies simply dying out.

Earlier exploration probes in the many-odor world (non-bank seeds 90001–90003, 97001–97004) showed survivor differences between bias-only, S0 and true-terms programs. P14 tests this on fresh rules, with criteria fixed in advance, across three food-value scales. No search and no lineage are involved, so P14 is a world/skill measurement and not an RSI test.

## Design

- **Rules.** 12 embodied rules in the many-odor world (`odorShiftEvery` 32):
  - pairs rules: seeds 2001001–2001006;
  - staircase rules: seeds 2001007–2001012.
  - The odor table is built as in P8.
- **Arms.** All arms use step 4, replays 1 and threshold decisions:
  - **NONE** (no skill): masks `[0]`, bias only.
  - **S0** (lifetime learning over single bits): the starting program.
  - **TRUE** (true terms from birth): masks `[0, ...target]`. Weights are still learned in life.
- **Scales.** `nutrientScale` ∈ {0.75, 1, 1.5}, with `toxinScale` at 1.
- **Histories.** 16 per rule: `makeHistories(2002000+k, 16)`. All arms and scales use the same histories.
- **Outcomes.** Survivors (of 24 founders) at the end of the run, and energy per founder. Each outcome is the mean over 16 histories, giving one value per rule.
- **Statistics.** The test is an exact one-sided sign-flip test over 12 rules.

## Criteria

At each scale:

- **S1:** TRUE − NONE survivors has mean ≥ 3 and p < 0.01.
- **S2:** NONE survivors has mean ≥ 2. This rules out a scale where the unskilled flies die out.

**The milestone is met** if at least one of the three scales passes both S1 and S2. p < 0.01 at each scale is roughly Bonferroni for three scales.

**Reported (not gated)** at each scale:

- S0 − NONE survivors: whether lifetime learning changes survival;
- TRUE − S0 survivors;
- energy for all arms.

## Labels

- The many-odor world is opt-in, and the tasks are constructed.
- TRUE is an oracle program, used to measure what skill is worth, not something the flies found.
- Smoke runs use seeds offset by +500.

Runner: `scripts/p14-survival.mjs`. Output: `evidence/p14/run.json`.
