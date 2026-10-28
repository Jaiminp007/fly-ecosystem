# RSI v17 search: R=4 x motor consolidation (v18 bank)

Bank `evidence/rsi-taste-v1/search-20261111-v18/protocol.json`
(bankSha `6401b7bb…`), Gen1 R=4 flags + (32,8) S=1, ≤96 worlds/procedure,
matched A/B. Last dial x R=4 cross; rationale + family-closure stakes in
`docs/RSI_TASTE_PLAN_AMENDMENT_V17.md`.

## Cells (all R=4, (32,8), S=1, g=0, K=1, γ=0; only μ varies)

| cell | μ | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | 0 | 5.737 | 5.356 | +0.382 | 0.677 vs 1.349 False | 0.989 vs 0.760 True |
| a18-mu005 | 0.05 | 5.903 | 5.162 | +0.741 | 1.441 vs 1.438 True | 0.960 vs 0.690 True |
| a18-mu02 | 0.2 | 4.874 | 4.997 | −0.124 | 2.031 vs 1.945 True | 1.088 vs 1.268 False |
| b18-mu01 | 0.1 | 5.764 | 4.874 | +0.891 | 1.248 vs 1.206 True | 1.226 vs 0.998 True |
| b18-mu05 | 0.5 | 7.221 | 5.797 | +1.424 | 1.721 vs 1.551 True | 1.256 vs 0.936 True |

v18 is A-demanding (baseline A-false). Recorded prediction REFUTED on this
bank: μ does not poison here — μ=0.5 (the strongest smoothing, worst at
R=1) is score-best at 7.221 (+1.48) and dual-true; μ=0.05 also qualifies
(5.903, dual-true by +0.003 on A). The R=4 taste mixture changes the motor
story: with strong taste pull, smoothed motor weights ride the same
actions instead of poisoning them. Non-monotonic in μ (0.2 worst, 0.5
best) — same shape as the rate and strata curves.

## Claimant

`b18-mu05` (score-best + dual-true, +1.48) → fresh-evaluated as Gen12
(`docs/RSI_TASTE_GEN12_EVAL.md`, REJECT). A-greedy μ=0.05 also qualified
but trailed; single best evaluated per the retention-first line. B-random
supplies the claimant for the fourth round running.

Round worlds: 80 search + 48 eval + 24 control = 152. Cumulative 3096.
