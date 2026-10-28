# RSI v15 search: ratio-preserving scale-up at R=4 (v16 bank)

Bank `evidence/rsi-taste-v1/search-20261109-v16/protocol.json`
(bankSha `4690706b…`), Gen1 R=4 flags, ≤96 worlds/procedure, matched A/B.
Rationale in `docs/RSI_TASTE_PLAN_AMENDMENT_V15.md`: deconfounds Gen9's
ratio-vs-scale ambiguity by holding the winning 3:1 old:recent ratio at
scales 32→40→48→56→64.

## Cells (all R=4, S=1, g=0, K=1, γ=μ=0; only capacity/recent vary)

| cell | (cap,rec) | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | (32,8) | 5.289 | 4.402 | +0.887 | 1.612 vs 1.740 False | 1.015 vs 0.953 True |
| a16-mem48-12 | (48,12) | 3.786 | 3.816 | −0.030 | 1.200 vs 0.889 True | 0.814 vs 0.608 True |
| a16-mem64-16 | (64,16) | 5.276 | 4.570 | +0.706 | 1.284 vs 0.999 True | 0.429 vs 0.518 False |
| b16-mem56-14 | (56,14) | 4.187 | 4.026 | +0.160 | 0.636 vs 0.495 True | 0.949 vs 0.883 True |
| b16-mem40-10 | (40,10) | 5.514 | 4.553 | +0.961 | 1.148 vs 0.909 True | 0.891 vs 0.743 True |

v16 is A-demanding (baseline A-false). Scale curve non-monotonic:
32→5.289 (A-false), 40→5.514 (dual-true), 48→3.786 (dual-true, level
lost), 56→4.187 (dual-true, level lost), 64→5.276 (B-false). No
exact-zero (proportion preserved — prediction held). Fixed-ratio scale DOES
move the weak leg: both 40 and 48 rescue A descriptively. But only 40
holds the level; 48/56 pay −1.1 to −1.5 lifetime for the joint gate.

## Claimant

`b16-mem40-10` (+0.225 over baseline, dual-true) → fresh-evaluated as
Gen10 (`docs/RSI_TASTE_GEN10_EVAL.md`, REJECT). Thin margin, rule-clean
via the retention-first line. B-random supplies the claimant again —
directed search has not produced a fresh-passing revision in any round.

Round worlds: 80 search + 48 eval + 24 control = 152. Cumulative 2792.
