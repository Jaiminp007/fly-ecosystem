# Sparse dopamine-gated policy: results

The [prospective mechanism and alternatives](MUSHROOM_POLICY_DEVELOPMENT.md) explain why this study replaces value bootstrapping/replay with direct stochastic policy plasticity. Its inspiration from fly neuroscience is a hypothesis, not biological or performance validation. Earlier SARSA, tile, and Retrace failures remain preserved.

## Development

The fixed gate **failed**: 8/12 required energy contrasts, 9/9 survival guards, and 8/8 plasticity-activity gates passed. Qualification reported by this phase: **False**. Independent histories are the units; founders and probes are not extra samples.

Collection: 80 main worlds and 144 read-only probes; 150.868 wall seconds and 156.813 process CPU seconds. The physical environment, reward, resource schedule and old gates were retained; slow consolidation was compared against a matched fast-only circuit.

| Required contrast | Mean energy/founder | Simultaneous lower | Exact one-sided p | Phase gate |
| --- | ---: | ---: | ---: | --- |
| B-acquisition | 0.153457 | -0.136062 | 0.042969 | True |
| C-acquisition | 0.018297 | -0.190827 | 0.375000 | True |
| sequence-incumbent | -1.974109 | -4.359324 | 0.988281 | False |
| sequence-fast | 2.377340 | -0.634259 | 0.011719 | True |
| sequence-slow | 7.956025 | 5.176837 | 0.003906 | True |
| A-initial-skill | 0.150392 | -0.174667 | 0.070312 | True |
| B-initial-skill | 0.226499 | -0.043313 | 0.015625 | True |
| A-retention | -0.040738 | -0.574089 | 0.617188 | False |
| B-retention | -0.284226 | -0.582264 | 0.992188 | False |
| sequence-fast-only | 0.243723 | -2.241003 | 0.371094 | True |
| sequence-linear | -1.010148 | -2.966376 | 0.953125 | False |
| sequence-reflex | 0.844301 | -1.883027 | 0.160156 | True |

Development requires all means positive; its intervals/p-values are descriptive and do not count as qualification. Confirmation requires both positive simultaneous lower bounds and exact paired p<=.05/13 on every required contrast.

| Survival control | Mean difference | Gate |
| --- | ---: | --- |
| incumbent | 0.000000 | True |
| fast | 0.010417 | True |
| slow | 0.005208 | True |
| frozen | 0.000000 | True |
| reset | 0.000000 | True |
| lambda0 | 0.000000 | True |
| fastOnly | 0.000000 | True |
| linear | 0.005208 | True |
| reflex | 0.000000 | True |

Nonzero dopamine fractions ranged from 100.00% to 100.00%; candidate slow-synapse transfers totaled 342,528. Activity alone does not prove useful learning or retention.

Full cold physical replay reproduced every main world, probe, factual trace hash, row, and score. Independent Python reconstructed 225,792 transitions, 258,047 learned-policy decisions, 1,152 learner bodies and 43,008 fixed-reflex choices, with zero warnings. It independently checks connectivity, sparse winner selection, saved policy probabilities/score gradients, dopamine/baseline, both synaptic compartments, eligibility, exact work counters, RNG, receipt rings, debt and statistical gates.

The original raw-object physical auditor failed on signed-zero entries lost by JSON serialization. Its source and failure log are preserved. The supplemental auditor found 195 such entries across the full bank and requires exact JSON row equality and exact trace hashes without numerical tolerance. The learner, recorded outcomes and failed gates are unchanged.

The [frozen protocol](../evidence/sarsa-screen/20261024-mushroom-policy-development-v1/protocol.json) preserves 192 unique new seeds for the development and reserved histories, excluding all prior registries and unused reserves. Confirmation directory exists: **False**. Software verification passed 161 Node tests with the independent Python checks enabled and one Python adapter test. Bounded/shared synaptic state does not itself prove distinct retained skills; no broader continual-learning or RSI claim follows a circuit label or software pass.

The full goal remains active. Every failed gate remains failed. A qualified embodied substrate is still required before the later persistent autonomous revisions, copied-improvement controls and improved subsequent search can establish their causal claims.

The [complete evidence manifest](../handoff/mushroom-policy-20261024/manifest.json) inventories 229 files, 340,110,537 raw bytes and three compressed chunks totaling 63,464,166 bytes. [Verification](../handoff/mushroom-policy-20261024/verification.json) records successful workspace verification and a separately restored, hash-checked copy of every file. Restore with `python scripts/package-sarsa-evidence.py restore handoff/mushroom-policy-20261024/manifest.json`. Repeat the numerical audit with the captured `sources/scripts/audit-mushroom-development.py STUDY development NEW_OUTPUT`; repeat exact-JSON physical replay with `supplemental/audit-mushroom-physical.mjs STUDY development NEW_OUTPUT`. Outputs must use fresh filenames. This local signed-zero correction does not resolve the earlier historical Mac/Windows numeric portability discrepancy.

[The post-result task/action audit](EMBODIED_TASK_REASSESSMENT.md) records the next design decision. Cue-dependent physical foraging and a separate action-authority diagnostic are proposed; the new environment and its tests are not yet implemented. No additional tuning or variant selection will use this failed bank.
