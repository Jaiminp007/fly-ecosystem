# GEN1-COHORT PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why cohorts (horizon-matched by construction; toxin-proof)
- Gen1-life confounded duration with depth (1792 vs 512 runs — lifespan
  scales with observed time). Fix: ONE run per history (1792 ticks),
  compare Gen1 birth COHORTS within it — early-born (fresh world) vs
  late-born (depleted world). Same run, same duration, same founders;
  only birth-timing (hence world-state at birth) differs. Horizon cannot
  confound (single clock); birth-timing IS the treatment (world depth at
  birth). Censoring-proof by construction (see metric).
- Metric: 200-tick survival (binary — toxin-proof, nothing to cancel).
  Early window: born ≤400 (shallow depletion). Late window: born in
  [1200,1592] (deep depletion AND ≥200 ticks observable before run end at
  1792 — everyone included has a complete 200-tick observation, so no
  censoring: died-before-200 = failure, alive-at-200 = success, both
  observed). No collector, no emit, no food sums — lineage only
  (born/died/generation). Smallest instrument yet (2 mains + pure
  analysis).
- Pre-registered confounds (disclosed, not controlled): parental age
  (late parents older), density (founders die off → late thinner),
  cohort sizes (mating schedule unknown — guard below). Direction
  reported; causes not attributed beyond world-depth-at-birth.

## Design (2 mains, no probes, no arms — observational cohorts)
- Run: founders learn (candidate), reproduction on, 'none' (naive Gen1,
  NO weight copy anywhere), bar 30, legacy, decoupled, 1792 ticks.
  2 histories (thin n=2) = 2 mains, 0 probes.
- Per history: early Gen1s (born≤400) vs late Gen1s (1200≤born≤1592);
  200-tick survival fraction each. Pooled over histories.
- Bank: fresh-16, 474271–474288 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. No triage (justified: standard
  reproduction run (gen1-world proved births at bar 30) + pure lineage
  analysis; zero new engine interactions; fixtures cover scorer).
  Caps: BT. Single attempt. Disk floor 1 GB (free ~2G; output <1M —
  rows carry only cohort tables; stop if <1G).
- Verdict (pooled): either cohort-window empty (0 Gen1s pooled) →
  INCOMPLETE-NOBIRTHS (void, inherit precedent — cannot compare).
  Else GO (`GEN1-COHORT-GO-V1`) iff max/min 200-tick survival > 1.1
  (either direction — world-at-birth matters); else NOGO
  (`GEN1-COHORT-NOGO-V1`). Offspring survival only; no transmission/
  transfer/RSI/population claim.
