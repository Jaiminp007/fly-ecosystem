# GEN1_BIPARWIN PLAN V1 (frozen 2026-11-04) — biparental in the 900-tick window (de-censored channel test)

## Why this line, and only this one
Biparental stands at 5/6 pairs (GO,GO,NOGO-at-extinction) — the
stable channel with an extinction-shaped boundary. SOCIALWIN just
showed the window de-censors cleanly (social 8/8, pair 2's +0.357 the
largest gap recorded). The licensed question: does recombination go
6/6 de-censored, or does the window expose a new boundary the way it
exposed ceilings for copy/mut? Same 900-tick heir-ecology colonies:
mixed founders (trained mothers odd ids / init fathers even ids) +
biparental crossover vs uniform-trained maternal copy vs uniform
naive (vt none). Not a re-run of BIPAR (1792) or SOCIALWIN
(different channel).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched colonies 900 ticks (`BPW_PROBE_TICKS=900`; A1 mating,
reproduction ON, frozen newborns, original cues): bi (mixed,
biparental) vs copy (maternal exact) vs naivekid (vt none). Pooled
offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS (void; window bar).
Score per-arm offspring survival (primary) + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — BIPAR bar at SHORTCOL horizon)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-BIPARWIN-GO-V1`) iff FOR EACH pair: bi − naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Copy gaps
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-79` main 475423–475440 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490622–490630 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-biparwin-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + births pooled ≥ 4 + all three 900-tick
  colonies complete + crossover spot-check).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
