# RSI plan amendment v26: rate-split WIDE menu (no new code, third generation)

## Why (productivity demands differentiability)

V25 proved ρ∈[1.25,1.75] is behaviorally one point (threshold
saturation): procedures cannot differ there. V26 steps OUTSIDE the
plateau where V24 proved behavior moves: inward toward the A-killing
slope (0.75) and outward past the B-killing slope (2.5). If A-directed
refinement (greedy outward from the winner) beats random probes here,
productivity 1/2. If random wins again or ties differentiably, the line
cannot supply A-direction and the program moves to V27-new-idea with
successive 2/2 banked but unclaimed.

## Menu (Gen1 R=4 flags, (32,8), S=1, orthogonal, greedy, tr=1.0, R=4)

* Baseline: Gen1 R=4 (ρ=1) — the bar never moves.
* A (greedy, outward from winner ρ=1.25): {ρ=0.75, ρ=2.5}.
* B (random, matched, informative pool): two of {ρ=0.5, ρ=1.0, ρ=2.0,
  ρ=3.0} via mulberry32(20261120) → ['1.0','0.5'] (baseline itself +
  the level-up/A-killer — the sternest random test possible).

## Rules unchanged

New search bank v28, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. No eval without dual-true beating baseline.
Claimant → fresh 8-history bank (6 arms, v2 gates + world-cap, copy
control).

## Stakes (predeclared, unchanged from Gen16/V25 docs)

* V26 A-won + fresh accept → productivity 1/2, successive 3/3 → V27
  (fourth generation, A-directed around V26 winner) decides the claim.
* V26 B-won/tie/no-claimant/REJECT → rate-split line can never supply
  A-direction → line banked at successive 2/2 unclaimed; program moves
  to next new-code idea class. The successive result STANDS (no
  retroactive invalidation) but claims nothing alone.
* Bounded RSI iff V26-A-won-accept AND V27-A-won-accept AND budgets.
