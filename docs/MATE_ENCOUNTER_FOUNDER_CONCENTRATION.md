# Founder-concentration analytic (post-hoc, read-only, zero new worlds; 2026-11-01)

Motivation: R62 network-threshold lens — do few high-degree founders drive gen-2
(superspreader pattern) or is gen-2 spread across founders? Read-only measurement on
frozen attempt-02/attempt-03 artifacts (`dev-results.json:founderSpread`; V1c orphan-drop
method: parentless founders excluded, so traceable n ≤ scorer gen-2).

## Data (gen-2 founder concentration)

| attempt | arm | gen-2 (scorer) | traceable | founders | top-1 | top-2 |
|---|---|---|---|---|---|---|
| 02 (V1b) | spread | 2 | 2 | 2 | 1 | 2 |
| 02 (V1b) | hub | 7 | 6 | 4 | 2 | 4 |
| 03 (V1c) | spread | 2 | 2 | 2 | 1 | 2 |
| 03 (V1c) | duo | 10 | 10 | 7 | 3 | 5 |
| 03 (V1c) | hub | 2 | 2 | 2 | 1 | 2 |

## Reading (measurement, not claim)

- NO strong superspreader signature: the largest sample (V1c duo, n=10) spans 7
  founders; top-2 = 5/10 (half) vs ~2–3/10 under uniform-among-7 — mild excess at
  un-testable n. All low-n arms are uninformative by construction.
- Directionally, gen-2 follows births (more births → more founders represented →
  more gen-2), consistent with the rolls-not-rate sketch at the FOUNDER level —
  which sits in tension with V1b/V1c's arm-level rate differences (winning arm ~3×
  per-birth rate). Both can hold if the winning arm has more births AND its births
  survive better; the founder table alone cannot separate them.
- Licensed use: calibration input for any future founder-degree model; NOT evidence
  for or against any gate. Zero worlds spent; no artifact modified.
