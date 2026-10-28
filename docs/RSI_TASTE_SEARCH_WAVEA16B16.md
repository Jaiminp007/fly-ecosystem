# RSI v16 search: R=4 x stratified replay (v17 bank)

Bank `evidence/rsi-taste-v1/search-20261110-v17/protocol.json`
(bankSha `efa2d854…`), Gen1 R=4 flags + (32,8), ≤96 worlds/procedure,
matched A/B. Last dial x R=4 cross; rationale in
`docs/RSI_TASTE_PLAN_AMENDMENT_V16.md`.

## Cells (all R=4, (32,8), g=0, K=1, γ=μ=0; only S varies)

| cell | S | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | 1 | 4.039 | 4.610 | −0.571 | 1.407 vs 1.359 True | 1.423 vs 1.494 True |
| a17-s2 | 2 | 4.652 | 4.324 | +0.328 | 1.636 vs 1.702 True | 1.253 vs 1.627 False |
| a17-s4 | 4 | 6.033 | 4.975 | +1.057 | 0.854 vs 0.649 True | 1.607 vs 1.711 False |
| b17-s2 | 2 | 4.652 | 4.324 | +0.328 | 1.636 vs 1.702 True | 1.253 vs 1.627 False |
| b17-s3 | 3 | 5.292 | 4.456 | +0.836 | 1.187 vs 1.096 True | 1.014 vs 1.013 True |

v17 is lifetime-hard (baseline vsR −0.571). a17-s2 and b17-s2 are
bit-identical (same S=2 config run under both procedure labels — honest
duplication from the B draw overlapping A; confirms determinism, costs
16 worlds, reported). Non-monotonic in S: halves (S=2) and quarters (S=4)
starve B descriptively while scoring well (S=4 is score-best at 6.033,
+1.99 over baseline, but B-false); thirds (S=3) hold both legs barely
(B by +0.001) at 5.292. Partially against the recorded prediction (S=2
did not hold; S=3 did).

## Claimant

`b17-s3` (+1.25 over baseline, dual-true by a hair) → fresh-evaluated as
Gen11 (`docs/RSI_TASTE_GEN11_EVAL.md`, REJECT). S=4 is a score-only
beater with B-false — no independent path. B-random supplies the claimant
for the third round running; directed search has never produced a
fresh-passing revision.

Round worlds: 80 search (incl. 16 honest duplication) + 48 eval + 24
control = 152. Cumulative 2944.
