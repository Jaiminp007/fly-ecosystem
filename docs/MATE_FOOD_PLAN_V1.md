# MATE-FOOD Plan V1 — nutrient enrichment for gen-2 feasibility (DESIGN ONLY)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question

MATE-INHERIT V1: maternal transmission works (16/16 copied) but changes
nothing (gap 0) — and produced ZERO gen-2 births in 12 mains despite 32
gen-1 births. The V1 verdict ranks the blocker: any heritability line
needs newborns surviving to mate FIRST (without gen-2+ events there is
nothing for heritability to compound); a mutation-carrying V1b is
UNLICENSED until then. This line is the feasibility gate: can gen-2
births occur at all?

Adjudicated read-only (zero new worlds) from frozen V1 rows + engine code:

- Maturity is LOW (genome trait 18–28 ticks) — newborns are eligible
  almost immediately. Not the wall.
- Cooldown is 12 ticks with encounters at ~0.05–0.15/main — refractory is
  non-binding at observed encounter rates. Not the wall (adjudicated
  away, not tuned around).
- Mortality is HEAVY (phaseRows 27→7 survivors): most newborns die young,
  almost certainly energetic (spawn 65.0, bar 50, mating costs 24 each,
  food is fixed-share). Energy is the testable wall.
- Encounters remain the alternative wall (radius 26 in a 1000×640 arena).
  Arena resize was considered and REJECTED: dimensions are hardcoded +
  validated in ≥4 engine sites (geometry, food grid, obstacles, lineage
  checks) — too invasive for a feasibility line. Density increase was
  already tried (MATE-DENSE backfires via fixed-food crowding).
- The clean single knob is `nutrient` (food regrowth/amount, validated
  range 0–5, base 3): richer ecology → longer lives → more lifetime
  mating lotteries, without touching agent count, space, behavior, or
  the energy bar. Boundary-test rationale (pre-registered, not tuning):
  use the MAXIMUM lawful enrichment (5) — if the ceiling doesn't work,
  the room is wrong (energy ruled out as sufficient, encounters remain).

## Design

2 arms × 6 histories = **12 mains** (V1 structure), fresh bank fresh-10,
BT_TICKS=1792, all else V1-identical (bar50, decoupled actuation,
maternal transmission BOTH arms — best-case constant; transmission mode
was V1's question, done. Control arm = V1 replication on a fresh bank).

- **control** (`nutrient:3` = base): expected V1-like outcome (gen-1
  births, 0 gen-2).
- **enriched** (`nutrient:5`): the feasibility test.

Instrument: `scripts/mate-food-dev.mjs` (from `mate-inherit-dev.mjs` +
two frozen additions): (1) `nutrient` optional param through
`TasteExperiment` → `World` config (null-default 3 = current behavior,
bit-identical when unset; M-ACT/MATE-ENERGY precedent for null-default
knobs); (2) generation summary per row from `world.lineage`
(`maxGeneration`, `birthsByGeneration`, `gen2Count` — small aggregates,
never raw lineage arrays) since V1 rows record only birth counts.
`reproduction:true` both arms.

## Gates (feasibility, not promotion)

- G1 integrity: 12/12 mains complete; ledger exact; `redone: []`.
- G2 audit: per-row arm/options match (nutrient per arm, decoupled true,
  bar 50, maternal both arms), births integer ≥ 0; lineage-verified
  gen-2 counts (parent IDs + generation fields, not just counts).
- G3 outcome: **GO iff enriched-arm gen-2 births ≥ 1** (existence claim;
  a single verified gen-2 event suffices — no rate claim is made).
  **INCOMPLETE iff enriched gen-1 births = 0** (broken run — nothing to
  compound; fail-closed, not NOGO). Else (gen-1 > 0 both arms, gen-2 = 0
  both) **NOGO** with the pre-registered NOGO-reading (descriptive):
  compare arms on survivors-at-end + mean energy (already-collected
  curves/phaseRows): enriched ≥ control on both AND gen-2 = 0 →
  energy ruled OUT as sufficient, encounters remain prime suspect
  (next line targets encounters); enriched ≈ control on survival →
  enrichment didn't work ecologically (dose/route wrong, rethink).
- Verdict strings: MATE-FOOD-GO / MATE-FOOD-NOGO (+INCOMPLETE-UNTRAINED/
  INVALID fail-closed). No RSI claim (feasibility only; explicitly NOT
  promotion-worthy; a GO unlocks V1b-mutation, it is not itself an
  advance claim).

## Bank (fresh, build AFTER fixtures pass)

`evidence/mate-food-dev/fresh-01/`: 6 histories × 9 = 54 seeds
415001–415054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 414001–414054 + all fixture seeds). Caps: ≤300 exec (12 used),
≤20e9 ops, ≤3600s wall, ≤100MB (V1 ledgered 2.05e9 for the same shape;
enrichment may raise survivor compute — billed fairly, wide margin).
Single authorized attempt; crash-resume with dual provenance only.
Fixtures: bank-after-fixtures + generation-summarizer units (synthetic
lineage) + scorer branches (GO/NOGO/INCOMPLETE/INVALID incl. void-proof
generation counting) + nutrient plumbing test (base default 3,
enriched 5, no other diff) + V1-parity check (control arm config ==
V1 maternal arm). No RSI claim.
