# MATE-ENCOUNTER Plan V1 — clumped resource hub vs spread controls (FROZEN, design only)

Date frozen: 2026-10-26. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Objective

Test whether spatial concentration lifts mating compounding: a single
resource hub (all regrowth in one region) vs the status-quo 3-center
spread. If encounters are the binding constraint (per MATE-SOCIAL
NOGO: gen-2 in 1/6 histories regardless of transmission), then
concentrating foragers should raise births and, downstream, gen-2.
Mechanism chain, each link gated: hub → concentration (assumed via
regrowth gradient) → births (G-manipulation) → gen-2 (G-lift).

## Knob (single, null-default)

`resourceTopology`: 'spread' (status quo: 3 static centers
{180,180}/{800,450}/{470,500}, no relocation in this ecology) vs
'hub' (single static center {500,320}, map middle, clear of
obstacles). Implementation (implement turn): replace the two
hardcoded center lists (food-init abundance + resourceCenters) with a
parameterized list; null-default absent = current 3-center behavior,
bit-identical (existing runs unaffected; verified by fixture).
Spawns stay uniform random (isolates the food-concentration effect;
agents must travel to the hub — travel IS part of the mechanism).
No abundance rescaling (fixed-abundance conservative test: if births
rise despite less total food, the concentration evidence is strong;
starvation risk disclosed, checked via mean-energy descriptives —
if hub starves AND births fall, the NOGO reads as concentration-cost,
not no-effect, and motivates a scaled follow-up).

## Arms, bank, caps

- Arms (2): spread (control = status-quo ecology, enriched) vs hub
  (treatment), both nutrientOverride 5.0 + bar 50 + matingActionRequired
  false (decoupled, V1f/V1b-identical) + maternal transmission
  (verticalTransmission 'maternal', transmissionNoise null —
  transmission HELD EXACT, the only thing that varies is topology).
  6 histories × 2 arms = 12 mains, BT_TICKS=1792.
- Bank `evidence/mate-encounter-dev/fresh-01/`: 6 histories
  427001–427054 (mating 9-seed structure; drawn .seed
  {001,010,019,028,037,046}). 427xxx verified pristine 2026-10-26
  (zero exact-seed/registry/test hits). Builder re-verifies at build;
  post-build refusal guard.
- Caps (V1-family): 12 mains / 0 probes / 21504 worldTicks /
  516096 founderSlots / 2.5e9 scalarOperations.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (12/12 complete, exact ledger, `redone: []`).
- G2 config audit: both arms decoupled, bar 50, nutrient 5.0,
  maternal/null-transmission, topology flag correct per arm;
  analogy to V1b's G2 (adapted: verify resourceCenters actually
  differ — hub run must show single center). Else INVALID.
- G-manipulation (fail → INVALID, not NOGO): hub total births >
  spread total births by ≥10% relative AND ≥5 absolute. If the knob
  doesn't move births, compounding can't be tested — instrument/
  ecology failure, not a mechanism result. (Brake-lesson applied:
  engagement gated separately from effect.)
- G-lift (the verdict): hub gen-2 ≥ 2 AND hub gen-2 > spread
  gen-2 (V1b bar, frozen) → **MATE-ENCOUNTER-GO** (concentration
  compounds; licenses carry-over-worlds + attraction-mechanism
  follow-ups, specified not executed). Else **MATE-ENCOUNTER-NOGO**.
- INCOMPLETE-NOBIRTHS if hub gen-1 == 0 (void; mirrors V1b/V1-social).
  INCOMPLETE if mains don't finish. INVALID on any gate failure.
- Descriptive: per-arm births, gen-1 lifespans (censored),
  founder spread (V1c method), mean energy (starvation check),
  births-per-history (is the gen-2 history an outlier again?).

The line closes with its verdict either way. No V2 without a new
rationale (e.g., scaled-abundance hub if this starves; attraction
knob if topology alone fails with births flat). Single authorized
attempt, cumulative +12. No RSI claim.
