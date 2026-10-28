# Recency-replay v1 input-boundary correction

In the first offline collection, each example passed to the learner carried
an external `phase` field. The captured learner did not read, store or branch
on that field, and the independent replay matched its results, but passing the
field violated the prespecified no-phase-input boundary. Preserve v1 and its
readbacks; do not promote it as fully protocol-compliant.

The corrected learner now rejects any input outside the four factual fields
`agentId`, `tick`, `cue` and `target`. V2 retains phase only in the external
audit record and strips it before each learner call. It repeats the same fixed
screen after v1 outcomes, so it is not independent confirmation and does not
alter any original qualification criterion.
