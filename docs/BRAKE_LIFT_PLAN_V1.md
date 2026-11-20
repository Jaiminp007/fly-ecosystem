# BRAKE-LIFT Plan V1 — LI-brake formalization + faster release (FROZEN, design only)

Date frozen: 2026-10-26. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Objective

Test whether formalizing latent inhibition as an explicit,
controllable brake — and RELEASING it faster — lifts HB extinction.
The floor's LI signature (HB partial −0.173, BH −0.535; gain lifts
without flattening) says pre-exposure brakes re-learning and
gain shouts over the brake instead of releasing it. This line releases
it. Mackintosh associability in brake form: b = 1 − α.

## Knob (single degree of freedom: release speed)

Per-cue brake b_cue ∈ [0, 0.8], computed ONCE at transplant from the
TRAIN row's measured contacts: b(0) = min(0.8, trainContacts/C0),
C0 = 2000 (held: top train quintile ≈ full brake, graded below).
Effective taste rate on cue contact: tasteRate × (1 − b). Brake lifts
with test exposure: b ← b×(1−decay) per contact on that cue (billed
1–2 ops). Floor multiplier 0.2 (never fully frozen). Arms differ ONLY
in decay (held values, not tuned):

- uniform (base opts; brake machinery runs, multiplier forced 1.0 —
  see billing): implicit-release reference.
- brake-nolift (decay = 0): pure brake. MUST underperform uniform
  (manipulation check that the brake bites; else INVALID).
- brake-slow (decay half-life ≈1000 contacts ≈ 0.0007/contact):
  should ≈ uniform (calibration: explicit-slow ≡ implicit).
- brake-fast (decay half-life ≈200 contacts ≈ 0.0035/contact):
  THE CLAIMANT. Must beat uniform.
- Plus train + unlearned (V1 reference triple). 6 arms × 3 pairs =
  18 mains, BT_TICKS=1792, otherwise base options, V1i transplant.

Null-default & symmetric billing (M-GATE precedent): the brake code
path (init arithmetic + per-contact decay ops + counters) runs
IDENTICALLY on every arm including train/uniform/unlearned; only
brake arms APPLY the multiplier. Behavior bit-identical when
disabled; ops identical always. Fixture: short-run digest-identity
(base opts vs brake-keys-present-but-disabled).

Brakes are test-side: computed fresh at transplant from train contacts,
NEVER transplanted (assertFreshTarget unchanged; brakes set post-copy
by the instrument, asserted separately). Cross-cue generalization
(timing-doc alternative) is compatible and untouched (shared-bit
updates proceed normally); per-cue first-contact ticks + per-third
behavior logged as standard (timing meta-analysis continues free).

## Bank, caps

- Bank `evidence/brake-lift-dev/fresh-01/`: 6 histories 423001–423054
  (turn-gate 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  423xxx verified pristine 2026-10-26 (zero exact-seed/registry/test/
  script hits). Builder re-verifies at build; post-build refusal guard.
- Caps (V1i-mirror): 18 mains / 0 probes / 32256 worldTicks /
  774144 founderSlots / 5e9 scalarOps. d=4-analog risk: none (no
  gain here); bracket risk: nolift arm craters (EXPECTED — that IS the
  manipulation check; floor-capped at 0.2× to keep runs viable).

## Gates, verdicts (conjunctive, fail-closed)

- G1 integrity: 18/18 complete, join >= 0.99, ledger exact.
- G0 train-learned (gap ≥ 0.5 all 3, else INCOMPLETE-UNTRAINED).
- G2b unlearned flat (|gap| ≤ 0.1 all 3, else INVALID).
- G-manipulation: brake-nolift HB < uniform HB by ≥ 0.05 (mean over
  pairs). If the brake doesn't bite, the construct is decorative →
  INVALID (not NOGO).
- G-lift (headline): brake-fast HB − uniform HB ≥ +0.1 (V1g yardstick)
  on ≥2/3 pairs → **BRAKE-GO** (license: associability-reset
  CONFIRMED as mechanism; follow-up dose-of-release freeze licensed,
  not executed). Else **BRAKE-NOGO** (brake real but release doesn't
  help — mechanism wrong despite biting).
- Descriptive: LI-gradient (partial train-contact|test-contact) per arm
  — pre-registered expectation: flattening with faster release
  (nolift steepest, fast flattest); uniform in between. Not gating
  (mechanism display, like gain test).
- HB primary (flippedHB contact-weighted, V1c metric); same-valence
  guardrail + BH reported, no gates. Null-hygiene: train/uniform/
  unlearned manipulation counters zero; brake arms must show decay activity >0 (VOID if silent - recorded, fail-closed).
- INCOMPLETE on halt; INVALID on G1/G0/G2b/manipulation fail.

Line closes with its verdict either way. No V2 without a new
rationale. Single attempt, cumulative +18. No RSI claim.
