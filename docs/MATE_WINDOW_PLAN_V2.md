# MATE-WINDOW PLAN V2 (FROZEN — DESIGN ONLY, no code, no bank, no attempt)

Status: FROZEN as design. Implementation (bar flip + fixtures +
triage + fresh bank + single authorized attempt) requires a
separate implementation freeze before code. Zero worlds, zero
seeds, zero bank draws spent here.

## Rationale (licensed by CONFIG_AUDIT_V1)

- V1 control (legacy/hub/bar-65) sterile 0/6: cause = bar
  (bar-65+legacy sterile in 2/2 configs), NOT bank luck.
  All birthy arms ran bar-50; enrichment set levels.
- V2 changes ONE variable: bar 65 → 50 (MATE-ENERGY
  precedent: bar50 unlocks). Control = legacy/hub/bar-50
  (predicts FOOD-like marginal birthiness ~2: floor passes,
  gates compute). Window test otherwise IDENTICAL to V1.
- Contingency: legacy+hub+bar-50 is a new cell (could be
  sterile via hub×legacy interaction). If V2 control
  sterile → INCOMPLETE again, line closes, rationale moves
  to enriched-base timing (V3, separate rationale required).

## Design (V1-identical except bar)

- 4 arms (control legacy all phases / early enriched phase-0
  only / late enriched phase-2 only / full enriched all) ×
  6 histories = 24 mains, ZERO probes. Hub base, maternal,
  decoupled, gain OFF.
- Bar: 50 (V1: 65). All other knobs HELD (same schedules,
  same topology, same transmission).
- Bank: fresh 54-unique (range TBD at implementation —
  anti-poisoning: never print literal future ranges; verify
  0 seed-key hits + 0 mentions before build), union-excluded
  incl. 446001–446054 (V1 spent), first use = V2 attempt.

## Gates (unchanged from V1 except bar value)

- G0 integrity (24 rows, 6/arm, residual <1e-7, finite).
- G1 config (maternal, decoupled, bar EXACTLY 50, hub,
  schedule deep-equal, births integers ≥0).
- G2 manipulation: early ≥ control×1.2 AND early ≥ control+2.
- G3 timing: early > late (direction; late≥early with boost
  met = TIMING-REFUTED).
- G4 reference: full ≥ control (else INVALID-bank-pathology).
- Floors: birthy rows ≥12/24 else INCOMPLETE-NOBIRTHS;
  key-arm (control/early) median survivors <6 → INVALID.
- Verdicts: GO-WINDOW / NOGO-WINDOW / TIMING-REFUTED /
  INVALID-* / INCOMPLETE-* (line closes either way).

## Budget (frozen caps; V1-repair carried forward)

- ≤24 mains + 0 probes; ≤150k ticks; ≤2M founder-slots;
  ≤5.0e9 ops (V1 measured 4.03e9/24 — cap fits with margin);
  ≤200MB; ≤3600s wall. Single authorized attempt;
  crash-resume only with dual provenance.

## Line discipline

- Closes either way (no V3 without fresh rationale — the
  enriched-base contingency above does NOT pre-authorize V3).
- No rescoring, no second attempt, no bank regeneration.
