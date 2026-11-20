# GEN1_SOCIAL2 PLAN V1 (frozen 2026-11-04) — fresh-bank replication of the social GO

## Why this line, and only this one
SOCIAL V1 is a GO (social−naive +0.124/+0.195 survival, +0.0037/
+0.0096 intake, both pairs; social beats maternal pooled) — the
milestone's first social result, flagged as the line to replicate.
Repeatability is bank-conditional across this whole family. The
licensed question is whether success-biased social transmission holds
still on a fresh bank with the identical instrument and frozen bar.
Same three colonies, same per-pair GO rule. Not a re-run of
fresh-72, not a new design.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to SOCIAL V1: trainAB (512+512, digest gates else INVALID),
skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three
separate matched colonies 1792 (A1 mating, reproduction ON, frozen
newborns, original cues): social (copyconditional) vs copy (maternal
exact) vs naivekid (vt none). Pooled offspring/arm ≥ 6 else
INCOMPLETE-LOWBIRTHS. Score per-arm offspring survival + per-lived-
tick intake.

## Verdict (per-pair, both pairs, frozen — identical to V1)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-SOCIAL2-GO-V1`) iff FOR EACH pair: social − naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Copy gaps
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-73` main 475315–475332 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490568–490576 (9).
  Never regenerate spent banks (fresh-72 spent).
- Fixtures `tests/gen1-social2-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete + social-rule
  engagement spot-check).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
