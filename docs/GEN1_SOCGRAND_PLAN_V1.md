# GEN1_SOCGRAND PLAN V1 (frozen 2026-11-04) — social transmission across two generations (GRAND shape, copyconditional arms)

## Why this line, and only this one
The generation axis is tested for maternal only: F1 holds, F2
dilutes to zero (GRAND +0.000/+0.118, NOGO). The strongest law-grade
channel — social, 8/8 pairs at F1 — has never faced F2. If
success-bias compounds across generations (F2 holds), the law
extends in depth; if it dilutes like maternal, scope is confirmed at
F1. F1social (copyconditional) vs F1naive colonies → matched-N F1
offspring weights as F2 founders → F2social (copyconditional again)
vs F2naive colonies. Scored on F2 grandoffspring per-pair both legs.
Not a re-run of GRAND (maternal arms) or any birth/gauntlet/return
line.

## Amendment A1 (pre-execution, 2026-11-04)
F1 and F2 colonies run 1792 ticks (`SGR_PROBE_TICKS=1792`, GRAND
precedent), NOT the 900-tick window. Rationale, from triage on
throwaway 490676–490684 BEFORE any bank mint: with F1 at 900 ticks
F1 births were 13/6 (fn=6) and F2 colonies birthed ZERO at both 900
and 1792 ticks; with F1 at 1792 ticks F1 births were 17/7 (fn=7) and
F2 colonies birthed 1/3 at 1792 — mechanics proven, founder-count-
limited. F2 founder groups are matched-N (~6-15 minds); the window
horizon starves them below any scoring floor. The F2 question needs
births, not window-consistency (F1 birth inheritance is already
answered at both horizons). No other change; all gates/bars hold.

## Pipeline (per history: 1 train + 6 colonies, 2 histories, 14 runs)
TrainAB (512+512, A≠init and B≠A digest gate else INVALID), skill
pair 256 (skillT > skillN else INCOMPLETE-NOSKILL), F1 colonies 1792
ticks (A1 mating, reproduction ON, frozen newborns): F1social
(copyconditional) vs F1naive (none); extract F1 offspring weights;
matched-N (min per history, first-k by id) F2 founders
(`placeSocgrandGroup`); F2 colonies 1792 ticks: F2social
(copyconditional) vs F2naive (none). Pooled F1 offspring per
lineage ≥ 4 AND pooled F2 offspring per lineage ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; window bar). Score F2 grandoffspring
survival (primary) + per-lived-tick intake.

## Verdict (per-pair, both pairs, frozen — GRAND bar family)
- A/B-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled F1 or F2 offspring/lineage < 4 → INCOMPLETE-LOWBIRTHS.
- Pooled F2 social-line survival < 0.05 → FLOOR (report, no retune).
- Else GO (`GEN1-SOCGRAND-GO-V1`) iff FOR EACH pair F2 gaps
  (social-line − naive-line) survival > +0.10 AND intake > +0.002;
  else NOGO. F1 gaps descriptive (must be positive for the F2
  question to mean anything; reported, not gated).
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-85` main 475531–475548 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490676–490684 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-socgrand-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + births F1 pooled ≥ 4 + engagement spot-check + F2 founders
  placed + F2 births pooled ≥ 4 + both F2 colonies complete).
- BT caps; ~1.3M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  original cues; matched 900-tick colonies.
