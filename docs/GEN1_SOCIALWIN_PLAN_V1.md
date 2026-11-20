# GEN1_SOCIALWIN PLAN V1 (frozen 2026-11-04) — social in the 900-tick window (de-censored law test)

## Why this line, and only this one
Social is law-grade 6/6 — but all six pairs were measured in
1792-colonies, which SHORTCOL proved mix selection with censored-tail
noise (born<450 all die; late-born survive by censoring). The
licensed question: does the social law hold in the 900-tick selection
window with the tail removed? If 6/6 replicates de-censored, the law
is regime-independent; if it splits, the tail was flattering social
too. Same SHORTCOL horizon + SOCIAL arms, same per-pair bar. Not a
re-run of SOCIAL (1792) or SHORTCOL (maternal/mut).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched colonies 900 ticks (`SWN_PROBE_TICKS=900`; A1 mating,
reproduction ON, frozen newborns, original cues): social
(copyconditional) vs copy (maternal exact) vs naivekid (vt none).
Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS (void; window bar).
Score per-arm offspring survival (primary) + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — SOCIAL bar at SHORTCOL horizon)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-SOCIALWIN-GO-V1`) iff FOR EACH pair: social −
  naivekid survival > +0.10 AND intake > +0.002; else NOGO. Copy gaps
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-78` main 475405–475422 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490613–490621 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-socialwin-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + all three 900-tick colonies complete +
  social-rule engagement spot-check).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
