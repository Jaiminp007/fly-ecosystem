# GEN1_BIPAR3 PLAN V1 (frozen 2026-11-04) — third bipar bank: law-grade or boundary?

## Why this line, and only this one
Bipar stands at 4/4 pairs across two banks (V1 +0.119/+0.167,
V2 +0.179/+0.183) — the only stable channel in the family. Two GOs
could still be luck; 6/6 would be law-grade for the ledger, while a
split would map the boundary the window lines kept hitting. Same
instrument, same frozen bar. Not a re-run of fresh-69/70, not a new
design.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to BIPAR V1/V2: trainAB (512+512, digest gates else
INVALID), skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL),
three separate matched colonies 1792 (A1 mating, reproduction ON,
frozen newborns, original cues): bi (mixed founders, biparental
crossover) vs copy (maternal exact) vs naivekid (vt none). Pooled
offspring/arm ≥ 6 else INCOMPLETE-LOWBIRTHS. Score per-arm offspring
survival + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — identical to V1/V2)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-BIPAR3-GO-V1`) iff FOR EACH pair: bi − naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Copy gaps
  descriptive. Three-bank tally reported (no pooled rescoring of
  closed verdicts).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-71` main 475279–475296 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490550–490558 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bipar3-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete + crossover
  spot-check).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
