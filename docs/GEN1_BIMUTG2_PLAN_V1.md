# GEN1_BIMUTG2 PLAN V1 (frozen 2026-11-04) — retry of the noise×interference cube cell on a fresh bank (BIMUTG V1 voided NOGAP)

## Why this line, and only this one
BIMUTG V1 voided bank-conditionally: mutated birth gaps +0.0019/
+0.0017 missed +0.002 by dust while exact-bi gaps cleared (+0.0039/
+0.0042) — 0.05 noise halves the birth gap, and this bank's exact
gap (~0.004) left the mutated gap just below bar. The results doc
licenses ONE retry on a fresh bank under the identical frozen plan
(BITASK precedent: void → one retry → close regardless). The
compound-stress question (does mutated recombination retain ≥0.5
through B+C?) needs a bank on which the mutated birth gap clears —
exact-gap ≳ 0.004 suffices. If this bank also voids, two voids close
the cell as bank-unfavorable with no further attempt. Same
instrument, fresh bank `fresh-90` (475621–475638), fresh triage
(490721–490729). Not a re-run of scored lines.

## Pipeline (identical to BIMUTG V1)
Per history: 1 train + 14 probes, 2 histories, 30 runs. TrainAB
(512+512, A≠init and B≠A digest gate else INVALID), skill pair 256
(skillT > skillN else INCOMPLETE-NOSKILL), three birth colonies
(BM2_PROBE_TICKS=900: bimut-mixed/biparental+0.05 + bi-mixed/
biparental exact + naivekid/none, A1 mating, frozen newborns),
matched-N frozen A-probes 256 (birth-gap gate) + frozen B-probes 256
via `enterPhaseB8s` (novel task, no learning) + alive BC gauntlet
1024 + frozen post A-probes 256. Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void). Score per-arm frozen A-probe intake pre
vs post; primary metric retention fraction (post-gap/pre-gap) per
pair for bimut−naive.

## Verdict (per-pair, both pairs, frozen — ERODE2 bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- pre-gap (birth bimut−naive intake) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; second void closes the cell).
- Else GO (`GEN1-BIMUTG2-GO-V1`) iff FOR EACH pair retention
  fraction post-gap/pre-gap ≥ 0.50; else NOGO. Bi-exact gaps +
  fractions descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-90` main 475621–475638 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490721–490729 (9).
  Never regenerate spent banks (BIMUTG V1 fresh-89 + triage
  490712–490720 now spent).
- Fixtures `tests/gen1-bimutg2-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + crossover spot-check + mutation
  digest≠exact + births pooled ≥ 4 + birth gap + full BC gauntlet
  1024 + post probes complete).
- BT caps; ~1.4M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no return practice; original cues;
  gauntlet is foreign-task interference (B→C), not same-world
  immersion.
