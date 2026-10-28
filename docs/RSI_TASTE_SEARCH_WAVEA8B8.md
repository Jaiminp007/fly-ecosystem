# RSI search wave A8/B8 (competitive streams, v8 bank)

Bank `search-20261102-v8` (`ac036b10…`). Gen0 K=1: 4.861 (seq 4.895, vsR
−0.034, A-true/B-false — B-leg false again, the recurring weak leg).

## Results (16 worlds/cell, matched)

| cell | h | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| a8 h=0 | 0 | 4.759 | 4.883 | −0.125 | true | false |
| a8 h=0.1 | 0.1 | 4.759 | 4.883 | −0.125 | true | false |
| b8 h=0.02 | 0.02 | 4.759 | 4.883 | −0.125 | true | false |
| b8 h=0.5 | 0.5 | 4.759 | 4.883 | −0.125 | true | false |

All four K=2 cells **bit-identical**: zero controller switches on any of the
4 histories, so hysteresis was never consulted. The −0.10 lifetime gap vs
Gen0 is pure EMA-measurement overhead. No claimant, no productivity
difference, no fresh eval spent.

## Why (verified live, then reasoned)

A unit probe confirmed the machinery works: after 320 steps stream EMAs read
0.0036 (trained controller) vs 0.062 (naive idle) — correct tracking, correct
argmin, no switch. The naive idle stream only wins control when the trained
stream errs **worse than chance** — i.e., only on catastrophic negative
transfer. The actual failure mode is mild interference (B-retention 95%,
small errors): the trained stream stays better than naive throughout B/C, so
it keeps control, keeps overwriting A, and the gate keeps failing by a hair.
Competitive gating against a naive challenger is threshold-mismatched to the
disease. Next idea class (new amendment): surprise-triggered archival — the
idle stream stores the pre-surprise weights (an endogenous A-archive) instead
of starting naive, so return-A has a strong challenger. All prior failures
stand; streams-v1 family closed.

Evidence: `evidence/rsi-taste-v1/search-20261102-v8/{gen0-search4,a8-*,b8-*}/`.
Cumulative RSI: prior 1584 + 16 + 32 + 32 = **1664 worlds**. Successive
accepts 0/2. Revisions SUSPENDED; Gen0-memory unrevised.
