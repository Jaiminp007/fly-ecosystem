# GEN1_SOCIAL3 PLAN V1 (frozen 2026-11-04) — third social bank: law-grade or boundary?

## Why this line, and only this one
Social stands at 4/4 pairs across two banks (V1 +0.124/+0.195,
V2 +0.146/+0.284) — the second stable channel after biparental.
BIPAR3 showed what a third bank is for: mapping the boundary (its
NOGO came from a colony extinction, not a flat gap). The licensed
question is whether social goes 6/6 (law-grade) or finds its own
boundary. Same instrument, same frozen bar. Not a re-run of
fresh-72/73, not a new design.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to SOCIAL V1/V2: trainAB (512+512, digest gates else
INVALID), skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL),
three separate matched colonies 1792 (A1 mating, reproduction ON,
frozen newborns, original cues): social (copyconditional) vs copy
(maternal exact) vs naivekid (vt none). Pooled offspring/arm ≥ 6 else
INCOMPLETE-LOWBIRTHS. Score per-arm offspring survival + per-lived-
tick intake.

## Verdict (per-pair, both pairs, frozen — identical to V1/V2)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-SOCIAL3-GO-V1`) iff FOR EACH pair: social − naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Copy gaps
  descriptive. Three-bank tally reported (no pooled rescoring of
  closed verdicts).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-74` main 475333–475350 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490577–490585 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-social3-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete + social-rule
  engagement spot-check).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
