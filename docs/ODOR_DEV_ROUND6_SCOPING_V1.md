# ODOR DEV ROUND 6 SCOPING V1 — threshold-unit soft gate (NOT FROZEN)

Date: 2026-11-02. Zero worlds. Status: SCOPED (mechanism + falsifier +
decomposition recorded; open items listed; no license, no bank, no
code, no execution). Licensed by round-5 NO-GO mechanism read
(forced stop starves acquisition — the stop consumes the learning
opportunity). Design parent: NONLINEAR_HEAD_DESIGN_V1 (B2).

## Mechanism

B2 (threshold units): replace B1's hard switch with a soft gate —
action blends go/stop logits by sigmoid(k·(viability−θ)) with frozen
k/θ, AND the TD update is viability-weighted rather than zeroed:
stopped ticks still generate a (down-weighted) update from the
observed transition. Two changes, one principle: the stop signal
shapes behavior without consuming the learning opportunity.
Single-variable vs B1: identical branches, identical features; the
ONLY difference is hard-zero vs soft-weight on !viable ticks.

## Why this is the licensed next hypothesis

R5 proved the hard gate's failure mode (A 33%: starvation, not
misclassification). B2 preserves exactly what B1 destroyed (updates
on !viable ticks) while keeping exactly what R3 lacked (an explicit
stop pathway the linear head could not express). If the program's
ladder means anything, the soft gate should recover A retention
toward R3's 78% AND beat R3's stop-correctness — both halves of the
decomposition in one arm.

## Falsifier (pre-registered)

- B2 recovers A (≥R3's 78%) but still loses transfer/guarded →
  gap is go-quality, not stop-correctness: close the gating family
  (B1+B2), promote B3 (MLP) as the last architectural hypothesis.
- B2 fails A too (≤R5's 33% band) → the viability signal itself
  is unusable for learning (not just the gate form): close B2
  without promoting B3 on gating grounds (B3 would need a fresh
  rationale, not a gate variation).
- B2 wins (GO) → qual-freeze consideration (iv-b).

## Verdict mapping (frozen at plan time, proposed here)

Same as R5: GO iff transfer gate (6/8 vs reset AND vs cheap
native-full, nonnegative survivor diffs) AND A≥95% AND B≥95% AND
beat-guarded (≥6/8 positive, mean≥0). PARTIAL iff transfer+A+B
pass but guarded fails. Else NO-GO per the falsifier branches.

## Open items before a frozen dev plan

1. Gate exact form (sigmoid on viability margin vs linear blend;
   frozen k/θ values and their billing).
2. Update weighting exact form (weight = viability? weight =
   gate output? frozen formula + billing identity).
3. Instrument change list (threshold-unit module vs gated-pair
   extension; null-default preservation).
4. Fixtures (soft-gate monotonicity in viability; stopped-tick
   update nonzero-but-discounted; stop-branch still constrained;
   billing identity; anchors; no-new-seeds).

## What this is not

Not frozen, not authorized. B3 stays queued behind B2's falsifier.
