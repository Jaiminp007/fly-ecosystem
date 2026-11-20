# TURN-GATE RESULTS V1k — direction-gated lossy confirmation GO

Date: 2026-11-02. Plan: `docs/TURN_GATE_PLAN_V1K.md` (FROZEN, design only +
bookkeeping CORRECTION attempt-12/fresh-12). Implement: `620c5f1`
(direction-gated scorer + 10/10 fixtures + triage 978/7 zero-new +
fresh-12 bank 448001–448054 built 54-unique post-fixtures).
Attempt-12 (single, authorized): 12 mains / 0 probes / 21504 worldTicks /
516096 founderSlots / 1.918e9 scalar ops (cap 3.0e9, margin 1.6×).
`redone: []`, all gates true. Ledger exact.

## Verdict: PHASE-K-GO

| gate | bar | actual | pass |
|------|-----|--------|------|
| G1 join+integrity (all rows, both arms) | ≥0.99 | 1.00 (all) | ✓ |
| G0 train gaps | ≥0.5 all 3 | 0.815/0.816/0.827 (6th replication) | ✓ |
| G2a transferred-exact mean gap | ≥0.3 | 0.525 (5th replication) | ✓ |
| G2b unlearned flat | ≤0.1 all 3 | flat | ✓ |
| **G2a-HB PRIMARY: mean lossy-HB − exact-HB** | **≥ +0.1** | **+0.2155** | ✓ |
| G2c-BH no-harm floor (mean lossy BH) | ≥0.7 | 0.8475 | ✓ |
| G2d same-val retention floor | ≥0.5 | 0.9473 | ✓ |

Per-pair HB (exact → lossy): 0.345→0.563 (+0.218), 0.375→0.516 (+0.141),
0.396→0.684 (+0.287). 3/3 positive. Pooled HB 0.372→0.588 (+0.216).
Pooled BH 0.827→0.848 (+0.021, no harm, no help — as predicted).

## Prediction check (post-hoc → pre-registered pipeline)

Measurement V1 (frozen V1j rows) predicted HB +0.2342 / BH +0.0099.
Attempt-12 actual: HB +0.2155 / BH +0.0211. Delta 0.019 / 0.011 —
the analytic read calibrated the confirmation run to within 0.02.
This is the discipline working end to end (measure frozen →
freeze test → run once → confirm).

## Reading: wound-has-treatment CONFIRMED (treatment, not cure)

- Lossy transplant specifically unlocks UNLEARNING (HB 0.37→0.59:
  single-seg1 lossy already beats the multi-exposure exact stall
  trajectory at its start; extinction of preserved avoidance).
- Acquisition (BH) needs nothing (0.83 exact; lossy harmless).
- NOT wound-closed: HB lossy 0.588 << train 0.819 (tax remains;
  overall lossy tax = 0.8191 − 0.7014 = 0.1177 > 0.1 —
  M4 trigger 2 still NOT fired (strict bright line, margin 0.018)).
- Mechanism (V1j reading, now confirmed): exact over-preserves
  avoidance; shrinkage weakens it; retention intact (0.947).

## Licenses (GO grants)

(a) Lossy (×0.5) as the unlearning-direction transfer standard
(extends V1j's retention-claim rule: future transfer claims must
use lossy/noisy transplants AND report direction-split HB/BH).
(b) M2-across: wound-has-treatment CONFIRMED (was: hypothesized).
M2 verdict stays PARTIAL (across-task loss persists: HB 0.59,
overall tax 0.12 — treatment halves the wound, does not close it).
(c) No V1l without new rationale (confirmation complete; next
lossy work needs a new question — e.g., lossy × harm→ben seg2+
convergence, or α-ladder — each its own frozen plan + fresh bank).

Line re-CLOSED (confirmation annex complete). Cumulative program
spend: 8025 + 12 = 8037. No RSI claim (single-mechanism confirmation,
not recursive improvement).
