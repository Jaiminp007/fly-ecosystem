# GEN1_SHORTCOL2 PLAN V1 (frozen 2026-11-04) — fresh-bank replication of the 900-tick window

## Why this line, and only this one
SHORTCOL V1 is a GO (copy−naive +0.389/+0.249, mut−naive +0.300/
+0.108, both pairs, 900-tick window) — the first pair-stable fate
result, obtained by removing the censored late tail. Repeatability is
bank-conditional across this whole family (mut3 0.49/0.79 vs mut4
0.92/0.11; muthome GO-by-dust → muthome2 NOGO; copymut split pairs).
The licensed question is whether the window result replicates on a
fresh bank with the identical instrument and frozen bar. Same 900-tick
heir-ecology colonies, same per-pair GO rule. Not a re-run of
fresh-63, not a new design.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to SHORTCOL V1: trainAB (512+512, digest gates else
INVALID), skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL),
three separate matched colonies 900 ticks (A1 mating, reproduction
ON, frozen newborns, original cues): copy vs mut (tn 0.05) vs
naivekid. Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS. Score
per-arm offspring survival (primary) + intake.

## Verdict (per-pair, both pairs, frozen — identical to V1)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-SHORTCOL2-GO-V1`) iff FOR EACH pair: copy survival
  − naive survival > +0.10; else NOGO. Mut−naive gaps + intake
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-64` main 475135–475152 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490478–490486 (9).
  Never regenerate spent banks (fresh-63 spent).
- Fixtures `tests/gen1-shortcol2-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + all three 900-tick colonies complete).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
