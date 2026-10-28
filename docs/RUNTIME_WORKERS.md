# Persistent world workers and live recovery

Recorded 2026-10-23T22:27:33.065Z. The resident-worker runtime passed its isolated verification and was installed in the local server. The full autonomous-learning goal remains unachieved; this changes execution placement, not controller behavior or learning qualification.

## Why checkpoint placement matters

The [matched parallel prototype](../evidence/worker-world-benchmark/84f0a74d-4c1d-45b1-92d0-15f556ba99e5/results.json) used copies of actual running worlds. Alternating serial and parallel runs produced exactly identical final worlds in every repetition. Worker computation was 1.59× faster, but copying full checkpoints back to the main thread yielded only 0.98× end-to-end speedup. Startup was excluded.

The opt-in backend now keeps each habitat's World, RNG, acquired memories and controller caches in a persistent worker. Frame, inspection and metadata reads transfer only their required views. Atomic autosaves and named archives are serialized and written inside that worker, with the existing checkpoint format. Explicit exports and forks still transfer complete checkpoints. UI reads queue behind the current bounded worker unit or save; the backend does not promise smooth animation through every checkpoint.

Controls and automatic simulation units retain one ordered queue per habitat. A restore validates its replacement, archives the preceding state, then swaps the worker and leaves the habitat paused. A failed checkpoint pauses the affected habitat and returns the actual error. Shutdown saves and terminates all workers. The ordinary main-thread backend remains available.

## Preserved initial miss and measured correction

The [first resident-worker observation](../evidence/worker-runtime/153ef1ca-3a1b-4546-b68b-d62058afac00/results.json) averaged 9.98× and 9.71× over 59.81 wall seconds with UI polling and autosaves. Its acceptance result was **false**. Both complete final worlds nevertheless matched serial replay, their disk autosaves, and fresh paused-worker recovery.

The original backlog bound could retain only a wall second of work at the highest target speed. The larger checkpoint write exceeded that allowance. The corrected backend retains a bounded catch-up debt sufficient for longer writes while keeping simulation requests small. It records discarded tick debt, clipped elapsed wall time, maximum debt and last save duration. It never advances beyond owed ticks; acquiring more compute capacity does not waive physical energy costs or shrink agents.

The [corrected observation](../evidence/worker-runtime/50c66013-6132-490e-90c2-cd06e4f35c4d/results.json) covered 59.81 wall seconds. Acceptance required at least 9.8×, an autosave during the window, no discarded debt, complete serial equality and exact disk/restart recovery. This finite gate passed (**true**). Finite windows can include catch-up from earlier owed time, so observed ratios may exceed the requested speed.

| Habitat copy | Actual ratio | Ending agents | Mean neurons | Discarded ticks | Last worker save |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cruising learner · breeding observation | 9.97× | 52 | 1524.06 | 0 | 850.96 ms |
| Trace actor · food-renewal control | 10.17× | 30 | 2043.73 | 0 | 1367.50 ms |

No wall-time clipping was recorded in this corrected observation. UI request median 4.03 ms, p95 20.26 ms, maximum 866.76 ms across 701 sampled requests. These are HTTP latency samples, not rendering FPS. All complete final worlds matched serial trajectories, autosaves and paused recovery. The source tree and input checkpoints are archived with each observation.

## Local live migration

[Migration and checkpoint backups](../evidence/worker-migration/614ee3ff-542a-470c-8f7d-cdd1cf8a3f8b/migration.json). The old listener shut down gracefully, final autosaves were copied, and the worker server restored the same 10 habitats. Every entire normalized world matched before any habitat resumed. Only the original 2 running habitats resumed, at their saved target speeds. No acquired memory, founders or long histories were reset, and no policy or difficulty promotion occurred. Current detached PID at migration: 55851; verify the listener before any later restart.

## Actual live observation after migration

[Read-only live sample](../evidence/runtime-profile/322d64cd-3793-4e08-b58b-d84c2d6af1dd/live-sample.json). After the excluded warmup, the real server was observed for 59.852 wall seconds with its regular autosaves and frame, agent and list polling.

| Live habitat | Requested speed | Actual progress | Ending agents | Mean neurons | Discarded ticks | Clipped wall seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Cruising learner · breeding observation | 10× | 10.000× | 44 | 1599.182 | 0 | 0 |
| Trace actor · food-renewal control | 10× | 10.000× | 20 | 2092.600 | 0 | 0 |

Sampled HTTP median 3.715 ms, p95 17.408 ms and maximum 748.860 ms over 712 requests. This supports near-target runtime for this finite live workload. It does not establish future population throughput, uninterrupted animation, better survival, or a causal speedup from comparing different live populations.

## Browser reconnection

A stale connection-error banner remained visible after the browser reconnected to the restarted server. Polling errors now carry their own notice source; a successful poll clears that transient notice while preserving action and habitat errors. A [synthetic browser-only interruption check](../evidence/runtime-profile/322d64cd-3793-4e08-b58b-d84c2d6af1dd/browser-recovery.json) verified the failure notice and recovery after a full document navigation loaded the updated script. The original tab check before that navigation is retained as a failed observation. Browser JavaScript passed syntax checking. No world controls were used in the probe.

## Checks and use

The regression suite passed 74 tests with 0 failures, including both HTTP backends, exact acquired-state continuation, simultaneous ordered controls, queued debt across slow operations, independent workers, close during startup, disk failure preservation, archive/restore and restart. [Captured test log](../evidence/worker-runtime/50c66013-6132-490e-90c2-cd06e4f35c4d/checks/node-tests.log).

Start the worker backend explicitly:

```sh
PLATFORM_WORLD_WORKERS=1 npm run start:platform
```

Use a separate checkpoint directory and port for experiments. The default launcher still selects the main-thread backend unless the option is set. Both modes recover saved habitats paused.

Reproduce the isolated source-copy verification with `node scripts/verify-worker-runtime.mjs`; use the archived source tree as cwd to reproduce an older observation. Use `node scripts/sample-live-runtime.mjs` for a read-only live sample that excludes its initial warmup and includes frame/agent/list polling.

This runtime work does not qualify the failed [joint steering policy](EPISODIC_JOINT.md), prove better survival, demonstrate human-like cognition, or establish open-ended recursive self-improvement. Continue learning diagnosis under the existing gates.
