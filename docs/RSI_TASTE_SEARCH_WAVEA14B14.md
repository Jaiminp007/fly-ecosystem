# RSI v14 search: replay-rate extension at fixed composition (v15 bank)

Bank `evidence/rsi-taste-v1/search-20261108-v15/protocol.json`
(bankSha `e7c88d65…`), Gen1 R=4 flags + (32,8), ≤96 worlds/procedure,
matched A/B. Rationale in `docs/RSI_TASTE_PLAN_AMENDMENT_V14.md`.

## Cells (all (32,8), S=1, g=0, K=1, γ=μ=0; only R varies)

| cell | R | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | 4 | 5.801 | 4.967 | +0.834 | 1.977 vs 1.844 True | 1.691 vs 1.702 True |
| a15-r6 | 6 | 6.067 | 4.906 | +1.161 | 1.706 vs 1.557 True | 1.318 vs 1.472 False |
| a15-r8 | 8 | 5.753 | 5.038 | +0.715 | 1.290 vs 1.201 True | 1.264 vs 1.528 False |
| b15-r7 | 7 | 4.807 | 4.906 | −0.099 | 1.140 vs 1.136 True | 1.665 vs 1.904 False |
| b15-r9 | 9 | 4.899 | 4.556 | +0.343 | 1.136 vs 0.882 True | 1.005 vs 0.926 True |

## Reading

Recorded prediction confirmed: rate-only scaling holds/degrades smoothly —
no exact-zero anywhere (all seq 4.5–5.0, all alive). Composition untouched,
so no threshold silencing. R=4 is the rate optimum on v15: R=6 beats the
baseline on score (+0.27) but surrenders B descriptively; R=8/7/9 trail.
Higher rate over-anchors A mildly (B-false in 3/4 cells) without the full
silencing of composition change — a graded version of the Gen9 mechanism,
consistent with stronger pull toward the same mixture starving B's leg.
R=9's dual-true (4.899) sits −0.90 below baseline: joint gate held, level
lost — the mirror image of R=6.

## Claimant

None. No dual-true cell beats the 5.801 baseline (R=6 is a score-only
beater with B-false; the retention-first line requires dual-true). No
48-world eval spent. A-directed search found the score-best (6.067) but
not a qualified claimant — productivity note, not a win.

Round worlds: 80 search. Cumulative 2640.
