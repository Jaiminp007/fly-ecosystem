# GEN1_BIPAR PLAN V1 (frozen 2026-11-04) — biparental recombination: trained mothers × naive fathers

## Why this line, and only this one
Every scored transmission world is maternal exact-or-noisy. The
engine natively supports biparental transmission (uniform per-element
crossover p=0.5 of both parents' weights) and it has never been
scored. The licensed question: does recombination preserve a usable
edge — offspring of trained mothers × naive fathers vs naive
offspring, separate matched heir-ecology colonies. Mothers sex 0 =
odd founder ids (engine: founder index i gets id i+1, sex i%2);
fathers sex 1 = even ids. Mixed placement: odd ids ← trained bSnap,
even ids ← init; biparental transmission (fallback maternal =
trained, disclosed). Copy (maternal exact, uniform trained)
descriptive ceiling; naivekid (uniform naive, vt none) baseline. Not
a re-run of MATE-RECOMBINE (mating-behavior line, no weight
transmission scored) or any heir line (all maternal).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched colonies 1792 (A1 mating, reproduction ON, frozen newborns,
original cues): bi (mixed founders, biparental tn null) vs copy
(uniform trained, maternal) vs naivekid (uniform naive, vt none).
Pooled offspring/arm ≥ 6 else INCOMPLETE-LOWBIRTHS (void). Score
per-arm offspring survival + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — family bar)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-BIPAR-GO-V1`) iff FOR EACH pair: bi survival −
  naive survival > +0.10 AND bi intake − naive intake > +0.002
  (recombination preserves a usable edge); else NOGO. Copy gaps
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-69` main 475243–475260 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490532–490540 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bipar-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete + spot-check one
  newborn is a true crossover — neither parent digest).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies; engine-native crossover
  (no new mechanism built).
