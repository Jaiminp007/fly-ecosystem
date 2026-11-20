# MATE-FOOD Results V1 — GO: gen-2 exists under enrichment (single authorized attempt)

Date: 2026-10-26. Plan: `docs/MATE_FOOD_PLAN_V1.md` + `docs/MATE_FOOD_PLAN_V1A.md`
(control = null/phase-table, enriched = forced constant 5.0).
Bank: `evidence/mate-food-dev/fresh-01/` (fresh, 6 histories).
Evidence: `evidence/mate-food-dev/attempt-01/`.

## Verdict: MATE-FOOD-GO (existence demonstrated, lineage-verified)

- **G1 integrity ✓** — 12/12 mains complete; ledger exact (12/0/21504/
  516096/2.18e9); `redone: []` (single clean run, no crash, no resume).
- **G2 audit ✓** — all rows maternal, decoupled, bar 50, nutrient per arm
  (control null / enriched 5.0), births integer ≥ 0, generations valid.
- **G3 outcome GO** — enriched gen-2 = **1** ≥ 1: seed 415019-enriched,
  6 gen-1 + 1 gen-2 births, maxGeneration 2.

Control arm: 12 gen-1, **0 gen-2** — replicates V1's zero on a fresh bank
(V1: 0 gen-2 in 32 births; here 0 in 12). The null is stable, not a fluke
of one bank.

## The ecological mechanism worked (descriptive, supports the reading)

| arm | total births | gen-1 | gen-2 | avg survivors | avg energy/founder |
|---|---|---|---|---|---|
| control (null) | 12 | 12 | 0 | 10.3 | −60.4 |
| enriched (5.0) | 27 | 26 | 1 | 22.8 | −30.4 |

Enrichment more than doubled births AND survivors and halved the energy
deficit. The causal chain reads cleanly: more food → longer lives → more
mating opportunities → the first gen-2 birth in program history. Energy,
not encounters-alone, was the binding constraint on gen-1 survival to
mating age (maturity is only 18–28 ticks; the enriched lived long enough).

Gen-2 verification (pre-registered lineage standard): the engine assigns
`generation = max(parent generations)+1` with recorded parent IDs; the
scorer counts only lineage entries with integer generation ≥ 2 AND
non-empty parents arrays. Row 415019-enriched carries exactly that
({1:6, 2:1}). A gen-1 fly demonstrably reproduced.

## Reading (unlock, not promotion)

Feasibility is demonstrated: gen-2 births EXIST under max-lawful
enrichment. This does NOT promote any claim beyond existence — a single
event is not a rate, a lineage, or a selection result. What it does, per
the frozen plan, is UNLOCK the V1b the V1 verdict demanded a rationale
for: with gen-2 now observed, maternally transmitted variation (mutation)
has something to compound on. The licensed next step is a mutation +
lineage-tracking line under its own frozen plan — new rationale supplied
here by the energy result plus the standing MLS/ratchet literature
(Rounds 15, 18: recombination/variation is load-bearing in small
populations). No RSI claim.
