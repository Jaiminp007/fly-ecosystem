# Factual steering replay: development hypothesis

The reused-history component diagnosis suggests steering interference may
contribute to the A retention deficit, but it does not establish an individual
causal mechanism. Test one fixed alternative: retain a uniform reservoir of
32 actual own steering transitions over the entire lifetime and perform one
additional one-step Q-learning update from a uniformly sampled record after
each factual transition. No phase, timer, fork outcome, hidden label, or other
body's experience enters routing or memory. The stored actual action, energy
change, next features, next-action availability and terminal flag define the
record. The replay learning rate is 0.01; the original live rate remains 0.05.
This is a fixed developmental hypothesis, not an optimized hyperparameter.

Exploration, physical experience and updates remain online; replay does not
freeze an earlier checkpoint. Reservoir replacement and replay use independent
per-body RNG streams. All retained records, pending transitions and RNG state
must be included in the normal encoded-state storage charge; every replay,
copy, draw and replacement operation must be billed. Unpaid debt and terminal
work remain payable. Freeze discards pending credit without fabricating a
transition; terminal credit uses the actual terminal energy. Reset clears the
reservoir as well as weights. Checkpoint restore must reproduce continuation.

Before any world outcome, validate provenance, math, terminal and freeze
boundaries, serialization and explicit work accounting. Integration requires
matched controls with the same sensors, curriculum, physical starts and
appropriate paid overhead, plus cheap native-full and reset controls; candidate
memory and work cannot be made free. Existing retention and transfer gates,
fresh qualification and functional-pressure requirements remain unchanged.
Do not use reused development outcomes as qualification or fork labels as
training data. A replay learner is not itself evidence of acquired skills or
autonomous algorithm revision.

## Prototype boundary

`learning/replay-steering.mjs` is available through the optional `replay`
steering learner in `OdorRoutedExperiment`; the default remains the original
learner, including for older checkpoints. Synthetic world tests check encoded
storage on every decision, parent work billing, same-world saved/current/reset
forks, terminal debt and exact checkpoint continuation. A separate test
reconstructs 90 factual transitions, reservoir replacement, sampled updates,
weights and declared work from an independent reference implementation.
Sixteen focused tests pass across the replay and original world interfaces.

The traced synthetic fixture at `evidence/replay-steering-fixture/20261026-v1`
covers three matched-world arms, a shortened cue/odor-free transition and a
forced early death. Separate readbacks reconstruct 723 decision/receipt/observe
triples and their storage, payments and debt; 714 replay-steering updates and
705 routed-motor updates; and exact checkpoint continuation with the source
captured at launch. The ledger
checker uses the steering work deltas that the independent steering checker
separately reconstructs. This is an engineering fixture, not a developmental
result: it checks the declared abstract operation schedule, not complete
low-level adequacy, and does not independently simulate physics.

Saved/current probes retain the D-body replay memory while copying only saved
model weights; reset removes its memory and is therefore a potentially cheaper,
stronger control, not an equal-memory comparison. A fixed matched developmental
protocol is still required before collecting research outcomes.
