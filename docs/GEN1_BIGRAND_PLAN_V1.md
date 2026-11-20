# GEN1_BIGRAND PLAN V1 (frozen 2026-11-04) — recombination across two generations (GRAND/SOCGRAND shape, biparental arms)

## Why this line, and only this one
The generation axis is measured for maternal (F2 dilutes to zero,
GRAND +0.000/+0.118) and social (F2 NOGO +0.068/+0.200, SOCGRAND) —
recombination, the second law-grade channel (7/7 natal, gauntlet
2.78/0.62), is untested at F2. If biparental compounds across
generations, the generation axis splits by mode (new result); if it
dilutes like the other two, the axis closes unanimously. F1bi
(mixed founders, biparental) vs F1naive colonies → matched-N F1
offspring weights as F2 founders → F2bi (mixed F1-derived founders,
biparental) vs F2naive colonies. Scored on F2 grandoffspring
per-pair both legs. Not a re-run of GRAND (maternal), SOCGRAND
(social), BIPARWIN (no F2), or any gauntlet/return line.

## Amendment A1 (pre-authorized from SOCGRAND triage, same substrate)
F1 and F2 colonies run 1792 ticks (`BGR_PROBE_TICKS=1792`, GRAND
precedent): SOCGRAND triage proved the 900 window starves small
matched-N F2 founder groups to zero births. No other change.

## Pipeline (per history: 1 train + 6 colonies, 2 histories, 14 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), F1 colonies 1792
ticks (A1 mating, reproduction ON, frozen newborns): F1bi (mixed
trained/naive founders via `placeBigrandMixed`, biparental) vs
F1naive (uniform naive, none); extract F1 offspring weights;
matched-N (min per history, first-k by id) F2 founders
(`placeBigrandGroup`, mixed F1-derived trained/naive halves —
mothers odd ids / fathers even ids by placement order); F2 colonies
1792 ticks: F2bi (biparental) vs F2naive (none). Pooled F1 offspring
per lineage ≥ 4 AND pooled F2 offspring per lineage ≥ 4 else
INCOMPLETE-LOWBIRTHS (void). Score F2 grandoffspring survival
(primary) + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — GRAND bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled F1 or F2 offspring/lineage < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled F2 bi-line survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-BIGRAND-GO-V1`) iff FOR EACH pair F2 gaps (bi-line
  − naive-line) survival > +0.10 AND intake > +0.002; else NOGO. F1
  gaps descriptive (reported, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-86` main 475549–475566 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490685–490693 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bigrand-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + crossover spot-check + F1 births
  pooled ≥ 4 + F2 founders placed + F2 births pooled ≥ 4 + both F2
  colonies complete).
- BT caps; ~1.3M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 1792-tick colonies.
