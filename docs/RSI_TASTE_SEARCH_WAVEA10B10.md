# RSI search wave A10/B10: surprise gain engages but washes out

Gen1 base R=4/g=0 on v10 bank `f888f4a4…`: 6.396, dual-true.
Gain cells (all R=4, all dual-true, none beats base):

- A: g=2 → 6.275 (seq 5.444 vsR 0.831); g=4 → 6.275 (full precision
  6.2748786090 vs 6.2748786152 — differ at 1e-8, not bit-identical).
- B (random {1,3}): g=1 → 6.287; g=3 → 6.275.
- All four sit ~0.11–0.12 below g=0: the EMA/threshold ops are billed on
  every live step, pure measurement overhead when boosts don't move means.

Diagnostics (new unbilled `work.surpriseBoosts`, anchor-restored): history-1
g=2 run fired 192 boosts / 3018 live updates (≈6.4%, ~8 per founder) — the
gate ENGAGES on real phase boundaries. But ×3 vs ×5 on ~8 single steps per
1792-tick run moves the score 1e-8: subsequent unboosted learning overwrites
the boosted steps. Single-step elevation is real but negligible.

No claimant → no 48-world eval spent. Family closed; next class must give
surprise a TIMESCALE (sustained elevation window, not one step).

Evidence: `evidence/rsi-taste-v1/search-20261103-v10/`
(`gen1-search4`, `a10-g2`, `a10-g4`, `b10-g1`, `b10-g3`).
Round 80 worlds (16+32+32); cumulative **1872 worlds**.
