# DOSE-RESPONSE SYNTHESIS V1 (measurement, zero worlds)

Date: 2026-11-02. Analytic only: reads frozen V1m (attempt-14) + V1n
(attempt-01) dev-results; no rescoring, no new worlds. Cross-bank
comparison is DESCRIPTIVE (pooled-V1+V1b precedent); each line's verdict
stands on its own bank.

## The full shrinkage curve (HB-seg1, pooled)

| α | 0.05 | 0.10 | 0.15 | 0.20 | 0.25 | 0.50 | 0.75 |
|---|---|---|---|---|---|---|---|
| HB | 0.950 | 0.953 | 0.951 | 0.951 | 0.934/0.914 | 0.532 | 0.360 |
| (bank) | V1n | V1n | V1n | V1n | V1n/V1m | V1m | V1m |
| train | 0.824 (V1n) / 0.810 (V1m) | | | | | | |

BH: 0.83–0.86 all doses. Same-val: 0.92–0.95 all doses.

## Findings (descriptive)

1. **Plateau then cliff.** HB is flat at ~0.95 across 0.05–0.25
   (range 0.018), steps down 0.93→0.53 between 0.25 and 0.5
   (drop 0.40), declines further to 0.36 at 0.75. The cliff lies
   strictly inside (0.25, 0.5); its exact location is unmapped
   (no interpolation licensed — stated, not estimated).
2. **Transfer tax: SUPERSEDED (see `docs/TAX_DECOMPOSITION_V1.md`).**
   The negative-tax claim (v1: +0.11; v2 corrected: −0.01–0.04) was
   doubly metric-mixed (gap-vs-correctness AND best-component-vs-
   aggregate). Same-metric pooled correctness: train 0.9156 vs lossy
   0.905–0.911 → tax +0.005–0.011 (essentially zero, slightly
   positive). Transfer is near-lossless (~99%), not super-training;
   no negative tax. The dose curve (all-HB) is unaffected (one metric
   throughout). Train level 0.915 ± 0.001 replicated across three banks.
3. **Manipulation purity at every dose.** BH (acquire avoidance) and
   same-val (retain) are invariant 0.05–0.75. Even failed doses
   (0.5/0.75) damage nothing — they attenuate the lift, never the
   substrate. No overdose signature anywhere (BH never dips).
4. **Cross-bank replication tight.** α=0.25: 0.934 vs 0.914
   (Δ=0.02); train: 0.824 vs 0.810 (Δ=0.014). Bank variance ≈0.02 —
   the plateau (width 0.018) is at the variance floor (argmax 0.1 is
   descriptive noise; the finding is the plateau, not the peak).

## Standing

Dose-response complete (0.05→0.75). The unlearning intervention is
saturating (any α in (0, 0.25] suffices), pure (HB-only), and
supra-training (negative tax). Nothing here reopens triggers
(within-body lossy class, adjudicated). No RSI implication beyond
the closed lines. No further dose work licensed without new rationale.
