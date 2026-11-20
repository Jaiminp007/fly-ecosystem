# Microverse goal ladder

The goals and thresholds were fixed on 2026-11-17, before any fixing began. They do not move.

The microverse is a small, closed, resource-limited world (`microverse/sim.mjs`). Flies in it live, learn, breed and die continuously. Each brain is a heritable program: taste feature masks, movement feature masks, innate movement instinct, and learning genes. Learned weights are never inherited.

## Workflow

1. **Practice suite.** Run the universal test (`node microverse/suite.mjs dev`) on practice seeds 101–108.
2. **Fix order.** Take the lowest failing goal on the ladder. Fix it with a real design change to the world or the brain. A fix may not hand the flies the answer, for example by building the true rule into a default strain.
3. **Re-run the whole suite after each fix,** so that a fix to one goal cannot silently break another.
4. **Escape hatch.** If 5 attempts in a row make no progress on a goal, stop tweaking. Either redesign the part behind it, or mark the goal **blocked** with the reason.
5. **Final suite.** When every goal passes on practice, run `node microverse/suite.mjs final <base>` on 8 fresh seeds that have never been used. A goal is **closed** only if it passes there. If anything fails, go back to the loop, and use new seeds for the next final run.

The attempt log is in [MICROVERSE_LOG.md](MICROVERSE_LOG.md). Every final run's seeds are recorded there and never reused.

## Common settings

- **Length.** Each world runs 20,000 ticks.
- **Rule schedule.** The hidden food rule cycles every 3000 ticks: pairs → staircase → triples → single.
- **Competition worlds.** Two strains start 30 founders each. A strain's **share** is its fraction of the population, averaged over ticks 15,000–20,000. A seed counts as a win for strain A if its share is > 0.5. A seed where the population goes extinct counts as a loss.

## Goals

| # | Goal | Test (8 seeds) | Pass |
|---|---|---|---|
| G1 | The world is livable | FIXED strain alone | Alive at 20,000 in ≥ 7/8 seeds. In each surviving seed, the mean population over 10,000–20,000 is between 30 and 360 (capacity 400), and there are ≥ 200 births. |
| G2 | Taste matters | ORACLE (born with the current rule's true terms) vs FIXED | ORACLE mean share ≥ 0.65, and ORACLE wins ≥ 7/8 seeds |
| G3 | Movement matters | FIXED vs RANDMOVE (random moves) | FIXED mean share ≥ 0.65, and FIXED wins ≥ 7/8 seeds |
| G4 | Learning in life helps | FIXED vs FROZEN (same innate brain, no learning) | FIXED mean share ≥ 0.60, and FIXED wins ≥ 7/8 seeds |
| G5 | Self-improvement helps | SELF vs FIXED, and SELF vs SHAM (random revision) | Both pairings: SELF mean share ≥ 0.60, and SELF wins ≥ 7/8 seeds |
| G6 | They adapt | SELF alone | For each rule epoch, mean skill in the last quarter minus the first tenth ≥ 0.2 on average, with late skill ≥ 0.5 on average, and the world alive at 20,000 in ≥ 7/8 seeds (validity condition added after the baseline; see the log) |
| G7 | Both systems improve | SELF vs TASTE-ONLY, and SELF vs MOVE-ONLY | Both pairings: SELF mean share ≥ 0.55, and SELF wins ≥ 6/8 seeds |

**Skill** is P(eat | good) − P(eat | bad) over the 16 current odor kinds.

**ORACLE** is a measuring instrument, not a candidate. At birth it gets the true terms of the rule in force.

## Labels

- The microverse is a new, constructed world.
- Every revision operator and gene grammar is hand-written.
- A pass means these flies, in this world, do these things. It does not mean open-ended intelligence.

## G7b: a separately named, lower-drift re-test of G7 (frozen 2026-11-17, before its run)

G7 failed both registered final runs (3/8 and 5/8). It stays recorded as **failed as registered**.

Per the Fable review, the winner-take-all contests are drift-heavy: one bit per seed, and a 6/8 bar that passes 14.5% of the time under the null. G7b uses a continuous fitness measure instead.

- **Measure.** Each strain lives alone in the same seeded world. The outcome is the mean population over ticks 10,000–20,000; ticks after an extinction count as 0. Runner: `microverse/solo.mjs`.
- **Code.** Commit `da995b0`, the code on which G1–G6 passed final run 2. No further tuning toward G7 was made.
- **Practice estimate** (seeds 101–116): SELF − TASTEONLY = +1.41 flies, 13/16 positive, p = .033.
- **Seeds.** 48 fresh seeds, 70001–70048, sized for about 80% power at α = .01 from the practice spread.
- **Pass.** Both SELF − TASTEONLY and SELF − MOVEONLY must have mean ≥ 0.7 flies (half the practice estimate) and one-sided sign-flip p < .01 (Monte Carlo, 200,000 draws).
- **One shot.** If G7b fails, G7 is reported as not shown and the loop stops for this goal.

## G7c: a separately named re-test of "both systems improve" (frozen 2026-11-18, before any G7c tuning)

G7 (failed 3/8 and 5/8) and G7b (+.88, p .0119) **stay recorded as failed**. G7c is a new test with the same claim and the same measure as G7b.

**Changes from G7b:**
1. **Practice loop.** The movement self-revision may be redesigned on the 48 practice seeds 101–116 and 301–332, with at most 5 attempts. The default world is not changed. A headroom check comes first: does movement have room left over taste-only flies?
2. **Power.** The final uses **96** fresh seeds (94001–94096). G7b's 48 seeds were sized from a practice estimate of +1.41 that proved too high; at the observed +.88 they gave roughly a coin-flip chance of p < .01.

**Selection rule.** If an attempt beats the current SELF on practice SELF − TASTEONLY, the best such attempt goes to the final; otherwise the current SELF does. The final is run once.

**Pass** (the G7b bar, unchanged): SELF − TASTEONLY ≥ .7 flies and SELF − MOVEONLY ≥ .7 flies, both with one-sided sign-flip p < .01 (200,000 Monte Carlo draws). Every G1–G6 strain uses the same code; if movement revision changes, the full universal suite is re-run on practice to check that nothing else broke.

**Reported together:** G7b's result, and a pooled G7b + G7c estimate.
