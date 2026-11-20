# MATE-ATTRACT Plan V3 — taxis on hub: the Emlen-Oring interaction cell (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V3; interaction, not main effect)

V2 tested encounters WITHOUT food (spread taxis: flat 2v3) and PROXIMITY-V1b tested
food WITHOUT breadth (hub-wide beats spread-wide 5v7: food irrelevant given breadth).
Both Emlen-Oring main effects are now measured — but their INTERACTION is not: does
forced encountering lift compounding WHEN food is already clumped? If hub taxis beats
hub control, encounters amplify given food (synergy the split was designed to detect;
mechanism: taxis concentrates already-central foragers onto mates). If hub taxis is
flat vs hub control (V2-analogous null on hub), encounters are fully irrelevant and
the mating arc's encounter question is closed in all tested regimes — the remaining
variance is food/energy/mass-action, not searchable encounters. NO new engine work:
the V2-validated `mateAttractBias` knob (k=2 parity, null-default, symmetric billing)
is reused verbatim; this line is pure instrument (new arms + scorer + bank).

## Arms, bank, caps

- Arms (3): hubAttract (hub + k=2) vs hub control (hub + k=0) + spread anchor
  (spread + k=0, descriptive: V1-direction continuity + dead-bank detection). All
  nutrientOverride 5.0 + bar 50 + matingActionRequired false (decoupled) +
  verticalTransmission 'maternal' + transmissionNoise null + mateSense 1× +
  matingRange 1× (ALL ELSE HELD — only steering on hub varies). 6 histories × 3
  arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-attract-dev/fresh-04/`: 6 histories **437001–437054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 437xxx verified
  pristine 2026-11-02 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–436xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots / 4.5e9 ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/arm identity, topology per arm ({hubAttract:hub, hub:hub,
  spread:spread}), sense/range 1× all arms, bias per-arm {hubAttract:2, hub:0,
  spread:0} (frozen literal + attempt record, V1 precedent), geography 1/1/3 from
  live worlds, bar 50, nutrient 5.0, noise null, decoupled. Else INVALID.
- NO births gate (V1c/ATTRACT precedent, pre-registered).
- G-lift (the interaction verdict): **MATE-ATTRACT-GO-V3** iff hubAttract gen-2 ≥ 2
  AND hubAttract gen-2 > hub gen-2 (forced encounters lift compounding given clumped
  food). Else **MATE-ATTRACT-NOGO-V3** (no interaction: encounters do not amplify
  hub compounding).
- Spread anchor DESCRIPTIVE (V1-direction context + dead-bank check: if ALL arms
  flatline including hub, bank effects dominate — reported, still NOGO per gate).
  firstMatingTick + energies DESCRIPTIVE.
- INCOMPLETE-NOBIRTHS if hubAttract gen-1 == 0 (void). INVALID on any gate failure.
- Weight logging: NOT in this instrument (conditional on coupled designs, standing rule).

The line closes with its verdict either way (ATTRACT arc then fully closed: sensing
bypassed + steering inert on spread + interaction decided). No V4 without new
rationale (e.g., magnitude sweep with pre-registered selection rule; sex-conditioned
gains). Single authorized attempt, cumulative +18. No RSI claim.
