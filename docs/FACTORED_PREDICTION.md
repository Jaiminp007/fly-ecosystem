# Factored dynamics and reward prediction

Completed 2026-10-24T01:33:07.788Z. The fixed fresh-seed prediction gate **passed (true)**, but the actual action-effect gate **failed (false)**. Integration is **not supported (false)**. This architecture remains offline; ecological survival, model-cost acceptance and continual retention are unqualified.

[Fixed protocol](../evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278/protocol.json) · [Acquired-state compatibility](../evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278/compatibility.json).

## Why separate the heads

The [initial own-experience probe](PREDICTIVE_MODEL.md) found better sensory prediction with action information, but worse reward prediction than action erasure. That fixed screen failed and remains final. The new hypothesis is to retain action-sensitive dynamics while using a state-only reward head, evaluated on fresh seeds under a separate protocol.

The predictor adds an optional `rewardActionConditioned` flag. When it differs from the dynamics flag, its saved kind is `factored-transition`. Reward updates use their own feature vector and normalization. The fixed candidate retains the full dynamics interactions and erases actions only in the reward head. Its reward-head predictions are mathematically identical to the state-only control, while its sensory-head predictions are identical to the joint model on the same experienced sequence; these identities are checked explicitly. They do not constitute independent evidence that either head predicts causal action effects.

The state-only reward head also omits direct instantaneous motor-cost dependence. This is a modelling limitation, not a claim that actions do not affect energy. The separate action-effect gate tests whether its longer predicted consequences support useful choices. Predictions are not correctness labels.

## Fixed evaluation and action effects

12 previously unregistered seeds, both stable and relocating food environments, fixed learning rate 0.2, chronological holdout beginning at tick 900. Models observe the same unchanged incumbent trajectories; no model weights are shared among founders. Freeze/reset/zero, joint, state-only and persistence controls retain their meanings. No parameter search, reselection or sample extension.

The prediction gate requires reward improvement against joint and persistence, plus sensory improvement against state-only and persistence, in both environments. This is a criterion for the new factored architecture; it does not change the failed old-model criterion.

At the fixed planning times, model forecasts compare the two declared movement levels. Copies of the same world then force each first speed choice while preserving other initial streams and synchronizing the subsequent target exploration RNG. The recorded finite-window energy effects never train a predictor and never enter the factual baseline. The action gate requires positive planned gain over a random first action and positive paired gain over the incumbent's greedy ranking in both environments. The forecast holds complete motor vectors fixed; the real forks continue their neural outputs naturally, so those open-loop assumptions are tested rather than treated as exact.

Even passing both screens would not establish ecological survival, energy acceptance for the model itself, continual whole-body retention, or self-improving algorithms. A planning policy changes its own data distribution; the current models are trained on incumbent-generated experience. Prospective embodied tests would still be required.

## Results: forecasting passed, decision quality failed

[Raw results](../evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278/results.json) · [Audit](../evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278/audit.json). The fixed study covered 24 worlds and 518356 chronological holdout transitions. MSE differences below are factored minus control; negative values favor the factored model. Intervals aggregate world-level means across the fixed seeds.

| Environment | Required prediction contrast | MSE difference [interval] |
| --- | --- | ---: |
| stable | Reward minus joint | -0.000999 [-0.001071, -0.000927] |
| stable | Reward minus persistence | -0.004983 [-0.005456, -0.004511] |
| stable | Sensory minus state-only | -0.001146 [-0.001225, -0.001067] |
| stable | Sensory minus persistence | -0.002773 [-0.003012, -0.002534] |
| relocation | Reward minus joint | -0.000792 [-0.000930, -0.000654] |
| relocation | Reward minus persistence | -0.002778 [-0.003513, -0.002043] |
| relocation | Sensory minus state-only | -0.001389 [-0.001514, -0.001263] |
| relocation | Sensory minus persistence | -0.003704 [-0.003990, -0.003419] |

Both head-equivalence identities held exactly, as the architecture predicts. Freeze/reset comparisons are retained in the raw results and are secondary. This supports useful prediction on the declared data distribution, not correct hypothetical choices or generalized cognition.

The 96 action-effect cases used the same pre-decision state for both choices and compared finite-window target-agent energy. A tie contributes zero expected gain over a random first action. These are not whole-world survival outcomes.

| Environment | Action-effect contrast | Energy gain [interval] |
| --- | --- | ---: |
| stable | Model gain over random first action | -0.061440 [-0.134894, 0.012014] |
| stable | Incumbent gain over random first action | 0.063291 [-0.013725, 0.140307] |
| stable | Model minus incumbent gain | -0.124731 [-0.244817, -0.004645] |
| relocation | Model gain over random first action | -0.020791 [-0.104938, 0.063356] |
| relocation | Incumbent gain over random first action | 0.078322 [0.001535, 0.155110] |
| relocation | Model minus incumbent gain | -0.099113 [-0.195855, -0.002371] |

The model's paired action gain was negative in both environments, with intervals below zero. Better chronological MSE did not establish useful action ranking. No integration, sample extension or difficulty promotion follows from this result.

## Audit boundaries

The audit recomputed every prediction comparison, action-effect difference, gain and gate, checked source/registry hashes and the declared head identities, and independently reproduced predictor states, loss totals, learned forecasts and real forks on 2 selected seed/environment trajectories. That replay checked 8 planned cases; it did not independently replay every learner trajectory or every fork. The baseline final-world hashes remained unchanged.

90 factual comparisons required the disclosed decision-reason normalization. Raw and normalized checkpoint hashes remain recorded. The normalization does not alter positions, rewards, genomes, learned state or RNG; selected replay comparisons verify every remaining field. A [synthetic changed-action-effect copy](../evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278/audit-guard.json) was rejected by the auditor.

Reproduce with:

```sh
node scripts/audit-factored-prediction-study.mjs evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278
```

## Checkpoints, verification and a preserved failed attempt

90 tests passed. [Suite log](../evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278/checks/node-tests.log). The factored model learns action-sensitive synthetic dynamics with state-only reward, selects an action through predicted later states, continues exactly after JSON restore, and rejects missing/contradictory head identity. Existing default models reproduced 60 stored sample updates and the entire final acquired state exactly against archived code.

The [first attempted action-fork comparison](../evidence/factored-prediction/7e1e3e15-3266-4820-a1db-4d950a676f13/fork-compatibility-diagnosis.json) stopped before holdout scoring: forced actions retained an exploration-reason marker while the natural action had a retrieval marker. Reproduction verified equality after normalizing ONLY that recorded reason field. The failed attempt and its protocol are preserved; all its registered seeds were excluded from the corrected campaign. The corrected comparison records raw and normalized hashes and does not claim raw whole-state equality where that marker differs. No world dynamics or training labels were changed to pass the comparison.

The next intervention must address action-effect prediction and planning errors, including the disclosed open-loop and immediate-cost assumptions, under a new fixed protocol. Do not optimize these same fork outcomes until a favorable result appears. The full RSI goal remains active and unachieved.
