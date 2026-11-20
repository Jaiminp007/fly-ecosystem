# GEN1_SHORTCOL PLAN V1 (frozen 2026-11-04) — is the heir fate benefit a censoring artifact?

## Why this line, and only this one
Zero-world cut of all heir-ecology rows (MUTHEIR/MUTLOW/COPYMUT
attempts) shows offspring born<450 ALL die (0.00 survival, 90+
offspring, 3 banks, all arms): the colony is a two-phase world —
early-born live through the crash (~tick 1000-1300, all deaths
energy), late-born survive by censoring (colony ends at 1792 before
they starve). The pooled "fate benefit" is therefore measured mostly
on mid-window births plus a censored late tail. The licensed question:
does the copy−naive survival gap survive when the censored tail is
removed — 900-tick colonies (selection window only, no late tail)?
If the gap holds, the fate benefit is real selection; if it
vanishes, the heir gap is a censoring artifact. The horizon IS the
manipulation (disclosed); everything else is heir ecology. Not a
re-run of any closed line (no short colony has ever been scored).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to MUTHEIR V1 except colony length: trainAB (512+512, A≠init
and B≠A digest gate else INVALID), skill pair 256 (skillT > skillN
else INCOMPLETE-NOSKILL), three separate matched colonies 900 ticks
(`GSC_PROBE_TICKS=900`; A1 mating, reproduction ON, frozen newborns,
original cues): copy (maternal exact) vs mut (maternal tn 0.05) vs
naivekid (no transmission). Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; bar scaled to the shorter window,
pre-registered — births happen early, triage must confirm ≥4
pooled). Score per-arm offspring survival (primary) + intake.

## Verdict (per-pair, both pairs, frozen)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (`GEN1-SHORTCOL-FLOOR-V1`,
  go:false): report the floor, no retune, no claim.
- Else GO (`GEN1-SHORTCOL-GO-V1`) iff FOR EACH pair: copy survival −
  naive survival > +0.10 (the fate benefit is real selection, not a
  censoring artifact); else NOGO. Mut−naive gaps + intake reported
  descriptively.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-63` main 475117–475134 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490469–490477 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-shortcol-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + all three 900-tick colonies complete).
- BT caps; ~1M expected (shorter colonies); disk floor 1 GB (stop
  below; do not trust a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched SHORTER colonies (the manipulation).
