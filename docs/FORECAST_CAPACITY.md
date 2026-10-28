# Archived forecast-capacity diagnosis

This was post-hoc use of 92 archived worlds from 46 seeds, including prior evaluation banks. It is not independent confirmation, a retest of the failed expression study, or an adoption gate.

Fixed learners used each founder's same factual training examples. Batch/replay models have different memory and compute from the chronological normalized-gradient baseline.

| Model | Fixed-food MSE after B training | Moving-food MSE |
| --- | ---: | ---: |
| zero | 0.00581505 | 0.00478801 |
| training-mean | 0.00594884 | 0.00473808 |
| online-initial | 0.00588747 | 0.00432525 |
| ridge-linear-1 | 0.00495214 | 0.00424778 |
| ridge-quadratic-1 | 0.00485394 | 0.00455588 |
| rbf-ridge-0.1 | 0.00387307 | 0.00362504 |
| rff-ridge-1 | 0.00435442 | 0.00407802 |

Kernel regression lowered average error in both environments. Allowing the original online learner to continue acquiring moving-food labels after each prediction produced MSE 0.00390852, a distinct protocol from the frozen-future probe. The data support exploring nonlinear learning and ongoing adaptation, not a unique causal diagnosis of every previous failure.

The Python exploratory run emitted 6717 numerical runtime warnings, preserved by message/category/count in [its results](../evidence/forecast-capacity/f1592535-e14c-4699-809f-11a066d2510c/results.json). Their cause is unverified. All reported model scores were finite; the linear baseline matched the independent JavaScript implementation to floating-point precision. The subsequent kernel implementation received an independent SciPy/direct-arithmetic audit with no warnings in the captured checks. That does not retroactively verify every exploratory Python fit.

The new architecture choices were fixed before the separately locked [fresh migration study](ALGORITHM_UPGRADE.md). Only that new bank supplies prospective upgrade evidence. The old failed expression-study result remains unchanged.
