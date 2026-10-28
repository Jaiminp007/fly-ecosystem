# Normalized sensory traces: partial energy signal, full gate failed

Completed 2026-10-24T01:13:45.906Z. The fixed architecture study passed its separate cue-memory gate (**true**) but failed the full ecological (**false**) and incumbent-upgrade (**false**) gates. No policy adoption, sample extension or difficulty promotion occurred.

[Results and fixed protocol](../evidence/normalized-traces/e201e06b-af66-4419-899f-f163175d950d/results.json) · [Raw paired outcomes](../evidence/normalized-traces/e201e06b-af66-4419-899f-f163175d950d/outcomes.json) · [Audit](../evidence/normalized-traces/e201e06b-af66-4419-899f-f163175d950d/audit.json).

## Observation before the intervention

A [historical replay diagnosis](../evidence/trace-saturation/e5fd5416-9062-402b-b4fc-8c6fac62a98c/results.json), with [count/hash audit](../evidence/trace-saturation/e5fd5416-9062-402b-b4fc-8c6fac62a98c/audit.json), reproduced 20 complete worlds across 10 recorded seeds and both environments. The existing additive traces often hit their clipping bound. A parallel exponential average was computed from exactly the same observations without feeding it to the controller.

| Environment | Food channel | Slow-trace saturation [interval] | Input changes above threshold | Flat trace despite input change |
| --- | ---: | ---: | ---: | ---: |
| stable | 0 | 0.934 [0.929, 0.939] | 132306 | 100956 |
| stable | 1 | 0.476 [0.462, 0.490] | 164206 | 109058 |
| stable | 2 | 0.433 [0.421, 0.445] | 156159 | 101258 |
| stable | 3 | 0.995 [0.995, 0.996] | 18947 | 18363 |
| relocation | 0 | 0.903 [0.892, 0.913] | 158738 | 117285 |
| relocation | 1 | 0.544 [0.518, 0.571] | 158552 | 111926 |
| relocation | 2 | 0.377 [0.355, 0.398] | 132781 | 86080 |
| relocation | 3 | 0.994 [0.993, 0.996] | 15735 | 15065 |

The diagnosis used the fixed change threshold 0.05. These counts show a representation behavior; they do not establish that clipping caused the failed survival gate. The parallel average remaining responsive is not evidence of improved ecological policy.

## Architecture and checkpoint contract

The opt-in `actorParameters.traceNormalization: 1` replaces input gain one by one minus retention. The same trace state follows `retention * previous + (1 - retention) * input`. The same trace neurons, recurrent retention, connection count, storage/read prices and metabolic node costs remain. Sensory-to-trace input genes explicitly record the altered gains. No new sensor, map, future label or persistent variable is added. This also changes the neural readout's features and effective learning normalization, so an effect cannot be attributed solely to episodic retrieval.

The setting, genotype and acquired actor state all carry the mode; mismatch or wrong memory-input weights are rejected on restore. Offspring inherit the mode and weights, but start with empty acquired state. Explicit mode zero is omitted and remains byte-identical to the old controller. Four old complete world hashes reproduced before prospective evaluation. Older search loops preserve the optional architecture flag rather than proposing it implicitly.

## Fixed prospective evaluation

There was one fixed candidate and no development search or reselection. 40 previously unused seeds were evaluated in both environments with 24 founders and 1800 ticks, reproduction/mutation disabled. Candidate frozen, memory-disabled, full-range and neural controls share identical complete inherited founders. The old incumbent differs in the declared normalization input genes. Neutral founder equality removes ONLY those input-gain differences and normalization tags; all other body, genotype, position and RNG-derived founder values must match. Both full and neutral hashes are retained.

Energy is the per-founder learned-minus-control difference. Population is mean ending-agent difference per world.

| Control | Stable energy [interval] | Stable population | Relocation energy [interval] | Relocation population |
| --- | ---: | ---: | ---: | ---: |
| Learning frozen | 2.645 [1.926, 3.364] | 0.000 | 0.515 [-0.605, 1.635] | -0.150 |
| Memory acquisition disabled | 2.291 [1.764, 2.818] | 0.000 | 0.981 [0.168, 1.795] | -0.075 |
| Full-range movement | 3.534 [3.037, 4.032] | 0.275 | 8.690 [7.485, 9.894] | 0.575 |
| Normalized neural control | 5.119 [4.143, 6.094] | 0.375 | 9.663 [8.526, 10.800] | 2.025 |
| Original incumbent / additive traces | 0.136 [-0.436, 0.708] | 0.025 | 0.776 [0.013, 1.539] | -0.025 |

The relocation-energy advantage over memory disabled and the original incumbent was positive in this fixed sample. Their mean population differences were negative. The frozen-control relocation energy interval included zero and its population difference was negative. These outcomes fail the declared joint rule; positive energy alone does not waive the survival guards. Do not extend this sample until it passes.

Cue-memory A after B was 0.960 [0.950, 0.970]; B after B 0.972 [0.966, 0.979]; A retention change -0.025 [-0.034, -0.016]. The declared cue threshold passed. It does not establish retention of whole-body skills or validate TD bootstrapping in the habitat.

## Verification and next direction

85 tests passed after normalization changes. [Test log](../evidence/normalized-traces/e201e06b-af66-4419-899f-f163175d950d/checks/node-tests.log). Tests cover the actual averaging recurrence and response to sustained-input changes, exact continuation, genotype/state/config mismatch rejection, offspring initialization, disabled-mode compatibility and preservation of optional flags in bounded proposals.

The [paused isolated-world DOM/API inspection](../evidence/normalized-trace-inspection/c85b9a05-0b25-4b9c-9ba2-9a8b6c8fe7c7/browser.json) verified the real mode, input genes, bounded trace activity and explanatory label. No screenshot/pixel-layout verification is claimed. The temporary server/tab were closed.

The audit covers 480 worlds and 24 exact complete-state selected replays, including JSON checkpoint continuation in every replay arm. All comparisons, cue summaries, qualification gates, source hashes, founder matching and short-study ledgers were checked. Maximum accounting residual: 2.5097506295423955e-9. It did not replay every world.

The live habitats remain on the previously confirmed policy. To move beyond repeated nearest-neighbor adjustments, the next prototype learns action-conditioned observation transitions and rewards from each agent's own experience, then makes explicit predicted rollouts. It must first beat chronological prediction controls before any prospective embodied planning/survival evaluation. Prediction, planning and autonomous self-improvement remain separate claims; RSI is unachieved.
