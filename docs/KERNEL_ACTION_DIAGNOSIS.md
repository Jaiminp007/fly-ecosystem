# Archived kernel action-ranking diagnosis

This is post-hoc reuse of 96 previously audited physical action forks. It is not fresh confirmation or a qualification gate.

Each model learned only the target founder's factual decision windows completed before the recorded query. The Gaussian-gradient and Laplacian-ridge models then forecast the same two hypothetical speed choices. Fork effects scored those predictions and were never training labels. The original experiment and its failed gate remain unchanged.

Positive differences favor Laplacian-ridge. Gain is target-agent energy versus an equally mixed random speed, calculated from each archived physical pair. The table is exploratory and does not correct for repeated comparisons.

| Environment | Comparator | Mean gain difference | One-sided paired p |
| --- | --- | ---: | ---: |
| stable | rbf | -0.020981 | 0.55859375 |
| stable | incumbent | -0.046823 | 0.76171875 |
| stable | slow | 0.146943 | 0.01708984 |
| stable | fast | -0.050141 | 0.87695312 |
| stable | zero | 0.048401 | 0.14843750 |
| relocation | rbf | 0.023246 | 0.13476562 |
| relocation | incumbent | 0.028161 | 0.00268555 |
| relocation | slow | 0.193807 | 0.00634766 |
| relocation | fast | 0.003226 | 0.45019531 |
| relocation | zero | 0.098517 | 0.00610352 |

The Laplacian model did not reliably beat the incumbent in both environments, and did not establish a benefit over always choosing fast movement. Forecast improvements alone still do not establish better physical decisions. No live adoption follows.

The next useful diagnostic should distinguish an action-effect estimation problem from ordinary forecasting error. Logging the known behavior-policy probabilities and separating genuinely randomized exploration from policy-selected experience is a concrete next step. This result does not identify selection bias, confounding or any other mechanism as the proven cause.

[Inputs, predictions and paired effects](../evidence/kernel-action-diagnosis/ea26472b-e3ab-4070-980f-5b1029ac29ac/results.json) · [Protocol and exact source fingerprints](../evidence/kernel-action-diagnosis/ea26472b-e3ab-4070-980f-5b1029ac29ac/protocol.json).
