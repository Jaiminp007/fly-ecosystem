# Own-steering randomized-geometry fixture audit

## Complete declared-work readback

`scripts/check-own-steering-work.mjs` independently reconstructs every declared
controller-work increment in the v4 fixture, including motor TD/replay branches,
reservoir decisions and taste-credit/update branches. It matches all 723
decision and 723 observation increments, including 714 motor updates and 96
taste examples across the three arms. This joins the earlier storage/debt,
own-steering and sensory readbacks on the same fixture.

The checker uses logged state and the project's existing abstract operation
convention. Agreement shows that the stated increments were charged; it does
not prove that the convention captures every low-level instruction, that the
logged physical snapshots were generated correctly, or that this short fixture
establishes affordability. Frozen/reset probe branches and full development
histories still need separate audits. Results are in
`evidence/own-steering-fixture/20261026-v4/work-readback.json`.

## Sensory follow-up

The `20261026-v4` fixture additionally records the full food snapshot and fly
pose at sensing time. A separate checker compares all 723 local queries against
the logged world snapshots (448,260 patch observations), reconstructs local
coordinates, native food direction, cue/contact selection, and a lower bound
on the work charged for these computations. Separate readbacks also reconstruct
the learner and reported-work/storage/debt ledger for the same fixture. The
15 focused tests, including observer neutrality, pass after instrumentation.

These checks do not independently replay physical dynamics, prove snapshot
provenance, or reconstruct the complete taste/motor operation count. Work is
checked against a lower bound, not fully audited. Frozen/reset probes and the
actual multi-history development study remain to be independently checked.
Evidence: `evidence/own-steering-fixture/20261026-v4` and
`scripts/check-own-steering-senses.mjs`. Source hashes in v2/v3 describe their
respective earlier live implementations; all prior fixtures remain preserved.

## Billing follow-up

The separate `20261026-v3` fixture adds opt-in audit snapshots at decisions and
after observation work is billed. A separate checker independently verifies
723 decisions, 723 physical receipts and 723 observations across three arms:
exhaustive midpoint scoring from logged local points, guard arithmetic, canonical
state bytes, charges based on reported operations, payments and terminal debt.
The checker does not independently reconstruct sensing, the reported total
operation counts, or physics; the snapshot instrumentation itself is not an
embodied controller. Fifteen focused tests pass, including a direct comparison
showing snapshot observation does not change the world, learner state or bills.

Evidence: `evidence/own-steering-fixture/20261026-v3` and
`scripts/check-own-steering-billing.mjs`. These are small synthetic fixtures,
with an intentionally short-lived founder; they do not establish scientific
performance. Source hashes in the earlier v2 fixture refer to the earlier source
state and will not match the now-modified live executor. Preserve both versions.

This is an engineering fixture, not a development performance comparison.
Each arm begins with four founders and the same randomized cue-acquisition
geometry; one founder is deliberately assigned an artificially short lifespan
to exercise terminal credit. The remaining bodies run up to 80 ticks.

An independent checker, without learner or engine imports, reconstructs feature
vectors from logged inputs, midpoint availability from the logged guard, RNG,
proposed and actual actions, own-energy temporal-difference updates, terminal
updates, steering-work counters and final learner state. It passes for 241
decisions per arm, including one terminal per arm. The learned arm executes 99
midpoints, forced native zero, and forced guarded 174. Trace and source hashes
and start/final checkpoints are preserved in
`evidence/own-steering-fixture/20261026-v2`.

This audit relies on logged observation, guard and energy values. It does not
independently reconstruct physical sensing, full operation counts, memory and
debt, or world dynamics; it does not verify frozen/reset probes or demonstrate
affordability, retention, transfer or useful acquisition. The earlier grid
fixture remains preserved separately under `20261026-v1`.

Next independently reconstruct complete controller operation counts and actual
sensory provenance, verify frozen/reset boundaries, then
freeze and run the matched acquisition and retention/transfer development
protocol. Keep the original strong controls and all qualification gates.
