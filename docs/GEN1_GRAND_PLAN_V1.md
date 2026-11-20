# GEN1_GRAND PLAN V1 (frozen 2026-11-04) — F2 grandoffspring: does transmission persist two generations?

## Why this line, and only this one
Every scored transmission world stops at F1. VISION's population
milestone is about persistence across generations, and no F2 world
has ever been scored (GEN2 audits only). The licensed question: do
grandoffspring of trained founders outperform grandoffspring of naive
founders — trained-line F2 vs naive-line F2, separate matched
colonies, heir ecology per generation. If F2 shows nothing while F1
shows the intake edge, transmission dilutes to zero in two generations
(a bound on the population claim); if F2 holds, inheritance compounds.
New contrast (two-generation lineage), not a re-run of any closed
line (no F2 colony ever scored).

## Pipeline (7 runs/history, 2 histories, 14 total; all runs scored, no selection)
1. Train founders A-512 + B-512 (`GGD_TRAIN_TICKS=512` each), digest
   gates A ≠ init AND B ≠ A else INVALID.
2. Skill pair 256 (skillT > skillN else INCOMPLETE-NOSKILL).
3. F1 colonies 1792 (A1 mating, reproduction ON maternal, frozen
   newborns, original cues): copy-line (trained mother) vs naive-line
   (init mother). Pooled F1 offspring/lineage ≥ 6 else
   INCOMPLETE-LOWBIRTHS (void).
4. F2 colonies 1792 (same ecology): N F1 offspring placed as founders
   (matched-N first-k by id, disclosed; own birth weights, frozen at
   placement), reproduction ON maternal, frozen newborns. N = min F1
   count per history. Pooled F2 offspring/lineage ≥ 6 else
   INCOMPLETE-LOWBIRTHS (void; F1 founders must prove breedable —
   triage checks this first). Score F2 offspring survival (primary) +
   per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled F1 or F2 offspring/lineage < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled F2 copy-line survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-GRAND-GO-V1`) iff FOR EACH pair: F2 copy-line
  survival − F2 naive-line survival > +0.10 AND intake gap > +0.002;
  else NOGO (transmission dilutes to zero by F2).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-68` main 475225–475242 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490523–490531 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-grand-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + F1 births ≥ 1/lineage + F2 founders breed (F2 births ≥ 1/lineage)
  + both F2 colonies complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched lineages; two generations only.
