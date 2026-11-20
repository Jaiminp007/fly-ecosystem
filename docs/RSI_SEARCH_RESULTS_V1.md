# Bounded self-improving search: results V1

> Later verdict (2026-11-14): RSI is not met. See [VISION.md](VISION.md),
> [RSI_V7_RESULTS.md](RSI_V7_RESULTS.md) and
> [fable-review/FABLE_REVIEW.md](fable-review/FABLE_REVIEW.md).

Date: 2026-11-11. Script: `scripts/rsi-search.mjs`, evaluator
`learning/taste-program-eval.mjs`. Data (local, gitignored):
`evidence/rsi-search/run-20261111.{json,log}`. Wall time 42 minutes,
about 2,300 embodied worlds.

## Setup

- Level 0, the fly's taste learner. A program is {feature code: pairwise or
  identity, step size, replays per live update, memory size, prior}.
  Changing the code changes which odors share learned information, so this
  counts as a bounded learning-algorithm redesign, not just tuning.
- Level 1, the proposer. It holds weights for which dimension to mutate and
  which value to try.
- A revision is accepted only if the candidate beats the incumbent on 6 dev
  histories (mean gain > 0, at least 4/6 paired wins) and then again on 6
  fresh confirmation histories.
- After each search, the proposer rewrites its own weights from its own
  record of accepted and rejected proposals.
- Score = each surviving fly's own taste discrimination over tasks A, B and
  C at the end of C (acquisition and retention together).

## Results by gate

**(a) Successive accepted revisions: MET (2).** Both were found by the loop,
not by hand, and each was confirmed on fresh histories:

1. step 0.5 -> 4 (normal world, confirmation gain +0.178)
2. pairwise -> identity code (short world, +0.075)

The loop rediscovered the identity code from M2 without being told about it.

**(d) Learning-algorithm redesign: MET (bounded).** Revision 2 changes the
representation, not only a rate. The revision space itself is fixed and
hand-written.

**Proposer self-revision: happened.** v0 -> v1 -> v2. Mutation mass moved to
code and step, and value mass to identity and step 4.

**(b) Better subsequent search: NOT MET against the copy control.** Mean
final score on 3 held-out problems x 3 search seeds, budget 8:

| arm | mean final score |
|---|---|
| fixed proposer, default start | 0.329 |
| revised proposer, default start | 0.387 |
| fixed proposer, copied best program | 0.461 |
| revised proposer, copied best program | 0.461 |

The revised proposer beats the fixed one (most clearly in the normal world).
Copying the best program beats both, and searching from the copy finds no
further improvement except one replays change. The gain is explained by
carried knowledge, not by a better improver. The landscape has one
dominant direction (identity code with a large step wins in every world
tested), so there is little left to search for after the first discovery.

**(c) Embodied benefit: WEAK.** Best program {identity, step 4} vs default
on 32 fresh histories:

| measure | better / worse histories |
|---|---|
| taste skill (0.614 vs 0.432) | 31 / 1 |
| survivors (4.06 vs 3.75 of 24) | 15 / 7 |
| energy | 21 / 11 |

The skill gain is clear. The survival and energy gains are directional and
short of significance (sign test, p of about 0.07).

## Verdict

Bounded RSI is partially demonstrated: an autonomous loop made two successive
validated revisions to the fly's learning algorithm, one of them
representational, and revised its own search policy. Full RSI as gated is not
met. The improved search does not beat simply copying the improvement, and
the survival benefit is not significant. To pass (b), the revision space has
to keep producing new improvements after the first ones (a space that
compounds), for example operators that compose new feature codes instead of
choosing from a fixed list.

## Follow-up: composable codes (V2 and V3, 2026-11-11)

Script `scripts/rsi-compose.mjs`. Data (local): `evidence/rsi-compose/`.

**Changes.** The taste code is any subset of the 16 Walsh terms
(`tasteCode: 'masks'`). Moves are add, remove, swap, reduce-to-one-term,
plus step and replay changes. Problems are "odor chemistry" worlds: an odor's
value is a hidden product rule over its bits, with short phases. A code
matched to the rule scores about 0.68, the full code about 0.50, and a wrong
sparse code about 0, so copying the previous winner fails on a new rule. Test
rules are disjoint from the training rules. The improver (weights over
operators and over term order) rewrites itself after every two training
problems. Two training problems with 20 proposals each feed each revision.

**Gate (a) again: MET.** Training made 2-4 confirmed successive revisions per
problem (for example reduce to [0,1] at +0.22, then add at +0.06), and
compositions of earlier accepted moves kept producing new accepted moves.

**Gate (b): NOT MET.** Mean held-out score after a 12-evaluation search:

| run | start | no search | v0 fixed | v1 | v2 | paired v2 vs v0 |
|---|---|---|---|---|---|---|
| V2, count credit, 2 seeds | copy | 0.417 | 0.447 | 0.461 | 0.462 | 7-3 (v2 vs v1 10-3) |
| V2 | identity | 0.474 | 0.490 | 0.496 | 0.512 | |
| V3, gain credit, fresh banks, 3 seeds | copy | 0.216 | 0.366 | 0.314 | 0.359 | 10-9 (v1 vs v0 5-10) |
| V3 | identity | 0.519 | 0.541 | 0.548 | 0.548 | |

V2 showed a small, borderline edge. V3 changed the credit rule after V2 was
seen, so it was run on fresh test banks with flipped rule signs, and it did
not reproduce the edge. Every arm beats no search; the revised improver does
not beat the fixed one.

**Why it fails.**

- The improver learns from about 40 proposals with 2-4 acceptances per
  revision. That is too little signal to rank 8 operators and 4 term orders
  above the evaluation noise.
- More fundamentally, the winning move needs the right term (1 of 15), and
  this improver can only learn which kinds of move tend to work. It cannot
  look at the fly's experience to see which term predicts food value.
  Operator statistics alone barely change the odds of that event.

**What would be needed.** An improver that proposes from data (for example,
from correlations between each Walsh term and the outcomes the fly
recorded), with that proposal machinery also open to revision, and many more
training problems per revision. That is new design work with no result yet.
It is not run here.
