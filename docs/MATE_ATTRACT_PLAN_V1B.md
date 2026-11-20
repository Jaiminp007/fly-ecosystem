# MATE-ATTRACT Plan V1b — sensing suppression on hub (FROZEN, design only)

Date frozen: 2026-11-01. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V1b; Emlen-Oring adjudication, not replication)

V1 proved the knob engages (scripted two-fly proof) but the policy ignored 2× sensing
on spread (contrast exactly flat 4v4). Two readings survive: (a) learned-use limitation
(policy never uses distant detections — R64 lazy regime); (b) encounters genuinely don't
limit spread compounding (nothing to gain). The suppression test separates them on HUB,
where V1/V1b/ATTRACT all show compounding (hub gen-2 5,7,6+8 across three banks):
suppress hub sensing to 0.5× with food HELD clumped. If compounding falls, the policy
USES sensing (reading (a) localized to spread: no gain there, not no use anywhere) and
encounters drive the hub advantage (Emlen-Oring: food alone insufficient). If compounding
holds, deeper limitation (sensing irrelevant to this policy at any range). The knob
already supports any finite >0 multiplier — no new engine work.

## Arms, bank, caps

- Arms (3): hub/1× vs hub/0.5× (food HELD, encounters vary) + spread/1× anchor
  (V1-direction fourth-bank check, descriptive). All nutrientOverride 5.0 + bar 50 +
  decoupled + maternal + null noise. 6 histories × 3 arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-attract-dev/fresh-02/`: 6 histories **431001–431054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 431xxx verified
  pristine 2026-11-01 (zero exact-seed/registry/test hits; evidence hits are float
  substrings in old anchors, same standard as 427–430xxx). Builder re-verifies;
  post-bank refusal; union-excluded from all future banks.
- Caps (3-arm scale): 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots / 4.5e9 ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit (V1 form + sense): mode/topology/sense per-arm maps
  ({hub1:hub/1, hub05:hub/0.5, spread1:spread/1}), multiplier ∈ {1, 0.5}, geography
  3/1 from live worlds. Else INVALID.
- NO births gate (V1c/ATTRACT precedent, pre-registered).
- G-lift (the suppression verdict): **MATE-ATTRACT-GO-V1B** iff hub/1× gen-2 ≥ 2
  (something to suppress — hub compounds on this bank) AND hub/0.5× gen-2 < hub/1×
  gen-2 (suppression works — encounters drive the hub advantage).
  Else **MATE-ATTRACT-NOGO-V1B** (suppression fails — food drives it or nothing replicates).
- spread/1× DESCRIPTIVE (V1-direction context). firstMatingTick + energies DESCRIPTIVE.
- INCOMPLETE-NOBIRTHS if hub/1× gen-1 == 0 (void). INVALID on any gate failure.
- Weight logging: NOT in this instrument (actor is a flat motor vector — per-channel
  norms need mapping analysis first; carried as a design task). V1b doubles as a
  behavioral learned-use test (suppression working ⟹ policy uses sensing).

The line closes with its verdict either way. No V2 without new rationale. Single
authorized attempt, cumulative +18. No RSI claim.
