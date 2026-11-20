# GEN1_MUTLOWS PLAN V1 (frozen 2026-11-04) — 0.01 dose in the 900-tick window (completes the dose×horizon factorial)

## Why this line, and only this one
The dose×horizon factorial has three scored cells: 0.05×1792
(MUTHEIR: mut−naive +0.018/+0.006 NOGO), 0.01×1792 (MUTLOW:
+0.186/+0.065 NOGO), 0.05×900 (SHORTCOL/SHORTCOL2/3 mut descriptive:
4/6 pairs clear, one reversal). The fourth cell — 0.01 dose scored
in the 900-tick window — was never tested. If 0.01 clears both pairs
in the window, dose and horizon interact genuinely (low noise needs
the window to show); if it still splits, pair-conditionality is
dose-independent and the dose question is closed. Same MUTLOW bar
(mut01−naive survival > +0.10 AND intake > +0.002, both pairs) at
SHORTCOL horizon; copy descriptive + floor check. Not a re-run of any
closed line.

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to MUTLOW V1 except colony length: trainAB (512+512, A≠init
and B≠A digest gate else INVALID), skill pair 256 (skillT > skillN
else INCOMPLETE-NOSKILL), three separate matched colonies 900 ticks
(A1 mating, reproduction ON, frozen newborns, original cues,
placement 48): copy (maternal exact) vs mut01 (maternal tn 0.01) vs
naivekid (no transmission). Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; bar scaled to the 900-tick window as in
SHORTCOL). Score per-arm offspring survival + intake.

## Verdict (per-pair, both pairs, frozen — MUTLOW bar at SHORTCOL horizon)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (`GEN1-MUTLOWS-FLOOR-V1`,
  go:false): report the floor, no retune, no claim.
- Else GO (`GEN1-MUTLOWS-GO-V1`) iff FOR EACH pair: mut01 survival −
  naive survival > +0.10 AND mut01 intake − naive intake > +0.002;
  else NOGO. Copy survival/intake + copy−mut01 gap descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-66` main 475189–475206 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490505–490513 (9).
  Never regenerate spent banks (fresh-63/64/65 + all priors spent;
  LOWSTART minted nothing).
- Fixtures `tests/gen1-mutlows-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + all three 900-tick colonies complete).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
