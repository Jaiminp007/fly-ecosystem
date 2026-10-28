# Budgeted recursive-search study

Completed 2026-10-24T03:40:30.107Z. The fixed recursive-search gate **failed**. The full RSI goal remains active and unachieved.

This study addressed the prior selector's missing causal link: its accepted learning rule was applied to a modifier that actually decides which revisions receive an evaluation. The upgraded modifier did not beat the original or a simple historical-average selector. Useful subsequent forecast revisions therefore do not establish a recursive-search advantage.

## Locked experiment

The [protocol](../evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694/protocol.json) fixed 16 independent search histories. Each used 6 unique warm-up task pairs and a separate target pair; all world seeds were distinct across histories and checked against archived registries. The study executed 224 fresh worlds.

The library contained 12 executable kernel/update programs: linear and Gaussian kernels, Laplacian and quadratic kernels, and positive-semidefinite sum/product compositions, each with gradient or ridge updates. This library and its feature transforms were human designed and fixed before fresh evaluation. This is not arbitrary source-code synthesis.

The original modifier first learned from its own completed warm-up evaluations. Every comparison arm began with the same facts. The **self** arm migrated that acquired state to the previously validated Gaussian-gradient learner. The **fixed** arm retained the original linear-gradient modifier. **Random** ignored learned preferences; **static** ranked each program's average observed improvement without task context; **reset** erased the warm-up facts.

Each arm requested exactly 3 distinct non-incumbent revision evaluations. A shared incumbent score was available to every arm. The learned models' predictions determined their requests. Validation feedback updated only the requesting modifier. Every arm locked its final program before any final score was computed. The target profile used only the already-experienced fixed-food training block. Validation and final windows were disjoint, and windows crossing a block boundary were omitted.

Forecasters carried their own retained experience from the earlier task through each algorithm change and subsequent moving-food training. A queried revision had to improve both validation tasks and retain the earlier task; otherwise the selector kept the incumbent. Final windows did not update forecasts or preferences.

## Primary recursive-search results

Positive differences favor the self-applied modifier. Effects are control-minus-self mean final MSE, averaged per independent search history. The exact one-sided paired sign-flip threshold was 0.005; the test assumes symmetric independent history-level effects.

| Control | Self advantage in final MSE | One-sided paired p | Required comparison |
| --- | ---: | ---: | --- |
| fixed | -0.00004511 | 1.00000000 | failed |
| random | 0.00079183 | 0.00012207 | passed |
| static | 0.00000000 | 1.00000000 | failed |
| reset | 0.00068608 | 0.00195312 | passed |

The self-applied and static selectors made identical final program choices in 16 of 16 histories. The original modifier matched those choices in 15 histories and performed better in the remaining history. Their query sequences did differ, so the upgraded preference model affected search behavior; it did not establish better outcomes.

| Arm | Histories selecting a revision | Histories improving both final tasks | Mean final MSE |
| --- | ---: | ---: | ---: |
| self | 14 | 13 | 0.00293947 |
| fixed | 15 | 14 | 0.00289436 |
| random | 10 | 7 | 0.00373130 |
| static | 14 | 13 | 0.00293947 |
| reset | 10 | 8 | 0.00362555 |

Warm-up evaluation labels favored the following program under the declared worst-component target: {"laplacian:gradient": 19, "laplacian:ridge": 69, "product:ridge": 1, "quadratic:ridge": 1, "rbf:gradient": 4, "sum:ridge": 2}. This is a descriptive count, not proof of why one modifier failed to outperform another.

## Subsequent forecasting and retention

Relative to the prior Gaussian-gradient forecast incumbent in this new study, the self arm's selected programs reduced fixed-food mean final MSE from 0.00510904 to 0.00343278 (32.81%) and moving-food MSE from 0.00310577 to 0.00244617 (21.24%). Both paired comparisons passed their locked significance threshold, as did the acquired-versus-reset comparisons. These gains are not the percentages from the previous migration study: they use a new bank and later, separately hidden scoring windows.

Average earlier-task retention improved by 0.00192686 MSE. The modifier's prior-fact recall error improved by 0.01809318; this is a narrow recall probe of already observed evaluation facts. These are group results, not per-agent no-forgetting guarantees. They do not override the failed comparisons with the original and static modifiers.

**Post-hoc retention-design correction (2026-10-24):** Astra's independent review exposed a limitation missed in the earlier interpretation. The [target-bank overlap audit](../evidence/retention-overlap/89d095c0-27fd-48bb-a859-3cb6614aca98/results.json) found 2,950 exact duplicate earlier-task examples among 3,584 moving-food training windows (82.3103%); complete raw windows at the same original tick give the same duplicate count. Every target learner receives 224 combined examples against a capacity of 256. The earlier-task MSE measurement therefore does **not** demonstrate sustained retention under distinct-task interference or memory pressure. This correction changes the interpretation, not the preserved scores, protocol, choices, or failed recursive-search gate.

An exhaustive validation reference, computed after every real choice was locked, found a validation-eligible revision in 15 histories and improved both hidden tasks in 13. Its extra evaluations never entered a policy state. It has a different budget and is diagnostic only.

## Verification and costs

The [audit](../evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694/audit.json) replayed every history, proposal, preference update, validation/final score, program choice, and acceptance calculation. It independently enumerated the paired sign-flip statistics. All 240 policy requests and 80 checkpoint continuations were verified. Altered evidence was rejected.

Cold physical replay covered every target pair and the first warm pair per history: 64 worlds. The remaining warm worlds were checked by source/input hashes and deterministic learning replay; they were not cold physically rerun. The recorded dataset contains 100,777 completed factual windows.

An [independent numerical audit](../evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694/numeric-oracle-input-numeric-audit.json) checked 7 real captured founder states, one per distinct selected algorithm, using a SciPy batch solve or direct chronological Python arithmetic. The maximum coefficient difference was 8.628e-13; 0 warning categories were recorded. A separate fixture also checked every declared kernel/update combination. Neither numerical check is independent scientific confirmation of the performance gate.

Caching shared identical computations, but labels were exposed only to requesting arms. Checkpoint copies repeated already requested observations outside the original policy. The exhaustive diagnostic reference required 75 further unique validation evaluations after choices were locked. Equal logical query budgets do not imply equal total arithmetic or wall-clock cost. Per-model kernel/matrix counters and separate oracle counts remain in the raw rows.

Reproduce the audit:

```sh
node scripts/audit-recursive-search.mjs evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694
node scripts/capture-revision-numerics.mjs evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694
python3 scripts/audit-kernel-numerics.py evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694/numeric-oracle-input.json
```

[Full results](../evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694/results.json). No failed sample was extended, no final labels trained a policy, and no live habitat, difficulty or controller was promoted.

## Next requirement

Do not repeat this unchanged search to obtain a pass. Before adding more modifier complexity, test whether the revised outcome learners improve physical action choice. Existing archived action forks can diagnose that question, but cannot qualify a new policy. A separate action-effect mechanism or fresh prospective gate is required; repeated forecasting gains alone do not satisfy RSI.
