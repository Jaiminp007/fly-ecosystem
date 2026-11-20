# GEN1_MUTLOW PLAN V1 (frozen 2026-11-04) — noise-0.01 dose in heir ecology

## Why this line, and only this line
MUT V1 showed noise-0.01 is cost-free at birth (mut tracks exact
within 0.0001, gap +0.0089); MUTHEIR/MUTHOME showed noise-0.05 keeps
the intake edge but loses the fate benefit (pooled) and the
head-to-head copy−mut gap is bank-conditional (0.000/+0.124/+0.077/
+0.008). Untested: whether the 0.01 dose preserves the fate benefit
in the heir ecology where the survival gap exists. Same MUTHEIR
verdict (mut−naive per-pair bar), only the dose changes — a direct
dose comparison, fresh bank. Copy descriptive + copy−mut01 gap
descriptive. Not a re-run of any closed line (no 0.01 colony has
ever been scored).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to MUTHEIR V1 except tn: trainAB (512+512, A≠init and B≠A
digest gate else INVALID), skill pair 256 (skillT > skillN else
INCOMPLETE-NOSKILL), three separate matched colonies 1792 (A1 mating,
reproduction ON, frozen newborns, original cues): copy (maternal
exact) vs mut01 (maternal tn 0.01) vs naivekid (no transmission).
Pooled offspring/arm ≥ 6 else INCOMPLETE-LOWBIRTHS. Score per-arm
offspring survival + intake.

## Verdict (per-pair, both pairs, frozen — same bar as MUTHEIR)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (`GEN1-MUTLOW-FLOOR-V1`,
  go:false): report the floor, no retune, no claim.
- Else GO (`GEN1-MUTLOW-GO-V1`) iff FOR EACH pair: mut01 survival −
  naive survival > +0.10 AND mut01 intake − naive intake > +0.002;
  else NOGO. Copy survival/intake + copy−mut01 gap reported
  descriptively (did the low dose spare the fate benefit?).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-62` main 475099–475116 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490460–490468 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-mutlow-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
