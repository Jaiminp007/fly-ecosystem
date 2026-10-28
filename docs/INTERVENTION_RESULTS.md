# Assignment, history and horizon: results

The locked action-value gate **failed**. The weighting follow-up screen **failed**. Weighting research advancement: **False**. No embodied qualification or RSI result follows.

[Protocol](../evidence/intervention-study/20261024-assignment-history-horizon-v1/protocol.json) · [Selection locked before held-out collection](../evidence/intervention-study/20261024-assignment-history-horizon-v1/locked-selection.json) · [Full results](../evidence/intervention-study/20261024-assignment-history-horizon-v1/results.json) · [Design and review](INTERVENTION_STUDY.md)

The selection used 8 development seed pairs, split into 4 fitting and 4 selection pairs. The frozen candidate was `ipw-contrast` with `current` observations at 256 ticks. The confirmation bank contains 16 fresh seed pairs and 1024 scheduled founder/checkpoint cases. It never trained the models.

## Primary action-value comparisons

Effects are target-agent energy change after one forced eight-tick speed interval and incumbent continuation. Constant controls refer only to that first interval. Positive effects favor the selected learner. Bounds are simultaneous one-sided Student-t lower bounds with the protocol family correction; tests additionally require the declared paired sign-flip threshold.

| Environment | Control | Mean selected advantage | Simultaneous lower bound | Paired p | Passed |
| --- | --- | ---: | ---: | ---: | --- |
| stable | incumbent | -0.096609 | -0.514198 | 0.75506592 | False |
| stable | slow | 0.052038 | -0.398030 | 0.36383057 | False |
| stable | fast | -0.190988 | -0.417750 | 0.99159241 | False |
| relocation | incumbent | -0.058549 | -0.448837 | 0.61355591 | False |
| relocation | slow | 0.045963 | -0.293785 | 0.34046936 | False |
| relocation | fast | -0.087565 | -0.517851 | 0.68693542 | False |

## Scope and interpretation

The short- and long-horizon action-effect signs disagreed in 46.78% of active held-out cases. This is a within-bank descriptive observation, not independent samples at each checkpoint. There were 0 already-dead scheduled cases; terminal branch counts were {"8": 0, "256": 0}. The collector/test suite supports terminal outcomes, but this performance bank supplies no mortality case evidence.

A passing screen motivates further investigation; it does not identify systematic propensity bias. Contrast/DR comparisons also vary target/model structure. Inference is conditional on a single fitted bank and assignment realization.

Other model/representation tables in the raw results are diagnostic. They cannot replace the locked candidate or turn this failed held-out gate into a successful qualification. All models pool development founders and use simulator fork labels. None establishes learning from its own resulting body trajectory. The experiment does not measure retained distinct skills or recursive search.

## Verification

The [cold replay audit](../evidence/intervention-study/20261024-assignment-history-horizon-v1/audit.json) reproduced all 48 physical worlds, 1536 scheduled cases and 786432 fork steps; rebuilt 64 models; and reproduced selection, scores and gates. These are reproducibility checks, not a new scientific sample.

The [independent numerical audit](../evidence/intervention-study/20261024-assignment-history-horizon-v1/numeric-audit-v3.json) checked 64 fits and 12 comparisons. Maximum coefficient difference: 2.668e-14; maximum inverse residual: 7.684e-14; maximum independently reconstructed delayed-DR target difference: 5.898e-17. Recorded warnings: 0. Checks passed: True.

The original numerical checker emitted matrix-multiply RuntimeWarnings despite passing its comparisons. Its warning list covered only a subset of operations. The original source, reports and process output are preserved. A [supplemental checker correction](../evidence/intervention-study/20261024-assignment-history-horizon-v1/numeric-checker-resolution.json) captures all warnings and uses explicit finite reductions for inverse/prediction/statistical products. It changes no scientific model, choice, score or acceptance rule. No cause is assigned to the original warning messages.

An [early scoring attempt](../evidence/intervention-study/20261024-assignment-history-horizon-v1/evaluation-attempt-before-bank-complete.log) refused the incomplete held-out bank with a missing-file error. No result was written by that attempt. Scoring ran successfully only after collection finished.

## Next work

Preserve the failed gate and do not extend this sample or expand weighting qualification. Use the diagnosis to specify a separate embodied learning screen. The [continuing-body substrate](EMBODIED_SUBSTRATE.md) is implemented but unqualified: it has independent phase resource layouts, per-founder own experience, bounded memory, terminal labels and exact checkpoints. A fresh prospective protocol must set actual cost accounting, per-skill and survival margins, matched controls, and fixed total budgets before performance runs. The [revised research goal](RESEARCH_GOAL.md) remains unachieved.
