# TAX DECOMPOSITION V1 (measurement, zero worlds)

Date: 2026-11-02. Analytic only: reads frozen V1n (attempt-01, 21 rows)
+ TRS (attempt-01, 18 rows) + T1 (attempt-01) dev-results/rows; no
rescoring, no new worlds. Same-metric pooled contact-weighted correctness
(T1 `correctnessOf`; tied cues skipped; unlearned sanity 0.5005 = chance).

## Same-metric levels (pooled correctness)

| | train | transfer/restart |
|---|---|---|
| T1 baseline (452xxx) | 0.9138 | — |
| V1n train vs lossy (453xxx) | 0.9156 | 0.9047–0.9108 (α 0.25–0.05) |
| TRS short/long/restart (455xxx) | 0.9142/0.9142 | 0.9280 (restart) |

## Findings (descriptive)

1. **Train level is 0.915 ± 0.001 across three banks.** The most
   replicated number in the program (T1/V1n/TRS-short/long all agree).
   Structural ceiling confirmed (time +0.0000).
2. **Transfer tax is +0.005–0.011 (essentially zero), NOT negative.**
   V1n lossy-pooled (0.905–0.911) sits just below V1n train-pooled
   (0.9156). Transfer preserves ~99% of train performance overall.
3. **The "negative tax" was doubly metric-mixed.** (a) Gap-vs-correctness:
   train pool-GAP (h−b ≈ 0.82) vs transfer HB correctness (≈0.95);
   in correctness units train is ≈0.91. (b) Component-vs-aggregate:
   HB is the BEST component (extinction 0.95); pooled averages HB +
   BH (0.85) + same (0.93) → 0.91. Comparing the best component to
   the aggregate manufactures a surplus. Same-metric: tiny positive tax.
4. **Dose curve unaffected.** All-HB relative comparisons (plateau +
   cliff) use one metric throughout — valid. Only the LEVEL claim
   (transfer exceeds train) was artifactual.
5. **TRS-restart (0.928) exceeds V1n-lossy-pooled (0.905–0.911), but
   cross-bank (455xxx vs 453xxx, variance ~0.02) — not a finding,
   noted.** Within-bank restart-vs-long (+0.014) is the licensed
   comparison (NOGO).

## Standing

Supersedes the synthesis correction (finding 2 v2 is final): no negative
tax; transfer is near-lossless (~99%), not super-training. The program's
transfer story is preservation (tax ≈ 0.2–0.3 in gap units on the wound
components, ≈ 0.01 pooled), fixed component-wise by lossy shrinkage
(HB 0.95). No RSI implication; no further analysis licensed without
new rationale.
