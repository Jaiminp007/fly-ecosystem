# Own-experience predictive model: initial offline screen

Completed 2026-10-24T01:19:46.642Z. Agents now have an experimental offline transition learner and an explicit predicted-rollout planner. The fixed prediction screen was **false**; this prototype is not integrated into World or the live controllers. Prediction improvements are not evidence of improved survival or RSI.

[Protocol and raw results](../evidence/predictive-transitions/42cec198-2c7c-41d1-9f68-16cb4694eaa3/results.json) · [Audit](../evidence/predictive-transitions/42cec198-2c7c-41d1-9f68-16cb4694eaa3/audit.json).

## What the prototype learns

Each founder owns its own model; weights and experience do not cross between agents. The model receives its 17 current sensory values and 5 executed motor outputs, with fixed interactions between sensory values and movement/turning. It learns normalized online linear updates from actual net-energy reward and the next observed sensory vector. Next-observation predictions are residuals from the current observation. No food map, engine-transition function, correct-action label or counterfactual effect is an input.

The initial model predicts zero reward and unchanged observations. Learning is online from completed consecutive transitions. Predictions for a transition are recorded before that transition updates the model; its next sensory target arrives on the next observed step. The offline historical engine has already generated the executed action/reward when the prediction query is computed, but the reward target is assigned separately after predictor calls and is never a predictor argument. This is an offline chronological evaluation, not proof of an in-body decision-before-execution integration.

The planner rolls this learned model forward with each proposed full action vector held constant for the declared horizon. It chooses by predicted discounted reward, records predicted final observations and the number of model calls, and refuses to plan before sufficient actual experience. Plans never change a world or train the model in this probe. Open-loop forecasts are not uncertainty bounds or executed outcomes. Future integration must account for model parameters/compute energy, world checkpoint identity and learned-state inheritance boundaries.

## Fixed chronological comparison

The probe reused 6 historical seeds across 2 environments (12 unchanged worlds). It scored 259043 own-experience transitions in the chronological second half, beginning at input tick 900. There was no learning-rate search or sample extension. No terminal transition without a following actual sensory observation is assigned a synthetic next-state label.

The controls erase action features, freeze previously acquired weights at the holdout boundary, reset acquisition at that boundary, retain a zero residual/reward predictor, or persist the last reward and current observation. All receive the same physical trajectories. Predictions can continue to update from earlier scored transitions; no transition trains on its own target before its prediction is scored.

Differences are online-model MSE minus control MSE. Negative values favor the online model. Observation MSE averages over the sensory channels. Intervals aggregate per-world means at the seed level; the small reused sample is exploratory.

| Environment | Control | Reward MSE difference [interval] | Sensory MSE difference [interval] |
| --- | --- | ---: | ---: |
| stable | Action-erased learner | 0.000971 [0.000866, 0.001076] | -0.001145 [-0.001262, -0.001028] |
| stable | Learner frozen at holdout | -0.002100 [-0.002562, -0.001638] | -0.004442 [-0.005065, -0.003819] |
| stable | Learner reset at holdout | -0.001386 [-0.001622, -0.001150] | -0.000682 [-0.000732, -0.000632] |
| stable | Zero residual / reward model | -0.001619 [-0.002204, -0.001035] | -0.002721 [-0.003038, -0.002404] |
| stable | Last reward / same-observation persistence | -0.004648 [-0.006240, -0.003055] | -0.002721 [-0.003038, -0.002404] |
| relocation | Action-erased learner | 0.000789 [0.000495, 0.001082] | -0.001529 [-0.001871, -0.001187] |
| relocation | Learner frozen at holdout | -0.002905 [-0.003339, -0.002471] | -0.006298 [-0.007826, -0.004771] |
| relocation | Learner reset at holdout | -0.000993 [-0.001377, -0.000610] | -0.000596 [-0.000675, -0.000516] |
| relocation | Zero residual / reward model | -0.002283 [-0.002980, -0.001587] | -0.004028 [-0.004922, -0.003134] |
| relocation | Last reward / same-observation persistence | -0.002277 [-0.003617, -0.000937] | -0.004028 [-0.004922, -0.003134] |

Action conditioning improved sensory forecasts but worsened reward forecasts relative to action erasure. Continued learning improved both heads over frozen/reset controls in this sample. The declared screen required reward improvement over action erasure and persistence in both environments; it failed. This does not justify an embodied planning policy or a survival claim. A future factorization of action-sensitive dynamics and reward prediction would be a distinct intervention requiring a new fixed protocol and fresh evaluation, not a reinterpretation of this failed screen.

## Verification

88 Node tests passed. [Suite log](../evidence/predictive-transitions/42cec198-2c7c-41d1-9f68-16cb4694eaa3/checks/node-tests.log). New tests show that observed action effects can be learned in a constructed transition task, action erasure removes their distinction, frozen models preserve zero acquired weights, exact JSON model continuation matches, planning does not mutate state, and malformed data are rejected. These component tests do not establish ecological usefulness.

The audit independently recomputed loss/interval arithmetic and the fixed screen. An independent online-learning loop reproduced every acquired predictor-state hash and every loss total for 2 complete seed/environment trajectories. Every original world hash still matches the recorded historical source. 36 hypothetical plans were recorded without affecting control. The audit replays only its specified subset of predictor trajectories.

Reproduce with:

```sh
node scripts/audit-predictive-transition-probe.mjs evidence/predictive-transitions/42cec198-2c7c-41d1-9f68-16cb4694eaa3
```

The normalized-trace study also completed and [failed the full energy/survival gate](NORMALIZED_TRACES.md), despite a separate cue-memory pass and a partial relocation-energy signal. Neither result changes the live policy or difficulty. Robust adaptation, whole-body continual retention, autonomous algorithm improvement and RSI remain open.
