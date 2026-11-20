# GEN1_SOCCARRY PLAN V1 (frozen 2026-11-04) — socially-transmitted skill through a foreign-task gauntlet (ERODE2 shape, copyconditional arms)

## Why this line, and only this one
Two decisive results intersect here untested: (a) socially-
transmitted skill is law-grade at birth (8/8 pairs, natal scope);
(b) maternally-transmitted skill survives a foreign B+C gauntlet
(ERODE2 fraction 1.0, ERODE3 1.43). Social has never faced foreign-
task interference — SOCIALHOME tested same-world immersion (0.02,
dissolves), SOCIALX tested cross-task birth probes (NOGO). The
licensed question: does success-bias survive interference the way
maternal copying does? Three arms (social/copyconditional, copy/
maternal, naivekid) with at-birth frozen probes, an alive BC gauntlet
(1024 ticks, auto B→C — foreign tasks, no immersion scoring), then
frozen post-probes. Not a re-run of ERODE2 (maternal only), CARRY
(maternal), LEARNBC (B-learning, not gauntlet), or SOCIALHOME
(same-world return).

## Pipeline (per history: 1 train + 9 probes, 2 histories, 20 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), then three
birth cohorts (social/copy/naivekid, A1 mating, frozen newborns):
at-birth frozen A-probes (256 ticks, `SCR_PROBE_TICKS=256`) +
alive BC gauntlet 1024 (train-on through auto B→C) + frozen post
A-probes (same 256). Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; window bar). Score per-arm frozen A-probe
intake pre vs post; primary metric retention fraction
(post-gap/pre-gap) per pair.

## Verdict (per-pair, both pairs, frozen — ERODE2 bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- pre-gap (birth social−naive intake) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; nothing to retain).
- Else GO (`GEN1-SOCCARRY-GO-V1`) iff FOR EACH pair retention
  fraction post-gap/pre-gap ≥ 0.50; else NOGO. Copy gaps + fractions
  descriptive (mode comparison, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-81` main 475459–475476 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490640–490648 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-soccarry-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births pooled ≥ 4 + birth probes show gap + full BC gauntlet 1024
  + post probes complete + engagement spot-check).
- BT caps; ~1.3M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no return practice; original cues;
  gauntlet is foreign-task interference (B→C), not same-world
  immersion.
