# ODOR DEV ROUND 4 RESULTS V1 — NO-GO (signal closed, architecture promoted)

Executed 2026-11-02 on the same 8 reused histories (hash-verified
bank copy; teacher-src 8 traces + 32 R1 anchors extracted read-only:
267,002 guarded teacher pairs). Fresh 8-dim BC students per fly,
supervised perceptron training in curriculum order, steering grafted
onto round-1 anchor copies (R1 bodies held constant), full A/B/transfer
probe suite. 23.85e9 scalar ops (cap 40e9 ✓), wall within 3600s ✓.
Single execution, no debris. Dev only, not qual.

## Verdict: R4-NO-GO (frozen mapping: signal-side closed)

| gate | round 4 | bar | met |
|---|---|---|---|
| transfer vs reset | +0.40 mean, 5/8, surv 0 | mean>0, 6/8, surv≥0 | NO (5/8) |
| transfer vs cheap native-full | +0.35, 4/8, surv −? | same | NO |
| A-retention | 30.05% | ≥95% | NO |
| B-retention | 1082% (saved≈0.028 — degenerate) | ≥95% | (vacuous) |
| beat-student-vs-teacher (descriptive) | −0.57 mean, 0/8 vs guarded | — | — |

## Reading (descriptive, dev-only)

1. **The signal hypothesis is dead by its own hand.** A student
   trained on 267k guarded decisions, in curriculum order, with
   identical bodies — loses to its teacher 0/8 by the same margin
   as the environmental learner (−0.57 vs R1's −0.55). The BC
   student is no closer to guarded than R1-learned ever was.
   Per the frozen falsifier: ARCHITECTURE, not signal. Candidate B
   (nonlinear head) is promoted; dataset-distillation stays queued.
2. **Transfer misses by ONE history** (5/8 vs 6/8, mean +0.40).
   The closest any learned arm has come (R1: +0.42/5/8; R4:
   +0.40/5/8 — the bar is histories, not means). Not a near-miss
   to tune on — the gate is count-based by design, and shopping
   one history would be exactly the forbidden move.
3. **A-retention 30%**: BC preserves the early skill barely better
   than R1 (22%) and far worse than rehearsal (96%) — supervision
   without re-exposure does not retain.
4. **B 1082% is degenerate** (saved advantage ≈0.028): the ratio
   explodes on a near-zero denominator. Reported, not celebrated —
   a guardrail that fires on noise is a lesson for future gate
   design (require saved advantage > ε before ratio-gating).

## Consequences (frozen mapping)

- NO-GO: signal-side closed (both the informational R3 and the
  supervisory R4 variants). Promote candidate B.
- No qual consideration. The odor lane's next step is an
  architectural line (needs its own design doc first — NOT
  authorized by this verdict).
