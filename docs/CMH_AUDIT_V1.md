# CMH AUDIT V1: hub conversion advantage is real and homogeneous (OR 3.1, banks agree)

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Extends JURY_AUDIT_V1 (same vote standard): 10 bank strata × (hub vs spread)
× (convert vs not), per-history binary conversion.
Script: `scripts/cmh-audit.py` (MH pooled OR + RBG CI, CMH association,
Breslow-Day homogeneity via bisection-fitted expectations).

## Findings

- **Pooled OR_MH = 3.13, 95% CI [1.45, 6.77].** Hub founders convert at
  ~3× the odds of spread founders, conditional on bank. CI excludes 1.
- **CMH χ²(1) = 7.46 (p ≈ 0.006).** Association survives stratification —
  not a bank artifact.
- **Breslow-Day χ²(9) = 6.18 (p ≈ 0.72): NO heterogeneity.** Banks agree
  on the hub effect (per-stratum ORs 1.0–10 + one inf from 6/6 vs 3/6 all
  fall within sampling noise of the common OR). The three ties
  (encounter-01/03, recombine-01) are small-n noise, not dissent.
- Scope honesty: arms are ASSIGNED not randomized (topology knob) —
  descriptive stratification, not a causal estimate. Votes are binary
  conversion (event counts, not rates). Proximity excluded (multi-arm,
  no canonical pair); encounter-03 duo excluded (three-arm question).

## Verdict (measurement — no GO/NOGO)

- **LICENSED:** the hub conversion advantage as a bank-robust regularity
  (OR≈3, homogeneous) — the encounter-topology thesis in its strongest
  formal dress. Null-hygiene intact: no rescoring, no new claims about
  WHY (encounters vs energy remain entangled — see GAS/SKEW).
- **NOT LICENSED:** causal reading (assignment ≠ randomization);
  per-bank ORs as standalone estimates (n=6 histories each — the pooled
  number is the estimate, the rest is display).
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
