# Gate-replay transfer trajectory census

The predeclared `GATE_REPLAY_TRANSFER_CENSUS_PLAN.md` compares existing
same-start transfer-current and transfer-native-steering probes in the fresh
and reservoir worlds. Differences below are current minus native per original
founder, except action counts and survivor discordances.

| Metric | Fresh | Reservoir |
| --- | ---: | ---: |
| Budget-adjusted energy | -0.150504 | -0.396175 |
| Beneficial intake | +0.081162 | -0.463660 |
| Physical cost | +0.009816 | +0.001827 |
| Death-discarded energy | +0.221874 | -0.069315 |
| Final unpaid debt | -0.000024 | +0.000004 |
| Current midpoint actions | 7,530 / 19,740 | 6,711 / 19,177 |
| Current / native wall-sensor decisions | 3,203 / 2,744 | 2,581 / 2,193 |
| Current-lost / current-saved survivors | 1 / 1 | 0 / 0 |

The reservoir energy deficit is associated primarily with lower total food
intake, not extra physical cost or frozen gate-buffer storage. Its native and
current probes have no survivor discordances, but lifetimes and positions can
still differ. Fresh has a different pattern: mean intake is higher under
current steering, but discarded energy at death is higher. Wall-sensor and
midpoint counts are descriptive and cannot by themselves identify a cause.

Evidence: `evidence/gate-replay-transfer-census/20261026-v1`. An independent
checker verifies 77,794 decision/receipt pairs, per-body energy balances,
unpaid debt and all summary arithmetic. Matched starts are identical, but
interacting worlds and RNG diverge; body-level gaps are not isolated causal
effects. These reused-world diagnostics do not establish fresh qualification,
independently simulate physics or reopen any reserve.

Next use fixed focal steering swaps on outcome-selected reservoir bodies to
distinguish the role of the focal controller from changes in the surrounding
world. This is mechanistic diagnosis only, not a new performance screen or a
source of counterfactual training labels.
