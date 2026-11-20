# GEN1_LEARNBC PLAN V1 (frozen 2026-11-04) — does lifetime learning rescue cross-task value of birth weights?

## Why this line, and only this one
BIRTHCARRY V1 (frozen newborns, novel task B) was flat (+0.0015/−0.0017
NOGO): birth-transmitted A-skill does not transfer frozen. HEIR3
showed learning-ON preserves the same-task edge. Untested: birth
weights + lifetime learning ON the novel task — the milestone 1
(lifetime-learning benefit on held-out tasks) × milestone 2
(cross-task) intersection. If learning opens a gap where freezing
showed none, lifetime learning rescues cross-task value; if still
flat, the task-bound is total (frozen and plastic alike). New
manipulation (acquisition open on the novel task), not a re-run of
BIRTHCARRY (frozen), HEIR3 (same task), or CARRY (same-agent).

## Pipeline (8 runs/history, 2 histories, 16 total; all runs scored, no selection)
Identical to BIRTHCARRY V1 through the birth colony, then learning:
trainA 512 (A≠init digest gate else INVALID), skill pair 256
(skillT > skillN else INCOMPLETE-NOSKILL), birth colony 1792
(maternal, A1 mating, frozen newborns). Matched-N offspring groups
(first-k by id, disclosed) into task-B phase via engine `enterCuePhase`
(same fn/seeds), acquisition ON, 512 ticks (`GLB_BLEARN_TICKS=512`):
copy (exact) vs mut (+0.05 deterministic seeded) vs naive (init).
Score intake gap copy−naive on the novel task with learning; mut
descriptive. Pooled offspring ≥ 12 else INCOMPLETE-LOWBIRTHS (void).

## Verdict (per-pair, both pairs, frozen)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled offspring < 12 → INCOMPLETE-LOWBIRTHS.
- GO (`GEN1-LEARNBC-GO-V1`) iff FOR EACH pair: copy−naive B-learn
  gap > +0.002; else NOGO (task-bound is total). Mut gap + intake
  descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-67` main 475207–475224 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490514–490522 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-learnbc-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digest moves
  + births ≥ 1 + B-entry correct + all three 512-tick learn runs
  complete with learning verified — final digest ≠ placed digest).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched-N; learning ON is the manipulation.
