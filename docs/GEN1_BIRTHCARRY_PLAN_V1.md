# GEN1_BIRTHCARRY PLAN V1 (frozen 2026-11-04) — birth-transmitted skill on a novel task

## Why this line, and only this line
CARRY showed same-agent skill survives a distinct task (thinly, then
replicated); HEIR showed birth-transmitted skill helps on the SAME
task (survival) while noise-0.05 keeps only the intake edge. Never
tested: does birth-transmitted skill help on a NOVEL task — the
population-level version of VISION's "persistent adaptation across
changing tasks." New contrast (birth transmission × novel task), not
a re-run of carry (same-agent) or heir (same-task) or any closed
line. Exact copy scored; noise-0.05 mut descriptive (does mutation
spare cross-task value?); naive baseline.

## Pipeline (7 runs/history, 2 histories, 14 total; all runs scored, no selection)
1. Train founders A-512 (`GNB_TRAIN_TICKS=512`), digest-gate A ≠ init
   else INVALID.
2. Skill pair: matched-A 256 frozen probes trained vs naive-init
   (`GNB_SKILL_TICKS=256`); skillT > skillN required else
   INCOMPLETE-NOSKILL (void — nothing to transmit).
3. Birth colony (1792 ticks; A1 mating; reproduction ON maternal;
   frozen newborns = birth weights; original A cues). Pooled
   offspring ≥ 12 else INCOMPLETE-LOWBIRTHS (void).
4. Matched-N offspring groups (first-k by learner id, disclosed),
   placed in task-B phase via engine `enterCuePhase` (resourceSeeds[1],
   same fn/seeds — disclosed), frozen, original B cues, 256-tick
   probes (`GNB_BPROBE_TICKS=256`): copy (exact) vs mut (+0.05 noise,
   deterministic seeded) vs naive (init). Score intake gap
   copy−naive on the NOVEL task; mut descriptive.

## Verdict (per-pair, both pairs, frozen)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled offspring < 12 → INCOMPLETE-LOWBIRTHS.
- GO (`GEN1-BIRTHCARRY-GO-V1`) iff FOR EACH pair: copy B-intake −
  naive B-intake > +0.002; else NOGO. Mut gap reported
  descriptively (no gate). No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-60` main 475063–475080 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490442–490450 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-birthcarry-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digest moves
  + births ≥ 1 + B-entry correct + all B-probes complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  matched-N; engine B-entry (same fn/seeds as carry family).
