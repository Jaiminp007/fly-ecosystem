# GEN1_BIMUT PLAN V1 (frozen 2026-11-04) — recombination under copy noise (SOCMUT shape, biparental arms)

## Why this line, and only this one
The mode×noise matrix has one empty cell: maternal averaging is
noise-free at birth (0.05 costs ~zero, MUT/MUT2), winner-copying is
fragile on the marginal pair (SOCMUT −0.114 cost where exact was
already sub-bar). The question is structural: does noise-fragility
track concentration (winner-copying breaks, averaging holds) — and
if so, where does recombination fall? Crossover mixes two parents
per child rather than collapsing onto one donor; if it survives 0.05
noise bank-stably, the fragility is winner-specific and
recombination joins averaging as the robust rule. Three arms
(bimut/mixed+biparental+0.05, bi/mixed+biparental exact descriptive,
naivekid/none), 900-tick window colonies. Not a re-run of
MUT/MUT2/MUTLOW/MUTLOWS (maternal), SOCMUT (social), BIPARWIN
(exact), or any gauntlet/return/F2 line.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched 900-tick colonies (`BMU_PROBE_TICKS=900`; A1 mating,
reproduction ON, frozen newborns, original cues): bimut (mixed
trained/naive founders via `placeBimutMixed`, biparental +
`transmissionNoise` 0.05) vs bi (same mixed founders, biparental
exact) vs naivekid (uniform naive, vt none) — F1-style birth
colonies (no F2). Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS
(void; window bar). Score per-arm offspring survival (primary) +
per-lived-tick intake. Record per-colony digest-move (mutation
applied) provenance.

## Verdict (per-pair, both pairs, frozen — heir bar at SHORTCOL horizon)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled bi-exact survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-BIMUT-GO-V1`) iff FOR EACH pair bimut−naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Bi-exact gaps
  descriptive (noise-cost readout: bimut vs bi).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-88` main 475585–475602 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490703–490711 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bimut-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + crossover spot-check + mutation
  digest≠exact + births pooled ≥ 4 + all three 900-tick colonies
  complete).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
