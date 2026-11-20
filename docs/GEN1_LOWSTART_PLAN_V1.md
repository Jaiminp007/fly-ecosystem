# GEN1_LOWSTART PLAN V1 (frozen 2026-11-04) — capped placement energy removes cap waste

## Why this line, and only this one
The synthesis addendum proved both mechanisms with existing evidence:
colonies pin all arms at ~45.7–45.8 early (placement 48, everyone
starts capped — early intake wasted) and decline together to ~21–25
(shared starvation). The licensed prediction: start colonies at
energy 10 instead of 48 and marginal intake matters from tick 0 —
survival gaps should WIDEN if cap waste was suppressing them. This is
a harsher regime (less starting energy, same field), not a kinder
world, and the manipulation is the point. If gaps widen, the
mechanism is confirmed and the fate edge is rescued in the right
regime; if still flat, depletion dominates and the story is complete.
Either outcome is informative (pre-registered both ways). Not a
re-run of any closed line (no low-placement colony ever scored).

## Pipeline (6 runs/history, 2 histories, 12 total; all runs scored, no selection)
Identical to SHORTCOL V1 except placement: trainAB (512+512, digest
gates else INVALID), skill pair 256 (skillT > skillN else
INCOMPLETE-NOSKILL; skill probes keep standard placement 48 — only
the COLONIES start low), three separate matched colonies 900 ticks
(A1 mating, reproduction ON, frozen newborns, original cues, placement
energy 10): copy vs mut (tn 0.05) vs naivekid. Pooled offspring/arm
≥ 4 else INCOMPLETE-LOWBIRTHS (void; founders start hungry, births
must prove the colony is viable — triage checks this first). Score
per-arm offspring survival (primary) + intake.

## Verdict (per-pair, both pairs, frozen)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS (the harsh regime
  killed the colony before birth — void, no claim, no retune).
- Pooled copy survival < 0.05 → FLOOR.
- Else GO (`GEN1-LOWSTART-GO-V1`) iff FOR EACH pair: copy survival −
  naive survival > +0.10; else NOGO (cap waste was not the suppressor
  — depletion dominates). Mut−naive gaps + intake descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-66` main 475171–475188 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490496–490504 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-lowstart-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 at placement 10 + all three 900-tick colonies
  complete — if triage shows zero births, the line voidś before any
  bank is minted).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies; placement 10 for
  colonies only.
