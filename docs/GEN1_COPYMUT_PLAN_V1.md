# GEN1_COPYMUT PLAN V1 (frozen 2026-11-04) — exact-copy vs noise-0.05 head-to-head on heir survival

## Why this line, and only this line
MUTHEIR V1 measured both against naive (copy 0.211, mut 0.150,
naive 0.138 pooled) but scored only mut−naive; copy was descriptive.
Its per-pair copy−mut gaps split: 475045 gap 0.0 (0.143/0.143),
475054 gap +0.124 (0.280/0.156) — the same pair-conditional pattern
as the whole family. The open question is whether mutation really
breaks the fate benefit: a direct head-to-head verdict on a fresh
bank with a frozen bar. Same heir ecology (A512+B512 train, skill
gate, 3 separate 1792 colonies frozen, original cues), naivekid kept
as calibration control. Not a re-run of gen1-mutheir (different
verdict, fresh bank) or any closed line.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to MUTHEIR V1: trainAB (512+512, A≠init and B≠A digest
gate else INVALID), skill pair 256 (skillT > skillN else
INCOMPLETE-NOSKILL), three separate matched colonies 1792 (A1
mating, reproduction ON, frozen newborns): copy (maternal exact) vs
mut (maternal tn 0.05) vs naivekid (no transmission). Pooled
offspring/arm ≥ 6 else INCOMPLETE-LOWBIRTHS. Score per-arm offspring
survival + intake.

## Verdict (per-pair, both pairs, frozen)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (`GEN1-COPYMUT-FLOOR-V1`,
  go:false): report the floor, no retune, no claim.
- Else GO (`GEN1-COPYMUT-GO-V1`) iff FOR EACH pair: copy survival −
  mut survival > +0.05; else NOGO. Naive gaps reported descriptively
  (calibration: the ecology should still separate copy from naive).
Bar +0.05: half the MUTHEIR pooled mut−naive bar scale, sized to the
observed pooled copy−mut gap (0.061) — the fate break, if real,
should clear it on both pairs.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-61` main 475081–475098 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490451–490459 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-copymut-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
