# TURN-GATE RESULTS V1M — dose ladder GO (best-α 0.25 exceeds train)

Date: 2026-11-02. Plan: `docs/TURN_GATE_PLAN_V1M.md` (FROZEN, DESIGN ONLY).
Implement: dose-panel instrument + 13/13 fixtures + fresh-14 bank
450001–450054 adopted-verified (post-bank refusal form).
Attempt-14 (single, authorized): 18 mains / 0 probes / 32256 worldTicks /
774144 founderSlots / 2.914e9 scalar ops (cap 5.0e9, margin 1.7×).
`redone: []`. Ledger exact.

## Verdict: PHASE-M-GO

| gate | bar | actual | pass |
|------|-----|--------|------|
| G1 join+integrity (all rows incl. all α tags) | ≥0.99 | 1.00 (all) | ✓ |
| G0 train gaps | ≥0.5 all 3 | 0.811/0.801/0.818 (8th replication) | ✓ |
| G2b unlearned flat | ≤0.1 all 3 | flat | ✓ |
| **G2a-MET (PRIMARY): best-α pooled HB ≥ pooled train − 0.1** | **≥ 0.71** | **0.9137 (α=0.25)** | ✓ |
| G2c-BH no-harm floor (all lossy arms) | ≥0.7 | 0.816/0.832/0.812 | ✓ |
| G2d same-val retention floor (all lossy arms) | ≥0.5 | 0.932/0.945/0.948 | ✓ |

Dose curves (pooled, 3 pairs):
- HB(α): 0.25→**0.9137**, 0.5→0.5320, 0.75→0.3600 (exact α=1: 0.2884,
  4th wound replication). Monotone decreasing in α on {0.25,0.5,0.75}:
  stronger shrinkage → better unlearning transfer.
- BH(α): 0.816/0.832/0.812 (flat — acquisition needs nothing, harmed by nothing).
- same(α): 0.932/0.945/0.948 (retention intact at every dose).

## Reading: the MET bar is cleared (bestHb EXCEEDS train)

- M2-addendum bar (HB-seg1 within 0.1 of train = 0.71): cleared by 0.20
  (0.9137 > 0.81 = train). Not within — ABOVE.
- The seg1 tax is gone at α=0.25 (HB 0.91 vs train 0.81): the change
  costs nothing in the unlearning direction; it pays.
- Dose shape: monotone on the tested panel (less preservation → more
  transfer); α=0 (zeroed) and α=1 (exact) bound the panel below
  (unlearned-flat ≈ chance; exact 0.29) — peak at or below 0.25,
  location of the peak unmapped (no α<0.25 tested; NOT licensed to
  interpolate — the curve between 0 and 0.25 is unknown).
- Exact-arm HB 0.288 = 4th replication of the wound (in-control).

## Licenses (GO grants)

(a) α=0.25 as the unlearning-direction transfer standard (extends V1k/V1l
rules: shrink to one quarter, transfer exceeds train).
(b) M2 flips to MET per the addendum's pre-registered bar (separate
addendum V2 records the flip; frozen verdict + V1 untouched).
(c) No V1n without new rationale (dose mapped on H-family; next questions
(peak location α<0.25, cross-codebook generality, α×seg-chain) each need
their own frozen plan + fresh bank).
(d) M4 trigger 2 still NOT fired (body-transfer class; V1m is same-body —
noted explicitly so the trigger ledger stays clean).

Line re-CLOSED. Cumulative program spend: 8052 + 18 = 8070.
No RSI claim (single-mechanism dose confirmation, not recursive improvement).
