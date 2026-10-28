# Neural and episodic learning interaction: no supporting signal

Completed 2026-10-23T22:43:11.674Z. The fixed diagnostic did not establish that the remaining neural-output updates explain the failure to adapt to relocated food. The declared interference signal was **false**. No policy was selected or promoted, no sample was extended, and environmental difficulty remains unchanged.

[Protocol and results](../evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7/results.json) · [Raw paired outcomes](../evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7/outcomes.json) · [Recomputation and replay audit](../evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7/audit.json).

## Question and matched design

Episodic speed control already freezes neural turning and movement updates. Eating, mating and signaling readouts can still learn. The hypothesis was that changes to those remaining readouts might interfere with episodic speed learning. It was a proposed mechanism, not an established cause of earlier failed gates.

The fixed 32-seed diagnostic crossed episodic memory learning on/off with neural-output learning on/off. Additional arms globally froze learning, enabled only eating or signaling updates, used the matched full-range movement rule, or used the neural control. The global-frozen and both-off arms produced identical complete non-configuration state hashes in all recorded worlds.

Both environments used the independently confirmed mixed-feature cruising policy: stable food and food relocation at nutrient 0.4, 24 matched founders, 1800 ticks, reproduction/mutation disabled. Source, inherited bodies, sensors, speed levels, exploration settings, memory bounds and physical prices were held fixed. Masked outputs retain inherited weights and exploration; this intervention does not substitute correct action labels or turn off the cost of executing an output. Mating updates have no direct ecological effect with reproduction disabled.

Seeds were chosen before outcomes and excluded all seeds found in the recorded protocol registries. These are new experimental trajectories, not a rerun or extension of the rejected joint policy. The archived protocol contains the registry hashes and fixed sample. This is a diagnostic with no policy qualification authority and no cue-retention component.

## Paired results

Energy is the per-founder difference in net remaining energy. Brackets show the declared seed-level intervals; population entries are mean differences in ending agents per world. Secondary contrasts are descriptive and are not adjusted for multiple comparisons.

| Contrast | Stable energy [interval] | Stable population | Relocation energy [interval] | Relocation population |
| --- | ---: | ---: | ---: | ---: |
| Memory effect, neural updates enabled | 1.972 [1.150, 2.795] | 0.000 | 0.725 [-0.598, 2.048] | -0.063 |
| Memory effect, neural updates frozen | 1.975 [1.270, 2.680] | -0.031 | 0.809 [-0.368, 1.986] | 0.000 |
| Freeze neural updates, memory enabled | -0.150 [-0.773, 0.473] | -0.031 | -0.185 [-1.162, 0.792] | 0.125 |
| Freeze neural updates, memory disabled | -0.153 [-0.691, 0.385] | 0.000 | -0.270 [-1.138, 0.599] | 0.063 |
| Eating-only updates minus no neural updates | 0.308 [-0.180, 0.797] | 0.031 | -0.167 [-1.073, 0.739] | -0.094 |
| Signaling-only updates minus no neural updates | 0.127 [-0.433, 0.686] | 0.000 | -0.070 [-0.791, 0.650] | -0.094 |
| Memory-only minus globally frozen | 1.975 [1.270, 2.680] | -0.031 | 0.809 [-0.368, 1.986] | 0.000 |
| Memory-only minus full-range control | 4.033 [3.391, 4.675] | 0.594 | 8.063 [6.638, 9.487] | 1.094 |
| Memory-only minus neural control | 4.281 [3.310, 5.252] | 0.281 | 9.721 [8.335, 11.106] | 1.250 |

The difference of memory effects, without neural updates minus with neural updates, was 0.003 [-0.885, 0.891] in stable food and 0.084 [-1.315, 1.484] with relocating food. Freezing neural updates with memory enabled did not show a reliable relocation-energy advantage. Its stable population mean was negative, so the declared stable guard also failed. These uncertain estimates do not prove that neural interference is absent; they do not support adopting this intervention.

Stable memory gains remain visible with or without the neural updates. Relocation-memory intervals still include zero. Beating the full-range or neural control does not replace the required learning-disabled comparisons and survival guards.

## Behavior observations

The fractions below are means of per-world living-agent-tick summaries; they include the final executed tick of agents that die. The food signal recorded per tick is capped by the engine and is not total food intake; uncapped total food and expenditure are separate ledger endpoints in the raw outcomes.

| Environment | Arm | Eating output positive | Mean emitted signal |
| --- | --- | ---: | ---: |
| stable | incumbent | 97.305% | 0.484 |
| stable | memoryOnly | 99.996% | 0.500 |
| stable | eatOnly | 97.476% | 0.500 |
| stable | signalOnly | 99.996% | 0.488 |
| relocation | incumbent | 97.749% | 0.484 |
| relocation | memoryOnly | 99.996% | 0.500 |
| relocation | eatOnly | 97.599% | 0.500 |
| relocation | signalOnly | 99.996% | 0.484 |

Neural eating updates changed how often eating was enabled. These observed changes did not establish a reliable ecological benefit or a causal explanation of earlier failure. All readout-weight magnitudes and masks are recorded; the study checks that frozen and unrelated readouts remain unchanged.

## Verification and next decision

Three historical reference seeds exactly reproduced their recorded endpoints before new outcomes were analyzed. Memory-only JSON checkpoint continuation was checked. The audit covers 576 worlds and 36 exact complete-state replays. Maximum recorded short-study accounting residual was 2.4233486328739673e-9. It verifies fixed seeds, matching founders and initial actor RNGs, output masks, population and energy ledgers, archived sources and references, all paired summaries, the interaction arithmetic and the declared decision rule. It also replays the first and last fixed seeds in every arm and both environments, requiring complete final checkpoint hashes to agree. It does not replay every world.

Reproduce from the repository root:

```sh
node scripts/audit-neural-memory-interaction.mjs evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7
```

Use the archived source tree for historical study execution; the completed diagnostic must not be extended to force a supporting result. There was no engine or controller implementation change in this diagnostic. The live server continues the confirmed policy with the [worker runtime](RUNTIME_WORKERS.md).

Next work should investigate a different mechanism. Earlier sampled action forks showed weak agreement between recalled action values and longer-horizon outcomes; this remains a more direct unresolved target than freezing the remaining neural readouts. Any new action/value representation must be specified separately, preserve measured physical costs, and pass fresh matched learning/survival and retention gates. Broad continual learning, autonomous algorithm changes, richer-world promotion and RSI remain open.
