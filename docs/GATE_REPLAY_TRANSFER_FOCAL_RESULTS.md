# Outcome-selected focal transfer steering

The fixed `GATE_REPLAY_TRANSFER_FOCAL_PLAN.md` selects, in each reservoir
history, the body with the largest observed native-minus-current final physical
energy gap. It swaps that body's steering alone in each of the two existing
whole-world backgrounds. Selection is explicitly post-outcome and the results
are not an independent performance screen.

| Seed / body | All current | Focal native in current | Focal learned in native | All native |
| --- | ---: | ---: | ---: | ---: |
| 1172370180 / 18 | 28.35 | 28.35 | 53.86 | 53.86 |
| 3243849148 / 9 | 61.21 | 66.19 | 49.30 | 81.44 |
| 1917475589 / 2 | 64.51 | 83.80 | 66.37 | 91.38 |
| 748966988 / 9 | 29.78 | 29.78 | 52.07 | 52.07 |
| 3285880790 / 9 | 46.69 | 46.69 | 62.47 | 62.47 |
| 2672461838 / 3 | 19.30 | 54.31 | 21.54 | 54.31 |
| 3170855589 / 4 | 34.59 | 37.60 | 56.26 | 44.27 |
| 681849533 / 15 | 55.14 | 55.14 | 59.92 | 59.92 |

In four selected cases the focal controller's executed steering never differs
under either swap; the focal outcomes remain exactly those of their respective
background worlds despite a substantial cross-world energy gap. In the other
four cases, focal-native steering improves the focal's energy in the current
background; focal-learned steering reduces it in three of four native
backgrounds. One native-background swap improves it instead. This establishes
that the selected gaps cannot all be attributed to the focal controller's own
steering choice. Competition, resource depletion and coupled RNG remain possible
explanations; these interventions do not separately identify them.

Here "steering" means the discrete native-versus-midpoint selector action.
Native turn commands can still differ across the two background worlds when
the focal's sensory inputs diverge, as checked in
`docs/GATE_REPLAY_NONFOCAL_PATH_RESULTS.md`.

Evidence: `evidence/gate-replay-transfer-focal/20261026-v1`. Six focused tests
pass. An independent checker reconstructs the selection and focal assignments,
verifies 38,338 decision/receipt pairs and declared work/debt, and exactly
replays all 16 intervention arms. It does not independently simulate physics
or turn these selected cases into independent qualification samples. No outcome
was supplied to the learner, and all prior failures and closed reserves remain.

Next inspect the previously audited social/RNG and steering diagnostics before
choosing a phase-blind learner revision. It must address whole-world transfer,
not merely the focal cases, and retain the original pressure, 95% retention,
survival, strong-control and fresh-audit requirements.
