# GEN1-DENSITY PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why density splits food from crowding (clean V1 left both open)
- Clean V1: zero-toxin fresh still dies ~27% (0.729 vs deep 0.958;
  historical clean-24 = 0.729, cited not re-run). Residual is either
  boom-bust starvation (food-limited: feast → deplete → crash) or
  another cost (crowding/interference, lifespan, escalating costs).
- 8 founders in the same world = 3× per-capita food (food grid is fixed,
  ~600 patches, founder-independent — engine line 88-91) at 1/3 the
  density. A second 8-founder arm with food scaled ×1/3 holds per-capita
  food at baseline while keeping density low. LOW−LOWM therefore isolates
  FOOD (same 8 agents, same clean codebook, same geometry/positions —
  only amounts move); LOW/LOWM−historical-24 isolates DENSITY (with the
  food reading attached). Per-agent death causes (energy vs age, inferred
  from last-seen state — rule below) corroborate: energy-deaths =
  starvation signature; age-deaths = lifespan.
- Custom reference {...VALUE_REFERENCE, founders:8} (constructor param;
  founderIds/learners/endpoint all derive generically — endpoint divides
  by founderIds.length; survival computed own way (alive/founderIds),
  not the /24 helper). Food scaling = plain field multiply
  (amount/capacity/regrowth ×1/3) after the clean re-lay, before
  placement. Clean codebook + enterCuePhase re-lay + run.codebook
  override imported from the frozen clean instrument (read-only reuse).

## Design (3 arms × 2 histories = 6 mains; food-vs-density split)
- LOW: fresh-clean, 8 founders, full food (3× per-capita). LOWM:
  fresh-clean, 8 founders, food ×1/3 (matched per-capita). DEEP:
  depleted-toxic, 24 founders, placed-verbatim reference. All:
  same naive placement (init-copy + clear + freeze + energy48 +
  re-baseline), same per-tick metering (toxin/food sums + energy bins)
  PLUS per-agent cause tables (born 0; each tick snapshot last-seen
  {energy,age} + lifespan read once at placement; on disappearance
  cause = lastAge≥lifespan ? (lastEnergy≤1 ? 'both' : 'age') : 'energy').
  Fresh arms 1792 ticks; deep 1024 deplete + 1792. Reproduction off.
- Metric: survival fraction (primary) + toxin sums (manipulation check:
  LOW/LOWM must load ~0 — swap check) + cause split (descriptive
  corroboration). Bank: fresh-21, 474361–474378 (2 histories × 9,
  18 unique), minted post-fixtures, verified clean. Triage: ONE
  throwaway LOWM run (full new machinery: 8-founder construction +
  clean swap + food scaling + cause metering, 256 ticks) on 490091–
  490099 (added to spent, disclosed) proving completion + zero toxin +
  populated cause table BEFORE bank mint. Caps: BT. Single attempt.
  Disk floor 1 GB (free ~4G; output ~1.5M).
- Verdict (pooled n=2; scored within-run; historical clean-24 = 0.729
  read descriptively cross-bank): LOW/LOWM toxin not ~0 → INVALID
  (swap failed — mechanism untested). Else GO-FOOD
  (`GEN1-DENSITY-GO-FOOD-V1`) iff LOW ≥ deep×0.9 AND LOWM < deep×0.9
  (per-capita food rescues, matched does not → boom-bust starvation
  explains the residual). Else GO-DENSITY
  (`GEN1-DENSITY-GO-DENSITY-V1`) iff LOWM ≥ deep×0.9 too (both
  low-density live regardless of food → crowding/interference, not
  food). Else NOGO (`GEN1-DENSITY-NOGO-V1`) — even 3× food at low
  density still dies (neither food nor density → lifespan/costs/other).
  No transmission/transfer/RSI/population claim.
