# Acquisition geometry support design

The default cue-acquisition grid cannot present the overlap action: neighboring
patch centers are at least 32 apart while the selector requires at most 30. This
is an action-support failure, so no default-grid performance run can establish
acquired steering. The prior grid implementation and failed readiness evidence
remain available.

For one explicitly different acquisition condition, initialize patch positions
once using the existing `enterContinualPhase` random-layout procedure and the
history's A resource seed, then apply the normal A cue phase. Later cue phases
retain these positions and use their existing cue labels, resource seeds and
clocks. The random layout does not refill food or body energy and does not
consume the physical or ecology RNG. All acquisition arms use the identical
layout rule and identical initial seeds. No pair threshold, rank, guard or
learner parameter is changed.

The default remains the original grid. This modified acquisition environment
must be identified in every future protocol and compared only with controls
given the same geometry, interface, training opportunity and costs. A cheap
native-full control remains required. The transfer probe continues to use its
existing original-ecology procedure and distinct transfer seed, with no learning
in the frozen probe; it is not replaced by the training layout. Distinct-task
retention, functional pressure, survival, independent audits and fresh
qualification requirements remain unchanged.

Initial validation is engineering only: show deterministic matched initial
physics, conserved energy and RNG, restored continuation, preservation of
positions across cue-phase changes, and actual available and executed actions in
a small developmental fixture. This is not proof of acquired skill, favorable
performance, action support for every founder or generalization. Capture full
cost and provenance before interpreting a future development experiment.
