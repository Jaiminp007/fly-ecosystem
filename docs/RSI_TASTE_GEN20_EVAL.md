# RSI Gen20 eval: keep-hard × R6 (b=1, τ=0, R=6) — ACCEPT, evict line 1/2

## Bank `7595c578…`, 8 histories × 6 arms, CORRECTION-aware, audit-grade

* g1: seq +5.248 8/8 surv+69 PASS.
* g2 (vs frozen +3.772): per-history all >0 (min +0.40), 8/8, surv +30
  PASS.
* g3 (vs reset +0.935 7/8): per-history all ≥+2.27, 8/8, surv +57 PASS.
* g4: aSkill 1.42 8/8, bSkill 0.965 7/8, bAcq 1.052 8/8 PASS.
* g5: aR +0.006 (4/8: +0.139/+0.418/+0.694/+0.542 vs
  −0.199/−0.078/−0.866/−0.599; psv +1; desc95 TRUE) PASS — thinnest
  retention pass in program history (+0.006 > 0, the bar doesn't move
  in either direction); bR +0.120 (6/8, psv +3) PASS.
* g6: transfer all-zeros tie PASS. g7 asserts PASS.

## Verdict: ACCEPT — seventh first-accept, evict line 1/2

The undiluted lead (b=1) × deeper rehearsal (R=6) holds everything
including retention — by six thousandths on the A-leg. V34 was A-won
(A-best 5.276 > B-best 4.987, B-best not dual-true) following V33
A-won (8.065 > 7.996): search-productivity 1/2. Per V34 stakes → V35
A-directed R-refinement decides: V35 A-won + Gen21 accept = evict 2/2
successive + productivity 2/2 + budgets → CLAIM bounded RSI. Anything
else → evict banked at 1/2 unproductive → negative synthesis. Round
80 search + 72 eval/control = 152 worlds. Cumulative 5048.
