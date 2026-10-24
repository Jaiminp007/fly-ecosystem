# Matching past action contexts: offline diagnostic

Completed 2026-10-24T01:00:26.823Z. The fixed offline comparison did not establish a better action ranking. The declared signal to motivate a prospective experiment was **false**. The prototype remains separate from the live engine; it was not integrated or adopted.

[Raw diagnostic](../evidence/matched-retrieval/9e3ae52a-48d8-44a3-b8a1-034000559b76/results.json) · [Protocol](../evidence/matched-retrieval/9e3ae52a-48d8-44a3-b8a1-034000559b76/protocol.json) · [Audit](../evidence/matched-retrieval/9e3ae52a-48d8-44a3-b8a1-034000559b76/audit.json) · [Audit tamper check](../evidence/matched-retrieval/9e3ae52a-48d8-44a3-b8a1-034000559b76/audit-guard.json).

## Question and estimator

The current controller averages returns separately among nearby slow-action and fast-action memories. Having records for both actions does not ensure the two retrieved sets describe comparable situations. This is a possible estimation issue, not an established explanation of the failed relocation gate.

The offline prototype weights pairs of past slow/fast records using their distances to the query and to each other. Both action estimates use this common weighted pair set. Unlike a common pooled prior, that matching can change a supported action ordering. It receives only the original query and past recalled records; recorded counterfactual effects are joined after prediction. It neither reads future labels nor fits its geometry to them.

The bandwidth (0.25) and pair radius (0.6) are fixed to the existing controller settings. Empty overlap returns explicit unavailability. A shared log-weight offset prevents underflow. The prototype reports every checked pair and two proposed extra record reads per comparison, including rejected pairs. This is accounting for a potential future integration, not energy already charged to a live body. Any integrated policy would need physical-cost, checkpoint, retention and matched ecological verification.

## Fixed reused-data comparison

The analysis replays 20 previously recorded seeds and 120 historical action-fork cases. Original baseline endpoints and sampled factual retrievals reproduce. Matching was available on 100 cases; 100 had non-tied raw/matched predictions and observed effects. Raw and matched gains below use the same available cases, aggregated first within each seed. These are reused diagnostic data, not untouched qualification seeds.

| Measure | Seed-level estimate [interval] |
| --- | ---: |
| Distance between original action-context centroids | 0.241 [0.210, 0.272] |
| Original greedy gain over a random first action | 0.136 [-0.189, 0.460] |
| Matched greedy gain over a random first action | 0.085 [-0.282, 0.453] |
| Matched minus original greedy gain | -0.050 [-0.231, 0.130] |
| Original ranking agreement with sampled effect | 0.532 [0.450, 0.615] |
| Matched ranking agreement with sampled effect | 0.528 [0.438, 0.619] |

The gain unit is target-agent energy over the recorded action-fork horizon, not per-founder world energy. A tie contributes zero expected gain over a random action. Centroid separation describes the chosen representation and does not prove causal confounding. The counterfactual effects use a finite horizon under a still-learning exploratory continuation; they are not unbiased labels for the controller's discounted Q values or an optimal long-run policy.

The paired gain interval includes zero, and this fixed method did not establish improved discrimination. Do not tune its geometry against these same effect labels until a result appears favorable, or present this diagnostic as a policy survival test.

## Verification and decision

82 Node regression tests passed. New tests establish that the estimator can reverse a constructed context-confounded ranking using past data, handles absent overlap without fabricated values, preserves its input, exposes pair/read counts, and remains finite for extreme log weights. [Test log](../evidence/matched-retrieval/9e3ae52a-48d8-44a3-b8a1-034000559b76/checks/node-tests.log).

The audit independently recomputed every pair distance, radius decision, log cost, weight and return estimate; paired gains and seed intervals; centroid separation; fixed decision; and all source/input hashes. It covers 3080 pair comparisons. It independently replayed 2 selected archived baseline trajectories and their sampled factual retrievals. The analysis driver checked all included baseline endpoints. A synthetic changed-summary copy was rejected by the auditor; original evidence was not edited.

Reproduce with:

```sh
node scripts/audit-matched-retrieval.mjs evidence/matched-retrieval/9e3ae52a-48d8-44a3-b8a1-034000559b76
```

The live engine and controller do not import `learning/matched-retrieval.mjs`. Live policy, acquired state and environmental difficulty remain unchanged. The negative diagnostic does not prove matching can never help; it supplies no supporting signal for this method under the declared rule.

A new intervention must address representation or temporal prediction through a separately specified experiment, rather than resampling the failed policies or optimizing these reused fork labels. Ecological adaptation/survival, whole-body continual retention, autonomous algorithm changes, richer-world gates and RSI remain unachieved.
