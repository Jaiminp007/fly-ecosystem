# Factual motor reward census results

Across the eight reused acquisition histories, the census reconstructs 260,820
actual own-energy transitions and verifies 23,808 retained motor-reservoir
entries against each founder's factual actions, features and rewards. Thirty
unfinished nonterminal decisions are censored; terminal transitions are kept.
A separate implementation reproduces the transition and receipt aggregates and
counts the retained entries. It does not independently replay TD updates,
reservoir selection or physical dynamics.

For decisions with no pre-action contact, mean immediate budget-energy change
per action is:

| Phase | Stationary | Half speed | Full speed |
| --- | ---: | ---: | ---: |
| A | -0.03725 | -0.04500 | -0.05382 |
| B | -0.03726 | -0.04727 | -0.05385 |
| C | -0.03610 | -0.04748 | -0.05979 |

In every phase and each of the eight histories, the observed stationary mean
away from contact is less negative than the observed full-speed mean. Across
31,565 such stationary transitions, none had a positive immediate reward.
These conditional observations are not a randomized comparison: different
actions occur in different positions, bodies and resource states. They do not
show that stopping is better over a longer horizon or prove why TD weights
shift. The full-speed intervention separately demonstrates improved frozen
transfer outcomes in the seven available histories, while still failing the
survival requirement against both strong controls.

This evidence is consistent with a short-term movement-cost versus future-food
credit problem worth testing, but bootstrapping, eligibility and state
distribution can also affect the learned values. A prospective revision must
learn from actual own trajectories, account for delayed consequences and
compare equally priced controls; do not replace the result with a hard-coded
full-speed policy or use fork outcomes as training labels.

Raw per-history bins and readback are in
`evidence/own-steering-reward-census/20261026-v1`. These are reused,
outcome-informed development histories, not fresh qualification. Retention,
functional pressure, transfer and later autonomous revision remain unproved.
