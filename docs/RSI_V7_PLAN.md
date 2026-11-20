# RSI V7 plan (committed before the full run)

Date: 2026-11-12. Script: `scripts/rsi-v7.mjs`. Follows
[V6](RSI_V6_RESULTS.md), which passed C2 and C3 but missed C1 (U* vs U0:
14–7, p = 0.095, with 27 of 48 rows tied).

## What changes, and why

- **Search budget 6 → 12, at validation and at test.** In V6 most rows tied
  because a budget of 6 usually ended with no accepted proposal: the first
  evaluation plus a 2-run confirmation leaves room for very few proposals.
  This makes the test measure library quality rather than luck in the
  first draw. V2 and V3 used 12.
- **Test size:** 3 replicates × 8 rules × 3 search seeds = 72 pairs per
  comparison, up from 48.
- **Fresh test bank:** 989001–989008, threshold rules with rule/sign
  combinations not used in V5 or V6:
  - AND(0,2)−
  - OR(0,3)−
  - AND(1,2)+
  - OR(2,3)+
  - AND(1,2,3)+
  - OR(0,1,3)−
  - AND(0,2,3)−
  - OR(0,1,2)+
- **Level 2 continues** from V6's accepted rule, {gain, α 2, ρ 0.25,
  floor 0.2, power 1}, rather than starting over. Its proposals are untried
  single-gene neighbours of the incumbent, in a shuffled order. The 7 rules
  V6 tried are excluded. The queue is regenerated after an acceptance.
  There are 4 proposals, each trained with 2 seeds and validated on the same
  validation bank as V6 (975101–975104 × 3 seeds), at budget 12.
- Everything else is as in V6: genes, seed library, the 8 training problems,
  invention by single-gene mutation, and U0 = {gain, α 1, ρ 0.25, floor 0.2,
  power 1} as the default comparator.

## Criteria

These are V6's criteria, unchanged. "Passes" means wins > losses,
one-sided sign test p < 0.05, and a higher mean.

- **C1:** U* ≠ U0, and U* passes against U0.
- **C2:** U* has ρ > 0, U* passes against U*-without-invention, and the
  top-weighted term move is invented in at least 2 of the 3 U* replicates.
- **C3:** U* passes against L0 on the unseen threshold-rule test, and U*'s
  mean exceeds the no-search score.

**RSI V7 passes only if C1, C2 and C3 all pass in this run.** Energy and
survivors are reported but not gated. A failure is reported as a failure.

## Limits

These are as in V6:

- The genes are hand-written.
- Level 2 is a fixed search.
- The phases are short, and no flies die.

V7 is a further design iteration: the budget and test-size changes were
made after seeing V6. This is disclosed here, and is why the test bank is
fresh.

## Restart note (infrastructure only)

The first V7 launch crashed after about 1 h. Two evaluation workers died
out of memory (machine memory pressure), and the run hung waiting for them.
It had reached level-2 proposal 1 of 4 and no test row had run. The worker
pool now replaces a dead worker and re-runs its job. Evaluation is
deterministic, and a test showed the retried result is identical. The run
uses 6 workers instead of 8. The run restarts from scratch with the plan
above unchanged.

## Second restart note (infrastructure only)

The restarted run was killed by a machine reboot on 2026-11-13, during test
replicate 102. By then level 2 had finished and rejected all 4 proposals, so
U* = {gain, α 2, ρ 0.25, floor 0.2, power 1}. The runner now has a `resume`
mode, which reuses the logged level-2 outcome instead of recomputing it.
Level 2 is deterministic. The runner also saves trained test libraries and
evaluated test rows to a checkpoint, so a later crash keeps finished test
work. Only replicate 101's means had been logged, and no test rows were
saved, so the whole test is recomputed. Replicate 101 must reproduce its
logged means (L0 0.4708, U0 0.4686, U* 0.5170, U*-without-invention 0.4713),
which checks determinism. The plan and criteria are unchanged.
