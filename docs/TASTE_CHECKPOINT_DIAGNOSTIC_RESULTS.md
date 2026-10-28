# Taste checkpoints: exposure and label diagnostic

This retrospective analysis uses the 56 cue-shared D survivors from eight
previously reused histories. It evaluates each survivor's saved A, B, C and D
taste weights on the four fixed codebook cues of each family, equally weighted.
The hidden codebook valences are **evaluator-only**: they are not provided to
the learner. These scores are not physical outcomes, independently sampled
qualification data, or estimates for dead founders.

| Saved model | A acceptance separation | B acceptance separation | A log loss | B log loss |
| --- | ---: | ---: | ---: | ---: |
| A | 0.5100 | 0.0371 | 0.3207 | 0.7853 |
| B | 0.5104 | 0.1951 | 0.3312 | 0.6553 |
| C | 0.4878 | 0.1801 | 0.3626 | 0.6759 |
| D | 0.4878 | 0.1801 | 0.3626 | 0.6759 |

Separation is mean acceptance propensity for beneficial cues minus that for
harmful cues; log loss uses the actual stochastic acceptance propensity.
Examples per surviving body averaged 64.45 in A, 119.43 in B, 96.09 in C,
and zero in odor-free D. These are counts, not independent samples; repeated
contact can dominate. The balanced-cue results suggest A discrimination
persists descriptively while B improves less, but neither establishes the
required functional-pressure contrasts or causality.

The D-checkpoint reservoir contains 1,788 retained records: 1,009 from A,
468 from B and 311 from C. Their own factual targets disagree with the matched
codebook valence in 116, 54 and 21 records respectively (191 overall). These
are retained, possibly repeated records, not the complete training population
or a measured independent error rate. The credit adapter associates the
nearest contact cue with the sign of the body's observed `lastFood`; agreement
with an individual patch's valence is not guaranteed. The causes and physical
consequences of the discrepancies remain unestablished. No hidden labels or
counterfactual outcomes may be introduced into future training.

`evidence/taste-checkpoint-diagnostic/20261026-v1` contains source hashes,
input hashes, per-founder records and results. Two focused tests pass; the
separate readback checks 32 input hashes, 2,688 cue/model evaluations and all
1,788 retained memories. It does not replay physics or audit all past examples.
All prior failures, closed reserves and the full staged objective remain.
