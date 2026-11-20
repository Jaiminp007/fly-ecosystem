# GEN1_SOCMUT PLAN V1 (frozen 2026-11-04) — success-bias under copy noise (MUT shape, copyconditional arms)

## Why this line, and only this one
Perturbation-robustness is measured for maternal averaging only
(0.01 free, 0.05 free at birth, costs ~third under interference) —
never for winner-copying. The mechanistic question is real:
copyconditional concentrates every birth onto ONE donor (like
copybest, which NOGO'd); maternal averaging spreads risk across
mothers. If noise breaks the winner-copy while sparing the average,
concentration is fragile; if success-bias survives 0.05 noise, the
law is a structural (selection) effect, not a fidelity artifact.
Three arms (socmut/copyconditional+0.05, social/copyconditional
exact descriptive, naivekid/none), 900-tick window colonies. Not a
re-run of MUT/MUT2/MUTLOW/MUTLOWS (maternal arms), SOCIALWIN
(exact), or any gauntlet/return line.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three separate
matched 900-tick colonies (`SMU_PROBE_TICKS=900`; A1 mating,
reproduction ON, frozen newborns, original cues): socmut
(copyconditional + `transmissionNoise` 0.05) vs social
(copyconditional exact) vs naivekid (vt none). Pooled
offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS (void; window bar).
Score per-arm offspring survival (primary) + per-lived-tick intake.
Record per-colony engagement (non-maternal births) + digest-move
(mutation applied) provenance.

## Verdict (per-pair, both pairs, frozen — heir bar at SHORTCOL horizon)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled social-exact survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-SOCMUT-GO-V1`) iff FOR EACH pair socmut−naivekid
  survival > +0.10 AND intake > +0.002; else NOGO. Social-exact gaps
  descriptive (noise-cost readout: socmut vs social).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-87` main 475567–475584 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490694–490702 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-socmut-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mutation digest≠exact + births pooled ≥ 4 + engagement + all
  three 900-tick colonies complete).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
