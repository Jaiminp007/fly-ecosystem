# CUE-DISCRIMINATE results — Phase A (NOGO on the frozen metric; major post-hoc finding, not claimed)

Frozen plan: `docs/CUE_DISCRIMINATE_PLAN_V1.md` (+ V1a bank move). Single
attempt, 24 mains, 0 probes, all caps (8.02e9 ops ≤ 20e9). Verdict per the
FROZEN implementation: **PHASE-A-NOGO** — G2b (pause-gated) fails 2/6.
No V1b, no intervention, no rescoring. What follows separates the verdict
(frozen, final) from a post-hoc observation (explicitly UNclaimed here,
with its own proposed line).

## Frozen verdict: NOGO (computed as written, no re-analysis)

- G1 integrity: join rate 1.00 on all 24 runs (≥0.99 required) ✓. The join
  machinery is proven; every number below rests on matched tick+agent pairs.
- G2a replication: unlearned-minus-candidate harmful share ≥0.15 on 5/6
  histories (gaps 0.12–0.24; one miss at 0.122). F-RISK replicates on a
  fresh bank: trained eats ~0.26–0.37 harmful vs untrained ~0.48–0.50. ✓
- G2b cue-conditioning (pause, as implemented): harmful-pause > beneficial-
  pause on 2/6 histories (need 4). Pause rates sit at 0.27–0.28 for BOTH
  cue types and BOTH arms, all histories — pausing is cue-blind baseline
  behavior, not avoidance. ✗ → NOGO (conjunctive bar fails).
- V1b gate: room exists (candidate mean 0.311 ≥ 0.25) BUT the gate answers
  "intervene on WHAT" — and the frozen WHAT (pause-gated avoidance) failed.
  No V1b. A ceiling claim would also be false (room exists; the mechanism
  question is open, not settled). Verdict: plain NOGO, line closed.

## Post-hoc observation (NOT a verdict, NOT a rescore — explicitly unclaimed)

Per-tick action analysis (odd = declined/default-deviating actions) shows
cue-gated TURNING, massive and consistent, where pausing showed nothing:

| history | T-turn\|harm (n) | T-turn\|ben (n) | U-turn\|harm | U-turn\|ben |
|---|---|---|---|---|
| 393001 | 0.864 (10520) | 0.051 (11479) | 0.049 | 0.051 |
| ...010 | 0.855 (10203) | 0.049 (10711) | 0.050 | 0.050 |
| ...019 | 0.868 (10035) | 0.050 (12258) | 0.049 | 0.048 |
| ...028 | 0.851 (8703) | 0.051 (13760) | 0.050 | 0.050 |
| ...037 | 0.864 (10063) | 0.050 (11622) | 0.049 | 0.050 |
| ...046 | 0.880 (11187) | 0.049 (11758) | 0.050 | 0.046 |

Trained: 85–88% turn-on-harmful vs 5% on beneficial, all 6 histories,
n≈10k each. Untrained: 5% flat. Contact exposure is similar (46% vs 49%
harmful-cue contacts), so the mechanism is IN-CONTACT turning, not contact
avoidance. This is the F-RISK choice defect explained mechanistically —
but it was NOT the pre-registered metric, so it is reported, not claimed.

## Anti-shopping statement (part of the record)

Claiming GO on turn rates now would be verdict-shopping: the turn metric
was examined BECAUSE the pause metric failed, on the SAME bank whose data
it would then "confirm". The bar that matters was frozen before any number
was seen, and it said pause. The verdict stands as NOGO.

## Licensed follow-up (proposal ONLY — needs its own frozen plan + fresh goal)

**TURN-GATE line**: freeze a turn-based G2b (same ≥4/6 structure, turn metric
pre-registered, fresh bank, new seeds) + replication of the gap; if GO,
the V1b intervention menu applies unchanged (cue-conditioned avoidance
training — turning, not pausing — vs exploration scheduling). The data above
is its motivation and NOTHING more; it cannot be its evidence.
