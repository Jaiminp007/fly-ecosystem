# GEN1_MUTHEIR PLAN V1 (frozen 2026-11-04) — noise-0.05 vs naive vs exact-copy in separate heir-ecology colonies

## Why this line, and only this line
HEIR V1 showed exact-copy offspring out-survive naive 0.331 vs 0.105
in separate colonies (heir ecology: A+B-trained mother, maternal
transmission, frozen newborns, 1792-tick colonies, original cues).
Mutated offspring were never scored on that ecology — MUTSAME tested
them only in a shared near-extinction world (intake edge persisted,
survival floored). The licensed question is whether noise-0.05
offspring beat naive offspring on deaths + intake in the kinder
separate-colony ecology where a survival gap is known to exist.
Three separate matched colonies per history (copy / mut / naivekid).
Exact copy is a descriptive control (ecology check: it should still
show a survival gap); if copy also dies near 98%, report the floor
instead of retuning food. Not a re-run of gen1-heir (no mut arm
there) and not a re-run of gen1-mutsame (shared world there).

## Pipeline (5 runs/history, 2 histories, 10 total; all runs scored, no selection)
1. Train founders A-512 + B-512 (`GMT_TRAIN_TICKS=512` each; B-entry
   via engine `enterCuePhase`), digest-gate A ≠ init AND B ≠ A else
   INVALID (no content to transmit).
2. Skill pair: matched-A 256 frozen probes post-B-trained vs
   naive-init (`GMT_SKILL_TICKS=256`); skillT > skillN required else
   INCOMPLETE-NOSKILL (void — the transmitted content is not skill).
3. Three separate matched colonies (1792 ticks,
   `GMT_PROBE_TICKS=1792`; A1 mating; reproduction ON; frozen
   newborns = birth weights; original cues, no new food):
   copy (maternal, exact), mut (maternal, transmissionNoise 0.05),
   naivekid (no transmission). Pooled offspring/arm ≥ 6 else
   INCOMPLETE-LOWBIRTHS (void). Score per-arm offspring survival
   fraction + offspring per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — stricter than pooled)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- Pooled copy survival < 0.05 → FLOOR (`GEN1-MUTHEIR-FLOOR-V1`,
  go:false): the kinder ecology is gone on this bank too; report
  the floor, do not retune food, do not claim.
- Else GO (`GEN1-MUTHEIR-GO-V1`) iff FOR EACH pair: mut survival −
  naive survival > +0.10 AND mut intake − naive intake > +0.002;
  else NOGO. Copy gap reported descriptively (ecology check).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-59` main 475045–475062 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490433–490441 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-mutheir-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births ≥ 1/arm + all three colonies complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched separate colonies.
