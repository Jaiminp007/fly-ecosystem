# Frozen gate-memory cost census

The predeclared `LEARNED_GATE_FROZEN_MEMORY_PLAN.md` examines the recorded
transfer-current probes from the matched gate replay study. It prices each
frozen reservoir's encoded storage for its body's actual decision count and
estimates a one-time encoded-buffer traversal/clear operation charge.

| Arm | Recorded extra storage incurred/founder | Estimated traversal charge/founder | Difference/founder |
| --- | ---: | ---: | ---: |
| Fresh | 0.003556 | 0.000570 | 0.002986 |
| Reservoir | 0.003455 | 0.000555 | 0.002899 |
| Random | 0.002106 | 0.000332 | 0.001775 |
| Shadow | 0.002735 | 0.000433 | 0.002302 |

This recorded-trajectory estimate is much smaller than the reservoir arm's
approximately -0.400/founder transfer-current versus reset contrast. It does
not explain that deficit by itself and does not measure a physical compaction
intervention: changed energy, deaths and RNG could alter future trajectories.
Incurred charge is not necessarily the same as paid charge or endpoint benefit.
Reset's different work, memory and learned components are not represented by
this isolated buffer calculation.

Evidence: `evidence/learned-gate-frozen-memory/20261026-v1`. A separate
checker uses the captured canonical encoder and verifies 65,793 recorded
transfer decisions, frozen buffer contents, trace hashes and the arithmetic.
It does not independently simulate physics. Main gate-replay study results and
their separate full replay audit remain the authoritative qualification context.
