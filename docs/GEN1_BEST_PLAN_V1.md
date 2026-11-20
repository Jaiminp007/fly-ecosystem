# GEN1_BEST PLAN V1 (frozen 2026-11-04) — fecundity-biased (copybest) transmission in the 900-tick window

## Why this line, and only this one
`copybest` is the last engine-native transmission mode never
scored. Its source is `bestFounderLearner` =
the founder with the most offspring (fecundity, not skill) — so this
tests fecundity-biased transmission, not prestige: does copying the
most fecund founder's weights beat having no inheritance, and how
does it compare against maternal averaging on the SAME heterogeneous
founders? Heterogeneous founders (half trained even ids / half naive
odd ids, `placeBestMixed` = BIPAR placement shape) make the contrast
bite: copybest collapses all offspring onto ONE source while maternal
splits them half/half. Uniform-trained founders would make best and
maternal near-identical (void, do not run). Not a re-run of any line.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched colonies 900 ticks (`GBE_PROBE_TICKS=900`; A1 mating,
reproduction ON, frozen newborns, original cues): best (mixed,
`copybest`) vs matmix (mixed, `maternal` — descriptive) vs naivekid
(uniform naive, vt none). Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; window bar). Score per-arm offspring
survival (primary) + per-lived-tick intake. Record which founder id
`bestFounderLearner` selects per colony (fecundity-vs-skill
provenance: report whether the selected founder was trained).

## Verdict (per-pair, both pairs, frozen — heir bar at SHORTCOL horizon)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled matmix survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-BEST-GO-V1`) iff FOR EACH pair: best − naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Matmix gaps
  descriptive (max-vs-average readout).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-80` main 475441–475458 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490631–490639 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-best-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + best-source id recorded + births
  pooled ≥ 4 + all three 900-tick colonies complete).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
