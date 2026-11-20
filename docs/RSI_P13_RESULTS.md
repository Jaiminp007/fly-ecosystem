# RSI P13 results: the lineage tuning its own reviser (FAILED as recursion; pruning finding stands)

The plan was [RSI_P13_PLAN.md](RSI_P13_PLAN.md), frozen in `874bdfb` before the run. Runner: `scripts/rsi-p13.mjs`. Outputs are in `evidence/rsi-p13/` (local only).

Setup: 24 rules × 4 lineages × 12 generations, scored on generations 9–12.

| Gate | Measure | Result | Pass |
|---|---|---|---|
| G1 recovery | META15 − FIXED15 | **+1.84** (bar 1.20), 24/24 rules positive, p < 0.00001 | yes |
| G2 sham | META15 − SHAM15 | +0.06, 12/24 rules positive, p = 0.32 | **no** |
| G3 no harm | META3 − FIXED3 | +0.16 (bar ≥ −0.5) | yes |
| G4 mechanism | META15 chains ending with z > 1.5 | 18% (bar ≥ 75%) | **no** |

Reported, not gated:

- FIXED3 − FIXED15 = +2.39.
- META15 − S0 = +3.06.
- SHAM15 − FIXED15 = +1.77.
- Mean final z: META15 1.66, META3 2.37.

**P13 fails.** As the plan pre-specified for this outcome, the finding is that **pruning repairs the lineage, and z-tuning adds nothing**:

- **The recovery comes from pruning.** Lineages that start with a bad threshold recover most of the gap (+1.84 of 2.39) because each offspring drops inherited masks its own learned weights don't support. The sham, which prunes identically but copies another lineage's z steps, recovers almost the same amount (+1.77).
- **z barely moves, and when it does, it moves downward.** From z = 1.5 it mostly stays at the floor. From z = 3 it drifts down to 2.37. In both arms the lowering rule fires more often than the raising rule. That is consistent with pruning removing the false adds before they can trigger a raise.

## What this shows

- **Shown.** In-lineage self-revision of the learning program now includes both adding (P12) and removing (P13 pruning). Each is driven by the lineage's own evidence, and together they repair a badly set reviser.
- **Not shown.** Recursion inside the lineage, meaning the lineage tuning its own reviser. The hand-written z-update rule did not do this.

Labels:

- in-lineage relay with no selection;
- opt-in many-odor world;
- constructed tasks;
- hand-written prune and z rules.
