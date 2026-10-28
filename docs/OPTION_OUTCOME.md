# Direct finite-window consequence memory

Completed 2026-10-24T01:47:27.953Z. The fixed fresh-seed action gate **failed**. No integration, policy adoption, sample extension or difficulty promotion follows from this experiment.

[Protocol](../evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/protocol.json) · [Results](../evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/results.json) · [Audit](../evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/audit.json).

## Intervention

The [planning failure diagnosis](PLANNING_DIAGNOSIS.md) found errors in both reward prediction and imagined sensory rollouts. This model bypasses both: each founder stores the discounted reward of its own completed movement-decision window. It predicts the outcome of choosing slow or fast while other neural motor outputs continue naturally. This is a finite-horizon option model, not an imagined tick-by-tick world.

The fixed prototype stores at most 128 actual windows in FIFO order. Retrieval uses eight neighbors per action, Gaussian bandwidth 0.125 and root-mean-square distance at most 0.25 over current food-bearing/proximity, energy, wall, scent and previous-intake channels. It requires at least two local examples for each action; unsupported queries fall back to incumbent greedy ranking. These are support counts, not calibrated confidence bounds. No cross-founder sharing, TD bootstrap, food-map access, hypothetical training labels, or future sensory targets are used.

The feature selection and kernel are disclosed engineered choices. Records preserve all 17 inputs, but the metric uses the nine channels listed in the protocol. No physical controller imports this module, and computation/storage energy costs remain unqualified.

## Fixed prospective study

12 fresh seeds in both stable and relocating environments, 24 worlds, 129588 completed factual windows and 96 matched action cases. The original incumbent generates all factual trajectories; candidate outcomes do not control or train from the forks. Reproduction and mutation are disabled. The same initial checkpoint is used for slow and fast forks, with the existing disclosed decision-reason normalization.

2 incomplete terminal windows were excluded and counted. This model cannot forecast terminal risk from that treatment, and survivor-conditioned forecast scores are not survival evidence.

The primary gate requires, in both environments: at least half the fixed cases supported, positive lower seed-level interval for gain over random first speed, and positive lower paired intervals versus both incumbent greedy ranking and the frozen-at-900 model. No development selection or tuning was performed. All cases, unsupported fallbacks and failed guards remain in the results.

## Outcomes

| Environment | Supported action cases | Gain over random speed [interval] | Gain minus incumbent [interval] | Gain minus frozen [interval] |
| --- | ---: | ---: | ---: | ---: |
| stable | 91.67% | 0.114878 [0.046362, 0.183394] | 0.019654 [-0.014760, 0.054068] | -0.001212 [-0.006719, 0.004295] |
| relocation | 93.75% | 0.094052 [-0.014043, 0.202148] | 0.023696 [-0.034892, 0.082285] | 0.009264 [-0.033998, 0.052526] |

Stable-world gain over random first speed was positive under the declared interval. Relocation gain remained uncertain, and neither environment established improvement over the incumbent or frozen model. The full action gate failed. Positive point estimates do not establish a qualified upgrade.

Chronological forecast controls are secondary and conditioned on sufficient local candidate support. They score only completed actual windows starting after the holdout boundary. The predictions are queried without the window outcome; targets become available only when the factual window finishes. Action erasure pools the same bounded history; the other control averages past outcomes for the chosen action without context.

| Environment | Scored-window coverage | MSE minus action-erased local predictor [interval] | MSE minus action-only mean [interval] |
| --- | ---: | ---: | ---: |
| stable | 83.82% | -0.005320 [-0.009393, -0.001246] | -0.136526 [-0.142590, -0.130463] |
| relocation | 82.77% | -0.004484 [-0.006997, -0.001971] | -0.115698 [-0.128357, -0.103038] |

The conditional prediction improvements do not establish causal action rankings or benefits under a candidate-controlled data distribution. Unsupported and incomplete windows are not silently counted as successful predictions.

## Verification

93 tests passed. [Full suite](../evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/checks/node-tests.log). Tests cover context-dependent opposite effects, explicit support failure, completed-window targets, action erasure, bounded storage, corrupt state rejection, prediction purity and exact JSON continuation. The new module is offline and does not alter the confirmed live policy.

The auditor independently implemented the FIFO model, kernel forecasts and target arithmetic, then reproduced all 24 worlds, every founder acquisition hash, every chronological score and all 96 actual action forks. Source/reference/seed-registry hashes, fallback rules, factual comparisons, intervals and the failed gate were checked. A [synthetic changed-effect fixture](../evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/audit-guard.json) was rejected against physical replay.

Reproduce from the unchanged source or its archived tree:

```sh
node scripts/audit-option-outcome.mjs evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf
```

The fixed study is complete and must not be extended to force a pass. Next work needs a separately specified mechanism or a diagnosis of where direct consequence predictions lose action ranking, with fresh evaluation for any resulting candidate. Broad relocating-food learning/survival, embodied model costs, retained multiple skills and autonomous algorithm improvement remain open.
