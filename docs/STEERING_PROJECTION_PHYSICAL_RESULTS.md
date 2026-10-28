# Steering projection physical development

The fixed matched-arm study in `STEERING_PROJECTION_PHYSICAL_PLAN.md` ran all
eight reused development histories. Both arms retained and computed the same
own-history projection and paid the declared costs; `project` applied it to
the shared increment, while `control` applied the original increment.
Checkpoints and full traces are compressed; no prior evidence was removed.

| Descriptive metric | Control | Project |
| --- | ---: | ---: |
| D survivors / 192 founders | 60 | 63 |
| Transfer energy vs matched reset, per founder | +0.088474 (3/8 positive) | +0.090557 (5/8) |
| Transfer energy vs cheap native, per founder | -0.075420 (3/8 positive) | -0.098036 (4/8) |
| Transfer survivor difference vs reset / cheap | +1 / +1 | 0 / 0 |
| A interference, energy per founder | -0.092293 | -0.043461 |
| B acquisition, energy per founder | -0.132556 | +0.203346 |
| A net-intake difference per founder | -0.098343 | -0.048516 |
| Descriptive A / B retention ratio | 100.34% / 101.89% | 103.66% / 94.49% |

The project arm **fails** the exploratory transfer rule against both reset
and cheap native: its reset win occurs in only five histories and its mean
cheap-native comparison is negative. It also fails the descriptive pressure
and 95% B-retention thresholds. The apparent B acquisition is not enough to
pass the joint gate. These are reused-world raw summaries, not statistical
qualification, and the two arms evolved different physical worlds; their
survivor totals are not paired individual counterfactuals.

Evidence is in `evidence/steering-projection-development/20261026-v1`.
The ledger/ancestry checker verifies 954,016 decision/receipt pairs, 128
checkpoint links and 208 probe starts. A separate own-pending-action projection
checker reconstructs 561,179 steering updates, including 261 terminal updates,
and exactly replays 64 acquisition phases. Fourteen focused physical, lifecycle
and regression tests pass. Neither checker independently simulates physics or
proves complete low-level operation pricing or hardware energy adequacy.

This falsifies promotion of the mean-projection candidate despite its positive
offline screen. Diagnose whether the action-conditioned means actually preserve
the prior transfer decisions on the candidate's factual trajectory, and
whether its paid overhead or altered C/B behavior drives failure before choosing
another mechanism. Do not tune on these results or claim a qualified skill;
closed reserves and the later autonomous-revision requirement remain unchanged.
