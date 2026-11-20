# MATE-PROXIMITY STATUS (V1 CLOSED AS GO, V1b CLOSED AS NOGO)

## V1 (range dose, GO 2026-11-01)

- Plan: `docs/MATE_PROXIMITY_PLAN_V1.md` (FROZEN 2026-11-01). Knob: matingRangeMultiplier
  (13/26/52u execution radius; sensing/display gates untouched).
- Implement: engine execution-site + validation + TasteExperiment passthrough +
  `scripts/mate-proximity-dev.mjs` (3-arm dose, per-arm range map) + scripted range proof
  (20u/40u boundaries exact) + 1×≡no-flag bit-identity + 11/11 fixtures + fresh bank 432001–432054.
- Attempt-01 (single, authorized): 18 mains / 0 probes / 3.60e9 ops, clean pass.
- Verdict: **MATE-PROXIMITY-GO-V1** (dose-monotone 5 ≤ 9 ≤ 17 gen-2 AND 32<46<57 births;
  strict ordering, no ties needed; sublinear births scaling 1:1.44:1.78 vs radii 1:2:4).
- Results: `docs/MATE_PROXIMITY_RESULTS_V1.md`.

## V1b (Emlen-Oring split at fixed breadth, NOGO 2026-11-02)

- Plan: `docs/MATE_PROXIMITY_PLAN_V1B.md` (split pair hubR2/spreadR2 + 1× anchors; GO iff food matters given breadth).
- Implement: per-arm topo/range maps + topology-independent range proof + 10/10 fixtures + fresh bank 433001–433054.
- Attempt-02: 24 mains / 0 probes / 4.75e9 ops, clean pass.
- Verdict: **MATE-PROXIMITY-NOGO-V1B** (hubR2 5 vs spreadR2 7 at equal 52u — breadth-sufficient; food geography irrelevant).
- Interaction (descriptive): breadth lifts spread 2→7, hub flat 5→5 (saturation); anchors hubR1 5 > spreadR1 2 (V1-direction 5/6 banks).
- Arc-closing food thesis: food is a gate (MATE-FOOD UNLOCK), not a gradient (V1b irrelevance).
- Results: `docs/MATE_PROXIMITY_RESULTS_V1B.md`. Cumulative program spend: 7821.

## V1c (dose replication, GO 2026-11-02)

- Plan: `docs/MATE_PROXIMITY_PLAN_V1C.md` (exact V1 replication, V1 bar frozen-identical).
- Implement: copy-adapted instrument + 11/11 fixtures + fresh bank 435001–435054 (targeted triage, zero shared-file changes).
- Attempt-04: 18 mains / 0 probes / 3.42e9 ops, clean pass.
- Verdict: **MATE-PROXIMITY-GO-V1C** (dose replicates: 3 ≤ 8 ≤ 11 gen-2, 27<37<49 births; shape-stable across banks, intercept varies — non-exact replication per R71; rate saturates normal≈wide 0.22).
- Arc-closing: first replicated mating structure; V1-direction 6/7 banks.
- Results: `docs/MATE_PROXIMITY_RESULTS_V1C.md`. Cumulative program spend: 7839.
