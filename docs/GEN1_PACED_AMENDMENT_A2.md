# GEN1-PACED PLAN V1 — Amendment A2 (FROZEN 2026-11-04)

## Duty defeated by compensation (universal per-patch cap replaces it)
Re-triage with the A1 nutrient pin: capped 0.0319 vs uncapped 0.0368
same-history (only a 13% cut, not 33%). The nutrient pin held (no
regrowth leak), but BEHAVIOR compensated: fasting spikes need
(120−energy), so visible-tick meals grow (take is need-capped with
0.8 headroom) — capping opportunities does not cap intake when agents
eat-to-need with headroom.
Replacement (same files, no engine change): UNIVERSAL per-patch cap
C, every tick (no duty, no nutrient games, regrowth intact). Pre-step:
store excess = max(0, amount−C) per patch, set amount = min(amount,C).
Post-step: add excess back (eaten stays eaten; conservation holds;
phase/shift-safe — amounts preserved by transitions). Meal size is
hard-capped (take = min(C, need, 0.8) = C when C binds), so gorging is
impossible regardless of need — total per tick ≤ k×C (k = nearby
patches). Cues/contacts/behavior/regrowth untouched; only meal size
gated. This is the user-ordered per-tick intake cap, literally.
Calibration: C starts at 0.01; up to TWO throwaway triage runs (new
seeds in the triage range, disclosed) to land capped per-agent-tick
gross near the deep steady rate (~0.018, feast-measured); pick the
closest C (one adjustment allowed). Manipulation gate unchanged in
form (capped ≤ uncapped×0.8) with the deep-rate landing reported
descriptively. All other plan terms stand.
