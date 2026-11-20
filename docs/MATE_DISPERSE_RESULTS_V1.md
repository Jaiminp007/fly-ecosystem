# MATE-DISPERSE RESULTS V1 — dispersal destroys compounding (NOGO, line CLOSED)

Date: 2026-11-02. Plan: `docs/MATE_DISPERSE_PLAN_V1.md` (FROZEN, design only).
Implement: `0a64014` (natal dispersal d=0.5, dedicated per-mating RNG,
per-row dispersal field + 12/12 fixtures + fresh-01 bank 442001–442054).
Attempt-01 (single, authorized): 18 mains / 0 probes / 32256 worldTicks /
774144 founderSlots / 3.52e9 ops. Ledger exact, `redone: []`, G1+G2 true.

## Verdict: MATE-DISPERSE-NOGO-V1

Dispersal does not rescue the sink — it deepens it: hubDisperse gen-2 = 1
vs hub gen-2 = 8. The deficit is patch-intrinsic, not placement-fixable;
dispersal scatters to starve (and worse: to lonelihood). Line CLOSED
(no MD2 without new rationale).

## Per-arm totals (6 histories each)

- hubDisperse (hub + d=0.5): births 34, gen-1 33, gen-2 1
  per-seed gen-2 [1,0,0,0,0,0] (seeds 442001…442046).
- hub (hub + d=0): births 36, gen-1 32, gen-2 8
  per-seed gen-2 [2,1,0,1,2,2].
- spread (d=0, descriptive): births 28, gen-1 26, gen-2 2
  per-seed gen-2 [0,0,1,0,0,1].

## Mechanism read (descriptive, non-gating)

- Births and gen-1 are IDENTICAL across arms (34–36 / 32–33) — dispersal
  does not touch mating at all (unsurprising: founders start together;
  scattering applies to newborns). The cliff is exactly at gen-2: 1 vs 8.
- Mechanism: scattered gen-1 cannot form the local encounter network that
  compounding requires (decoupled mating is proximity-gated — the V1b
  structural finding). Philopatry is not crowding stupidity; it is the
  network topology compounding runs on. Dispersal dissolves the very
  encounters the encounter-arc spent 5 lines trying to create.
- firstMatingTick IDENTICAL per-seed hubDisperse vs hub (9th bank running
  with unshifted timing — the program's most replicated null).
- Endpoint energies: dispersed −30…−47 vs hub −32…−43 (no rescue, slight
  spread of outcomes) — geometry changes where starvation happens, not
  whether it happens. The sink is patch-intrinsic (food geography), as the
  plan's fail clause specified.
- Asymmetry note: the harm is directional and large (−7 gen-2). Combined
  with ML1's GO (+3 over hub via spacing WITHIN the hub), the pair draws
  the boundary precisely: move WITHIN the patch (spacing) helps or is
  neutral; move OUT of the patch (dispersal) destroys. The operative
  variable is network connectivity, not density.

## Arc position

Mating arc: 13 interventions; the dispersal result reframes the whole
arc — every prior null (sensing through transmission) was measured on
philopatric populations, and now we know why philopatry persists: it is
load-bearing for compounding. Licensed frontiers unchanged
(sex-conditioned leaving, detection-sharing, differentiation-first,
fear ecology, load-then-recombine — all need fresh rationale + frozen
plans). The named V-next (cost-bearing dispersal) is NOT licensed by
this result (geometry alone already harms; adding cost cannot rescue).
No RSI claim. Cumulative program spend: 7959 (+18 ledgered).
