# RSI plan amendment v29: skip-threshold refinement (no new code, second generation)

## Why (A-direction must come from refinement)

V28 was B-won (B found the robust τ=0.3 cell). The skip line stands at
1/2 successive, 0/1 productivity. Refinement around the winner is the
A-directed move (V25 precedent): A greedy brackets τ=0.3 while B
probes outward. If A wins here AND accepts fresh, productivity 1/2
(line 2/2); V30 then decides the claim.

## Menu (Gen1 R=4 flags (32,8) S=1 orthogonal greedy tr=1.0 R=4)

* Baseline: Gen1 R=4 (τ=0) — the bar never moves.
* A (greedy, bracket the winner): τ ∈ {0.2, 0.5} — between the twins
  (0.15) and the winner (0.3), and beyond into near-total skip.
* B (random, matched, outward pool): two of {0.05, 0.4, 0.7} via
  mulberry32(20261123) → ['0.7','0.4'].

## Rules/stakes unchanged

New search bank v31, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. No eval without dual-true beating baseline.
Claimant → fresh 8-history bank (6 arms, v2 gates + world-cap, copy
control).

* V29 A-won + fresh accept → skip line 2/2, productivity 1/2 → V30
  (A-directed around V29 winner) decides the claim.
* V29 B-won/tie/no-claimant/REJECT → skip line banked at 1/2
  unproductive; program moves to next new-code class (adaptive
  per-record RATES: surprise-scaled rehearsal gain — the remaining
  accepted-mechanism interaction).
* Bounded RSI iff V29-A-won-accept AND V30-A-won-accept AND budgets.
