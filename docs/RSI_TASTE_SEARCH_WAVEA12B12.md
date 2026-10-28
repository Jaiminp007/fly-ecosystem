# RSI v12 search: endogenous phase-indexed taste slots (v13 bank)

Bank `evidence/rsi-taste-v1/search-20261106-v13/protocol.json`
(bankSha `61d1833f…`), Gen1 R=4 base, ≤96 worlds/procedure, matched A/B.

## Baseline (final build, S=1, bit-identical to pre-round build)

`gen1-search4b`: score **7.839** (seq 6.194, vsR +1.644, A 1.598 vs 1.557
True, B 1.59 vs 1.238 True) — dual-true. Exact same score as the pre-round
`gen1-search4`, confirming the `tasteUpdate` else-wrap preserved S=1
behavior bit-identically across the V12 refactor.

## Methods bugs found and fixed (preserved, not banked)

1. **Cue-key flatline** (`a13-rho001/005`, score 0.05): local contact-cue
   statistics carry no phase information — records split 17/15 with
   IDENTICAL centroids. Clean negative about the cue signal.
2. **Write-path bug**: `tasteUpdate` predicted from the routed slot but
   wrote to `weights.taste` — slot norms stayed exactly 0.0 over 236
   acquisitions while behavior flatlined. Fixed; regression test pins
   live→active-slot and replay→tagged-slot writes. The richness-key reruns
   (`a13r/b13r`, score −0.10) are records of this bug, not the key.
3. **Richness-key collapse** (`a13s/b13s`, scores 3.35–4.01): signed intake
   mixes beneficial (+) and harmful (−) encounters to ~0 mean in EVERY
   phase — slow EMA converges to the same point regardless of nutrient
   density. Centroids identical ([−0.007,−0.007]) again.
4. Void run (`gen1-search4b` first attempt): empty `--slot-rate` → NaN;
   rerun clean. 16 worlds of harness waste, reported.

## Gap-key cells (inter-arrival time; all S=2, R=4 base)

| cell | ρ | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| a13g-rho001 | 0.01 | 2.116 | 2.752 | −0.636 | 0.959 vs 1.423 False | 1.353 vs 1.334 True |
| a13g-rho005 | 0.05 | 3.618 | 2.615 | +1.003 | 1.493 vs 1.334 True | 1.262 vs 0.801 True |
| b13g-rho0005 | 0.005 | 2.986 | 2.984 | +0.001 | 1.087 vs 1.006 True | 1.133 vs 1.063 True |
| b13g-rho02 | 0.2 | 4.121 | 2.949 | +1.173 | 0.957 vs 0.663 True | 0.951 vs 0.69 True |

Gap centroids also identical ([5.04,5.01], [8.27,8.26]) — routing is
~50/50 noise on all three keys. With random routing each slot sees half
the data; slots surrender ~3–4 lifetime vs the dual-true baseline while
holding retention. B-random best (4.121) beats A-greedy best (3.618):
no productivity win for directed search this round.

## Claimant

No cell beats the Gen1 baseline (7.839) — no baseline-claimant, no 48-world
eval on that path. But 3/4 gap cells are descriptively dual-true, and per
the retention-first precedent (`docs/RSI_TASTE_GEN4_LINE.md`) the best
dual-true cell (`b13g-rho02`, ρ=0.2, 4.121) was fresh-evaluated
independently of score-best → `docs/RSI_TASTE_GEN8_EVAL.md` (REJECT).

Round worlds: search 240 (incl. 64 methods-bug + 16 void waste, reported),
eval 48, control 24 → 312. Cumulative 2408.
