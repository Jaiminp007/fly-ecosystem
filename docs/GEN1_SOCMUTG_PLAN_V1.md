# GEN1_SOCMUTG PLAN V1 (frozen 2026-11-04) — mutated success-bias through a foreign-task gauntlet (SOCCARRY shape, noise arms)

## Why this line, and only this one
The stress cube has one empty cell: maternal exact/noise hold
through B+C (1.0/1.43/1.03/1.45, 0.62/1.05), biparental exact/noise
hold (2.78/0.62, 1.12/1.41), social exact erodes (0.90/0.46) — but
mutated winner-copying through the gauntlet is unknown. The
question is structural and symmetric: BIMUTG showed mixing absorbs
compound stress; SOCCARRY+SOCMUT showed concentration fails each
stress separately (0.90/0.46 erosion; −0.114 cost on the marginal
pair). Does noise collapse the eroded remnant fully (retention ~0),
or does it hold like exact (≥0.5)? Either answer completes the cube:
collapse = concentration breaks under compound stress where mixing
holds; hold = winner-copying is more robust than its parts suggest.
Three birth colonies (socmut/copyconditional+0.05, social/
copyconditional exact descriptive, naivekid/none, 900t) + matched-N
frozen A-probes + alive BC gauntlet 1024 + frozen post-probes. Not a
re-run of SOCCARRY (exact), SOCMUT (no gauntlet), BIMUTG (different
mode), or any return/F2 line.

## Pipeline (per history: 1 train + 14 probes, 2 histories, 30 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three birth
cohorts (A1 mating, reproduction ON, frozen newborns, 900 ticks):
at-birth frozen A-probes 256 (`SMG_APROBE_TICKS=256`) + alive BC
gauntlet 1024 (train-on through auto B→C) + frozen post A-probes
(same 256). Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS
(void; window bar). Score per-arm frozen A-probe intake pre vs post;
primary metric retention fraction (post-gap/pre-gap) per pair for
socmut−naive.

## Verdict (per-pair, both pairs, frozen — ERODE2 bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- pre-gap (birth socmut−naive intake) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; nothing to retain).
- Else GO (`GEN1-SOCMUTG-GO-V1`) iff FOR EACH pair retention
  fraction post-gap/pre-gap ≥ 0.50; else NOGO. Social-exact gaps +
  fractions descriptive (noise-cost under interference, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-92` main 475657–475674 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490739–490747 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-socmutg-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mutation digest≠exact + births pooled ≥ 4 + birth gap + full BC
  gauntlet 1024 + post probes complete).
- BT caps; ~1.4M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no return practice; original cues;
  gauntlet is foreign-task interference (B→C), not same-world
  immersion.
