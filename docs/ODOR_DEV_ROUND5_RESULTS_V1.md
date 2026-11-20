# ODOR DEV ROUND 5 RESULTS V1 — R5-NO-GO (B1 closed, B2 next)

Date: 2026-11-02. Single authorized execution per PLAN V1 FROZEN.
Triage: bank copy hash `893c60a9…cd4487` == R1 bankSha256, 8 reused
histories, zero new seeds. Scalar ops 27.03e9 (cap 40e9 ✓).

## Outcome (frozen gates)

- Transfer vs reset: mean −0.70, 2/8 positive (need 6/8 + mean>0) — FAIL.
- Transfer vs native-full: mean −0.79, 2/8 — FAIL.
- Beat-guarded: mean −0.07, 4/8 (need 6/8 + mean≥0) — FAIL.
- Retention A: 33% (need ≥95%) — FAIL. B: 92.7% (need ≥95%) — FAIL.
- Verdict: **R5-NO-GO**. B1 closed. B2 (threshold units) scoped next;
  B3 last resort.

## Mechanism read (descriptive, not a new claim)

Forcing the stop starved acquisition itself: A retention collapsed to
33% (R3-learned 78%, R4-student 30%). When viability is false — most
often in phase A, where no good overlap exists yet — the gate issues
no update, so the go-branch never learns the very contexts where
stopping dominates. R3's failure was not "won't learn to stop" but
"can't learn anything while stopped": the stop decision consumes the
learning opportunity. B1's falsifier fires in the informative
direction — even perfect stopping is insufficient because perfect
stopping prevents learning. The B2 threshold unit (soft gate: learn
through the stop, weight by viability) is now the licensed next
hypothesis, since it preserves the stop signal without zeroing the
update.
