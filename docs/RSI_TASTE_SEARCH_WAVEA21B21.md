# RSI v21 search: pairwise x R=4 (v22 bank) — NO CLAIMANT

Bank `evidence/rsi-taste-v1/search-20261115-v22/protocol.json`
(bankSha `396ee3d6…`), Gen1 R=4 flags, representation varies + rate
companions, ≤96 worlds/procedure, matched A/B. Amendment:
`docs/RSI_TASTE_PLAN_AMENDMENT_V21.md`.

## Cells

| cell | (repr, R) | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | (orth, 4) | 7.808 | 5.566 | +2.243 | 1.684 vs 1.619 True | 1.251 vs 1.041 True |
| a22-pw4 | (pair, 4) | 3.305 | 3.392 | −0.088 | 1.712 vs 1.594 True | 1.149 vs 0.881 True |
| a22-pw6 | (pair, 6) | 4.853 | 4.595 | +0.258 | 1.483 vs 1.615 False | 1.764 vs 1.645 True |
| b22-pw3 | (pair, 3) | 5.877 | 4.560 | +1.317 | 1.209 vs 1.108 True | 1.002 vs 0.798 True |
| b22-pw8 | (pair, 8) | 4.704 | 4.382 | +0.322 | 1.680 vs 1.301 True | 0.922 vs 0.566 True |

Pairwise holds both retentions descriptively at every rate (the v1
signature, reproduced at R=4) but surrenders 2–4.5 points of level vs
orthogonal on this bank — representation changes which conjunctions can
push predictions across .5, and pairs split the evidence. Alive
everywhere (no threshold collapse — features move predictions, never
pin them). Best cell (b22-pw3, 5.877) trails baseline by −1.93: no
claimant, no 48-world eval spent.

## Consequence

ALL old-code axes at R=4 are now exhausted: composition, scale, ratio,
rate-count, step-size, channel (slots/streams/surprise/windows),
consolidation (taste+motor), feeding rule, and now features. The next
round needs NEW CODE: the threshold-aware margin dial (V22) — learn
faster where predictions sit near the .5 greedy boundary, i.e., where
weight changes flip behavior.

Round worlds: 80 search, 0 eval. Cumulative 3632.
