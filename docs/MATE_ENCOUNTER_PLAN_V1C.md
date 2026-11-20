# MATE-ENCOUNTER Plan V1c — concentration dose-response (FROZEN, design only)

Date frozen: 2026-11-01. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V1c)

V1 and V1b disagree about the MECHANISM while agreeing on gen-2 direction:
- V1: births moved (hub 35 vs spread 25, +40%) AND gen-2 moved (5 vs 3).
- V1b: births flat (hub 36 vs spread 33, +9% — manipulation INVALID) but gen-2
  moved MORE (7 vs 2), with per-birth rate 3× different (0.19 vs 0.06).
V1's "more births → more rolls" sketch is therefore NOT supported by V1b. The live
question is the DOSE-RESPONSE SHAPE of concentration: does gen-2 compounding track
concentration monotonically (topology effect real, birth-independent), or is the
pattern flat/inverted (V1 GO was bank luck)? The R56/R57 literature (Allee saddle-node,
contact-process criticality) predicts THRESHOLD nonlinearity, not linearity — a
3-point dose curve is the minimal design that can see it (monotonic vs hump vs flat).
Total-food confound is ACCEPTED as-is (per-patch abundance rule unchanged → total food
scales 1<2<3 centers; the conservative direction: concentration must win DESPITE less
food, same as V1).

## Knob (single, null-default extension)

`resourceTopology`: 'spread' (3 centers, status quo) vs 'duo' (2 fixed centers
{250,450}/{750,450}, clear of all obstacles, in-bounds) vs 'hub' (1 center {500,320}).
Implementation: extend the V1 parameterized list + both cue-foraging phase sites;
absent/legacy values take the identical path (bit-identity fixtures: no-flag ≡ spread,
spread ≡ V1 spread trajectories). Spawns stay uniform random.

## Arms, bank, caps

- Arms (3): hub vs duo vs spread, all nutrientOverride 5.0 + bar 50 + matingActionRequired
  false (decoupled) + verticalTransmission 'maternal' + transmissionNoise null.
  6 histories × 3 arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-encounter-dev/fresh-03/`: 6 histories **429001–429054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 429xxx verified
  pristine 2026-11-01 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old body-transfer anchors, same standard as 427/428xxx). Builder
  re-verifies at build; post-build refusal guard; union-excluded from all future banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots /
  3.75e9 scalarOperations.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit (V1b-corrected form) + geography audit: per-row centersCount read
  from the live world object (NOT the arm label) must equal {hub:1, duo:2, spread:3}.
  A label-says-hub-but-world-shows-3 run is INVALID (knob-pathology catch; the V1b
  lesson generalized). Else INVALID.
- NO births manipulation gate (deliberate departure from V1/V1b, pre-registered):
  V1b proved births are bank-volatile; gating the dose verdict on births re-litigates
  V1b instead of testing the dose shape. Engagement is established by the geography
  audit (G2). Birth totals are reported descriptively as the dose curve's first panel.
- G-lift (the dose verdict), all on gen-2 COUNTS (same-n arms):
  **MATE-ENCOUNTER-GO-V1C** iff hub gen-2 ≥ 2 AND weak dose-monotonicity
  spread ≤ duo ≤ hub with hub > spread strict.
  Else **MATE-ENCOUNTER-NOGO-V1C** (flat/inverted — V1 GO reads as bank luck).
- INCOMPLETE-NOBIRTHS if hub gen-1 == 0 (void). INVALID on any gate failure.
- firstMatingTick + energies: DESCRIPTIVE ONLY (non-gating), same as V1b.

The line closes with its verdict either way. No V1d without a new rationale (e.g.,
Emlen-Oring split needs the unbuilt attraction knob; total-food-clamped dose needs
renormalization rationale against the energy books). Single authorized attempt,
cumulative +18. No RSI claim.
