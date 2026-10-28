# Why the factored planner made worse choices

Completed 2026-10-24T01:41:46.940Z. This is a diagnosis of the fixed failed action cases, not a new policy qualification.

[Protocol](../evidence/planning-diagnosis/9ff7bff8-0167-42d5-8f34-afa6fffc6e78/protocol.json) · [Detailed per-step evidence](../evidence/planning-diagnosis/9ff7bff8-0167-42d5-8f34-afa6fffc6e78/results.json) · [Independent audit](../evidence/planning-diagnosis/9ff7bff8-0167-42d5-8f34-afa6fffc6e78/audit.json).

The auditor independently reconstructed every acquired target-founder model and replayed all 24 unchanged baseline worlds, 96 action cases, and 1536 slow/fast physical steps. Every recorded model hash, baseline-world hash, fork ending and forecast was reproduced. The previous [factored study](FACTORED_PREDICTION.md) remains failed for action choice.

## Decomposition

Each frozen model is queried in four ways: its original rollout with complete initial motor vectors held fixed; the same rollout supplied the actual future motor schedule; reward predictions supplied the actual future sensory states; and actual discounted clipped rewards. The last three include privileged future information and are diagnostic only. Fork outcomes never train predictors.

Adjacent differences add exactly to the original predicted-effect error relative to actual endpoint energy. Their absolute magnitudes are descriptive and correlated, so they are not additive causal shares. Seed-level intervals use the original 12 seeds per environment; individual cases are not independent samples.

| Environment | Forecast variant | Gain over random speed [interval] | Mean absolute energy-effect error |
| --- | --- | ---: | ---: |
| stable | Original forecast | -0.061440 [-0.134894, 0.012014] | 0.272214 |
| stable | Actual future motor schedule | -0.062779 [-0.138403, 0.012845] | 0.278586 |
| stable | Actual future sensory states | 0.057071 [-0.032170, 0.146312] | 0.240595 |
| stable | Actual discounted rewards | 0.123880 [0.044253, 0.203506] | 0.013878 |
| relocation | Original forecast | -0.020791 [-0.104938, 0.063356] | 0.260458 |
| relocation | Actual future motor schedule | -0.017895 [-0.099975, 0.064185] | 0.258551 |
| relocation | Actual future sensory states | 0.042837 [-0.044918, 0.130593] | 0.246584 |
| relocation | Actual discounted rewards | 0.119099 [0.045660, 0.192537] | 0.013058 |

## What the replay supports

Actual discounted reward ranked the same speed as endpoint energy in every recorded case. Reward clipping/discounting therefore does not explain the observed ranking failure in this sample. Supplying actual future motor outputs changed the rankings little and did not resolve negative planned gain. Sensory rollout drift accumulated, and the reward head still made large effect errors even with actual future sensory states. Neither oracle-assisted variant establishes a deployable solution.

| Environment | Held-motor gap, absolute mean | Dynamics gap, absolute mean | Reward-head gap, absolute mean | Objective gap, absolute mean |
| --- | ---: | ---: | ---: | ---: |
| stable | 0.012036 | 0.077791 | 0.230063 | 0.013878 |
| relocation | 0.009537 | 0.069335 | 0.233667 | 0.013058 |

These observations support testing a direct finite-window consequence model: learn the return of completed actual movement decisions, bundling natural feedback in the other motors, rather than chaining uncertain sensory and reward forecasts. They do not establish that direct modelling will work. It requires a separately fixed fresh-seed action-effect screen.

## Verification and limits

A synthetic copy with one changed per-step reward was rejected by the physical replay audit. The initial diagnostic launch failed because the archived task helper imports an engine file absent from that predictor-only archive; the preserved log records `ERR_MODULE_NOT_FOUND`. The corrected script implements the same declared interval convention directly and imports only the complete archived world and dependency-free predictor. No factual trajectory or case set was changed.

All target agents survived the selected finite windows. This diagnosis cannot establish terminal-risk calibration, survival benefit, prospective control, model energy cost, retained skills, or RSI. No live controller or difficulty was changed.

Reproduce:

```sh
node scripts/audit-planning-diagnosis.mjs evidence/planning-diagnosis/9ff7bff8-0167-42d5-8f34-afa6fffc6e78
```
