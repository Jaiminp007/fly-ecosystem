# Taste decomposition assumption failure and continuation

The first `supported-taste-decomposition.mjs` run stopped before any per-history
results: the asserted invariance of A-cue residuals between A and B was false
for the first checked survivor (1.0888516407687474 versus 1.1294053151137207).
Its partial `20261026-v1` protocol remains preserved; it is not a completed
result. Although A/B cue sets are disjoint, the learner's factual replay buffer
can revisit prior A samples during B; disjoint immediate inputs do not imply
unchanged A residual weights. The checkpoint assertion alone does not establish
which replay caused the observed change.

The `20261026-v2` continuation retains the original inputs and decomposition,
but records both changed and unchanged A-cue residuals rather than assuming
invariance. This revision is informed by the failed assertion and is diagnostic,
not a pre-outcome test or a qualification. Record the full outcome and audit it
independently; do not discard the failed v1 or promote post-hoc findings.
