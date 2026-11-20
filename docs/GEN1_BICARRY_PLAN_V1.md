# GEN1_BICARRY PLAN V1 (frozen 2026-11-04) — recombined skill through a foreign-task gauntlet (SOCCARRY shape, biparental arms)

## Why this line, and only this one
The mode×interference matrix has one empty cell: maternally-
transmitted skill survives a foreign B+C gauntlet (ERODE2 1.0,
ERODE3 1.43, SOCCARRY-copy 1.03), socially-transmitted skill erodes
(SOCCARRY 0.90/0.46) — recombination untested. Biparental holds 7/7
at natal birth (BIPAR/BIPAR2/BIPARWIN) and dissolves under same-world
return (BIHOME −0.07). The licensed question: does recombination
survive foreign-task interference like maternal copying, or erode
like success-bias? Three arms (bi/biparental, copy/maternal
descriptive, naivekid/none) with at-birth frozen probes, an alive BC
gauntlet (1024 ticks, auto B→C), then frozen post-probes. Not a
re-run of SOCCARRY (different channel), ERODE2/3 (maternal), BIHOME
(return), or BIPARWIN (no gauntlet).

## Pipeline (per history: 1 train + 14 probes, 2 histories, 30 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), then three birth
cohorts (bi/copy/naivekid, A1 mating, reproduction ON, frozen
newborns; bi founders mixed trained/naive via `placeBiparFounders`
shape): at-birth frozen A-probes (256 ticks, `BIC_APROBE_TICKS=256`)
+ alive BC gauntlet 1024 (train-on through auto B→C) + frozen post
A-probes (same 256). Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; window bar). Score per-arm frozen A-probe
intake pre vs post; primary metric retention fraction
(post-gap/pre-gap) per pair.

## Verdict (per-pair, both pairs, frozen — ERODE2 bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- pre-gap (birth bi−naive intake) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; nothing to retain).
- Else GO (`GEN1-BICARRY-GO-V1`) iff FOR EACH pair retention
  fraction post-gap/pre-gap ≥ 0.50; else NOGO. Copy gaps + fractions
  descriptive (mode comparison, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-82` main 475477–475494 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490649–490657 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bicarry-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + crossover spot-check + birth gap +
  full BC gauntlet 1024 + post probes complete).
- BT caps; ~1.4M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no return practice; original cues;
  gauntlet is foreign-task interference (B→C), not same-world
  immersion.
