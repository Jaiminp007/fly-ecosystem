# GEN1_BIPAR2 PLAN V1 (frozen 2026-11-04) — fresh-bank replication of the biparental GO

## Why this line, and only this one
BIPAR V1 is a GO (bi−naive +0.119/+0.167 survival, +0.0066/+0.0076
intake, both pairs) — the first pair-stable fate GO with a new
channel, flagged as the line to replicate. Repeatability is
bank-conditional across this whole family (window GO→NOGO→NOGO;
mut splits every bank). The licensed question is whether the
recombination edge replicates on a fresh bank with the identical
instrument and frozen bar. Same mixed-sex founders, same
engine-native crossover, same per-pair GO rule. Not a re-run of
fresh-69, not a new design.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to BIPAR V1: trainAB (512+512, digest gates else INVALID),
skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three
separate matched colonies 1792 (A1 mating, reproduction ON, frozen
newborns, original cues): bi (mixed founders trained-mothers odd
ids/naive-fathers even ids, biparental crossover) vs copy (uniform
trained, maternal) vs naivekid (uniform naive, vt none). Pooled
offspring/arm ≥ 6 else INCOMPLETE-LOWBIRTHS. Score per-arm offspring
survival + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — identical to V1)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-BIPAR2-GO-V1`) iff FOR EACH pair: bi − naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Copy gaps
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-70` main 475261–475278 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490541–490549 (9).
  Never regenerate spent banks (fresh-69 spent).
- Fixtures `tests/gen1-bipar2-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete + crossover
  spot-check).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
