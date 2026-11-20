# M2 across distinct tasks: orthogonal taste code removes forgetting

Date: 2026-11-11. Runner: `scripts/m2-identity-retention.mjs`.
Data: `evidence/m2-identity-retention/bank-20261111-n32.json`,
`evidence/m2-identity-retention/bank-20261112-n32.json`.

## Cause of the forgetting

The odor-routed taste learner scored cues with 11 shared features (bias,
4 cue bits, 6 pairwise products). Tasks A, B and C use disjoint cue
patterns with their own good/bad assignments, and the shared features
cannot represent all of them at once, so every gradient step on a new
task moved the old tasks' predictions. Offline, on 200 codebooks, the
pairwise model kept 85% of task-A accuracy after training B and C.

## Change

`tasteCode: 'identity'` (opt-in; the default stays `'pairwise'`) scores
cues with the complete 16-term Walsh basis over the 4 bits. Distinct cues
get orthogonal feature vectors, so a step on one cue cannot move any other
cue's prediction. Unit test: `tests/odor-routed-taste.test.mjs`. Offline
retention: 100%.

## Embodied test

Curriculum A (stable) -> B (moving) -> C (scarce) -> return-A, 1792 ticks,
24 flies, learned steering, no added rehearsal. Two independent fresh banks
of 32 histories each, both arms on identical histories.

Skill = each fly's own taste model, P(accept | good cue) - P(accept | bad
cue) on a family's 4 cues. Retention pairs every fly alive at the end of C
with that same fly's model at the end of the phase that taught the family,
read before return-A re-exposes A. Most flies die in C, so population means
across anchors would compare different flies.

| bank | arm | A retained | B retained | identity better, A / B (paired) | survivors /24 |
|---|---|---|---|---|---|
| 20261111 | pairwise | 0.839 | 0.864 | | 3.06 |
| 20261111 | identity | 1.075 | 1.090 | 24/31, 25/31 | 2.91 |
| 20261112 | pairwise | 0.933 | 0.910 | | 3.03 |
| 20261112 | identity | 1.074 | 1.043 | 22/30, 20/30 | 3.38 |

Values above 1 come from reservoir replay, which keeps consolidating old
cues while the fly learns new ones. Task C discrimination at the end of C
was also higher with identity on bank 20261111 (0.47 vs 0.40).

## Verdict

Earlier useful behavior (which odors to eat) is kept across three
sequential distinct tasks, which closes the M2 across-task row for this
skill. Limits:

- No generalization: an unseen cue starts at the prior. The pairwise model
  generalizes, but only at chance on these random codebooks.
- Survival is unchanged (about 3/24 in both arms). Colony deaths in the
  scarce phase are a separate ecological problem; keeping the skill does not
  fix it.
- Steering and motor learning are not addressed (the diagnostics measured
  them as near-inert).
- The odor-free "transfer" probe of rounds 1-10 is not used. It forces
  odor absent, so a taste skill cannot be expressed there.
