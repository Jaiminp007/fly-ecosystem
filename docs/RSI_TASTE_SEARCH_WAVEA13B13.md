# RSI v13 search: R=4 x retention-first memory (v14 bank)

Bank `evidence/rsi-taste-v1/search-20261107-v14/protocol.json`
(bankSha `e486824f…`), Gen1 R=4 flags, ≤96 worlds/procedure, matched A/B.
First round to vary memory at R=4 (all prior memory/strata searches ran
R=1); rationale in `docs/RSI_TASTE_PLAN_AMENDMENT_V13.md`.

## Cells (all R=4, S=1, g=0, K=1, γ=μ=0)

| cell | (cap,rec) | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | (32,8) | 4.460 | 3.852 | +0.609 | 0.500 vs 0.457 True | 0.954 vs 1.357 False |
| a14-mem64-8 | (64,8) | 5.324 | 4.031 | +1.293 | 1.095 vs 1.057 True | 0.589 vs 0.674 False |
| a14-mem32-16 | (32,16) | 3.902 | 3.636 | +0.265 | 0.752 vs 0.753 True | 1.520 vs 1.608 False |
| b14-mem48-8 | (48,8) | 6.046 | 4.403 | +1.643 | 0.808 vs 0.441 True | 1.691 vs 1.352 True |
| b14-mem32-4 | (32,4) | 4.468 | 3.790 | +0.678 | 0.539 vs 0.317 True | 1.582 vs 1.605 True |

v14 is a B-demanding bank (baseline B-false). B-random wins the round:
(48,8) is score-best AND the sole clear dual-true claimant (+1.59 over
baseline). A-greedy best (64,8) beats baseline but B-false. No
productivity win for directed search (second round running).

## Claimant

`b14-mem48-8` beats the same-bank R=4 baseline → fresh-evaluated as
Gen9 (`docs/RSI_TASTE_GEN9_EVAL.md`, REJECT). (32,4) is dual-true but
+0.008 over baseline — noise margin, not an independent claimant; no
second eval spent.

Round worlds: 80 search + 48 eval + 24 control = 152. Cumulative 2560.
