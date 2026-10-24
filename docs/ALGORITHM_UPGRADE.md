# Autonomous forecast-algorithm revision

Completed 2026-10-24T03:17:12.939Z. The locked migration screen **passed**. The full RSI goal remains active and unachieved.

The offline selector evaluated a declared library of executable learning programs, selected `{'kernel': 'rbf', 'update': 'gradient'}` on archived development worlds, and accepted that fixed choice only after its fresh-world gate passed. It changed from linear normalized-gradient learning to functional gradient learning with a Gaussian kernel. The update step remains fixed; the kernel changes which observations share acquired information. This is a bounded algorithm choice, not arbitrary source rewriting.

## Fresh evidence

The [protocol](../evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/protocol.json) was locked before evaluating new worlds; [selection](../evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/locked-selection.json) was saved before collecting them. No held-out reselection, sample extension or gate change occurred. Each seed supplied a fixed-food and a moving-food world with matched controller settings. Only each founder's own completed observation/action/reward windows train its predictor. Earlier work on the same repository is development context, not fresh confirmation.

| Forecast task | Original mean squared error | Revised mean squared error | Mean error reduction | One-sided paired p |
| --- | ---: | ---: | ---: | ---: |
| Fixed food | 0.00545421 | 0.00432537 | 20.70% | 0.00001526 |
| Moving food | 0.00537541 | 0.00435849 | 18.92% | 0.00003052 |

The seed is the independent unit, with 16 seed pairs. All required paired sign-flip tests met the locked threshold 0.0125; those tests assume symmetric independent paired effects. Acquired-state reset advantages were positive in both tasks. The table measures forecasting, not chosen-action quality or survival.

## Prior experience and retention

Each learner first trains under the original algorithm on fixed-food experience. Migration reconstructs the new learner solely from its retained factual records. It then learns moving-food outcomes while retaining that experience and is queried again on the earlier task. Test queries do not update weights.

Average earlier-task MSE improved by 0.00098259 immediately after migration and by 0.00121473 after the complete sequence, relative to the original pre-migration learner. These are group results: 1 of 32 tested founder learners regressed immediately after migration, and 2 regressed after the full sequence. No per-agent no-forgetting guarantee follows.

**Post-hoc retention-design correction (2026-10-24):** Astra's independent review exposed a limitation missed in the earlier interpretation. The [overlap audit](../evidence/retention-overlap/89d095c0-27fd-48bb-a859-3cb6614aca98/migration-results.json) found that 3,024 of 3,584 moving-food training windows (84.375%) exactly duplicate earlier fixed-food learner input/target examples. Each learner receives 224 combined examples against a capacity of 256, so the sequence does not impose memory pressure. The recorded forecasting scores and locked migration-gate result stand, but this sequence does **not** demonstrate sustained retention under distinct-task interference or memory pressure. Preserving acquired records through migration is a separate, narrower result.

## Self-application and its limit

After acceptance, the selector autonomously migrated its own preference learner to the same selected executable algorithm using only its retained development-evaluation facts. The fixed-preference control kept the original algorithm and exactly the same facts. No fresh acceptance labels trained preference weights.

This validates the self-application mechanism and one forecasting revision. The selector exhaustively evaluated its small library, so its preference model did not determine which candidates received an evaluation. **Improved recursive-search productivity and a chain of repeated beneficial revisions are not demonstrated.** The revised forecasting algorithm has not been installed in a live fly, tested for better physical choices, or qualified for survival/difficulty promotion. These remain required work toward the full goal.

## Audit and the checkpoint correction

The [audit](../evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/audit.json) independently regenerated all 32 fresh physical worlds, including 14,400 completed factual windows, metrics and final-world hashes. Every program score, selection decision, paired test and acceptance gate replayed. The preference learner preserved its proposal facts. Altered forecast evidence was rejected.

The first strict audit failed because JSON turns signed zero into ordinary zero in captured sensory-feature records. The failed auditor and process output are preserved as `audit-attempt-before-zero-normalization.*`. The successful historical audit explicitly records 436 signed-zero differences and permits no changed nonzero value, metric or decision. Current storage canonicalizes zeros. [Current-source compatibility](../evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/current-source-compatibility.json) proves unchanged serialized states/scores on the whole fresh bank and exact JSON continuation through memory eviction for both captured learners, using 40 further verification updates each. Those copies do not contribute to performance scores.

An [independent Python audit](../evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/results-numeric-audit.json) reconstructed 4 captured states with maximum coefficient difference 1.106e-17 and 0 recorded numerical warning categories. A separate pre-study oracle checked all declared kernel/update combinations against a SciPy batch solve or direct chronological arithmetic. The complete software suite passes; the signed-zero regression is included.

Both algorithms have the same bounded factual-record capacity and training sample counts. A Gaussian kernel requires different arithmetic from a linear kernel; this is not a claim of equal runtime, equal total compute or a speedup.

Reproduce the historical audit and independent numeric check:

```sh
node scripts/audit-algorithm-upgrade.mjs evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865
python3 scripts/audit-kernel-numerics.py evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/results.json
```

[Full results](../evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/results.json). The archived source hashes identify the evaluated implementation; the compatibility artifact identifies the corrected current implementation.

## Next goal requirements

Demonstrate another beneficial autonomous algorithm revision with preserved acquired skill. Measure whether the changed modifier improves subsequent search against a fixed modifier under declared budgets and independently sampled search histories. Then qualify action choice and embodied learning/retention on fresh worlds before any live-policy or environment promotion. One accepted forecast revision does not complete RSI.
