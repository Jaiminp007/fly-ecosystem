# GEN1_SHORTCOL3 PLAN V1 (frozen 2026-11-04) — third window bank settles the ceiling question

## Why this line, and only this one
Window tally stands at copy−naive 3/4 pairs clearing (SHORTCOL V1
+0.389/+0.249 GO; SHORTCOL2 +0.301/+0.042 NOGO on a ceiling pair
~0.83 all arms). Mut−naive is 2/4 with one reversal. The licensed
question is whether SHORTCOL2's ceiling pair was the exception: a
third window bank with the identical instrument and frozen bar adds
two pairs and settles 5/6-or-3/6. Same 900-tick heir-ecology
colonies, same per-pair GO rule. Not a re-run of fresh-63/64, not a
new design.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to SHORTCOL V1/V2: trainAB (512+512, digest gates else
INVALID), skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL),
three separate matched colonies 900 ticks (A1 mating, reproduction
ON, frozen newborns, original cues): copy vs mut (tn 0.05) vs
naivekid. Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS. Score
per-arm offspring survival (primary) + intake.

## Verdict (per-pair, both pairs, frozen — identical to V1/V2)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-SHORTCOL3-GO-V1`) iff FOR EACH pair: copy survival
  − naive survival > +0.10; else NOGO. Mut−naive gaps + intake
  descriptive. Three-bank tally reported (no pooled rescoring of
  closed verdicts — each bank stands).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-65` main 475153–475170 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490487–490495 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-shortcol3-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + all three 900-tick colonies complete).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
