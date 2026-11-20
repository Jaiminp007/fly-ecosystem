# MATE-PROXIMITY Plan V1b — Emlen-Oring split at fixed breadth (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V1b; the mating arc's culminating adjudication)

PROXIMITY-V1 established that breadth orders compounding (5/9/17) with food HELD
clumped. The confound it accepted: all arms shared hub food, so food amount and
breadth covary across the dose. The Emlen-Oring split — hub-food WITHOUT
hub-encounters vs hub-encounters WITHOUT hub-food — is now executable at the RIGHT
level because both knobs exist: fix breadth at 52u (2×) on BOTH topologies and vary
only food geography (hub clumped vs spread distributed). If hub-wide beats
spread-wide, food drives the hub advantage beyond breadth (food-side follow-ups
licensed). If equal-or-reversed, breadth alone explains hub compounding (encounter
story complete at this scale; food irrelevant here). Either outcome closes a
question the arc has carried since MATE-FOOD. 1×-range anchors (hub + spread) ride
along for replication context (descriptive): hub1 replicates PROXIMITY-normal,
spread1 replicates ATTRACT-spread1 direction.

## Arms, bank, caps

- Arms (4): hub/range-2× (hubR2) vs spread/range-2× (spreadR2) — the split pair,
  breadth HELD — plus hub/range-1× (hubR1) + spread/range-1× (spreadR1) anchors.
  All nutrientOverride 5.0 + bar 50 + matingActionRequired false (decoupled) +
  verticalTransmission 'maternal' + transmissionNoise null + mateSense 1× (HELD).
  6 histories × 4 arms = 24 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-proximity-dev/fresh-02/`: 6 histories **433001–433054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 433xxx verified
  pristine 2026-11-02 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–432xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future banks.
- Caps (4-arm scale): 24 mains / 0 probes / 43008 worldTicks / 1032192 founderSlots / 6.0e9 ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (24/24 complete, exact ledger, `redone: []`).
- G2 config audit (V1 form + range/topology maps): mode/topology per arm
  ({hubR2:hub, spreadR2:spread, hubR1:hub, spreadR1:spread}), range ∈ {1,2} per-arm
  ({hubR2:2, spreadR2:2, hubR1:1, spreadR1:1}), sense 1× all arms, geography
  centers 3/1 from live worlds, bar 50, nutrient 5.0, noise null, decoupled.
  Else INVALID.
- NO births gate (V1c/ATTRACT precedent, pre-registered).
- G-lift (the split verdict), gen-2 COUNTS on the breadth-held pair:
  **MATE-PROXIMITY-GO-V1B** iff hubR2 gen-2 ≥ 2 (something to explain — hub compounds
  at wide breadth on this bank) AND hubR2 gen-2 > spreadR2 gen-2 (food geography
  matters given equal breadth — food drives the hub advantage).
  Else **MATE-PROXIMITY-NOGO-V1B** (breadth-sufficient: hubR2 ≤ spreadR2 — food
  geography irrelevant here; OR hubR2 < 2 with hubR2 ≤ spreadR2 — nothing to explain).
- hubR1/spreadR1 anchors DESCRIPTIVE ONLY (replication context + spread-wide vs
  spread-normal breadth check on spread). INCOMPLETE-NOBIRTHS if hubR2 gen-1 == 0
  (void). INVALID on any gate failure.
- firstMatingTick + energies DESCRIPTIVE ONLY (non-gating).

The line closes with its verdict either way. No V1c without new rationale (e.g.,
food-amount clamp needs renormalization-against-books rationale; coupled-line
interaction needs the program-level coupled decision). Single authorized attempt,
cumulative +24. No RSI claim.
