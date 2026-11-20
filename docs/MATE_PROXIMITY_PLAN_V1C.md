# MATE-PROXIMITY Plan V1c — exact dose replication (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V1c; replication, not extension)

PROXIMITY-V1's dose (gen-2 5/9/17, births 32/46/57, strict monotone) is the mating
arc's sole clean positive — and its ONLY unreplicated verdict (V1b tested the split,
not the dose). Two warning signs demand the INHERIT-V1c treatment (thin/sole GO must
replicate before any claim): (a) V1b's hub-wide arm scored gen-2 5 on its bank vs
V1's 17 — descriptively, the wide arm does NOT reproduce across banks; (b) every
other mating GO (INHERIT-V1b, ENCOUNTER-V1, ATTRACT hub-direction 3/4 banks) wobbled
or died on replication. Exact replication with the V1 bar frozen-identical (no tuning
possible by construction). Either outcome resolves the arc's central empirical
question: replicated dose = first replicated mating structure ever; flat = V1 GO was
bank luck and the arc closes with zero replicated positives.

## Arms, bank, caps (V1-identical — replication fidelity, not tuning)

- Arms (3): hub/narrow (13u) vs hub/normal (26u) vs hub/wide (52u). All nutrientOverride
  5.0 + bar 50 + matingActionRequired false (decoupled) + verticalTransmission 'maternal' +
  transmissionNoise null + mateSense 1× (HELD). 6 histories × 3 arms = 18 mains,
  BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-proximity-dev/fresh-03/`: 6 histories **435001–435054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 435xxx verified
  pristine 2026-11-02 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–434xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots / 4.5e9 ops.

## Gates (conjunctive, fail-closed) and verdicts (V1 bar, frozen-identical)

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit (V1 form): mode/topology hub all arms, range ∈ {0.5,1,2} per-arm map,
  sense 1×, geography centers==1 all rows, bar 50, nutrient 5.0, noise null, decoupled. Else INVALID.
- NO births gate (V1c precedent, pre-registered).
- G-lift (the replication verdict): **MATE-PROXIMITY-GO-V1C** iff wide gen-2 ≥ 2 AND
  weak monotonicity narrow ≤ normal ≤ wide with wide > narrow strict (V1 bar, unchanged).
  Else **MATE-PROXIMITY-NOGO-V1C** (dose does not replicate — V1 GO reads as bank luck;
  non-replication if V1 GO stood, INHERIT-V1c stop-rule analogue).
- INCOMPLETE-NOBIRTHS if wide gen-1 == 0 (void). INVALID on any gate failure.
- firstMatingTick + energies DESCRIPTIVE ONLY (non-gating).

The line closes with its verdict either way (the mating arc then stands fully closed:
transmission/mating-topology/sensing/proximity-split/informed all NOGO-or-void except
the disposition of this dose). No V1d without new rationale. Single authorized attempt,
cumulative +18. No RSI claim.
