# MATE-ATTRACT STATUS (V1 CLOSED AS NOGO, V1b CLOSED AS NOGO)

## V1 (encounter contrast, NOGO 2026-11-01)

- Plan: `docs/MATE_ATTRACT_PLAN_V1.md` (FROZEN 2026-11-01, design only).
- Implement: mateSenseMultiplier null-default knob (engine sensors + validation +
  TasteExperiment passthrough) + `scripts/mate-attract-dev.mjs` (2x2, per-arm sense/topo
  maps, encounter-contrast verdict) + scripted two-fly sensing proof + 10/10 fixtures +
  fresh bank 430001-430054.
- Attempt-01 (single, authorized, 2026-11-01): 24 mains / 0 probes / 4.72e9 ops, clean pass.
- Verdict: **MATE-ATTRACT-NOGO-V1** (encounter contrast exactly flat: spread/2x gen-2 4
  vs spread/1x 4; births 30 vs 33; learned-use limitation realized, knob proven engaged).
- Hub arms descriptive: hub/1x 6 + hub/2x 8 vs spread 4/4 (V1-direction third bank).
- Line CLOSED (as V1). Births bank-volatile fourth time running.
- Weight-frozen diagnostic BLOCKED (rows lack weights); requirement carried (now conditional — see V1b).
- Results: `docs/MATE_ATTRACT_RESULTS_V1.md`.

## V1b (suppression, NOGO 2026-11-01)

- Plan: `docs/MATE_ATTRACT_PLAN_V1B.md` (hub suppression 0.5× vs 1×, food held; spread anchor; GO iff suppression works with hub≥2).
- Implement: per-arm sense/topology maps + scripted 0.5× sensing proof (detects 0.4r, blind 0.75r) + 1×≡no-flag bit-identity + 10/10 fixtures + fresh bank 431001–431054.
- Attempt-02 (single, authorized, 2026-11-01): 18 mains / 0 probes / 3.45e9 ops, clean pass.
- Verdict: **MATE-ATTRACT-NOGO-V1B** (suppression fails exactly: 5v5/27v27/22v22; V1-direction reverses fourth bank: spread 6 > hub 5).
- Structural finding: decoupled mating is proximity-gated (engine.mjs:175-178 — mate-action channel bypassed); sensing acts only via locomotion; [0.5,2]× range-invariant. Sharpens V1's learned-use reading; R65 patching-illusion cross-link recorded.
- Consequence: mating arc tested proximity-mediated mating throughout; Emlen-Oring needs proximity-rate manipulation (not sensing); weight-logging requirement now conditional on coupled designs.
- Line CLOSED. Results: `docs/MATE_ATTRACT_RESULTS_V1B.md`. Cumulative program spend: 7779.

## V2 (hardwired taxis, NOGO 2026-11-02)

- Plan: `docs/MATE_ATTRACT_PLAN_V2.md` (action-level knob after sensing proved bypassed; k=2 food-parity pre-registered; sign verified by fixture; -0 analysis documented).
- Implement: mateAttractBias null-default knob (motorPrimitive + tickMotor + 4 billing sites 6/9→9/12 + validation + TasteExperiment passthrough; 5 Python audit mirrors synced) + `scripts/mate-attract-v2.mjs` (attract/spread + hub anchor, per-arm bias maps, contrast verdict) + scripted steering proof (direction verified) + JSON-normalized bit-identity + absolute billing (9/12) + 11/11 fixtures; triage baseline restored (17 fallout items fixed as billing-sync, same-class as pursuit mirror); fresh bank 436001–436054.
- Attempt-03 (single, authorized, 2026-11-02): 18 mains / 0 probes / 3.59e9 ops, clean pass.
- Verdict: **MATE-ATTRACT-NOGO-V2** (attract gen-2 2 vs spread 3, births 31v33; firstMatingTick 4/6 identical — encounters on the same schedule; hub anchor 6).
- Line + arc CLOSED: sensing bypassed + steering inert → bottleneck is downstream (encounter→birth conversion / birth→gen-2 survival), not encounter rate.
- Results: `docs/MATE_ATTRACT_RESULTS_V2.md`. Cumulative program spend: 7857.

## V3 (hub taxis interaction, NOGO 2026-11-02)

- Plan: `docs/MATE_ATTRACT_PLAN_V3.md` (Emlen-Oring interaction cell; no new engine work — k=2 knob reused verbatim).
- Implement: per-arm topo/bias maps + dose-shaped contrast verdict + 11/11 fixtures incl. scripted steering + JSON-normalized bit-identity + absolute billing mirror; targeted triage green (zero shared-file changes); fresh bank 437001–437054.
- Attempt-04 (single, authorized, 2026-11-02): 18 mains / 0 probes / 3.37e9 ops, clean pass.
- Verdict: **MATE-ATTRACT-NOGO-V3** (hubAttract gen-2 0 vs hub 4; births uniform-low 19 vs variable 28; worst energy −42.2; timing unshifted).
- Line + arc CLOSED: encounters exonerated across sensing (bypassed), steering (inert), and interaction (harmful) levels. Bottleneck is downstream energy→survival conversion.
- Results: `docs/MATE_ATTRACT_RESULTS_V3.md`. Cumulative program spend: 7875.

## V4 (departure-gated taxis, NOGO 2026-11-02)

- Plan: `docs/MATE_ATTRACT_PLAN_V4.md` (energy gate at bar, +1 op billing 10/13, null-default preserved; hub-gated vs hub + spread anchor; closes arc either way).
- Implement: gate knob (`mateAttractEnergyGate` + `mateAttractGateThr`, JSON-safe checkpoint-restore recompute + regression fixture) + V4 instrument (gate maps/asserts/G2, NO births gate, INCOMPLETE-NOBIRTHS) + 13/13 fixtures; triage at 6 pre-existing baseline; fresh bank 438001–438054.
- Attempt-05 (single, authorized, 2026-11-02): 18 mains / 0 probes / 3.50e9 ops, clean pass (ledger exact, `redone: []`, G1+G2 true).
- Verdict: **MATE-ATTRACT-NOGO-V4** (hubAttract gen-2 7 vs hub 8 — gated taxis restores births to control level 33v37 but does not lift compounding; timing unshifted per-seed; no energy rescue; starvation was the harm mechanism, removing it reveals no latent advantage).
- Line + arc CLOSED: sensing bypassed + steering inert + interaction harmful + gating neutral → encounter-rate knob does not compound; conversion/interference-queueing are the licensed frontiers.
- Results: `docs/MATE_ATTRACT_RESULTS_V4.md`. Cumulative program spend: 7893.
