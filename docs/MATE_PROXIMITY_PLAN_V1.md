# MATE-PROXIMITY Plan V1 — mating-range dose on hub (FROZEN, design only)

Date frozen: 2026-11-01. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses PROXIMITY as a new line)

ATTRACT-V1b's structural finding: decoupled mating is proximity-gated
(engine.mjs:175-178 — mate-action bypassed; sensing acts only via locomotion) and
mating outcomes are range-invariant across [0.5, 2]× sensing. The V1/V1b sensing
sweep therefore patched a bypassed channel three times (R65 illusion cross-link).
The remaining causal level is the gate itself: the 26-unit execution radius
(engine.mjs:179, single site). If compounding tracks proximity BREADTH, the hub
advantage is encounter-rate after all (at the right level); if flat, hub compounding
is not proximity-breadth either (food/energy or history-composition story).
Sensing HELD at 1× throughout to isolate breadth. Hub (not spread) for power:
proximity encounters are densest there; spread floor risk would void the dose.

## Knob (single, null-default)

`matingRangeMultiplier`: multiplies ONLY the 26-unit `candidates.nearby` execution
radius (sensing radii, display channels, cooldown/energy gates untouched). Undefined/1
= legacy call bit-identical (fixture: 1× ≡ no-flag on actions + ops). Validation:
finite > 0. Experiment uses exactly {0.5, 1, 2} → 13/26/52 units. TasteExperiment
passthrough `matingRangeMultiplier=null` default, forwarded only when non-null
(resourceTopology pattern). Fixture-level engagement proof (scripted two-fly):
mates at 20u under 1× but not 0.5×; mates at 40u under 2× but not 1×.

## Arms, bank, caps

- Arms (3): hub/narrow (0.5×=13u) vs hub/normal (1×=26u) vs hub/wide (2×=52u).
  All nutrientOverride 5.0 + bar 50 + matingActionRequired false (decoupled) +
  verticalTransmission 'maternal' + transmissionNoise null + mateSense 1× (HELD).
  6 histories × 3 arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-proximity-dev/fresh-01/`: 6 histories **432001–432054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 432xxx verified
  pristine 2026-11-01 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–431xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots / 4.5e9 ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/topology hub all arms, range ∈ {0.5,1,2} per-arm map
  (frozen literal + attempt record, V1 precedent), geography centers==1 all arms,
  bar 50, nutrient 5.0, noise null, decoupled, sense 1×. Else INVALID.
- NO births gate (V1c/ATTRACT precedent, pre-registered).
- G-lift (the dose verdict), gen-2 COUNTS: **MATE-PROXIMITY-GO-V1** iff wide gen-2
  ≥ 2 AND weak monotonicity narrow ≤ normal ≤ wide with wide > narrow strict.
  Else **MATE-PROXIMITY-NOGO-V1** (breadth does not order compounding).
- INCOMPLETE-NOBIRTHS if wide gen-1 == 0 (void). INVALID on any gate failure.
- firstMatingTick + energies DESCRIPTIVE ONLY (non-gating).

The line closes with its verdict either way. No V2 without new rationale (e.g.,
spread-floor dose needs zero-tolerance design; coupled-range interaction needs the
program-level coupled-line decision). Single authorized attempt, cumulative +18.
No RSI claim.
