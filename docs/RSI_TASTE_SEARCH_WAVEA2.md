# RSI search wave A2 (wider menu, greedy Hamming-1) — claimant, not acceptance

Bank: `search-20261028-v2` (`6cf32614…`), 4 histories × 4 arms = 16 worlds/proposal.
Gen0 start line: score **5.606** (seq +4.689, vsReset +0.918; A-false/B-true).

## Wave (96 worlds, cap)

* `a2-feeding-matching`: 2.350 + 0.150 = 2.501. A 0.33 vs −0.02 false; B false.
* `a2-taste-pairwise`: 3.765 − 0.511 = 3.254. A-true, B-false.
* `a2-cruise1`: 3.099 + 0.870 = 3.970. A-true (0.84 vs 0.85), B-false.
* `a2-tasterate01`: 0.909 − 0.436 = 0.473. A-false, B-true.
* **`a2-td`** (td/hold1, else Gen0): **5.626 + 1.976 = 7.601** — beats Gen0 by
  +1.995. A 1.754 vs 1.408 TRUE; B 1.726 vs 2.092 false (82%).
* `a2-renewal`: 2.224 − 0.461 = 1.763. A-true, B-false.

Total A2: 96 worlds. Claimant: `a2-td`. Note the reversal: td lost to Gen0 on
v1-search (2.82 vs 5.02) but wins on v2-search — bank-dependent, so this is a
search observation only and must survive fresh eval. It also trades skills
(A fixed, B breaks on search bank), which the fresh v2 gates will punish if it
generalizes that way.

## Not yet acceptance (predeclared)

* Matched B wave (random, 96 worlds) on v2 bank still pending — productivity
  comparison open.
* Fresh `gen1-eval` bank (8 new histories) + full 6-arm eval of `a2-td` vs v2
  gates + world-cap guard still required. No copy, no promotion, no RSI.

Evidence: `evidence/rsi-taste-v1/search-20261028-v2/{a2-*}/`.
Cumulative RSI: 48 eval + 192 v1-search + 16 v2-base + 96 A2 = **352 worlds**.
