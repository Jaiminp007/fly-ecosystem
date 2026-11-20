# MATE-ATTRACT Plan V2 — hardwired mate taxis (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V2; action level, not perception)

V1/V1b manipulated SENSING range and proved the policy ignores it (learned-use
limitation; decoupled mating is proximity-gated, sensing acts only via locomotion
the policy never performs). The next level is ACTION: hardwire steering toward
sensed mates (taxis), bypassing the learned policy's failure to use mate sensors.
If forced encounters lift compounding, encounters are causal and the policy was
the blocker (patching-illusion resolved: the right level was downstream all along).
If hardwired taxis ALSO fails, encounters themselves do not limit compounding at
this scale (energy/mass-action story). This is the Emlen-Oring split's missing cell:
spread-food + high-encounters (via taxis) vs spread-food baseline, food HELD —
plus a hub anchor for V1-direction continuity. No new sensing/range/energy knobs.

## Knob (single, null-default, symmetric billing)

`mateAttractBias` k ≥ 0 (default 0/undefined = legacy): adds matePull=k*(raw[8]−raw[7])
(mate right−left, mirroring food attraction=2*(raw[2]−raw[1])) inside the tanh arg,
mirrored in both branches — approach: attraction+matePull; avoidance:
−(attraction+matePull)+.8*raw[0]. Computed UNCONDITIONALLY (no k-branches anywhere):
identical code path and op counts for all arms. Op accounting: matePull costs
sub+mul (2) + 1 inclusion add per branch = +3 both branches → approach 9 (was 6),
avoidance 12 (was 9). Billing constants updated at ALL motor paths
(cue-foraging step, tickMotor, pursuit legacyFast 6→9, transfer-authority 6→9);
tests mirroring counts updated via triage.
Bit-identity analysis (done pre-freeze): k=0 gives matePull=±0; x±0≡x for all finite
x except x=−0→+0 flips (measure-zero sums; physics/comparisons/JSON digests are
−0-blind; only in-memory deepStrictEqual could see it). Fixture asserts identity
post-JSON-normalization + EXACT op-count equality — matching how the program's own
persistence layer treats identity. Sex-conditioning NOT included (mate sensors
already filter opposite-sex mature mates, engine.mjs:110 — symmetric bias IS
sex-directed approach); sex-specific gains are specified-not-executed follow-up.
k=2 pre-registered (parity with the food coefficient: mate pull equals food pull;
symmetric treatment of the two attractors). The fixture proves ENGAGEMENT
(orientation toward mates at k=2, none at k=0) — magnitude is fixed, not tuned.

## Arms, bank, caps

- Arms (3): attract (spread + k=2) vs spread control (spread + k=0) + hub anchor
  (hub + k=0, descriptive V1-direction continuity). All nutrientOverride 5.0 + bar 50
  + matingActionRequired false (decoupled) + verticalTransmission 'maternal' +
  transmissionNoise null + mateSense 1× + matingRange 1× (ALL ELSE HELD — only
  steering varies). 6 histories × 3 arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-attract-dev/fresh-03/`: 6 histories **436001–436054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 436xxx verified
  pristine 2026-11-02 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–435xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots / 4.5e9 ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/arm identity, topology per arm ({attract:spread,
  spread:spread, hub:hub}), sense/range 1× all arms, bias per-arm {attract:2,
  spread:0, hub:0} (frozen literal + attempt record, V1 precedent), geography
  3/1 from live worlds, bar 50, nutrient 5.0, noise null, decoupled. Else INVALID.
- NO births gate (V1c/ATTRACT precedent, pre-registered).
- G-lift (the encounter-taxis verdict): **MATE-ATTRACT-GO-V2** iff attract gen-2 ≥ 2
  AND attract gen-2 > spread gen-2 (forced encounters lift compounding with food HELD).
  Else **MATE-ATTRACT-NOGO-V2** (even hardwired encounters do not lift compounding).
- Hub anchor DESCRIPTIVE (V1-direction context). firstMatingTick + energies DESCRIPTIVE.
- INCOMPLETE-NOBIRTHS if attract gen-1 == 0 (void). INVALID on any gate failure.
- Weight logging: NOT in this instrument (conditional on coupled designs, ATTRACT-V1b standing rule).

The line closes with its verdict either way (ATTRACT arc then closed: sensing CLOSED, steering decided). No V3 without new rationale (e.g., approach-only asymmetry if avoidance-steering confounds; sex-conditioned gains). Single authorized attempt, cumulative +18. No RSI claim.
