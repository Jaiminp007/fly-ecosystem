# Supported taste representation decomposition

For each protect D survivor in the eight reused histories, compare A and B
checkpoint cue-taste parameters. Verify the acquisition codebook's A and B
cue sets are disjoint and test whether every A-cue residual is unchanged after
B. On the existing saved-A and saved-B A-probe traces, independently decompose
each nonzero cue's B-minus-A logit into the shared-weight and cue-residual
terms, verify observed cue membership and the selected model's probability, and
record support counts, trace hashes and per-history aggregates.

This diagnoses parameter sharing on observed inputs; it does not prove which
updates caused any physical outcome, use hidden valence as a learner input, or
qualify a skill. The codebook is used only by this offline auditor for cue-set
membership. No counterfactual labels, new rollouts or reserves are used.
