# Bounded replay: development result

The fixed bounded replay candidate **failed development**: 10 of 12 required energy means were positive, 1 of 9 survival guards passed, and all eight replay-activity gates passed. Sixteen reserved confirmation histories remain unrun. The full research goal remains active; embodied qualification and every later causal recursive-improvement stage remain unachieved.

The [prospective design](RETRACE_DEVELOPMENT.md) and [frozen protocol](../evidence/sarsa-screen/20261024-retrace-development-v2/protocol.json) specify one fixed hypothesis. It completed 80 main worlds and 144 probes across eight independent histories. Collection took 198.136 wall seconds and 207.375 process CPU seconds. These timings are separate from the declared embodied energy charges.

| Required contrast | Mean energy per founder | Simultaneous lower bound | Development mean > 0 |
| --- | ---: | ---: | --- |
| B-acquisition | 0.027268 | -1.072756 | True |
| C-acquisition | 0.098358 | -0.664128 | True |
| sequence-incumbent | 0.041773 | -1.864907 | True |
| sequence-fast | 3.865124 | 1.003991 | True |
| sequence-slow | 10.368120 | 5.911965 | True |
| A-initial-skill | 0.476075 | -0.418507 | True |
| B-initial-skill | 0.484956 | -0.483533 | True |
| A-retention | 0.204874 | -0.941801 | True |
| B-retention | -0.163964 | -0.975785 | False |
| sequence-one-step | 0.721921 | -1.403995 | True |
| sequence-linear | -0.071317 | -2.472003 | False |
| sequence-reflex | 1.854015 | -1.141734 | True |

Development uses positive means; the displayed bounds and exact paired sign-flip tests are descriptive here. This bank supplies no confirmatory qualification. The candidate was above the matched one-step program on mean sequence energy, but below the earlier linear learner, and failed the separate B-retention contrast. These comparisons across a new development bank do not show that replay improved learning in general.

| Survival control | Mean survival difference | Gate |
| --- | ---: | --- |
| incumbent | -0.010417 | False |
| fast | -0.005208 | False |
| slow | 0.005208 | True |
| frozen | -0.010417 | False |
| reset | -0.005208 | False |
| lambda0 | -0.005208 | False |
| oneStep | -0.005208 | False |
| linear | -0.005208 | False |
| reflex | -0.015625 | False |

Multi-step replay accounted for 66.82%–67.47% of candidate updates. Mean backup length ranged from 5.730 to 6.020; every history reached the fixed 16-record cap. Thus the temporal-credit manipulation occurred even though the overall screen failed.

Full cold replay exactly reproduced all 80 main worlds, 144 probes, factual trace hashes, row objects, and scores. Independent Python rebuilt 225,696 factual transitions, 257,926 learned-policy decisions, 1,152 learner bodies, and 43,008 fixed-reflex choices, with zero warnings. The full Node suite passed 157 tests with the independent Python checks enabled; the Python controller adapter test also passed.

The original frozen checker and its focused test had a disclosed filter bug: they selected learner IDs while traces used role names, allowing a zero-record selection. Review caught this before the full scientific numeric audit completed. The corrected checker uses actual roles and requires exact nonzero body counts. Its corrected fixture performs the independent updates and policy checks. [The correction record](../evidence/sarsa-screen/20261024-retrace-development-v2/supplemental/checker-correction.json) preserves original and corrected source hashes and demonstrates that a wrong filter is now rejected. Frozen experimental sources and every outcome remain unchanged.

No confirmation collection, parameter change, alternative replay variant, sample extension, promotion, or RSI claim follows this failure. Previous failed gates and the historical strict portability discrepancy remain preserved. The next research obligation is a qualified embodied learner with separate skill retention under interference; persistent autonomous revisions and improved subsequent search against copied-improvement and matched-budget controls remain later required stages.

The [complete archive manifest](../handoff/retrace-20261024/manifest.json) inventories 210 files, 418,380,844 raw bytes and six compressed chunks totaling 138,645,888 bytes. [Verification](../handoff/retrace-20261024/verification.json) records successful workspace checks and a separately restored, hash-verified copy of all 210 files. Restore with `python scripts/package-sarsa-evidence.py restore handoff/retrace-20261024/manifest.json`, then verify with the same command using `verify` instead of `restore`. The numerical replay entrypoint is the preserved `supplemental/checker-v2/audit-replay-development.py`; give it the study directory, `development`, and a fresh output filename. Physical replay uses the captured `sources/scripts/replay-development.mjs audit STUDY development` in a separate copied study, retaining the original `development/physical-audit.json` under another filename so the exclusive new audit output can be written.
