# GEN1_CAPTEST PLAN V1 (frozen 2026-11-04) — capped placement energy unlocks intake→survival conversion (mechanism test)

## Why this line, and only this one
The synthesis V2 mechanism addendum (zero-world cut of SHORTCOL
rows) found cap waste + depletion timing: every colony pins intake
at the placement ceiling early (45.7–45.8) and starves together late
(~21–25), so no regime exists where marginal food changes fate —
and it explicitly licenses the next step: "any future survival
contrast must change the regime (e.g. capped placement energy — a
new manipulation, not a kinder world)". This is that manipulation.
Capped placement (energy 20 vs 48) removes the ceiling: founders
start hungry, so a genuine intake edge must convert to survival if
the mechanism story is right. Risky prediction with a toothed
falsifier: capped-skilled out-survives capped-naive by >+0.10 both
pairs → GO (mechanism causally confirmed); else NOGO (the zero-world
inference was wrong — intake does not drive fate even hungry). M5
population-mechanism work. Not a re-run of any line (no capped
placement has ever been tested; density varied food RATE, this
varies initial ENERGY).

## Pipeline (5 runs/history, 2 histories, 10 total; all runs scored)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL — establishes the
intake edge to be converted), two separate capped colonies 900
ticks (`CTP_PROBE_TICKS=900`; A1 mating de-gated but reproduction
OFF — pure founder survival, no birth confounds; original cues):
capSkilled (uniform A-trained minds via `placeCaptestSkilled`,
frozen, placement energy `CTP_PLACE_ENERGY=20`) vs capNaive
(uniform naive via `placeCaptestNaive`, frozen, same 20). Score
per-arm founder survival (primary) + per-lived-tick intake
(descriptive — edge should persist).

## Verdict (per-pair, both pairs, frozen — heir bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- Pooled capNaive survival < 0.05 → FLOOR (report; 20 starves
  everyone — do not retune, no claim).
- Else GO (`GEN1-CAPTEST-GO-V1`) iff FOR EACH pair capSkilled −
  capNaive survival > +0.10; else NOGO.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-91` main 475639–475656 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490730–490738 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-captest-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + capped placement verified at 20 + both 900-tick capped colonies
  complete + deaths occur (no ceiling) + intake edge persists).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return; original
  cues; only placement energy changes (20 vs 48).
