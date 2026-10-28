# Matched factual gate replay development

The fixed `LEARNED_GATE_REPLAY_PLAN.md` compares a reservoir-selected second
gate update against a current-record second update, with matched buffers,
draws, work and actual own-action rewards. Random-action and selector-shadow
arms use the same replay architecture. All results use the eight reused,
outcome-informed development histories; no qualification reserve was opened.

| Metric | Fresh | Reservoir | Random | Shadow |
| --- | ---: | ---: | ---: | ---: |
| D survivors / 192 founders | 79 | 77 | 46 | 60 |
| D survivors sampling both gate actions | 79/79 | 77/77 | 46/46 | 0/60 |
| A advantage, energy/founder | +1.502477 | +1.541524 | +0.636861 | +1.255812 |
| A interference, energy/founder | +0.121951 | +0.103185 | -0.030603 | +0.027361 |
| A interference minus 5% advantage | +0.046827 | +0.026109 | -0.062446 | -0.035430 |
| A net-intake difference/founder | +0.061788 | +0.001596 | -0.042346 | +0.020370 |
| B acquisition, energy/founder | +0.365305 | +0.234844 | -0.069173 | -0.110804 |
| A / B descriptive retention | 101.18% / 93.02% | 92.91% / 95.37% | 108.54% / 119.53% | 98.74% / 97.48% |
| Transfer vs reset, energy/founder | -0.154316 | -0.399987 | +0.509938 | -0.095614 |
| Transfer vs cheap native, energy/founder | -0.367864 | -0.663515 | +0.375834 | -0.252422 |
| Positive transfer histories vs reset / cheap | 3 / 2 | 2 / 2 | 5 / 5 | 3 / 3 |
| Transfer survivor difference vs reset / cheap | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

Both learned arms have positive raw A-pressure margins and B-acquisition
contrasts, and all their D survivors sampled both gate actions. Nevertheless,
fresh falls below the 95% B-retention target, reservoir falls below the 95%
A-retention target, and both fail the exploratory transfer rule against
reset and cheap native. Reservoir versus fresh has -1.330079 D energy per
founder, only 2/8 positive histories and two fewer D survivors; separately
evolved worlds are not paired individual effects. No arm passes the joint
development requirements, and neither qualifies a skill or an autonomous
revision. Preserve all negative evidence and closed reserves.

The independent endpoint checker verifies 544 endpoints and 124,963 A-probe
receipts. The independent gate/ledger checker reconstructs 446,434 actual
gate actions, including 193,017 reservoir updates from earlier own records,
and 1,966,672 decision/receipt pairs; all 544 recorded arms replay exactly,
with 256 checkpoint links and 416 probe starts. Nine focused tests passed.
Independently reconstructed floating rewards and weights use numerical
tolerances because equivalent debt-subtraction orders round differently.
These checks do not independently simulate physics or establish hardware-energy
adequacy. Evidence: `evidence/learned-gate-replay-development/20261026-v1`.

The separate `LEARNED_GATE_FROZEN_MEMORY_RESULTS.md` census estimates only
about 0.0029 incurred energy/founder of removable reservoir storage net of
traversal on recorded transfer trajectories; it is not a physical compaction
experiment or an explanation of the roughly -0.400 reset deficit. Reservoir
transfer-current is also -0.396175/founder versus matched native steering,
positive in only 2/8 histories. Next isolate the transfer steering and
trajectory mechanism on the same saved worlds before altering the learner;
retain both replay controls and the unchanged original qualification gates.
