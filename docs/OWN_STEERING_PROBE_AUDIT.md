# Frozen-probe engineering audit

The synthetic randomized-layout fixture acquires for 80 ticks with four
founders, including one deliberately short-lived founder. It captures an earlier
40-tick snapshot and an 80-tick physical checkpoint. A separate run from the
captured earlier checkpoint reproduces the later checkpoint exactly using the
captured source; this is not an independent physics implementation.

Seven 30-tick forks cover A current/earlier/reset and transfer
current/reset/forced-native/forced-guarded. Within each task, all starting world
hashes match. A separate checker verifies source hashes, per-founder saved/reset
weights, frozen state, forced actions, inherited debt and setup charges: 106
declared operations for current/earlier and 213 for reset. It checks 630
decision/receipt/observation triples. Additional separate readbacks reconstruct
the declared per-step work and reported-work/storage/debt ledger for those same
630 triples; no motor or taste training occurs during the probes.

Evidence, captured sources, checkpoints, tapes and readbacks are in
`evidence/own-steering-probe-fixture/20261026-v1`. These are engineering checks,
not performance results. The replay establishes ancestry only for this synthetic
fixture. The readbacks rely on logged physical state and the existing abstract
operation convention; they do not independently simulate physics or establish
skill, retention, survival, affordability or transfer.

The multi-history collector, actual A/B/C ancestry checks, complete functional
pressure and fresh qualification remain outstanding. Closed reserves remain
closed, and later autonomous revision/search-productivity criteria still apply.
