# TURN-GATE RESULTS V1l — lossy-initialized seg-chain CONVERGES (GO)

Date: 2026-11-02. Plan: `docs/TURN_GATE_PLAN_V1L.md` (FROZEN + bookkeeping
CORRECTION). Implement: V1k-mirror chain instrument + 13/13 fixtures +
triage 988/8 zero-new (2 bank-lifecycle converted) + fresh-13 bank
449001–449054 (54-unique). Attempt-13 (single authorized): 15 mains /
0 probes / 26880 worldTicks / 645120 founderSlots / 2.444e9 scalar ops
(cap 4.0e9, margin 1.7×). `redone: []`. Ledger exact.

## Verdict: PHASE-L-GO

| gate | bar | actual | pass |
|------|-----|--------|------|
| G1 join+integrity (all rows incl. chain) | ≥0.99 | 1.00 (all) | ✓ |
| G0 train gaps | ≥0.5 all 3 | 0.837/0.818/0.821 (7th replication) | ✓ |
| G2b unlearned flat | ≤0.1 all 3 | flat | ✓ |
| **G2a-HBconv PRIMARY: mean HB-seg3 − HB-seg1** | **≥ +0.1** | **+0.2541** | ✓ |
| G2c-BH no-harm floor (mean BH-seg3) | ≥0.7 | 0.9504 | ✓ |
| G2d same-val retention floor | ≥0.5 | 0.9510 | ✓ |

Per-pair HB trajectory (seg1 → seg3, conv): 0.577→0.800 (+0.223),
0.624→0.906 (+0.282), 0.561→0.818 (+0.258). 3/3 climbing.
Pooled HB seg1 0.587 (= V1k 0.588: replication to 0.001) → seg3 0.841.

## Reading: cure direction (convergence, not palliative saturate)

- The lossy start (HB 0.59) CLIMBS to 0.84 by seg3 — the exact-trajectory
  shape (converge) from a higher floor, asymptote ≈ train level (0.825).
  V1d's question (transient vs structural) re-answered for lossy starts:
  TRANSIENT (exposure converges; the residue was in the transplant, not
  the substrate).
- BH direction unharmed throughout (seg3 0.95); same-val intact (0.951).
- M2-across: wound-CLOSING (was: wound-has-treatment (V1k)). The seg1 tax
  remains (0.82→0.59 on change) but exposure now recovers it (→0.84 by
  seg3) instead of stalling (exact harm→ben stalled ~0.67). The M2 verdict
  doc predates this evidence — revision warranted (follow-up audit, not
  a silent edit).
- M4 trigger 2 still NOT fired (overall body-transfer tax gates it;
  V1l is same-body seg chain, not body transfer — no trigger relevance
  beyond the HB mechanism).

## Execution incident (preserved, not hidden)

- Attempt-13 run 1: VOID (instrument shipped the V1k exact arm instead of
  the seg2/seg3 chain + wrong mains constant 12 vs frozen 15; scorer
  fail-closed at the tag assert — no verdict, no valid attempt consumed).
- Instrument corrected (chain blocks in frozen order, weights persist per
  link, mains 15); two regression fixtures added (structural source guard
  incl. block order; mains-cap frozen-design check); 13/13 green.
- Void partial output removed (documented here, not hidden); bank untouched
  (read-only); single authorized attempt = the completed run above
  (`redone: []`, dual provenance: pre-fix rows none — all 15 rows ran under
  the corrected instrument; the mains-constant fix is result-independent
  (affects no world computation)).

## Licenses (GO grants)

(a) Lossy-initialized chains as the transfer standard for unlearning
directions (extends V1k's rule: lossy start + exposure converges).
(b) M2-across upgraded treatment→CLOSING (cure direction confirmed).
(c) No V1m without new rationale (chain convergence demonstrated; next
questions (α-ladder, lossy×lossy dose, cross-codebook generality) each
need their own frozen plan + fresh bank).

Line re-CLOSED. Cumulative program spend: 8037 + 15 = 8052.
No RSI claim (single-mechanism confirmation ×2, not recursive improvement).
