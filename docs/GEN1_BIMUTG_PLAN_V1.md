# GEN1_BIMUTG PLAN V1 (frozen 2026-11-04) — mutated recombination through a foreign-task gauntlet (BICARRY shape, noise arms)

## Why this line, and only this one
The stress cube has one empty cell for the second law-grade
channel: maternal noise survives the B+C gauntlet (MUT3 0.62, MUT4
1.05), biparental exact survives it (BICARRY 2.78/0.62), biparental
noise holds at birth (BIMUT +0.125/+0.275) — but noise ×
interference compounded on recombination is unknown. If mutated
recombination retains ≥0.5 through B+C both pairs, mixing absorbs
compound stress and the law strengthens; if it erodes, compound
stress is the boundary even for mixing rules. Three birth colonies
(bimut/mixed+biparental+0.05, bi/mixed+biparental exact
descriptive, naivekid/none, 900t) + matched-N frozen A-probes +
alive BC gauntlet 1024 + frozen post-probes. Not a re-run of
MUT3/MUT4 (maternal), BICARRY (exact), BIMUT (no gauntlet),
SOCCARRY (social), or any return/F2 line.

## Pipeline (per history: 1 train + 14 probes, 2 histories, 30 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), three birth
cohorts (A1 mating, reproduction ON, frozen newborns, 900 ticks):
at-birth frozen A-probes 256 (`BMG_APROBE_TICKS=256`) + alive BC
gauntlet 1024 (train-on through auto B→C) + frozen post A-probes
(same 256). Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS
(void; window bar). Score per-arm frozen A-probe intake pre vs post;
primary metric retention fraction (post-gap/pre-gap) per pair for
bimut−naive.

## Verdict (per-pair, both pairs, frozen — ERODE2 bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- pre-gap (birth bimut−naive intake) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; nothing to retain).
- Else GO (`GEN1-BIMUTG-GO-V1`) iff FOR EACH pair retention
  fraction post-gap/pre-gap ≥ 0.50; else NOGO. Bi-exact gaps +
  fractions descriptive (noise-cost under interference, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-89` main 475603–475620 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490712–490720 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bimutg-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + crossover spot-check + mutation
  digest≠exact + births pooled ≥ 4 + birth gap + full BC gauntlet
  1024 + post probes complete).
- BT caps; ~1.4M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no return practice; original cues;
  gauntlet is foreign-task interference (B→C), not same-world
  immersion.
