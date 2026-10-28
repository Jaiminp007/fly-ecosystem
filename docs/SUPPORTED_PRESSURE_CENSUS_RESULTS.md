# Supported learner pressure feature census

The fixed census in `SUPPORTED_PRESSURE_CENSUS_PLAN.md` compares saved A and B
taste and steering models on the protect arm's recorded A-probe inputs. Each
trajectory uses the same reconstructed own taste draw for both model estimates.
A/B motor weights match for every D survivor.

| Recorded trajectory | Decisions | Taste changes | Eligible stationary/contact taste changes | Available steering changes |
| --- | ---: | ---: | ---: | ---: |
| Saved-A probe | 14,584 | 295 | 93 / 5,125 | 452 / 9,213 |
| Saved-B probe | 14,580 | 245 | 94 / 5,303 | 237 / 9,190 |

The joint taste/steering change occurs on 7 and 1 decisions respectively.
An eligible contact is an observed stationary, odor-present homogeneous contact,
not proof that food was actually consumed. Changes vary substantially by
history. Both taste and steering models can alter behavior on factual inputs,
but these counts alone cannot say which component caused the negative pressure
contrast or whether changes would improve any physical outcome. In particular,
the same-draw estimate holds the recorded trajectory fixed; an actual changed
action could alter later inputs, interactions and RNG consumption.

Evidence: `evidence/supported-pressure-census/20261026-v1`. A separate
implementation verifies taste and steering arithmetic, factual RNG, input and
trace hashes, and aggregate counts for all 29,164 decisions. This is reused,
outcome-informed observational evidence, not a physical counterfactual,
independent simulation, or qualification.

Next use a paid frozen A/B taste-by-steering factorial on the same protect D
worlds and original A and B probe seeds, preserving equal motor models and
debt, and audit assignments and replay. This distinguishes total-world component
effects and interaction without using counterfactual outcomes as learning
labels. Additional free disk space is required before collecting full tapes;
do not delete existing evidence or open a reserve. All original gates remain.
