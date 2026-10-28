# Supported taste representation and replay

The first decomposition attempt incorrectly assumed that disjoint A/B cue sets
implied unchanged A residuals; it failed and remains preserved as documented in
`SUPPORTED_TASTE_DECOMPOSITION_RECOVERY.md`. The post-failure v2 census finds
103 changed and 137 unchanged A-cue residual slots across 60 D survivors. All
60 had at least one own A example; 34 had at least one own B example. These are
survivor-selected, reused development data.

On the saved-A A-probe trajectory, the absolute B-minus-A logit change averages
0.307523 from shared weights and 0.088943 from residuals over 14,383 odor-present
decisions. On the saved-B trajectory the corresponding values are 0.292283 and
0.090669 over 14,379 decisions. These are separately averaged absolute terms,
not additive or causal contributions to physical performance. Both components
can change; a smaller average term may still change sampled actions.

An independent B-phase own-credit and RNG reconstruction covers all bodies
active during B, not just D survivors. Of 8,572 factual current examples, all
have B-family cues; the replayed examples comprise 2,403 A-family and 6,169
B-family cues. Thus factual reservoir replay does revisit A while learning B,
consistent with the observed A-residual changes. This does not establish the
effect of those changes on the failed pressure gate.

Evidence: `evidence/supported-taste-decomposition/20261026-v2` includes an
independent 29,164-decision parameter/logit readback. The replay audit is
`evidence/supported-steering-development/20261026-v1/taste-replay-readback.json`:
it reconstructs 8,572 own examples, sensory and taste work, and exactly replays
eight B acquisition phases. Neither audit independently simulates physics or
proves hardware energy adequacy. The completed v2 analysis is post-assertion
and outcome-informed; it is not fresh qualification.

The paid taste-by-steering factorial remains the appropriate causal diagnostic.
Disk is critically low; it must not be run below its documented free-space
guard. Preserve v1, v2, all prior evidence and closed reserves.
