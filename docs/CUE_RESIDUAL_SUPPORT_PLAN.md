# Cue-residual support diagnostic

Use the already audited offline cue-residual rows and their original
checkpoint codebooks. For each selected founder and each B cue, count that
founder's own A/B factual examples with the same observable cue, and compare
saved end-B shared-only and shared-plus-cue log losses. Partition the fixed
diagnostic into zero, one and at-least-two matching examples; verify that an
unseen cue's residual remains zero. Reconstruct original per-history B loss
differences from the cue-level numbers. Use codebook valence only for offline
evaluation, never for learning.

This is a post-outcome decomposition on repeated, survivor-selected and
correlated histories, not a new prospective pass, physical intervention or
causal estimate. It cannot justify tuning a threshold on these outcomes. Audit
all linked source hashes, support counts, predictions and aggregation; retain
prior failures, the original benchmark and closed reserves.
