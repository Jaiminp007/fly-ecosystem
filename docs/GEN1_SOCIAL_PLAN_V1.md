# GEN1_SOCIAL PLAN V1 (frozen 2026-11-04) — success-biased social transmission (copyconditional)

## Why this line, and only this one
Every scored line uses maternal/noise/biparental transmission. The
engine natively supports `copyconditional` (SOCIAL-V2: a newborn
copies the most-recent successful fly iff its own maternal line is
maiden/unsuccessful, else maternal) — success-biased SOCIAL learning —
and it has never been scored. The licensed question: do colonies
using social transmission out-survive naive colonies — and how does
social compare to maternal exact? Three separate matched heir-ecology
colonies: social (copyconditional, trained founders) vs copy
(maternal exact, trained founders) vs naivekid (no transmission).
Copy descriptive + floor check. Not a re-run of MATE-SOCIAL
(mating-behavior line) or any transmission line (new engine mode).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched colonies 1792 (A1 mating, reproduction ON, frozen newborns,
original cues): social (copyconditional) vs copy (maternal exact) vs
naivekid (vt none). Pooled offspring/arm ≥ 6 else INCOMPLETE-LOWBIRTHS
(void). Score per-arm offspring survival (primary) + per-lived-tick
intake.

## Verdict (per-pair, both pairs, frozen — family bar)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-SOCIAL-GO-V1`) iff FOR EACH pair: social − naivekid
  survival > +0.10 AND intake > +0.002 (success-biased social
  transmission works); else NOGO. Copy gaps descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-72` main 475297–475314 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490559–490567 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-social-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete + spot-check a
  social newborn whose donor is not its mother).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies; engine-native social
  mode (no new mechanism built).
