# GEN1-MUTHOME2 PLAN V1 (frozen 2026-11-04) — fresh-bank replication of the mut gauntlet-then-return instrument

## Why this line, and only this line
GEN1-MUTHOME V1 (`f857367`) is a thin pooled GO (mut fraction 0.72,
post-gap +0.0020 clears by dust, pairs 0.80/0.29) on one bank.
Repeatability is bank-conditional across this whole family (mut3
0.49/0.79 split vs mut4 0.92/1.11 both-carry; cue immune pair first
bank, none second). The licensed question is whether the mutated
post-return gap still clears +0.002 on a fresh bank and whether both
pairs carry. Same instrument verbatim (scripts/gen1-muthome2-dev.mjs,
GMH2_ prefix clone of the frozen gen1-muthome-dev). Same constants,
same matched lengths, original cues, no new food, no colony immersion
before the tasks. Fresh-bank replication — not a new design, not a
home re-run, not a re-run of fresh-56. Bar UNMOVED.

## Pipeline (15 runs/history, 2 histories, 30 total; all runs scored, no selection)
1. Train founders A-512 + B-512 (`GMH2_TRAIN_TICKS=512` each; B-entry
   via engine `enterCuePhase`), digest-gate A ≠ init else INVALID.
2. Skill pair: matched-A 256 frozen probes trained vs naive-init
   (`GMH2_SKILL_TICKS=256`); skillT > skillN required else
   INCOMPLETE-NOSKILL (void — nothing to transmit).
3. Colonies (1792 ticks; A1 mating; reproduction ON maternal):
   copy (exact birth weights), mut (noise 0.05), naive (init); all
   frozen at birth = birth weights. Pooled offspring/arm ≥ 6 else
   INCOMPLETE-LOWBIRTHS (void).
4. Matched-N groups (first-k by learner id, disclosed); frozen birth
   pre-probes 256 (`GMH2_APROBE_TICKS=256`); mut pre-gap ≤ 0 →
   INCOMPLETE-NOGAP (void).
5. BCR-train 1280 (`GMH2_BCR_TICKS=1280`, B+C+return-A auto in one
   run, learn ON, engine B-entry).
6. Frozen post A-probes 256 (original cues). Score mut gap after
   return + mut fraction.

## Verdict (pooled macro-average, n=2, frozen — identical to V1)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- mut pre-gap ≤ 0 → INCOMPLETE-NOGAP.
- GO (`GEN1-MUTHOME2-GO-V1`) iff mut post-gap > +0.002 AND mutPost
  > 0 AND mut fraction > 0.5, else NOGO. Copy gap/fraction reported
  descriptively. Per-pair carry reported (user question) — descriptive
  only; the verdict rule is pooled, unchanged from V1.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-57` main 475009–475026 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490415–490423 (9).
  Never regenerate spent banks (fresh-56 474991–475008 spent).
- Fixtures `tests/gen1-muthome2-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births + full BCR + pre/post probes complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~27G at plan time.
- No new food/sensors/actuators; no colony immersion before tasks;
  matched-N; original cues; no new design elements.
