# Local food-strength measurement screen

Completed 2026-10-24T02:02:49.939Z. The fixed fresh-seed screen **failed**. The extra measurement remains an offline research option; no embodied controller, physical sensor price, ecological survival, continual retention or difficulty promotion qualified.

[Protocol](../evidence/resource-outcome/3c9b3c4b-5881-49ec-9337-52f33149c608/protocol.json) · [Results](../evidence/resource-outcome/3c9b3c4b-5881-49ec-9337-52f33149c608/results.json) · [Independent audit](../evidence/resource-outcome/3c9b3c4b-5881-49ec-9337-52f33149c608/audit.json).

## New information, matched estimator

The [observation diagnosis](OBSERVATION_DIAGNOSIS.md) constructed identical initial target readings with different preferred speeds under altered food supply. The new hypothesis is one bounded local measurement of the amount at the same patch already selected by the normal food-bearing/proximity receptor. The value is amount/(1+amount). The caller supplies only patches within the body’s existing sense range. No future outcome, map representation or preferred action enters prediction.

Offline instrumentation reads this scalar at the actual sensory phase, after actual regrowth and before action physics. It does not feed the measurement into the factual controller. Every instrumented world must match a plain archived World exactly. The new optional model flag resourceSense adds an 18th coordinate, a distinct saved identity and an additional squared-distance term. The original nine-channel distance denominator remains unchanged. The unsensed arm retains the same factual histories, targets, FIFO budget, speed choices, kernel and old geometry.

The measurement and feature geometry are engineered choices. This screen tests this particular representation/estimator combination, not whether food quantity can ever be useful. A positive screen would still require a priced embodied implementation, controls for information versus geometry effects, survival/retention tests and independent confirmation.

## Fixed fresh evaluation

12 new seeds, 24 worlds, 129565 completed factual decision windows and 96 action cases; 3 incomplete windows were excluded and counted. No tuning, candidate selection or sample extension. Extra sensing does not control any factual action. Counterfactual outcomes never train either arm.

In both environments the screen requires at least half the action cases supported; positive lower intervals for gain over random speed and paired gain versus incumbent, unsensed and frozen sensed models; and negative upper interval for sensed-minus-unsensed chronological forecast MSE. Forecast comparisons use common supported completed windows. Intervals aggregate world means across the fixed seeds.

| Environment | Sensed action support | Gain over random speed [interval] | Sensed minus unsensed gain [interval] | Sensed minus incumbent gain [interval] |
| --- | ---: | ---: | ---: | ---: |
| stable | 89.58% | 0.057475 [-0.023848, 0.138798] | -0.002902 [-0.009269, 0.003465] | 0.030633 [-0.079249, 0.140515] |
| relocation | 81.25% | 0.072391 [0.005945, 0.138837] | -0.000915 [-0.005839, 0.004010] | 0.047771 [-0.047982, 0.143523] |

| Environment | Sensed minus frozen gain [interval] | Common forecast coverage | Forecast MSE minus unsensed [interval] |
| --- | ---: | ---: | ---: |
| stable | -0.005063 [-0.023524, 0.013397] | 84.29% | 0.001156 [-0.000671, 0.002984] |
| relocation | 0.002672 [-0.003242, 0.008586] | 82.61% | -0.000890 [-0.004301, 0.002520] |

The paired sensor gain did not establish improvement over the unsensed model in either environment. Forecast MSE improvement was also uncertain in both. A relocation gain over random first speed does not establish an upgrade over incumbent or retained/frozen knowledge. The complete gate failed; do not extend this experiment or alter its geometry until a favorable outcome appears.

## Verification

96 tests passed. [Suite log](../evidence/resource-outcome/3c9b3c4b-5881-49ec-9337-52f33149c608/checks/node-tests.log). Tests cover local patch selection, sensor bounds, constructed-context discrimination, sensor erasure, unchanged default geometry, identity validation and exact acquired-state continuation. Default models reproduced forecasts and final acquired state over 10800 archived completed windows exactly.

The independent auditor rebuilt the local receptor, bounded histories and kernel, then reproduced every one of the 24 baseline worlds, all founder-model hashes, all chronological scores and all 96 physical action forks. A synthetic changed receptor query was rejected. Every factual comparison retains its disclosed decision-reason normalization and raw/normalized hashes.

Reproduce:

```sh
node scripts/audit-resource-outcome.mjs evidence/resource-outcome/3c9b3c4b-5881-49ec-9337-52f33149c608
```

The result does not establish that sensory ambiguity is absent or that extra food sensing is useless. It rejects adoption of this fixed sensor/kernel design. Further learning work must specify a distinct mechanism rather than tune or resample this failed screen.
