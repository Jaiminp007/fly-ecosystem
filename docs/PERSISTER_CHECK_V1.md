# PERSISTER CHECK V1: longevity does not predict conversion — no senescent-persister pattern at arm level

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Executes the R122-specified decidable portion (frozen ages) on 347 rows.
Script: `scripts/persister-check.py`.

## Question

q-bio/0610026v1 (senescence explains microbial persistence) predicts an
age signature: the dormant/surviving fraction should be AGE-structured.
Our MORTALITY round left "long-lived-childless arms" undescribed. Are
long-lived non-converting cohorts senescent persisters (age → dormancy),
or just reserves that never got the chance?

## Method (frozen)

Per row with gen-1 present (347/396; 48 older-schema rows lack the
summary, 1 row has n=0 — MLR1 441028-spread, zero gen-1, excluded with
cause): gen1Lifespan {mean, n, censored} vs conversion (gen-2 count).
Censoring note: median censored fraction 0.86 — reported means are LOWER
bounds (most gen-1 were alive at run end).

## Findings

1. **Longevity does not separate converters from non-converters.**
   Median gen-1 mean lifespan: 1217 (gen2≥1) vs 1217 (gen2≥2) vs 1253
   (gen2=0) — identical within noise; censored fractions 0.86/1.00/0.88.
   Age carries no information about reproductive fate at arm level.
2. **What separates them is COUNT, not age.** Median gen-1 n: 5–6
   (converting) vs 4 (zero-conversion); median births 7–8 vs 4.
   Conversion is a numbers game (more gen-1 → more chances), consistent
   with the encounter-bottleneck + skew-at-floor picture.
3. **Long-lived non-converters are everywhere and nowhere.** 48 rows
   above q75 lifespan (1332.6) with gen2=0, scattered across every bank
   and arm (max 5 in one arm: leave-spread); 39 long-lived rows DO
   convert. Long-lived conversion rate ≈ 45% ≈ base rate (48%) — no
   enrichment, no depletion, no arm signature.
4. **Senescence signature ABSENT.** The q-bio/0610026v1 prediction
   (age-structure dependence of the dormant fraction) fails at the only
   level our data can test: cohort age does not predict dormancy-like
   outcome (alive-but-childless). The 1310.8592v1 port SURVIVES this
   check (fates diverge among same-longevity cohorts — fluctuation-driven
   heterogeneity needs no age structure).

## Verdict (measurement, not intervention — no GO/NOGO)

- **NOT SUPPORTED:** senescent-persister reading of long-lived-childless
  cohorts. They are reserves that lost the numbers game, not an
  age-structured dormant caste.
- **LICENSED:** the numbers-game account of conversion (gen-1 count +
  births predict gen-2; lifespan does not) — third line of evidence that
  the mating system's binding constraint is event count.
- **BLOCKED (individual level):** whether THE long-lived individuals are
  the childless ones needs per-founder age×offspring linkage — the same
  lineage-logging gap the MORTALITY round specified (compact per-founder
  table: birth tick, death tick, cause, offspring count, sex/role).
  One-line schema addition for any future mating line; no behavior change.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
