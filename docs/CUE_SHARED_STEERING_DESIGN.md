# Cue-conditioned shared steering hypothesis

The A-component diagnostic implicates steering changes in aggregate but does
not prove individual causality. The current steering value function cannot
condition on the body's observed four-sign cue, although the cue-foraging
world assigns different observable odor patterns to A/B/C. Test one fixed
representation: a shared two-action linear steering value plus an additive
two-action residual for each of the sixteen observed signed cues and one for
the absent cue. Route solely from the existing own observable cue signs, never
task identity, clock, hidden valence, other bodies or fork outcomes.

All 17 residual banks are allocated and billed from initialization; every
bank, route operation, update, snapshot and reset is charged. The selected
bank and shared component both receive half of the original 0.05 one-step
factual Q-learning update, using the owner's executed action and next own
budget energy. A cross-cue transition updates the actual previous cue's bank
and bootstraps on the actually observed next cue; terminal credit uses the
actual terminal observation. Exploration, features, clipping and availability
rules otherwise match the original own-steering learner. This is fixed in
advance, not a cue-label oracle or a phase-specific saved model.

The shared component can still interfere across cues; separate residuals do
not themselves demonstrate functional pressure, retained skills or useful
transfer. The absent cue has no privileged transfer signal and must acquire
from its own factual experience. Fixed cost of all 17 banks and equal-access
model/reset controls are mandatory. In same-body A/B probes, saved/current
snapshots must include all 17 banks, and all arms pay the same bank-copy
schedule even when reset. Frozen-only memory compaction must not remove any
weights. No performance outcomes are allowed until the learner, billed
integration, actual-action provenance, cross-route/terminal credit, exact
checkpoint restore and matched probe snapshots are tested.

Any development success is still not fresh qualification: the original
survival, skill, 95% retention, demonstrable functional-pressure, original-
ecology transfer and later autonomous revision/search productivity gates remain
unchanged. Do not train on counterfactual fork outcomes or reopen reserves.

## Engineering status

The opt-in implementation in `learning/cue-shared-steering.mjs` is integrated
with the physical routed experiment and incremental selector. Its fixed initial
288-weight allocation and the 272 additional context-weight snapshot copies
are charged. Synthetic tests independently reconstruct 80 sequential own
cross-cue TD/RNG/work updates, check the actual action and terminal credit,
and exercise billed retained state, reset, saved-model copies, frozen-memory
compaction and exact checkpoint restore. These tests do not establish complete
low-level cost adequacy, acquired utility, pressure or any qualification gate.
The prospective development comparison is fixed in
`docs/CUE_SHARED_DEVELOPMENT_PLAN.md` before its outcomes.
