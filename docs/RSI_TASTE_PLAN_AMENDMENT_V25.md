# RSI plan amendment v25: rate-split refinement (NO NEW CODE, second generation)

## Why (successive + productivity demand it)

Gen16 accepted ρ=1.5 (rate-split line 1/2) but V24 was B-won. The line
needs TWO A-won generations to satisfy successive (2/2) AND A-directed
productivity (2/2) simultaneously. V25 is the first: refine around the
winner on a FRESH bank (no tuning — v26 never revisited).

## Menu (Gen1 R=4 flags, (32,8), S=1, orthogonal, greedy, tr=1.0, R=4)

* Baseline: Gen1 R=4 (ρ=1) — the bar never moves.
* A (greedy, refinement around winner): {ρ=1.25, ρ=1.75}.
* B (random, matched, bracketing pool): two of {ρ=1.1, ρ=1.4, ρ=1.6,
  ρ=1.9} via mulberry32(20261119).

## Rules unchanged

New search bank v27 (bank() scan excludes all prior), `--count 4`,
6 arms + baseline cell same bank, ≤96/procedure matched A/B. No eval
without dual-true beating baseline. Claimant → fresh 8-history bank
(6 arms, v2 gates + world-cap, copy control).

## Stakes (predeclared)

* V25 A-won + fresh accept → line 2/2 successive, productivity 1/2 →
  V26 (third generation, A-directed around the V25 winner) decides the
  claim.
* V25 B-won or no-claimant or fresh REJECT → line stalls at 1/2;
  rate-split joins the four stalled lines; program continues to V26-new
  idea (next: error-gated replay skip vs full rehearsal — does the
  budget bind on count? — or adaptive per-record rates).
* Bounded RSI is claimed ONLY on V25-A-won-accept AND V26-A-won-accept
  AND total-budget accounting. This is the longest road the rules allow,
  and it is stated here before a single V25 world runs.
