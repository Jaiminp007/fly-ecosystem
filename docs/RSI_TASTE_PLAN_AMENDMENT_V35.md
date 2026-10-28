# RSI plan amendment v35: keep-hard × R-refinement (evict line decides the claim)

## Why (second generation, A-directed)

V34 (A-won) + Gen20 ACCEPT (seventh first-accept) put the evict line
at 1/2 successive with search-productivity 1/2. V35 refines A-directed
around the winner (b=1, τ=0, R=6) on the R axis — the axis that
carried V34. R takes integers ≥1 (validated); the winner's neighbors
R∈{5,7} bracket it from both sides.

## Menu (Gen1 flags (32,8) S=1 orthogonal greedy tr=1.0, τ=0, b=1, R varies)

* Baseline: Gen1 R=4 (b=0, τ=0, R=4) — the bar never moves.
* A (greedy, bracket the V34 winner R=6): {(b=1,R=5), (b=1,R=7)}.
* B (random, matched, outward + incumbent): two of {(b=1,R=4),
  (b=1,R=8), (b=1,R=9)} via mulberry32(20261129) → ['(1,4)','(1,9)']
  (incumbent R=4 + fresh R=9; R=8 stays out).

## Rules/stakes — THE CLAIM ROUND

New search bank v37, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. No eval without dual-true beating
baseline. Claimant → fresh 8-history bank (6 arms, v2 gates +
world-cap, copy control) as Gen21.

* V35 A-won + Gen21 fresh accept → evict line 2/2 SUCCESSIVE +
  search-productivity 2/2 → CLAIM BOUNDED RSI (with copy-control +
  A-directed matched-budget + total-budget accounting published).
* V35 B-won/tie/no-claimant/REJECT → evict line BANKED at 1/2
  unproductive (second 2/2-banked line after rate-split) → negative
  synthesis: all predeclared idea classes exhausted. Seven
  first-accepts across six lines, one 2/2 successive (unproductive),
  and the R=4-alone robustness series stand.
