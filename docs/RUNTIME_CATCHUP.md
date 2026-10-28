# Runtime topology cache and catch-up scheduling

Recorded 2026-10-23T20:01:39.005Z. The server is running with a 10× target. The latest measured live ratio was about 8.21×; sustained 10× has not been established. These runtime changes preserve controller behavior and do not qualify a new learning policy or demonstrate RSI.

## Matched controller and world evidence

[Matched full-world replay](../evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/cached-topology-world.json) · [applied-code compatibility](../evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/applied-compatibility.json).

Inherited topology is immutable during a lifetime. The controller now caches hidden-node descriptors, feature order, and output-edge indices outside checkpoints, avoiding repeated filters and edge-routing lookups. Each trace reads its own previous activation, so it no longer copies the entire activity object before observation. Edge accumulation order, RNG draws, weights, learning rules, body size and energy prices are preserved. The cache adds derived process memory; it does not remove neural or memory costs from the simulated body.

Removing the copy alone measured only a small difference in the preliminary microbenchmark. The larger result came from the combined topology changes; the profile did not establish the copy as the dominant cost.

The full-world comparison restored one real breeding checkpoint with 95 flies and 512.1 mean neurons. Across 5 alternating repetitions of 200 ticks, the candidate was **1.45× faster**: median 1.398 seconds versus 0.966 seconds. Entire final checkpoints matched in every repetition, including acquired weights, memory records, activity, RNGs, births and mutations. This is local headless evidence for this workload, not a promise for all future topologies.

## Scheduler behavior

Previously the fixed wake schedule could wait while requested ticks were still overdue. The manager now reports whether work remains after its bounded 8-millisecond compute chunk. The server yields to I/O, then schedules another chunk promptly when behind; it waits between checks when caught up. It still accrues ticks from measured wall time and the requested speed, respects paused/pending controls, caps backlog, and never invents extra simulation time. A single world step remains atomic and can exceed the soft chunk deadline.

The scheduler regression verifies backlog reporting, exact owed-tick catch-up without overshoot, and exclusion of paused or pending worlds. The full Node suite passed **60 tests**.

## Recovery and live observation

[Recovery proof](../evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/restart-verification.json) · [final checkpoint backups](../evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/restart-manifest.json) · [live sample before](../evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/live-before.json) · [live sample after](../evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/live-after.json).

The original server shut down cleanly. All 10 final checkpoints were backed up and restored exactly after normalizing old default fields through the current restore path. This was checked before any world resumed. Only the 2 originally running habitats resumed, with their original requested speeds. No founders were reseeded and no acquired state was cleared. The inactive learning campaign remained inactive.

| Live habitat | Earlier ratio | Later ratio | Target | Later population / mean neurons |
| --- | --- | --- | --- | --- |
| Cruising learner · breeding observation | 2.10× | 8.21× | 10× | 100 / 588.4 |
| Trace actor · food-renewal control | 2.10× | 8.21× | 10× | 23 / 1589.7 |

The earlier sample covered 12.01 wall seconds; the later sample covered 30.03 wall seconds across three windows. Populations and topologies evolved between them. The live difference is observational; do not treat its ratio as the causal optimization speedup. The controlled evidence is the matched 1.45× replay above. The later list-request samples ranged from 3.1 to 8.7 ms. This checks sampled API latency, not animation FPS or every request's latency.

The long-running worlds have nonzero ledger residuals recorded in the raw runtime samples; a full reconciliation of those long histories was not performed here. They are distinct from the short, tightly reconciled learning qualifications. Their generation count and network growth are observational, not evidence of improved intelligence.

## Reproduce

The general runner uses actual completed tick deltas and verifies whole checkpoints. From the repository root:

```sh
node scripts/benchmark-world.mjs evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/sources/engine.mjs engine.mjs evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/checkpoint.json /tmp/afterwing-world-benchmark.json 200 5
```

To replay the exact historical candidate, use evidence/runtime-profile/8b76a6cf-be37-4a72-86de-922ceb263604/cached-topology/engine.mjs as the candidate path. The command above instead compares the archived reference with current source. For historical learning studies, use their archived source trees as working directories so strict source fingerprints remain valid.

Next runtime work is profiling the larger live control and evaluating independent-world execution if contention still prevents the requested ratio. Do not shrink agents, reset long-lived bodies or count a headless microbenchmark as sustained live acceptance.
