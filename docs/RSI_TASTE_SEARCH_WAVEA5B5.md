# RSI search wave A5/B5 (stratified replay, v5 bank)

Bank `search-20261030-v5` (`f5185178…`), 16 worlds/proposal. Gen0 S=1 line 6.027.

## A5 greedy (48 worlds): S=2 → 4.367 dual-true; S=3 → 5.838 A-false/B-true; S=4 → 6.231 A-true/B-false. Claimant S=4 (+0.20 over Gen0).

## B5 random (seed 20261031, 96 worlds): draws S=4/3/5/2/8/6 → 6.231 / 5.838 / 5.663 / 4.367 / 5.218 / 5.006. B-best 6.231 (same cell, overlap). No productivity edge; reruns reproduce A5 exactly (determinism ✓).

## Mechanism read

Stratification moves retention mass toward old records: S=4 holds search-A but
starves search-B; S=2/3 split the difference with lower lifetime. Same
tradeoff curve, new axis — the fresh eval decides whether the curve moved
outward (`RSI_TASTE_GEN5_EVAL.md`).

Evidence: `evidence/rsi-taste-v1/search-20261030-v5/{gen0-search4,a5-*,b5-*}/`.
