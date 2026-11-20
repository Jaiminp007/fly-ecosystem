# MATE-ATTRACT Plan V4 — departure-gated taxis (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V4; mechanism fix, not retest)

V3 closed the arc with a mechanism hypothesis, not just a null: forced taxis on
clumped food yields uniform-low births (3,4,3,3,3,3) with the worst energy (−42.2)
and unshifted timing — the signature of starvation-mediated failure (R75 MVT reading:
attraction without departure converts hub to trap). V1/V1b/V2/V3 vary encounters;
NONE vary the energy constraint that V3 implicates. V4 tests the implication
directly: the SAME k=2 taxis, but gated to disengage when the agent cannot afford
the chase (energy below mating bar). If gated taxis compounds where ungated taxis
flatlined (V2 spread) or destroyed (V3 hub), the bottleneck is CONFIRMED energetic
and the rescue is specified (departure-gating, not more encounters). If gated taxis
also fails, energy-gating is insufficient and the bottleneck lies elsewhere
(interference/queuing: cooldown-12 + capacity-240 saturation), which reframes all
follow-ups. This is new rationale per V3's "no V4" clause: a mechanism-specific fix
for the identified failure mode (R75-specified), not a retest and not a knob
re-parameterization (k stays at parity 2; threshold reuses the bar, no new constant).

## Knob (single, null-default, symmetric billing; engine change required)

`mateAttractEnergyGate`: raw-energy threshold at/below which the taxis term
disengages. Semantics: gate = 1 when the agent's energy ≥ gate, else 0;
effective bias k_eff = k × gate (computed UNCONDITIONALLY every tick — no
branches — identical code path and op counts for all arms). Default null =
ungated (V2/V3 behavior preserved EXACTLY: k_eff ≡ k; bit-identity holds since
k×1 ≡ k in IEEE, same -0 analysis as V2's plan). V4 attract arm sets an explicit
gate; control/anchor arms use k=0 (gate value moot — matePull stays ±0).
Threshold (pre-registered, no new constant): matingEnergyBar (bar=50, same units
as the engine's mating gate — the ecological meaning is "only chase when you could
actually mate"). Raw-scale mapping (raw energy channel = f.energy/120) established
at implementation with scripted fixture proof (high-energy orients, low-energy
cruises, k=0 null-default bit-identical).
Billing: the gate adds EXACTLY one unconditional mul (k×gate) vs V2: approach
9→10, avoidance 12→13, symmetric across arms. All billing sites + 5 Python audit
mirrors + absolute-billing fixtures synced in implementation triage (same class as
V2's +3 update; billing-sync, not tuning). The gate COMPARISON itself is unbilled
(precedent: branch conditions unpriced; only the arithmetic path is counted, and it
is identical in both outcomes).

## Arms, bank, caps

- Arms (3): hubAttract-gated (hub + k=2 + gate=bar) vs hub control (hub + k=0,
  ungated-identical) + spread anchor (spread + k=0, descriptive V1-direction +
  dead-bank check). All nutrientOverride 5.0 + bar 50 + matingActionRequired false
  (decoupled) + verticalTransmission 'maternal' + transmissionNoise null +
  mateSense 1× + matingRange 1× (ALL ELSE HELD — only gating varies the attract arm).
  6 histories × 3 arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-attract-dev/fresh-05/`: 6 histories **438001–438054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 438xxx verified
  pristine 2026-11-02 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–437xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future qual banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots / 4.5e9 ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/topology per-arm ({hubAttract:hub, hub:hub, spread:spread}),
  sense/range 1× all arms, bias per-arm {hubAttract:2, hub:0, spread:0}, gate per-arm
  {hubAttract:bar, hub:null, spread:null} (frozen literal + attempt record, V1 precedent),
  geography 1/3 from live worlds, bar 50, nutrient 5.0, noise null, decoupled. Else INVALID.
- NO births gate (precedent, pre-registered).
- G-lift (the rescue verdict): **MATE-ATTRACT-GO-V4** iff hubAttract gen-2 ≥ 2 AND
  hubAttract gen-2 > hub (departure-gated taxis lifts compounding where ungated taxis
  destroyed it — energetic bottleneck confirmed, rescue specified).
  Else **MATE-ATTRACT-NOGO-V4** (even energy-smart taxis fails — bottleneck is not
  (only) starvation; interference/queuing becomes the leading hypothesis).
- Spread anchor DESCRIPTIVE. firstMatingTick + energies DESCRIPTIVE. Gate engagement is
  established at fixture level (scripted: low-energy agent cruises, high-energy orients,
  k=0 null-default bit-identical) + absolute billing (10/13); NO per-tick gate telemetry
  (emit schema stays frozen — same constraint as V1/V1b/V2). Live-bank gate behavior is
  read descriptively from endpoint energies.
- INCOMPLETE-NOBIRTHS if hubAttract gen-1 == 0 (void). INVALID on any gate failure.
- Weight logging: still conditional on coupled designs (unchanged standing rule).

The line closes with its verdict either way (ATTRACT arc then fully closed including
the rescue attempt: sensing bypassed, steering inert, interaction harmful, gating
decides). No V5 without new rationale (magnitude ladder with pre-registered selection
rule; sex-conditioned gains; detection-sharing channel). Single authorized attempt,
cumulative +18. No RSI claim.
