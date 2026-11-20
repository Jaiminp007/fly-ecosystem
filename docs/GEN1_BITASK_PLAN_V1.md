# GEN1_BITASK PLAN V1 (frozen 2026-11-04) — recombined skill on a novel task at birth (BIRTHCARRY shape, biparental arms)

## Why this line, and only this one
The task matrix has one empty cell: birth-transmitted skill tested
on a novel task B fails for maternal copy (+0.0015/−0.0017),
mut (+0.0015 flat), and social (−0.0001/−0.0022) — recombination
untested. If biparental also fails, all law-grade channels are
natal-scoped and the natal-scope law is complete; if it holds, that
is a major new result (recombination transfers across tasks).
Three birth cohorts (bi/biparental mixed founders, copy/maternal,
naivekid/none, 900-tick window, A1 mating, frozen newborns) +
matched-N frozen A-probes (birth-gap gate) + matched-N frozen
B-probes via engine B-entry (novel task, no learning — scored).
Not a re-run of BIRTHCARRY (maternal/mut arms), SOCIALX (social),
LEARNBC (B-learning), or any gauntlet/return line.

## Pipeline (per history: 1 train + 11 probes, 2 histories, 24 runs)
TrainA (512, A≠init digest gate else INVALID), skill pair 256
(skillT > skillN else INCOMPLETE-NOSKILL), three birth colonies
(BTA_PROBE_TICKS=900), matched-N offspring groups (min per history,
first-k by id, disclosed): frozen A-probes 256 (`BTA_APROBE_TICKS`)
+ frozen B-probes 256 via `enterPhaseB8s` (novel task, no learning).
Pooled offspring/arm ≥ 4 else INCOMPLETE-LOWBIRTHS (void; window
bar). Score per-arm frozen probe intake; primary metric B-gap
(bi−naive on task B) per pair.

## Verdict (per-pair, both pairs, frozen — BIRTHCARRY bar family)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- A-gap (birth bi−naive on task A) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; nothing to transfer).
- Else GO (`GEN1-BITASK-GO-V1`) iff FOR EACH pair B-gap bi−naive >
  +0.002; else NOGO. Copy B-gaps + A-gaps descriptive (mode
  comparison, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-83` main 475495–475512 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490658–490666 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bitask-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (A-digest
  moves + mixed placement verified + crossover spot-check + births
  pooled ≥ 4 + A-probes show gap + B-entry + B-probes complete).
- BT caps; ~1.2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  matched 256-tick probes; novel task = engine B codebook, frozen.
