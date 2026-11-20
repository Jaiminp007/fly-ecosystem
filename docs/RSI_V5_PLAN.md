# RSI V5 plan: invented moves, revised update rule, unseen world family

Date: 2026-11-12. Written and committed before any V5 run.
Script: `scripts/rsi-v5.mjs`.

V4 passed its own test, but that test was narrow: the winning move
(guidedReduce) was hand-written, the update rule was fixed, and the test
worlds were from the training family. V5 tests the three things V4 lacked.

## Levels

- **Level 0, fly taste program:** `{masks, step, replays}`, as in V2–V4.
- **Level 1, improver = a library of moves with weights.** A term move is
  built from three primitive genes:
  - action: `add` (from terms not in the code), `remove` (from terms in
    the code), or `keepOnly` (code becomes bias + the chosen terms);
  - ranking: `evid`, `antiEvid`, `random`, `lowOrder` or `highOrder`, where
    evid is |evidence| from the flies' own taste experience;
  - k: 1, 2, 3, 4, 6 or 8 terms.

  That makes 90 term moves, plus 4 fixed hyper moves (step±, replays±).
  **The seed library has only the three blind moves** (add/random/1,
  remove/random/1, keepOnly/random/1) and the hyper moves. While training,
  the system **invents** moves by mutating one gene of a library move. It
  tries them, and keeps them only through credit. No guided move is given.
- **Level 1 update rule U:**
  - each move's weight = floor + (credit + 0.5·α)/(tries + α), revised
    after each training problem;
  - credit is `count` (1 per accepted proposal) or `gain` (10 × confirmed
    gain);
  - ρ = invention rate;
  - U = {credit, α, ρ, floor}.
  - U0 = {gain, 1, 0.25, 0.2}, the hand-chosen default (V4's rule plus
    invention).
- **Level 2, revising the update rule:** a fixed hill climber, 5 proposals.
  Each proposal mutates one parameter of U. It trains a fresh library with
  that U (training seed 1), then validates on 4 validation problems × 3
  search seeds (identity start, budget 6). It is accepted if the mean is
  higher and paired wins > losses against the incumbent U.

## Problems (short phases, 160/160/160/64)

- **Train:**
  - single term 3 (+)
  - majority of terms (1,2,4) (+)
  - single 5 (−)
  - majority (2,8,6) (−)
- **Validation (meta level only):**
  - single 9 (+)
  - majority (1,4,8) (−)
  - single 6 (−)
  - majority (2,4,9) (+)
- **Test, an unseen family:** threshold rules over raw odor bits, i.e.
  AND/OR of 2 or 3 bits. Their Walsh expansion has unequal weights, 3 or 7
  terms, plus a bias. That is a different structure from both training
  families. Eight rules:
  - AND(0,1)+
  - OR(2,3)−
  - AND(0,2,3)+
  - OR(0,1,2)−
  - AND(1,3)−
  - OR(0,3)+
  - AND(1,2,3)−
  - OR(1,2)+

  Bank seeds 985001–985008. Not touched by any smoke run.

## Test (fixed before running)

Three fresh training replicates (training seeds 101, 102, 103) are run for
U0 and for U* (the final level-2 rule). Libraries are frozen at test (no
invention, no revision). Each is run on all 8 test rules × 2 search seeds,
identity start, budget 6, with the final score on 8 held-out histories. L0 is
the seed library with uniform weights, run on the same rows. Search seeds
are shared across libraries, so rows pair on (replicate, rule, seed): 48
pairs per comparison.

- **C1, update rule revised and the revision helps:** U* ≠ U0, and on the
  test, U* vs U0 gives wins > losses, one-sided sign test p < 0.05, and a
  higher mean.
- **C2, the system generates new kinds of move:**
  1. In U0's trained libraries, invented moves hold > 50% of the total
     term-move weight (mean over replicates).
  2. U0 vs L0 on the test gives wins > losses, p < 0.05 and a higher mean.

  U0 is used so that C2 measures invention alone, not the level-2 change.
- **C3, the gain carries over to a different kind of world:** C2(2) holds on
  the threshold-rule test family, which training never saw. In addition,
  U0's mean final score must exceed the no-search identity score.
- **Reported, not gated:** paired energy for U0 vs L0 and U* vs L0;
  survivors; which moves were invented and kept; the U* parameters.

Failures are reported as failures. No reruns or rescoring of the test bank.

## Known limits, stated up front

- The primitive genes are hand-written. One of them (`evid` ranking) is an
  ingredient of V4's guided move. The system has to discover combining it
  with the right action and k, and to weight the result. It does not invent
  primitives.
- Level 2 is a fixed hill climber. Nothing revises it.
- Worlds are still short-phase constructed worlds. The harsh long world is
  not tested here.

## Amendment before the first full run (2026-11-12)

The smoke run plus a learnability probe (non-test bank 991777, threshold
worlds AND(0,1)+, OR(2,3)−, AND(1,2,3)−) showed that the V2–V4 score field
mixes base rate into skill. Summing ±P(accept) over items rewards "accept
everything" when most odors are good: score 1.35 for AND(1,2,3)−, against
1.06 for a bias-only code that cannot tell odors apart. V5 therefore scores
every level (training, validation, test) by `discrimination`, which is
mean P(accept|good) − mean P(accept|bad) within each family that has both
classes, averaged over families and flies. On that probe the bias-only
code scores 0, the identity code 0.44–0.47, and the correct small code
0.58–0.63. The old `score` field is unchanged, so V2–V4 results are not
affected. No test-bank seed was used.
