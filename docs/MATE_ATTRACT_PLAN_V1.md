# MATE-ATTRACT Plan V1 — mate-sensing range × topology factorial (FROZEN, design only)

Date frozen: 2026-11-01. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses ATTRACT as a new line, not encounter-V1d)

V1c closed NOGO with a food-confounded hump: duo (2 centers, most food-per-opportunity)
won everything, so food amount and encounter structure remain confounded. The Emlen-Oring
split (hub-food WITHOUT hub-encounters vs hub-encounters WITHOUT hub-food) requires
separating the two — impossible with topology alone. R61 banks the math for a SOCIAL
attraction knob (Keller-Segel field template; swarmalator state-conditioned approach).
The minimal implementable knob is mate-SENSING range: mating executes at ≤26 units
(engine.mjs:178) but mates are sensed at the sense trait (95–145, engine.mjs:109);
sensing is the encounter funnel, proximity the gate. Extending the funnel on a SPREAD
ecology raises encounters with food geography HELD — the clean encounter-only test.
No field solver, no policy surgery: one radius multiplier in one query.

## Knob (single, null-default)

`mateSenseMultiplier`: multiplies ONLY the mates `nearby` radius in `sensors()`
(food radius, scent radius, mating-execution range 26 all untouched). Undefined/1 =
legacy call bit-identical (fixture: 1× run ≡ no-flag run on actions + ops).
Validation: finite > 0; experiment uses exactly {1, 2}. TasteExperiment passthrough
`mateSenseMultiplier=null` default, forwarded only when non-null (resourceTopology
pattern). Honest risk (stated, not hedged): mate approach is LEARNED (seed reflex has
no mate wiring, engine.mjs:28-36), so the policy may not exploit 2× range in 1792 ticks
— a flat encounter contrast reads as policy-limitation, not knob failure; the
fixture-level sensing proof (scripted two-fly: detected at 1.5× range under 2×, not
under 1×) establishes the knob engages.

## Arms, bank, caps (2×2 factorial)

- Arms (4): topology {spread, hub} × mateSense {1×, 2×}. All arms nutrientOverride 5.0
  + bar 50 + decoupled + maternal + null noise. 6 histories × 4 arms = 24 mains,
  BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-attract-dev/fresh-01/`: 6 histories **430001–430054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 430xxx verified
  pristine 2026-11-01 (zero exact-seed/registry/test hits; evidence hits are integer
  substrings in old bank seeds, same standard as 427/428/429xxx). Builder re-verifies;
  post-build refusal; union-excluded from all future banks.
- Caps (4-arm scale): 24 mains / 0 probes / 43008 worldTicks / 1032192 founderSlots /
  6.0e9 scalarOperations.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (24/24 complete, exact ledger, `redone: []`).
- G2 config audit (V1c form + sense): mode/topology/geography per arm, multiplier
  ∈ {1,2} matching arm (frozen literal + attempt record, V1 verticalTransmission
  precedent — the runner hardcodes per-arm values, zero within-arm variation possible).
  Else INVALID.
- NO births manipulation gate (V1c precedent, pre-registered: births are bank-volatile;
  engagement = fixture-level sensing proof + G2 multiplier audit).
- G-lift (the encounter-contrast verdict): **MATE-ATTRACT-GO-V1** iff spread/2× gen-2
  ≥ 2 AND spread/2× gen-2 > spread/1× gen-2 (V1b bar shape on the encounter contrast —
  encounters lift compounding with food HELD).
  Else **MATE-ATTRACT-NOGO-V1** (encounter-only lift absent at this scale).
- Hub arms DESCRIPTIVE (V1b-replication context for hub/1× vs spread/1×; additivity
  narrative for hub/2×). No pooled gating.
- INCOMPLETE-NOBIRTHS if spread/2× gen-1 == 0 (void). INVALID on any gate failure.
- firstMatingTick + energies DESCRIPTIVE ONLY (non-gating).

The line closes with its verdict either way. No V2 without new rationale (e.g.,
directed-search assessment needs the unbuilt quality-signal knob, R62). Single
authorized attempt, cumulative +24. No RSI claim.
