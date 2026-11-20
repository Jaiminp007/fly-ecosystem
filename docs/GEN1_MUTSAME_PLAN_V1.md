# GEN1_MUTSAME PLAN V1 (frozen 2026-11-04) — noise-0.05 mutated vs naive offspring in the same colony

## Why this line, and only this line
MUTHOME/MUTHOME2 closed the return-gap question as NOGO-pooled
(naive catch-up erases the birth edge through immersion). The birth
intake edge itself is still there on every bank (mut pre-gap
+0.0028/+0.0087; copy similar). The licensed question is whether the
birth edge translates into lived survival + intake when mutated and
naive offspring share one colony with no gauntlet and no return
practice — pure birth-weights fate in a shared world. Exact copy is
a third side, descriptive only. Not a re-run of gen1-heir (separate
colonies, survival only, exact-copy scored) and not a third muthome
(no B/C tasks, no return). Same instrument family, new scored
contrast: shared-colony fate.

## Pipeline (5 runs/history, 2 histories, 10 total; all runs scored, no selection)
1. Train founders A-512 (`GMS_TRAIN_TICKS=512`), digest-gate A ≠ init
   else INVALID (no content to transmit).
2. Skill pair: matched-A 256 frozen probes trained vs naive-init
   (`GMS_SKILL_TICKS=256`); skillT > skillN required else
   INCOMPLETE-NOSKILL (void — nothing to inherit).
3. Birth colony (1792 ticks; A1 mating; reproduction ON maternal):
   trained mother → offspring birth weights (exact). Pooled
   offspring across 2 histories ≥ 12 (avg 6/history) else
   INCOMPLETE-LOWBIRTHS (void).
4. Shared colony (1792 ticks, matched horizon, original A cues, no
   new food, reproduction OFF so sides stay pure): N copy (exact
   birth weights) + N mut (birth weights + Gaussian noise 0.05) +
   N naive (init weights), N = offspring count that history, all
   frozen at birth (freezeNew = birth weights; the only difference
   between sides is birth weights + noise). Score per-side survival
   fraction + per-side intake rate (food map by placed-id set; extra
   births impossible with reproduction OFF).

## Verdict (pooled macro-average, n=2, frozen)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled offspring < 12 → INCOMPLETE-LOWBIRTHS.
- GO (`GEN1-MUTSAME-GO-V1`) iff mut survival − naive survival >
  +0.10 AND mut intake − naive intake > +0.002, else NOGO. Copy
  survival/intake reported descriptively (no gate). No rescoring.
  Single attempt.

## Discipline
- Fresh bank `fresh-58` main 475027–475044 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490424–490432 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-mutsame-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digest moves
  + births ≥ 1 + shared colony completes + per-side stats finite).
- BT caps; ~1M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched horizon; shared colony only.
