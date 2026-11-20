# GEN1_SOCIALX PLAN V1 (frozen 2026-11-04) — does social transmission cross tasks?

## Why this line, and only this one
BIRTHCARRY (+0.0015/−0.0017) and LEARNBC (+0.0004/+0.0014, learning
verified active) proved exact birth skill does not cross to the novel
task B — frozen or plastic. Social transmission is now the law-grade
channel (6/6 same-task pairs); its boundary is unmapped. The licensed
question: do copyconditional offspring beat naive offspring on novel-
task B frozen probes — i.e., is socially transmitted content more
transferable than maternally transmitted content? Same BIRTHCARRY
pipeline with a social birth colony (trained founders,
copyconditional) + naive control + exact-copy descriptive arm.
Not a re-run of BIRTHCARRY (maternal only) or SOCIAL (same task).

## Pipeline (8 runs/history, 2 histories, 16 total; all runs scored, no selection)
TrainA 512 (A≠init digest gate else INVALID), skill pair 256
(skillT > skillN else INCOMPLETE-NOSKILL), birth colonies 1792 (A1
mating, reproduction ON, frozen newborns, original cues): social
(copyconditional, trained founders) + copy (maternal exact, trained
founders) + naivekid (no transmission). Pooled offspring/arm ≥ 12
else INCOMPLETE-LOWBIRTHS (void). Matched-N groups (first-k by id,
disclosed) into task-B via engine `enterCuePhase`, frozen 256-tick
B-probes: social vs copy (descriptive) vs naive. Score social−naive
B-gap; copy gap descriptive.

## Verdict (per-pair, both pairs, frozen — BIRTHCARRY bar)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 12 → INCOMPLETE-LOWBIRTHS.
- GO (`GEN1-SOCIALX-GO-V1`) iff FOR EACH pair: social B-gap >
  +0.002; else NOGO (social is task-bound too — the law's scope is
  the natal task). Copy gap descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-75` main 475351–475368 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490586–490594 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-socialx-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digest moves
  + births ≥ 1/arm + B-entry correct + all three B-probes complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~29G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched-N; frozen B-probes.
