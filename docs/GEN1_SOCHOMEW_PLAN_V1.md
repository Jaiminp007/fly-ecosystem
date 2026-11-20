# GEN1_SOCHOMEW PLAN V1 (frozen 2026-11-04) — social transmission through short same-world immersion (SOCCARRY shape, A-immersion instead of BC gauntlet)

## Why this line, and only this one
The universal-solvent claim (return dissolves everything: exact
0.25/0.11, mut 0.72→0.35, bi −0.07, social 0.02) was only ever
tested at 1792-tick immersion. Whether dissolution needs the long
horizon or happens by 900 ticks is untested for ALL modes — a real
boundary condition on a law-grade claim, by the same method as the
SHORTCOL window tests that de-censored birth inheritance. Matched
dose to the gauntlet lines (1024-tick alive immersion, same A cues
throughout, no foreign task): if social holds (fraction ≥0.5 both
pairs), the solvent needs long immersion and the law gains a horizon
bound; if it dissolves, the solvent is horizon-independent and fast.
Three arms (social/copyconditional, copy/maternal descriptive,
naivekid/none) with at-birth frozen probes, an alive A-immersion
1024 (train-on), then frozen post-probes. Not a re-run of
SOCIALHOME (1792 + BCR gauntlet+return combined), ERODE (exact,
same-survivor), SOCCARRY (foreign-task gauntlet), or any window
birth line.

## Pipeline (per history: 1 train + 14 probes, 2 histories, 30 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), then three birth
cohorts (A1 mating, reproduction ON, frozen newborns, 900 ticks):
at-birth frozen A-probes (256 ticks, `SHW_APROBE_TICKS=256`) +
alive A-immersion 1024 (train-on through same A cues — immersion,
not gauntlet) + frozen post A-probes (same 256). Pooled offspring
per arm ≥ 4 else INCOMPLETE-LOWBIRTHS (void; window bar). Score
per-arm frozen A-probe intake pre vs post; primary metric retention
fraction (post-gap/pre-gap) per pair for social−naive.

## Verdict (per-pair, both pairs, frozen — ERODE bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- pre-gap (birth social−naive intake) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; nothing to retain).
- Else GO (`GEN1-SOCHOMEW-GO-V1`) iff FOR EACH pair retention
  fraction post-gap/pre-gap ≥ 0.50; else NOGO. Copy gaps + fractions
  descriptive (mode comparison, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-93` main 475675–475692 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490748–490756 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-sochomew-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + birth gap + full A-immersion 1024 + post
  probes complete).
- BT caps; ~1.4M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet (same-task immersion);
  no return practice beyond the immersion itself; original cues.
