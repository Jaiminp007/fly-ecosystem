# ODOR DEV ROUND 3 RESULTS V1 — NO-GO (information hypothesis dead)

Executed 2026-11-02 on the same 8 reused histories (hash-identical
bank copy). One new arm (learned-guard: fixed curriculum, 10-dim
steering) + full A/B/transfer probe suite. 26.94e9 scalar ops (cap
40e9 ✓), wall within 3600s ✓. Single execution, no debris (guard
fix landed pre-run). Dev only, not qual.

## Verdict: R3-NO-GO (frozen falsifier triggered)

| gate | round 3 | bar | met |
|---|---|---|---|
| transfer vs reset | −0.42, 2/8, surv −1 | mean>0, 6/8, surv≥0 | NO |
| transfer vs cheap native-full | −0.52, 2/8, surv −1 | same | NO |
| A-retention | 78.22% | ≥95% | NO |
| B-retention | 102.97% | ≥95% | yes |
| beat-guarded | −0.37 mean, 3/8 positive | mean≥0, 6/8 | NO |

## Reading (descriptive, dev-only)

1. **The information hypothesis is dead by its own hand.** The
   viability boolean + requiredEnergy scalar were visible every
   decision; the guarded gap persists (−0.37, guarded wins 5/8).
   Per the frozen falsifier: policy-expressiveness, not information.
   Giving the learner the guard's answer does not teach it the
   guard's policy.
2. **A-retention ranks the treatments: rehearsal (96%) > guard
   feature (78%) > baseline (22%).** Exposure beats information
   for preserving the early skill — but neither fixes transfer.
3. **Transfer ranks differently: R1 (+0.42) > R3 (−0.42) > R2
   (−1.20).** Both interventions hurt transfer vs the fixed
   baseline while moving retention — the dissociation stands in
   all three rounds now (retention⇏transfer ×3).
4. Guarded itself stays the ceiling no learned arm has touched
   (learned-guard loses to it 5/8). The hand-designed gate remains
   the best steering on this ecology.

## Consequences (frozen mapping)

- NO-GO: guard-feature closed. No round 4 scoped — the two
  recorded mechanisms both failed; the lane needs a NEW hypothesis,
  not another round on autopilot.
- No qual consideration. DTR part (iv) still open; odor lane stays
  exploratory.
