# RSI v18 search: taste step-size x R=4 (v19 bank)

Bank `evidence/rsi-taste-v1/search-20261112-v19/protocol.json`
(bankSha `b0f6ed61…`), Gen1 R=4 flags + (32,8) S=1, ≤96 worlds/procedure,
matched A/B. Rationale in `docs/RSI_TASTE_PLAN_AMENDMENT_V18.md`.

## Cells (all R=4, (32,8), S=1, g=0, K=1, γ=μ=0; only tasteRate varies)

| cell | tr | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | 1.0 | 6.865 | 6.403 | +0.462 | 1.200 vs 0.911 True | 1.175 vs 1.095 True |
| a19-tr01 | 0.1 | 3.428 | 2.972 | +0.456 | 0.975 vs 0.881 True | 1.657 vs 1.376 True |
| a19-tr05 | 0.5 | 7.482 | 6.751 | +0.730 | 1.745 vs 1.854 False | 1.572 vs 1.555 True |
| b19-tr07 | 0.7 | 5.669 | 5.390 | +0.279 | 1.198 vs 1.124 True | 1.493 vs 1.322 True |
| b19-tr03 | 0.3 | 6.884 | 5.912 | +0.972 | 2.393 vs 1.315 True | 1.476 vs 1.389 True |

Curve non-monotonic (1.0→6.865, 0.7→5.669, 0.5→7.482 A-false,
0.3→6.884 dual-true, 0.1→3.428 dual-true level-lost); no exact-zero
anywhere (prediction held — same mixture, only gain changes). Slow steps
rescue the weak leg: tr=0.3 posts the strongest search A-margin of any
claimant (+1.08); tr=0.1 holds both legs but starves the level.

## Claimant

`b19-tr03` (+0.019 over baseline, dual-true) → fresh-evaluated as Gen13
(`docs/RSI_TASTE_GEN13_EVAL.md`, REJECT). a19-tr05 is a score-only
beater with A-false — no path. B-random supplies the claimant for the
fifth round running.

Round worlds: 80 search + 48 eval + 24 control = 152. Cumulative 3248.
