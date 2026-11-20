# GEN1-DENSITY V1 verdict (2026-11-04) — GO-FOOD (boom-bust starvation)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output ~1M). Frozen plan `docs/GEN1_DENSITY_PLAN_V1.md`. New
instrument (8-founder reference + matched ×1/3 food scaling +
per-agent cause tables + exact aggregate death ledgers). Fixtures 7/7
green pre-run (zero worlds; two laziness repairs — double-wrapped
helper + food-bookkeeping conservation fix, disclosed below — zero
mechanism impact); triage on throwaway 490091–490099 (8-founder build
+ clean swap + exact ×0.333 scaling + zero toxin + populated cause
table + finite lifespans). Bank 474361–474378 minted post-triage,
verified clean. Single attempt with one fix-forward resume (R9 pattern),
as measured. No rescoring.

## Run incident (disclosed, R9-precedented)
First launch completed 474361-low then crashed on lowm: food scaling
changed patch amounts without re-baselining the world energy books →
conservation assert. Fix: `scaleFood` now re-baselines `initialEnergy`
by the food delta (same disclosed pattern as placement); fixture
extended (fake energy books assert the re-baseline; passing). Resume
kept the valid 474361-low row (low never calls scaleFood — code path
byte-identical pre/post fix) and ran the remaining 5 (`redone` 5/6 in
dev-results.json; executionSources ≠ scoringSources — dual provenance
as in R9). No seed re-run; no bank abandoned.

## Results (pairs 474361, 474370; frozen naive, 48 energy; repro off)
Manipulation PASSES: low/lowm toxin exactly 0.00 both pairs (swap
verified); deep loads 12.39 (metering live). Survival: low 1.000
(8/8 both) vs lowm 0.750 (6/8 both) vs deep 0.958 (23/24 both).
Bar: low 1.0 ≥ 0.862 ✓ and lowm 0.75 < 0.862 ✓ → **GO-FOOD**
(`GEN1-DENSITY-GO-FOOD-V1`). Causes: every death in all 6 mains is
energy (lowm 2+2, deep 1+1, low 0) — exact aggregate ledgers and
per-agent inference agree perfectly (inference validated as exact);
zero age-deaths anywhere (lifespan never binds at these horizons).

## Reading (residual = food, not crowding, not lifespan)
- Per-capita food fully rescues (1.00); matched-food low-density dies
  exactly like historical 24-clean (0.75 vs 0.73, same energy-deaths).
  Density per se does nothing; food does everything. The ~27% residual
  in toxin-free fresh is boom-bust starvation (feast → deplete → crash),
  food-limited and energy-mediated. Crowding/interference ruled out
  (lowm has 1/3 the mouths yet identical deaths); lifespan ruled out
  (zero age-deaths; DT-scaled ages never near caps).
- Full decomposition of fresh death (three lines, consistent): toxin
  drain ~73% (clean V1 lift 0→0.73) + boom-bust starvation ~27%
  (this line 0.73→1.00) + ~0% lifespan. Depleted worlds survive
  because depletion pre-empts both (little poison left, steady-state
  low intake). No transmission/transfer/RSI/population claim.
- Line closed as scored. The next licensed question (not opened here)
  would be dynamics-side (pacing/oscillation), not content-side.

## Preservation
`evidence/gen1-density-dev/fresh-21/` (bank, now spent) +
`evidence/gen1-density-dev/attempt-01/` (untracked raw evidence, ~1M;
per-agent toxin/food + cause tables + exact death ledgers + dual-
provenance sources).
