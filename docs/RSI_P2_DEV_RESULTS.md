# RSI P2 dev check: FAILED. All four gates missed. Taste-program RSI line ends.

Plan: [RSI_P2_PLAN.md](RSI_P2_PLAN.md), frozen in `a8f3678` and `fc7cb87`
before the run. Runner: `scripts/rsi-p2-dev.mjs`. Evidence (gitignored):
`evidence/rsi-p2-dev/dev.{json,log}`. Run time: 5.4 h, with no errors.

## Gate

| Gate | Needed | Got | Result |
|---|---|---|---|
| 1. Oracle O − B | ≥ 1.5 | **0.65** | fail |
| 2. Libraries with A_L − B_L > 0 | ≥ 5 of 6 | **3 of 6** | fail |
| 3. Mean A_L − B_L | ≥ 1.0 | **0.39** | fail |
| 4. Libraries needed for power | ≤ 12 | **84** | fail |

The six differences A_L − B_L were −0.46, −0.68, +2.28, −0.22, +0.97 and
+0.45 (sd 1.11).

Mean energy per founder over the 6 dev rules:

| Arm | Energy |
|---|---|
| No-search identity | −46.18 |
| Uniform grammar (B, 36 rows) | −45.62 |
| Trained libraries (A, mean) | −45.23 |
| Oracle (O) | −44.97 |

## What the libraries learned

All 6 libraries ranked a `keepOnly/evid/k` move first (k = 3 or 4), from
independent training banks. So training-time credit assignment found the
move family the P1 analysis points to.

## Why it failed: two design confounds, plus no headroom on gate rules

An earlier draft of this doc said "headroom, not learning". Fable's review
showed that reading is not supported, and every claim below has been
checked against `dev.json`.

1. **The oracle arm was not an oracle.** O ran with one search seed, and 4
   of its 10 moves are hyper moves. On s3+ it accepted only `replaysUp` and
   finished at −52.06. On the same rule B averaged −50.05 and A −50.21. An
   arm the uniform baseline beats is not a ceiling, so O − B (0.65) does
   not measure headroom.
2. **Frozen Thompson eval was close to uniform order.** The pooled variance
   was 7.3–15.2 per library, because it mixes differences between moves
   into the noise term. That gives a sampling sd of about 2.3 for a move
   tried once, against top-move means of 1.2–4.2, with about 90 competing
   moves. So the learned top move rarely sorted first. A accepted a
   `keepOnly/evid` move in 6 of 36 rule-searches, and B in 5 of 36. The
   output stores only accepted moves, so "not proposed" cannot be told
   apart from "proposed and rejected".
3. **Gate rules have no headroom.** On the three-quarter-good gates every
   arm is within about 0.9 energy of identity (−38.49).

Single-term rules do have headroom. Identity averages −53.86. A3, the one
library whose top move was used reliably, accepted `keepOnly/evid/3` on all
three and averaged about −49.0, a gain of about +4.9. A3 − B3 = +2.28. This
is one library picked after the fact, so it is a hint, not a result.

## Decision

The line still ends. Re-running with greedy eval on these dev rules is the
re-tuning the stopping rule forbids. A pass would also show little: all six
libraries found the same single move, so the "learner" learns one constant.
There is no chain of improvements for a level-1 learner to shorten, and the
best move does not depend on the problem.

The test (step 2) is not run.

Before any future RSI learner is written, its target must pass a headroom
check (roughly an hour of compute):

1. **Greedy oracle vs uniform:** a hand-coded "best move first" policy beats
   uniform order by a pre-set margin at the eval budget, over at least 3
   seeds per rule.
2. **Chain length:** level-0 search accepts at least 2–3 moves per run
   (here 0.5–1.0).
3. **Context dependence:** the best first move differs across problems. If
   one move wins everywhere, hard-code it instead of learning it.

Also: the eval-time ordering rule must be checked to see whether it
actually expresses the learned ranking. Here the pooled-variance flaw was
missed by both reviewers before the run.
